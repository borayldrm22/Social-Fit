const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { getStarPointsForUserIds, getCurrentStreakForUserIds } = require('../lib/streakStats');
const { awardPoints, getStarPointsInPeriod } = require('../services/starService');

const prisma = new PrismaClient();
const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `avatar-${uuidv4()}${path.extname(file.originalname) || '.jpg'}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);

// Get my profile
router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, emailVerified: true, profile: true },
    });
    const [starPointsMap, weekStarPoints, monthStarPoints] = await Promise.all([
      getStarPointsForUserIds(prisma, [req.user.id]),
      getStarPointsInPeriod(req.user.id, 'week'),
      getStarPointsInPeriod(req.user.id, 'month'),
    ]);
    const starPoints = starPointsMap[req.user.id] ?? 0;
    res.json({
      ...user,
      starPoints,
      weekStarPoints,
      monthStarPoints,
    });
  } catch (e) {
    next(e);
  }
});

// Last 20 star transactions for "Puan Geçmişi"
router.get('/me/star-history', async (req, res, next) => {
  try {
    const transactions = await prisma.starTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, points: true, reason: true, createdAt: true, refId: true },
    });
    res.json(transactions);
  } catch (e) {
    next(e);
  }
});

// Onboarding: update profile and mark onboarding complete
const GOAL_VALUES = ['lose_weight', 'gain_muscle', 'eat_healthy', 'stay_active'];
router.patch(
  '/me/onboarding',
  [
    body('goal').optional().isIn(GOAL_VALUES),
    body('age').optional().isInt({ min: 1, max: 150 }),
    body('weightKg').optional().isFloat({ min: 0 }),
    body('heightCm').optional().isFloat({ min: 0 }),
    body('dailyCalorieGoal').optional().isInt({ min: 0 }),
    body('onboardingCompleted').optional().isBoolean(),
    body('kvkkConsent').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { goal, age, weightKg, heightCm, dailyCalorieGoal, onboardingCompleted } = req.body;
      const data = {};
      if (goal !== undefined) data.goal = goal;
      if (age !== undefined) data.age = age;
      if (weightKg !== undefined) data.weightKg = weightKg;
      if (heightCm !== undefined) data.heightCm = heightCm;
      if (dailyCalorieGoal !== undefined) data.dailyCalorieGoal = dailyCalorieGoal;
      if (onboardingCompleted === true) data.onboardingCompleted = true;

      const sendingHealthData = weightKg !== undefined || heightCm !== undefined;
      if (sendingHealthData) {
        const existingProfile = await prisma.profile.findUnique({
          where: { userId: req.user.id },
          select: { kvkkConsentAt: true },
        });
        if (!existingProfile?.kvkkConsentAt && req.body.kvkkConsent !== true) {
          return res.status(400).json({
            error: 'KVKK_AUTH_REQUIRED',
            message: 'Sağlık verilerini kaydetmek için KVKK aydınlatma metnini kabul etmeniz gerekmektedir.',
          });
        }
      }
      if (req.body.kvkkConsent === true) {
        data.kvkkConsentAt = new Date();
      }

      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        create: {
          userId: req.user.id,
          displayName: req.user.profile?.displayName || 'User',
          ...data,
        },
        update: Object.keys(data).length ? data : {},
      });
      res.json(profile);
    } catch (e) {
      next(e);
    }
  }
);

// Update profile
router.patch(
  '/me',
  upload.single('avatar'),
  [
    body('displayName').optional().trim(),
    body('weightKg').optional().isFloat({ min: 0 }),
    body('heightCm').optional().isFloat({ min: 0 }),
    body('dailyCalorieGoal').optional().isInt({ min: 0 }),
    body('goalNote').optional().trim(),
    body('kvkkConsent').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const allowed = ['displayName', 'weightKg', 'heightCm', 'dailyCalorieGoal', 'goalNote'];
      const data = {};
      for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];
      if (req.file) data.avatarUrl = `${BASE_URL}/uploads/${req.file.filename}`;

      const healthKeys = ['weightKg', 'heightCm', 'dailyCalorieGoal', 'goalNote'];
      const isUpdatingHealth = healthKeys.some((k) => req.body[k] !== undefined);
      const existingProfile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
        select: { kvkkConsentAt: true },
      });
      if (isUpdatingHealth && !existingProfile?.kvkkConsentAt && req.body.kvkkConsent !== true) {
        return res.status(403).json({
          error: 'KVKK_AUTH_REQUIRED',
          message: 'Sağlık verilerini kaydetmek için KVKK aydınlatma metnini kabul etmeniz gerekmektedir.',
        });
      }
      if (req.body.kvkkConsent === true) {
        data.kvkkConsentAt = new Date();
      }

      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, displayName: req.user.profile?.displayName || 'User', ...data },
        update: Object.keys(data).length ? data : {},
      });

      const isProfileComplete =
        profile.displayName &&
        profile.displayName.trim() !== '' &&
        profile.weightKg != null &&
        profile.heightCm != null &&
        profile.dailyCalorieGoal != null &&
        profile.goalNote != null &&
        profile.goalNote.trim() !== '';
      if (isProfileComplete) {
        const existingAward = await prisma.starTransaction.count({
          where: { userId: req.user.id, reason: 'profile_completed' },
        });
        if (existingAward === 0) {
          await awardPoints(req.user.id, 20, 'profile_completed', null);
        }
      }

      res.json(profile);
    } catch (e) {
      next(e);
    }
  }
);

// Suggested users to follow (top 5 by total streak days, exclude self and friends)
router.get('/suggestions', async (req, res, next) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: req.user.id }, { friendId: req.user.id }],
      },
      select: { userId: true, friendId: true },
    });
    const friendIds = new Set([req.user.id]);
    for (const f of friendships) {
      friendIds.add(f.userId);
      friendIds.add(f.friendId);
    }
    const excludedIds = [...friendIds];

    const streakSums = await prisma.streak.groupBy({
      by: ['userId'],
      where: { userId: { notIn: excludedIds } },
      _sum: { count: true },
    });
    streakSums.sort((a, b) => (b._sum.count || 0) - (a._sum.count || 0));
    const topUserIds = streakSums.slice(0, 5).map((x) => x.userId);

    if (topUserIds.length === 0) return res.json([]);

    const users = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, profile: true },
    });
    const ordered = topUserIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);
    const [starPointsMap, currentStreakMap] = await Promise.all([
      getStarPointsForUserIds(prisma, topUserIds),
      getCurrentStreakForUserIds(prisma, topUserIds),
    ]);
    const result = ordered.map((u) => ({
      id: u.id,
      displayName: u.profile?.displayName ?? '',
      avatarUrl: u.profile?.avatarUrl ?? null,
      starPoints: starPointsMap[u.id] ?? 0,
      currentStreak: currentStreakMap[u.id] ?? 0,
    }));
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Search users (for friends)
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        profile: { displayName: { contains: q, mode: 'insensitive' } },
      },
      select: { id: true, profile: true },
      take: 20,
    });
    const userIds = users.map((u) => u.id);
    const starPointsMap = await getStarPointsForUserIds(prisma, userIds);
    const withStars = users.map((u) => ({ ...u, starPoints: starPointsMap[u.id] ?? 0 }));
    res.json(withStars);
  } catch (e) {
    next(e);
  }
});

// Friends: send request
router.post('/friends', async (req, res, next) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'friendId gerekli' });
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: req.user.id, friendId },
          { userId: friendId, friendId: req.user.id },
        ],
      },
    });
    if (existing) return res.status(400).json({ error: 'Zaten arkadaş veya bekleyen istek var' });
    await prisma.friendship.create({
      data: { userId: req.user.id, friendId, status: 'pending' },
    });
    res.status(201).json({ message: 'Arkadaşlık isteği gönderildi' });
  } catch (e) {
    next(e);
  }
});

// Friends: accept request
router.post('/friends/accept', async (req, res, next) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'friendId gerekli' });
    const fr = await prisma.friendship.findFirst({
      where: { userId: friendId, friendId: req.user.id, status: 'pending' },
    });
    if (!fr) return res.status(404).json({ error: 'Bekleyen istek bulunamadı' });
    await prisma.friendship.update({ where: { id: fr.id }, data: { status: 'accepted' } });
    const requesterId = fr.userId;
    const acceptorId = req.user.id;
    await awardPoints(requesterId, 15, 'friend_added', fr.id);
    await awardPoints(acceptorId, 15, 'friend_added', fr.id);
    res.json({ message: 'Arkadaşlık kabul edildi' });
  } catch (e) {
    next(e);
  }
});

// Friends: list (accepted)
router.get('/friends', async (req, res, next) => {
  try {
    const list = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: req.user.id }, { friendId: req.user.id }],
        status: 'accepted',
      },
      include: {
        user: { select: { id: true, profile: true } },
        friend: { select: { id: true, profile: true } },
      },
    });
    const friends = list.map((f) => {
      const other = f.userId === req.user.id ? f.friend : f.user;
      return { id: other.id, profile: other.profile };
    });
    res.json(friends);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
