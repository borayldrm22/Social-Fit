const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { awardPoints, getStarPoints } = require('../services/starService');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware);

function toDateOnly(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

// Get my current streak and badges
router.get('/me', async (req, res, next) => {
  try {
    const today = toDateOnly(new Date());
    const records = await prisma.streak.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
      take: 100,
    });
    let currentStreak = 0;
    let lastDate = null;
    for (const r of records) {
      const d = toDateOnly(r.date);
      if (!lastDate) {
        const diff = (today - d) / (24 * 60 * 60 * 1000);
        if (diff > 1) break;
        lastDate = d;
        currentStreak = r.count;
        if (diff === 0) break;
        continue;
      }
      const diffDays = (lastDate - d) / (24 * 60 * 60 * 1000);
      if (diffDays !== 1) break;
      lastDate = d;
      currentStreak = r.count;
    }
    const badges = await prisma.userBadge.findMany({
      where: { userId: req.user.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
    const earnedIds = new Set(badges.map((b) => b.badgeId));
    const catalog = await prisma.badge.findMany({ orderBy: { daysRequired: 'asc' } });
    const allBadges = catalog.map((b) => ({
      id: b.id,
      key: b.key,
      name: b.name,
      description: b.description,
      iconUrl: b.iconUrl,
      daysRequired: b.daysRequired,
      earned: earnedIds.has(b.id),
    }));
    const starPoints = await getStarPoints(req.user.id);
    res.json({
      currentStreak,
      starPoints,
      badges: badges.map((b) => b.badge),
      allBadges,
    });
  } catch (e) {
    next(e);
  }
});

// Yıldız ekonomisi burada merkezî: günde ilk aktivite +20 (günde max 1),
// 7'nin katı seri gününde +50 haftalık bonus. Post + foodlog bunu tetikler.
const DAILY_POST_POINTS = 20;
const WEEKLY_STREAK_BONUS = 50;

async function recordStreak(userId) {
  const today = new Date(toDateOnly(new Date()));
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Bugün ilk aktivite mi? (puanı günde bir kez vermek için)
  const existingToday = await prisma.streak.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  const isFirstToday = !existingToday;

  const prev = await prisma.streak.findUnique({
    where: { userId_date: { userId, date: yesterday } },
  });
  const count = prev ? prev.count + 1 : 1;
  await prisma.streak.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, count },
    update: { count },
  });

  // Rozetler (7/14/30 gün)
  const badges = await prisma.badge.findMany();
  for (const badge of badges) {
    if (count >= badge.daysRequired) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        create: { userId, badgeId: badge.id },
        update: {},
      });
    }
  }

  const updated = await prisma.streak.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  // Yıldız puanı — yalnızca günün ilk aktivitesinde (günde max 1)
  let awarded = 0;
  let bonus = 0;
  if (isFirstToday && updated) {
    awarded = DAILY_POST_POINTS;
    await awardPoints(userId, DAILY_POST_POINTS, 'post_created', updated.id);
    // Haftalık seri bonusu: 7, 14, 21... günde
    if (updated.count % 7 === 0) {
      bonus = WEEKLY_STREAK_BONUS;
      await awardPoints(userId, WEEKLY_STREAK_BONUS, 'streak_weekly', updated.id);
    }
  }

  // Mobil kutlama animasyonu için kazanılan puanı da döndür (awarded/bonus)
  return { ...updated, awarded, bonus };
}

// Record activity for today (call when user posts or logs a meal)
router.post('/record', async (req, res, next) => {
  try {
    const result = await recordStreak(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
module.exports.recordStreak = recordStreak;
