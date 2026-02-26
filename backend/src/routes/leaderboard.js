const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware);

// Leaderboard: by star points (sum of streak counts in current period)
// Simplified: we use sum of streak counts in last 30 days as "points"
router.get('/', async (req, res, next) => {
  try {
    const period = req.query.period || 'month'; // week | month
    const days = period === 'week' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const streaks = await prisma.streak.findMany({
      where: { date: { gte: since } },
    });
    const pointsByUser = {};
    for (const s of streaks) {
      pointsByUser[s.userId] = (pointsByUser[s.userId] || 0) + s.count;
    }
    const sorted = Object.entries(pointsByUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);
    const userIds = sorted.map(([id]) => id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
      select: { id: true, profile: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    const leaderboard = sorted.map(([userId, points], index) => ({
      rank: index + 1,
      userId,
      profile: userMap[userId]?.profile,
      points,
    }));
    res.json({ period, leaderboard });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
