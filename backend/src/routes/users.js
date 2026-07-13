const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { getStarPointsForUserIds, getCurrentStreakForUserIds } = require('../lib/streakStats');
const { publicProfileSelect } = require('../lib/publicProfile');
const { awardPoints, getStarPointsInPeriod } = require('../services/starService');
const { uploadFile } = require('../services/storageService');

const prisma = require('../lib/prisma');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

// PATCH /api/users/me/password — mevcut şifreyi doğrula, yenisini ayarla
router.patch(
  '/me/password',
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      const ok = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
      if (!ok) return res.status(400).json({ error: 'Mevcut şifre yanlış' });
      const passwordHash = await bcrypt.hash(req.body.newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
      res.json({ message: 'Şifre güncellendi' });
    } catch (e) { next(e); }
  }
);

// POST /api/users/me/feedback — uygulama içi değerlendirme/geri bildirim (şimdilik log; DB/e-posta persist follow-up)
router.post(
  '/me/feedback',
  [body('rating').optional().isInt({ min: 1, max: 5 }), body('message').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      console.log('[feedback]', { userId: req.user.id, rating: req.body.rating, message: String(req.body.message).slice(0, 800) });
      res.status(201).json({ ok: true });
    } catch (e) { next(e); }
  }
);

// Monthly post calendar — returns posts for a given month grouped by day
router.get('/me/calendar', async (req, res, next) => {
  try {
    const { month } = req.query; // format: "2026-06"
    const now = new Date();
    const year  = month ? parseInt(month.split('-')[0], 10) : now.getFullYear();
    const mon   = month ? parseInt(month.split('-')[1], 10) - 1 : now.getMonth();
    const start = new Date(year, mon, 1);
    const end   = new Date(year, mon + 1, 0, 23, 59, 59, 999);
    const posts = await prisma.post.findMany({
      where: { userId: req.user.id, createdAt: { gte: start, lte: end } },
      select: { id: true, type: true, imageUrl: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    // Group by day (1-31)
    const days = {};
    for (const p of posts) {
      const day = new Date(p.createdAt).getDate();
      if (!days[day]) days[day] = [];
      days[day].push({ id: p.id, type: p.type, hasImage: !!p.imageUrl });
    }
    res.json({ year, month: mon + 1, days });
  } catch (e) { next(e); }
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
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('weightKg').optional().isFloat({ min: 0 }),
    body('heightCm').optional().isFloat({ min: 0 }),
    body('dailyCalorieGoal').optional().isInt({ min: 0 }),
    body('onboardingCompleted').optional().isBoolean(),
    body('kvkkConsent').optional().isBoolean(),
    body('onboardingData').optional().isObject(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { goal, age, gender, weightKg, heightCm, dailyCalorieGoal, onboardingCompleted, onboardingData } = req.body;
      const data = {};
      if (goal !== undefined) data.goal = goal;
      if (age !== undefined) data.age = age;
      if (gender !== undefined) data.gender = gender;
      if (weightKg !== undefined) data.weightKg = weightKg;
      if (heightCm !== undefined) data.heightCm = heightCm;
      if (dailyCalorieGoal !== undefined) data.dailyCalorieGoal = dailyCalorieGoal;
      if (onboardingCompleted === true) data.onboardingCompleted = true;
      if (onboardingData !== undefined) {
        data.onboardingData =
          typeof onboardingData === 'string' ? onboardingData : JSON.stringify(onboardingData);
      }

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
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('kvkkConsent').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const allowed = ['displayName', 'weightKg', 'heightCm', 'dailyCalorieGoal', 'goalNote', 'gender'];
      const data = {};
      for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];
      // isPublic toggle
      if (req.body.isPublic !== undefined) data.isPublic = req.body.isPublic === true || req.body.isPublic === 'true';
      if (req.body.phone !== undefined) data.phone = String(req.body.phone).trim() || null;
      // Username — benzersiz handle
      if (req.body.username !== undefined && String(req.body.username).trim()) {
        const uname = String(req.body.username).trim().toLowerCase().replace(/^@/, '');
        if (!/^[a-z0-9_.]{3,20}$/.test(uname)) {
          return res.status(400).json({ error: 'Kullanıcı adı 3-20 karakter olmalı (harf, rakam, _ veya .)' });
        }
        const taken = await prisma.profile.findFirst({ where: { username: uname, NOT: { userId: req.user.id } } });
        if (taken) return res.status(409).json({ error: 'Bu kullanıcı adı alınmış' });
        data.username = uname;
      }
      if (req.file) data.avatarUrl = await uploadFile(req.file.buffer, { prefix: 'avatar', originalname: req.file.originalname, contentType: req.file.mimetype });

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
      select: { id: true, profile: { select: publicProfileSelect } },
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

// Search users (for friends) — case-insensitive via raw SQL LIKE for SQLite
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    // Postgres: ILIKE = case-insensitive arama (SQLite'da LIKE zaten insensitive'di)
    const users = await prisma.$queryRaw`
      SELECT u.id, p.display_name as displayName, p.avatar_url as avatarUrl, p.goal_note as goalNote
      FROM "User" u
      JOIN "Profile" p ON p.user_id = u.id
      WHERE u.id != ${req.user.id}
        AND p.display_name ILIKE ${'%' + q + '%'}
      LIMIT 20
    `;

    const userIds = users.map((u) => u.id);
    const starPointsMap = await getStarPointsForUserIds(prisma, userIds);

    const result = users.map((u) => ({
      id: u.id,
      profile: { displayName: u.displayName, avatarUrl: u.avatarUrl, goalNote: u.goalNote },
      starPoints: starPointsMap[u.id] ?? 0,
    }));

    res.json(result);
  } catch (e) {
    next(e);
  }
});

// GET /api/users/username-available?username=x — onboarding'de canlı kontrol (/:id'den ÖNCE)
router.get('/username-available', async (req, res, next) => {
  try {
    const uname = String(req.query.username || '').trim().toLowerCase().replace(/^@/, '');
    if (!/^[a-z0-9_.]{3,20}$/.test(uname)) return res.json({ available: false, reason: 'format' });
    const taken = await prisma.profile.findFirst({ where: { username: uname, NOT: { userId: req.user.id } } });
    res.json({ available: !taken });
  } catch (e) { next(e); }
});

// GET public profile of any user
router.get('/:id', async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        lastSeenAt: true,
        profile: { select: publicProfileSelect },
        _count: { select: { posts: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    const [starPointsMap, streakMap] = await Promise.all([
      getStarPointsForUserIds(prisma, [targetId]),
      getCurrentStreakForUserIds(prisma, [targetId]),
    ]);

    // Leaderboard rank (kaç kişi bu kullanıcıdan fazla puana sahip + 1)
    const allStars = await prisma.starTransaction.groupBy({
      by: ['userId'],
      _sum: { points: true },
    });
    const myPoints = starPointsMap[targetId] ?? 0;
    const rank = allStars.filter((r) => (r._sum.points ?? 0) > myPoints).length + 1;

    // Takip durumu
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: req.user.id, friendId: targetId },
          { userId: targetId, friendId: req.user.id },
        ],
      },
    });
    const followStatus = friendship?.status ?? null; // pending | accepted | null
    const isFollowing = followStatus === 'accepted';

    // Takipçi / Takip edilen sayısı (friendship tablosundan)
    const [followerCount, followingCount] = await Promise.all([
      prisma.friendship.count({ where: { friendId: targetId, status: 'accepted' } }),
      prisma.friendship.count({ where: { userId: targetId, status: 'accepted' } }),
    ]);

    // isPublic bilgisini raw SQL ile çek (Prisma client generate edilmemiş olabilir)
    const privacyRow = await prisma.$queryRaw`
      SELECT is_public FROM "Profile" WHERE user_id = ${targetId} LIMIT 1
    `;
    // Boolean(): SQLite 0/1 ve Postgres true/false ikisinde de doğru (önceki `!== 0` Postgres'te false için de true dönüyordu)
    const isPublic = privacyRow.length > 0 ? Boolean(privacyRow[0].is_public) : true;

    res.json({
      id: user.id,
      lastSeenAt: user.lastSeenAt,
      profile: user.profile,
      postCount: user._count.posts,
      followerCount,
      followingCount,
      starPoints: myPoints,
      currentStreak: streakMap[targetId] ?? 0,
      leaderboardRank: rank,
      isFollowing,
      followStatus,
      isPublic,
    });
  } catch (e) { next(e); }
});

