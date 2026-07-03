const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { getStarPointsForUserIds } = require('../lib/streakStats');
const { awardPoints } = require('../services/starService');
const { createNotification } = require('./notifications');
const { uploadFile } = require('../services/storageService');

const prisma = new PrismaClient();
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);

// List my groups (with latest post for "Yeni paylaşım" subtitle)
router.get('/', async (req, res, next) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.user.id },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
            posts: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { caption: true },
            },
          },
        },
      },
    });
    const groups = memberships.map((m) => {
      const { posts, ...group } = m.group;
      return { ...group, latestPost: posts[0] || null };
    });
    res.json(groups);
  } catch (e) {
    next(e);
  }
});

// Suggested groups to join (3 groups not yet joined, by member count desc)
router.get('/suggestions', async (req, res, next) => {
  try {
    const myGroupIds = await prisma.groupMember
      .findMany({ where: { userId: req.user.id }, select: { groupId: true } })
      .then((r) => r.map((x) => x.groupId));
    const where = myGroupIds.length ? { id: { notIn: myGroupIds } } : {};
    const groups = await prisma.group.findMany({
      where,
      include: { _count: { select: { members: true } } },
      orderBy: { members: { _count: 'desc' } },
      take: 3,
    });
    const result = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      imageUrl: g.imageUrl,
      memberCount: g._count.members,
    }));
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Discover / all groups (for join)
router.get('/discover', async (req, res, next) => {
  try {
    const myGroupIds = await prisma.groupMember
      .findMany({ where: { userId: req.user.id }, select: { groupId: true } })
      .then((r) => r.map((x) => x.groupId));
    const groups = await prisma.group.findMany({
      where: { id: { notIn: myGroupIds } },
      include: { _count: { select: { members: true } } },
    });
    res.json(groups);
  } catch (e) {
    next(e);
  }
});

// Groups with location for the map (markers) + my membership/pending status
router.get('/map', async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      include: { _count: { select: { members: true } } },
    });
    const [memberships, requests] = await Promise.all([
      prisma.groupMember.findMany({ where: { userId: req.user.id }, select: { groupId: true } }),
      prisma.groupJoinRequest.findMany({ where: { userId: req.user.id }, select: { groupId: true } }),
    ]);
    const memberIds = new Set(memberships.map((m) => m.groupId));
    const pendingIds = new Set(requests.map((r) => r.groupId));
    res.json(groups.map((g) => ({
      id: g.id, name: g.name, latitude: g.latitude, longitude: g.longitude,
      locationName: g.locationName, imageUrl: g.imageUrl, isPrivate: g.isPrivate,
      memberCount: g._count.members,
      isMember: memberIds.has(g.id), isPending: pendingIds.has(g.id),
    })));
  } catch (e) { next(e); }
});

// Group detail — id, name, description, imageUrl, memberCount, current user's role, members list
router.get('/:id', async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { members: true } },
        members: {
          include: { user: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!group) return res.status(404).json({ error: 'Grup bulunamadı' });

    const myMembership = group.members.find((m) => m.userId === req.user.id);
    const myRole = myMembership?.role || null;

    res.json({
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      isPrivate: group.isPrivate,
      latitude: group.latitude,
      longitude: group.longitude,
      locationName: group.locationName,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      myRole,
      members: group.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        displayName: m.user.profile?.displayName || m.user.id,
        avatarUrl: m.user.profile?.avatarUrl || null,
      })),
    });
  } catch (e) { next(e); }
});

