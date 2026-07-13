const { toDateOnly } = require('./dateUtils');

/**
 * Compute current streak for one user from their streak records (ordered by date desc).
 */
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

/**
 * Shared helper to compute star points for multiple users from StarTransaction table.
 * Used by feed, comments, user search, group posts so star points appear next to usernames.
 */
async function getStarPointsForUserIds(prisma, userIds) {
  if (!userIds || userIds.length === 0) return {};
  const uniq = [...new Set(userIds)];
  const groups = await prisma.starTransaction.groupBy({
    by: ['userId'],
    where: { userId: { in: uniq } },
    _sum: { points: true },
  });
  const result = {};
  for (const id of uniq) result[id] = 0;
  for (const g of groups) {
    result[g.userId] = g._sum?.points ?? 0;
  }
  return result;
}

/**
 * Returns current streak (consecutive days including today) per user.
 */
async function getCurrentStreakForUserIds(prisma, userIds) {
  if (!userIds || userIds.length === 0) return {};
  const uniq = [...new Set(userIds)];
  const records = await prisma.streak.findMany({
    where: { userId: { in: uniq } },
    select: { userId: true, date: true, count: true },
    orderBy: { date: 'desc' },
  });
  const byUser = {};
  for (const id of uniq) byUser[id] = [];
  for (const r of records) byUser[r.userId].push(r);
  const today = toDateOnly(new Date());
  const result = {};
  for (const id of uniq) {
    result[id] = currentStreakFromRecords(byUser[id], today);
  }
  return result;
}

module.exports = { getStarPointsForUserIds, getCurrentStreakForUserIds };
