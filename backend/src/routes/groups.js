const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { getStarPointsForUserIds } = require('../lib/streakStats');
const { awardPoints } = require('../services/starService');

const prisma = new PrismaClient();
const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `group-${uuidv4()}${path.extname(file.originalname) || '.jpg'}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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
      createdBy: group.createdBy,
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
      if (req.file) data.imageUrl = `${BASE_URL}/uploads/${req.file.filename}`;

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
      if (req.file) imageUrl = `${BASE_URL}/uploads/${req.file.filename}`;
      const group = await prisma.group.create({
        data: {
          name: req.body.name,
          description: req.body.description || null,
          imageUrl,
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

// Join group
router.post('/:id/join', async (req, res, next) => {
  try {
    await prisma.groupMember.create({
      data: { userId: req.user.id, groupId: req.params.id, role: 'member' },
    });
    const existingGroupJoinAwards = await prisma.starTransaction.count({
      where: {
        userId: req.user.id,
        reason: 'group_joined',
        refId: req.params.id,
      },
    });
    if (existingGroupJoinAwards === 0) {
      await awardPoints(req.user.id, 10, 'group_joined', req.params.id);
    }
    res.json({ message: 'Gruba katıldınız' });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Zaten üyesisiniz' });
    next(e);
  }
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