// Edit group (admin only) — name, description, image
router.patch(
  '/:id',
  upload.single('image'),
  async (req, res, next) => {
    try {
      const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: req.user.id, groupId: req.params.id } },
      });
      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({ error: 'Sadece grup admini düzenleyebilir' });
      }
      const data = {};
      if (req.body.name?.trim()) data.name = req.body.name.trim();
      if (req.body.description !== undefined) data.description = req.body.description.trim() || null;
      if (req.file) data.imageUrl = await uploadFile(req.file.buffer, { prefix: 'group', originalname: req.file.originalname, contentType: req.file.mimetype });
      if (req.body.latitude !== undefined && req.body.latitude !== '') { const v = parseFloat(req.body.latitude); if (Number.isFinite(v)) data.latitude = v; }
      if (req.body.longitude !== undefined && req.body.longitude !== '') { const v = parseFloat(req.body.longitude); if (Number.isFinite(v)) data.longitude = v; }
      if (req.body.locationName !== undefined) data.locationName = req.body.locationName.trim() || null;
      if (req.body.isPrivate !== undefined) data.isPrivate = req.body.isPrivate === 'true' || req.body.isPrivate === true;

      const group = await prisma.group.update({ where: { id: req.params.id }, data });
      res.json(group);
    } catch (e) { next(e); }
  }
);

// Remove member (admin only)
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId: req.params.id } },
    });
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Sadece grup admini üye çıkarabilir' });
    }
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'Kendinizi çıkaramazsınız' });
    }
    await prisma.groupMember.delete({
      where: { userId_groupId: { userId: req.params.userId, groupId: req.params.id } },
    });
    res.json({ message: 'Üye gruptan çıkarıldı' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Üyelik bulunamadı' });
    next(e);
  }
});

// Create group
router.post(
  '/',
  upload.single('image'),
  [body('name').trim().notEmpty(), body('description').optional().trim()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      let imageUrl = null;
      if (req.file) imageUrl = await uploadFile(req.file.buffer, { prefix: 'group', originalname: req.file.originalname, contentType: req.file.mimetype });
      const lat = req.body.latitude !== undefined && req.body.latitude !== '' ? parseFloat(req.body.latitude) : null;
      const lng = req.body.longitude !== undefined && req.body.longitude !== '' ? parseFloat(req.body.longitude) : null;
      const group = await prisma.group.create({
        data: {
          name: req.body.name,
          description: req.body.description || null,
          imageUrl,
          latitude: Number.isFinite(lat) ? lat : null,
          longitude: Number.isFinite(lng) ? lng : null,
          locationName: req.body.locationName?.trim() || null,
          isPrivate: req.body.isPrivate === 'true' || req.body.isPrivate === true,
          createdBy: req.user.id,
        },
      });
      await prisma.groupMember.create({
        data: { userId: req.user.id, groupId: group.id, role: 'admin' },
      });
      res.status(201).json(group);
    } catch (e) {
      next(e);
    }
  }
);

// Join group — public: instant; private: create request + notify admins
router.post('/:id/join', async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      select: { id: true, isPrivate: true },
    });
    if (!group) return res.status(404).json({ error: 'Grup bulunamadı' });
    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId: req.params.id } },
    });
    if (existing) return res.status(400).json({ error: 'Zaten üyesisiniz' });

    if (group.isPrivate) {
      await prisma.groupJoinRequest.upsert({
        where: { userId_groupId: { userId: req.user.id, groupId: req.params.id } },
        create: { userId: req.user.id, groupId: req.params.id },
        update: {},
      });
      const admins = await prisma.groupMember.findMany({
        where: { groupId: req.params.id, role: 'admin' },
        select: { userId: true },
      });
      for (const a of admins) {
        await createNotification(a.userId, req.user.id, 'group_join_request', req.params.id);
      }
      return res.json({ status: 'pending', message: 'Katılma isteği gönderildi' });
    }

    await prisma.groupMember.create({
      data: { userId: req.user.id, groupId: req.params.id, role: 'member' },
    });
    const existingGroupJoinAwards = await prisma.starTransaction.count({
      where: { userId: req.user.id, reason: 'group_joined', refId: req.params.id },
    });
    if (existingGroupJoinAwards === 0) {
      await awardPoints(req.user.id, 10, 'group_joined', req.params.id);
    }
    res.json({ status: 'joined', message: 'Gruba katıldınız' });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Zaten üye veya bekleyen istek var' });
    next(e);
  }
});

async function isGroupAdmin(userId, groupId) {
  const m = await prisma.groupMember.findUnique({ where: { userId_groupId: { userId, groupId } } });
  return !!m && m.role === 'admin';
}

