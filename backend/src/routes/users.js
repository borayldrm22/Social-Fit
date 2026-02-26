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
  filename: (req, file, cb) => cb(null, `avatar-${uuidv4()}${path.extname(file.originalname) || '.jpg'}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);

// Get my profile
router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
      select: { id: true, email: true, emailVerified: true, profile: true },
    });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

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
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const allowed = ['displayName', 'weightKg', 'heightCm', 'dailyCalorieGoal', 'goalNote'];
      const data = {};
      for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];
      if (req.file) data.avatarUrl = `${BASE_URL}/uploads/${req.file.filename}`;
      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, displayName: req.user.profile?.displayName || 'User', ...data },
        update: Object.keys(data).length ? data : {},
      });
      res.json(profile);
    } catch (e) {
      next(e);
    }
  }
);

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
      include: { profile: true },
      select: { id: true, profile: true },
      take: 20,
    });
    res.json(users);
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
        user: { include: { profile: true }, select: { id: true, profile: true } },
        friend: { include: { profile: true }, select: { id: true, profile: true } },
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
