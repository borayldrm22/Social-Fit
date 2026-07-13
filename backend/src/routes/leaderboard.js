const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// Example leaderboard when no StarTransaction data exists
const EXAMPLE_LEADERBOARD = [
  { rank: 1, userId: 'example-1', displayName: 'Alex', avatarUrl: null, totalPoints: 42, currentStreak: 7, weekPoints: 12, monthPoints: 42, allTimePoints: 42 },
  { rank: 2, userId: 'example-2', displayName: 'Sam', avatarUrl: null, totalPoints: 38, currentStreak: 5, weekPoints: 10, monthPoints: 38, allTimePoints: 38 },
  { rank: 3, userId: 'example-3', displayName: 'Jordan', avatarUrl: null, totalPoints: 35, currentStreak: 4, weekPoints: 8, monthPoints: 35, allTimePoints: 35 },
  { rank: 4, userId: 'example-4', displayName: 'Casey', avatarUrl: null, totalPoints: 28, currentStreak: 3, weekPoints: 6, monthPoints: 28, allTimePoints: 28 },
  { rank: 5, userId: 'example-5', displayName: 'Riley', avatarUrl: null, totalPoints: 22, currentStreak: 2, weekPoints: 5, monthPoints: 22, allTimePoints: 22 },
  { rank: 6, userId: 'example-6', displayName: 'Morgan', avatarUrl: null, totalPoints: 18, currentStreak: 2, weekPoints: 4, monthPoints: 18, allTimePoints: 18 },
  { rank: 7, userId: 'example-7', displayName: 'Taylor', avatarUrl: null, totalPoints: 12, currentStreak: 1, weekPoints: 2, monthPoints: 12, allTimePoints: 12 },
];

router.use(authMiddleware);

function toDateOnly(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

function startOfWeekUTC() {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset, 0, 0, 0, 0));
}

function startOfMonthUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function currentStreakFromRecords(records, today) {
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
  return currentStreak;
}

// GET /api/leaderboard?period=week|month|all
router.get('/', async (req, res, next) => {
  try {
    const period = req.query.period || 'week';
    const scope = req.query.scope === 'friends' ? 'friends' : 'global';
    const today = toDateOnly(new Date());

    // Arkadaş kıyaslaması: yalnızca kabul edilmiş arkadaşlar + kullanıcının kendisi
    let allowedIds = null;
    if (scope === 'friends') {
      const friendships = await prisma.friendship.findMany({
        where: { status: 'accepted', OR: [{ userId: req.user.id }, { friendId: req.user.id }] },
        select: { userId: true, friendId: true },
      });
      const ids = new Set([req.user.id]);
      for (const f of friendships) ids.add(f.userId === req.user.id ? f.friendId : f.userId);
      allowedIds = ids;
    }

    const weekStart = startOfWeekUTC();
    const monthStart = startOfMonthUTC();

    const [weekGroups, monthGroups, allGroups] = await Promise.all([
      prisma.starTransaction.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: weekStart } },
        _sum: { points: true },
      }),
      prisma.starTransaction.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: monthStart } },
        _sum: { points: true },
      }),
      prisma.starTransaction.groupBy({
        by: ['userId'],
        _sum: { points: true },
      }),
    ]);

    const weekMap = Object.fromEntries(weekGroups.map((g) => [g.userId, g._sum?.points ?? 0]));
    const monthMap = Object.fromEntries(monthGroups.map((g) => [g.userId, g._sum?.points ?? 0]));
    const allMap = Object.fromEntries(allGroups.map((g) => [g.userId, g._sum?.points ?? 0]));

    const hasAnyData = weekGroups.length > 0 || monthGroups.length > 0 || allGroups.length > 0;

    // Örnek tablo yalnızca global scope'ta ve hiç veri yokken gösterilir.
    if (!hasAnyData && scope !== 'friends') {
      return res.json({
        period,
        leaderboard: EXAMPLE_LEADERBOARD,
        myRank: null,
        myPoints: 0,
      });
    }

    const periodMap = period === 'week' ? weekMap : period === 'month' ? monthMap : allMap;
    const sortedByPeriod = Object.entries(periodMap)
      .filter(([userId]) => !allowedIds || allowedIds.has(userId))
      .sort((a, b) => b[1] - a[1]);
    const top50UserIds = sortedByPeriod.slice(0, 50).map(([userId]) => userId);

    const myIndex = sortedByPeriod.findIndex(([id]) => id === req.user.id);
    const myRank = myIndex >= 0 ? myIndex + 1 : null;
    const myPoints = periodMap[req.user.id] ?? 0;

    const userIdsToFetch = [...new Set([...top50UserIds, req.user.id])];
    const [usersWithProfile, streakRecords] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIdsToFetch } },
        select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } },
      }),
      prisma.streak.findMany({
        where: { userId: { in: userIdsToFetch } },
        orderBy: { date: 'desc' },
        select: { userId: true, date: true, count: true },
      }),
    ]);

    const profileMap = Object.fromEntries(
      usersWithProfile.map((u) => [u.id, { displayName: u.profile?.displayName ?? 'Kullanıcı', avatarUrl: u.profile?.avatarUrl ?? null }])
    );
    const streakByUser = {};
    for (const r of streakRecords) {
      if (!streakByUser[r.userId]) streakByUser[r.userId] = [];
      streakByUser[r.userId].push(r);
    }

    const leaderboard = top50UserIds.map((userId, index) => {
      const profile = profileMap[userId] ?? { displayName: 'Kullanıcı', avatarUrl: null };
      const recs = streakByUser[userId] || [];
      const currentStreak = currentStreakFromRecords(recs, today);
      return {
        rank: index + 1,
        userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        totalPoints: periodMap[userId] ?? 0,
        currentStreak,
        weekPoints: weekMap[userId] ?? 0,
        monthPoints: monthMap[userId] ?? 0,
        allTimePoints: allMap[userId] ?? 0,
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
