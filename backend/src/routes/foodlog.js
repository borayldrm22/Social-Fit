const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { recordStreak } = require('./streaks');
const foods = require('../data/foods');

const prisma = new PrismaClient();
const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const FOODLOG_DIR = path.join(UPLOAD_DIR, 'foodlog');
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

if (!fs.existsSync(FOODLOG_DIR)) {
  fs.mkdirSync(FOODLOG_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FOODLOG_DIR),
  filename: (req, file, cb) => cb(null, `foodlog-${uuidv4()}${path.extname(file.originalname) || '.jpg'}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

function toDateOnly(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
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
      if (req.file) imageUrl = `${BASE_URL}/uploads/foodlog/${req.file.filename}`;

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

      // Streak + günlük yıldız puanı (günde max 1 — recordStreak içinde)
      await recordStreak(req.user.id);

      res.status(201).json(foodLog);
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

    const results = foods
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 10);

    res.json(results);
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
