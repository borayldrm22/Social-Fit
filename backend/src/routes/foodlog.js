const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { recordStreak } = require('./streaks');
const { awardPoints } = require('../services/starService');
const { uploadFile } = require('../services/storageService');
const foods = require('../data/foods');

const prisma = require('../lib/prisma');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

const { toDateOnly, startOfDayInstant } = require('../lib/dateUtils');

// Öğün loglama ödülü: her öğün +2, günde ilk MEAL_DAILY_CAP öğün (farm'a kapalı — StarTransaction sayacıyla)
const MEAL_POINTS = 2;
const MEAL_DAILY_CAP = 3;

function toNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeOpenFoodItem(product) {
  const languages = Array.isArray(product?.languages_tags) ? product.languages_tags : [];
  const hasTurkishLanguageTag = languages.includes('en:turkish');
  const turkishName = (product.product_name_tr || product.generic_name_tr || '').trim();
  if (!hasTurkishLanguageTag && !turkishName) return null;

  const nutriments = product?.nutriments || {};
  const calories = toNumber(nutriments['energy-kcal_100g'] ?? nutriments.energy_kcal_100g ?? nutriments['energy-kcal']);
  const protein = toNumber(nutriments.proteins_100g ?? nutriments.proteins);
  const carbs = toNumber(nutriments.carbohydrates_100g ?? nutriments.carbohydrates);
  const fat = toNumber(nutriments.fat_100g ?? nutriments.fat);
  const hasAnyMacro = calories != null || protein != null || carbs != null || fat != null;
  if (!hasAnyMacro) return null;
  const name = (turkishName || product.product_name || product.generic_name || '').trim();
  if (!name) return null;
  return {
    name,
    calories: Math.max(0, Math.round(calories ?? 0)),
    protein: Math.max(0, Number((protein ?? 0).toFixed(1))),
    carbs: Math.max(0, Number((carbs ?? 0).toFixed(1))),
    fat: Math.max(0, Number((fat ?? 0).toFixed(1))),
  };
}

async function searchOpenFoodFacts(q) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(q)}&page_size=24&fields=product_name,product_name_tr,generic_name,generic_name_tr,languages_tags,nutriments`;
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return [];
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return [];
    const data = await response.json();
    const products = Array.isArray(data?.products) ? data.products : [];
    const normalized = products.map(normalizeOpenFoodItem).filter(Boolean);
    const uniqueByName = new Map();
    for (const item of normalized) {
      const key = item.name.toLowerCase();
      if (!uniqueByName.has(key)) uniqueByName.set(key, item);
      if (uniqueByName.size >= 12) break;
    }
    return Array.from(uniqueByName.values());
  } catch (_) {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// POST /api/foodlog
router.post(
  '/',
  upload.single('image'),
  [
    body('date').notEmpty(),
    body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    body('foodName').trim().notEmpty(),
    body('calories').isInt({ min: 0 }),
    body('protein').optional().isFloat({ min: 0 }),
    body('carbs').optional().isFloat({ min: 0 }),
    body('fat').optional().isFloat({ min: 0 }),
    body('note').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { date, mealType, foodName, calories, protein, carbs, fat, note } = req.body;

      let imageUrl = null;
      if (req.file) imageUrl = await uploadFile(req.file.buffer, { prefix: 'foodlog', originalname: req.file.originalname, contentType: req.file.mimetype, folder: 'foodlog' });

      const foodLog = await prisma.foodLog.create({
        data: {
          userId: req.user.id,
          date: toDateOnly(date),
          mealType,
          foodName,
          calories: parseInt(calories, 10),
          protein: protein != null ? parseFloat(protein) : null,
          carbs: carbs != null ? parseFloat(carbs) : null,
          fat: fat != null ? parseFloat(fat) : null,
          imageUrl,
          note: note || null,
        },
      });

      // Streak + günlük "aktif oldun" puanı (günde max 1 — recordStreak içinde)
      const streak = await recordStreak(req.user.id);

      // Öğün loglama ödülü: +2, günde ilk 3 öğün. Sayaç silinmeyen StarTransaction'a bakar
      // (silinen foodLog satırına değil) → sil-tekrar-logla ile farm edilemez.
      const mealAwardsToday = await prisma.starTransaction.count({
        where: { userId: req.user.id, reason: 'meal_logged', createdAt: { gte: startOfDayInstant() } },
      });
      let mealAwarded = 0;
      if (mealAwardsToday < MEAL_DAILY_CAP) {
        mealAwarded = MEAL_POINTS;
        await awardPoints(req.user.id, MEAL_POINTS, 'meal_logged', foodLog.id);
      }

      // Mobil kutlama: günlük aktif + öğün puanı toplamı (kalan bonus = haftalık seri)
      res.status(201).json({
        ...foodLog,
        awarded: (streak?.awarded || 0) + mealAwarded,
        bonus: streak?.bonus || 0,
      });
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/foodlog/search?q=keyword
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) return res.json([]);

    const onlineResults = await searchOpenFoodFacts(q);
    if (onlineResults.length > 0) return res.json(onlineResults);

    const fallbackResults = foods
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 10);

    res.json(fallbackResults);
  } catch (e) {
    next(e);
  }
});

// GET /api/foodlog/weekly-summary  (must be before /:id)
router.get('/weekly-summary', async (req, res, next) => {
  try {
    const today = toDateOnly(new Date());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const profile = req.user.profile;
    const goalCalories = profile?.dailyCalorieGoal || null;

    const logs = await prisma.foodLog.findMany({
      where: {
        userId: req.user.id,
        date: { gte: sevenDaysAgo, lte: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) },
      },
      orderBy: { date: 'asc' },
    });

    const dayMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { date: key, totalCalories: 0, goalCalories, entryCount: 0 };
    }

    for (const log of logs) {
      const key = new Date(log.date).toISOString().slice(0, 10);
      if (dayMap[key]) {
        dayMap[key].totalCalories += log.calories;
        dayMap[key].entryCount += 1;
      }
    }

    res.json(Object.values(dayMap));
  } catch (e) {
    next(e);
  }
});

// GET /api/foodlog?date=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const dateParam = req.query.date;
    if (!dateParam) return res.status(400).json({ error: 'date query parameter required' });

    const targetDate = toDateOnly(dateParam);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const logs = await prisma.foodLog.findMany({
      where: {
        userId: req.user.id,
        date: { gte: targetDate, lt: nextDay },
      },
      orderBy: { createdAt: 'asc' },
    });

    const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
    let totalCalories = 0;
    for (const log of logs) {
      if (meals[log.mealType]) meals[log.mealType].push(log);
      totalCalories += log.calories;
    }

    const profile = req.user.profile;
    const goalCalories = profile?.dailyCalorieGoal || null;
    const remaining = goalCalories != null ? goalCalories - totalCalories : null;

    res.json({
      date: dateParam,
      totalCalories,
      goalCalories,
      remaining,
      meals,
    });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/foodlog/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const log = await prisma.foodLog.findUnique({ where: { id } });
    if (!log) return res.status(404).json({ error: 'Food log not found' });
    if (log.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.foodLog.delete({ where: { id } });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
