const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware);

function toDateOnly(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

// Compute currentStreak and starPoints from streak records (same logic as streaks/me)
function streakStatsForUser(records, today) {
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
  const starPoints = records.reduce((sum, r) => sum + (r.count >= 7 ? 10 : r.count), 0);
  return { currentStreak, starPoints };
}

// Leaderboard: sum of streak counts in period; optional currentStreak/starPoints per entry
router.get('/', async (req, res, next) => {
  try {
    const period = req.query.period || 'month'; // week | month | all
    const today = toDateOnly(new Date());
    let since;
    if (period === 'week') {
      since = new Date(today);
      since.setDate(since.getDate() - 7);
    } else if (period === 'all') {
      since = new Date(today);
      since.setDate(since.getDate() - 90); // 90 days for "all-time" to keep query fast
    } else {
      since = new Date(today);
      since.setDate(since.getDate() - 30);
    }
    const streaks = await prisma.streak.findMany({
      where: { date: { gte: since } },
    });
    const pointsByUser = {};
    for (const s of streaks) {
      pointsByUser[s.userId] = (pointsByUser[s.userId] || 0) + s.count;
    }
    const sorted = Object.entries(pointsByUser)
      .sort((a, b) => b[1] - a[1]);
    const top50 = sorted.slice(0, 50);
    const userIds = top50.map(([id]) => id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
      select: { id: true, profile: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // Current user rank (from full sorted list)
    const myEntry = sorted.find(([id]) => id === req.user.id);
    const myRank = myEntry ? sorted.findIndex(([id]) => id === req.user.id) + 1 : null;
    const myPoints = myEntry ? myEntry[1] : 0;

    // Optional: currentStreak and starPoints for top 50 (batch fetch their streak records)
    const allRecordsForTop = await prisma.streak.findMany({
      where: { userId: { in: userIds } },
      orderBy: { date: 'desc' },
    });
    const byUser = {};
    for (const r of allRecordsForTop) {
      if (!byUser[r.userId]) byUser[r.userId] = [];
      byUser[r.userId].push(r);
    }
    const leaderboard = top50.map(([userId, points], index) => {
      const recs = byUser[userId] || [];
      const { currentStreak, starPoints } = streakStatsForUser(recs, today);
      return {
        rank: index + 1,
        userId,
        profile: userMap[userId]?.profile,
        points,
        currentStreak,
        starPoints,
      };
    });

    res.json({
      period,
      leaderboard,
      myRank,
      myPoints,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
