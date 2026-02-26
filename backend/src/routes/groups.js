const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

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

// List my groups
router.get('/', async (req, res, next) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.user.id },
      include: {
        group: true,
      },
    });
    res.json(memberships.map((m) => m.group));
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
        user: { include: { profile: true }, select: { id: true, profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    const withLiked = await Promise.all(
      posts.map(async (p) => {
        const like = await prisma.like.findUnique({
          where: { userId_postId: { userId: req.user.id, postId: p.id } },
        });
        return { ...p, liked: !!like };
      })
    );
    res.json(withLiked);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