// List pending join requests (admin only)
router.get('/:id/requests', async (req, res, next) => {
  try {
    if (!(await isGroupAdmin(req.user.id, req.params.id))) {
      return res.status(403).json({ error: 'Sadece grup admini görebilir' });
    }
    const requests = await prisma.groupJoinRequest.findMany({
      where: { groupId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    const users = await prisma.user.findMany({
      where: { id: { in: requests.map((r) => r.userId) } },
      select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });
    const umap = Object.fromEntries(users.map((u) => [u.id, u.profile]));
    res.json(requests.map((r) => ({
      userId: r.userId,
      createdAt: r.createdAt,
      displayName: umap[r.userId]?.displayName || 'Kullanıcı',
      avatarUrl: umap[r.userId]?.avatarUrl || null,
    })));
  } catch (e) { next(e); }
});

// Approve a join request (admin only)
router.post('/:id/requests/:userId/approve', async (req, res, next) => {
  try {
    if (!(await isGroupAdmin(req.user.id, req.params.id))) {
      return res.status(403).json({ error: 'Sadece grup admini onaylayabilir' });
    }
    const reqRow = await prisma.groupJoinRequest.findUnique({
      where: { userId_groupId: { userId: req.params.userId, groupId: req.params.id } },
    });
    if (!reqRow) return res.status(404).json({ error: 'İstek bulunamadı' });
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId: req.params.userId, groupId: req.params.id } },
      create: { userId: req.params.userId, groupId: req.params.id, role: 'member' },
      update: {},
    });
    await prisma.groupJoinRequest.delete({
      where: { userId_groupId: { userId: req.params.userId, groupId: req.params.id } },
    });
    const award = await prisma.starTransaction.count({
      where: { userId: req.params.userId, reason: 'group_joined', refId: req.params.id },
    });
    if (award === 0) await awardPoints(req.params.userId, 10, 'group_joined', req.params.id);
    await createNotification(req.params.userId, req.user.id, 'group_join_accepted', req.params.id);
    await prisma.$executeRaw`UPDATE notifications SET read = 1 WHERE user_id = ${req.user.id} AND from_user_id = ${req.params.userId} AND type = 'group_join_request' AND post_id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Reject a join request (admin only)
router.post('/:id/requests/:userId/reject', async (req, res, next) => {
  try {
    if (!(await isGroupAdmin(req.user.id, req.params.id))) {
      return res.status(403).json({ error: 'Sadece grup admini reddedebilir' });
    }
    await prisma.groupJoinRequest.deleteMany({
      where: { userId: req.params.userId, groupId: req.params.id },
    });
    await prisma.$executeRaw`UPDATE notifications SET read = 1 WHERE user_id = ${req.user.id} AND from_user_id = ${req.params.userId} AND type = 'group_join_request' AND post_id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Leave group
router.post('/:id/leave', async (req, res, next) => {
  try {
    await prisma.groupMember.delete({
      where: { userId_groupId: { userId: req.user.id, groupId: req.params.id } },
    });
    res.json({ message: 'Gruptan ayrıldınız' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Üyelik bulunamadı' });
    next(e);
  }
});

// Group feed (posts in group)
router.get('/:id/posts', async (req, res, next) => {
  try {
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId: req.params.id } },
    });
    if (!member) return res.status(403).json({ error: 'Bu gruba üye değilsiniz' });
    const posts = await prisma.post.findMany({
      where: { groupId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    const authorIds = posts.map((p) => p.user.id);
    const starPointsMap = await getStarPointsForUserIds(prisma, authorIds);
    const withLiked = await Promise.all(
      posts.map(async (p) => {
        const like = await prisma.like.findUnique({
          where: { userId_postId: { userId: req.user.id, postId: p.id } },
        });
        const user = { ...p.user, starPoints: starPointsMap[p.user.id] ?? 0 };
        return { ...p, user, liked: !!like };
      })
    );
    res.json(withLiked);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
