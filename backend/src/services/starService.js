const prisma = require('../lib/prisma');

/**
 * Create a star transaction (award points to a user).
 * @param {string} userId - User id (uuid)
 * @param {number} points - Points to award
 * @param {string} reason - One of: post_created | comment_created | like_received | group_joined | friend_added | profile_completed | coach_booked | streak_daily
 * @param {string|null} refId - Optional id of the post/comment/group that triggered this
 */
async function awardPoints(userId, points, reason, refId = null) {
  await prisma.starTransaction.create({
    data: {
      userId,
      points,
      reason,
      refId: refId ?? undefined,
    },
  });
}

/**
 * Sum all star transaction points for a user (lifetime).
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getStarPoints(userId) {
  const result = await prisma.starTransaction.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  return result._sum?.points ?? 0;
}

/**
 * Start of current Monday 00:00 UTC.
 */
function startOfWeekUTC() {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset, 0, 0, 0, 0));
  return monday;
}

/**
 * First day of current month 00:00 UTC.
 */
function startOfMonthUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Sum star points for a user in a given period.
 * @param {string} userId
 * @param {'week' | 'month' | 'all'} period
 * @returns {Promise<number>}
 */
async function getStarPointsInPeriod(userId, period) {
  let where = { userId };
  if (period === 'week') {
    where.createdAt = { gte: startOfWeekUTC() };
  } else if (period === 'month') {
    where.createdAt = { gte: startOfMonthUTC() };
  }
  const result = await prisma.starTransaction.aggregate({
    where,
    _sum: { points: true },
  });
  return result._sum?.points ?? 0;
}

module.exports = {
  awardPoints,
  getStarPoints,
  getStarPointsInPeriod,
};