// GET /api/users/:id/presence — hafif son görülme (ChatScreen poll'u için ucuz sorgu)
router.get('/:id/presence', async (req, res, next) => {
  try {
    const u = await prisma.user.findUnique({ where: { id: req.params.id }, select: { lastSeenAt: true } });
    res.json({ lastSeenAt: u?.lastSeenAt ?? null });
  } catch (e) { next(e); }
});

// GET user's posts
router.get('/:id/posts', async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 18,
      select: {
        id: true, type: true, imageUrl: true, caption: true, createdAt: true, viewCount: true,
        _count: { select: { likes: true, comments: true } },
      },
    });
    res.json(posts);
  } catch (e) { next(e); }
});

// Takipçi listesi (bu kullanıcıyı takip edenler)
router.get('/:id/followers', async (req, res, next) => {
  try {
    const rows = await prisma.friendship.findMany({
      where: { friendId: req.params.id, status: 'accepted' },
      include: { user: { select: { id: true, profile: { select: publicProfileSelect } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows.map((r) => ({ id: r.user.id, profile: r.user.profile })));
  } catch (e) { next(e); }
});

// Takip edilenler listesi
router.get('/:id/following', async (req, res, next) => {
  try {
    const rows = await prisma.friendship.findMany({
      where: { userId: req.params.id, status: 'accepted' },
      include: { friend: { select: { id: true, profile: { select: publicProfileSelect } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows.map((r) => ({ id: r.friend.id, profile: r.friend.profile })));
  } catch (e) { next(e); }
});

// GET common groups between current user and target user
router.get('/:id/common-groups', async (req, res, next) => {
  try {
    const myGroupIds = await prisma.groupMember
      .findMany({ where: { userId: req.user.id }, select: { groupId: true } })
      .then((r) => r.map((x) => x.groupId));

    const theirGroupIds = await prisma.groupMember
      .findMany({ where: { userId: req.params.id }, select: { groupId: true } })
      .then((r) => r.map((x) => x.groupId));

    const commonIds = myGroupIds.filter((id) => theirGroupIds.includes(id));
    if (commonIds.length === 0) return res.json([]);

    const groups = await prisma.group.findMany({
      where: { id: { in: commonIds } },
      include: { _count: { select: { members: true } } },
    });
    res.json(groups.map((g) => ({
      id: g.id, name: g.name, description: g.description,
      imageUrl: g.imageUrl, memberCount: g._count.members,
    })));
  } catch (e) { next(e); }
});

// Follow a user — private hesaplarda pending, public'te accepted
router.post('/:id/follow', async (req, res, next) => {
  try {
    const friendId = req.params.id;
    if (friendId === req.user.id) return res.status(400).json({ error: 'Kendinizi takip edemezsiniz' });
    const existing = await prisma.friendship.findFirst({
      where: { OR: [{ userId: req.user.id, friendId }, { userId: friendId, friendId: req.user.id }] },
    });
    if (existing) return res.status(400).json({ error: 'Zaten takip ediyorsunuz veya istek bekliyor', status: existing.status });

    // Hedef kullanıcının isPublic durumunu kontrol et
    const privacyRow = await prisma.$queryRaw`SELECT is_public FROM "Profile" WHERE user_id = ${friendId} LIMIT 1`;
    // Boolean(): SQLite 0/1 ve Postgres true/false ikisinde de doğru (önceki `!== 0` Postgres'te false için de true dönüyordu)
    const isPublic = privacyRow.length > 0 ? Boolean(privacyRow[0].is_public) : true;
    const status = isPublic ? 'accepted' : 'pending';

    const fr = await prisma.friendship.create({ data: { userId: req.user.id, friendId, status } });

    // Bildirim gönder
    const { createNotification } = require('./notifications');
    if (isPublic) {
      await createNotification(friendId, req.user.id, 'follow_accepted'); // direkt kabul bildirimi yok, isteğe bağlı
    } else {
      await createNotification(friendId, req.user.id, 'follow_request');
    }

    res.status(201).json({ message: isPublic ? 'Takip edildi' : 'Takip isteği gönderildi', status, friendshipId: fr.id });
  } catch (e) { next(e); }
});

// Unfollow a user
router.delete('/:id/follow', async (req, res, next) => {
  try {
    const friendId = req.params.id;
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: req.user.id, friendId },
          { userId: friendId, friendId: req.user.id },
        ],
      },
    });
    res.json({ message: 'Takipten çıkıldı' });
  } catch (e) { next(e); }
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
    // +15 aynı çift için ömür boyu 1 kez — çık/tekrar-ekle collusion loop'unu kapatır.
    // refId = karşı tarafın userId'si; friendship.id silinip yeniden oluştuğu için kalıcı iz olamaz.
    const already = await prisma.starTransaction.findFirst({
      where: { userId: acceptorId, reason: 'friend_added', refId: requesterId },
      select: { id: true },
    });
    if (!already) {
      await awardPoints(requesterId, 15, 'friend_added', acceptorId);
      await awardPoints(acceptorId, 15, 'friend_added', requesterId);
    }
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
        user: { select: { id: true, profile: { select: publicProfileSelect } } },
        friend: { select: { id: true, profile: { select: publicProfileSelect } } },
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
