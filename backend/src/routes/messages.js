const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware);

// List conversations (people I chatted with)
router.get('/conversations', async (req, res, next) => {
  try {
    const sent = await prisma.message.findMany({
      where: { senderId: req.user.id },
      distinct: ['receiverId'],
      orderBy: { createdAt: 'desc' },
      include: { receiver: { include: { profile: true }, select: { id: true, profile: true } } },
    });
    const received = await prisma.message.findMany({
      where: { receiverId: req.user.id },
      distinct: ['senderId'],
      orderBy: { createdAt: 'desc' },
      include: { sender: { include: { profile: true }, select: { id: true, profile: true } } },
    });
    const seen = new Set();
    const list = [];
    for (const m of [...sent, ...received]) {
      const otherId = m.senderId === req.user.id ? m.receiverId : m.senderId;
      if (seen.has(otherId)) continue;
      seen.add(otherId);
      const other = m.senderId === req.user.id ? m.receiver : m.sender;
      list.push({
        userId: other.id,
        profile: other.profile,
        lastMessage: m.body,
        lastAt: m.createdAt,
        unread: m.receiverId === req.user.id && !m.read,
      });
    }
    list.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));

    const otherIds = list.map((c) => c.userId);

    // Unread count per conversation (messages they sent me that I haven't read)
    const unreadCounts = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: req.user.id,
        senderId: { in: otherIds },
        read: false,
      },
      _count: { id: true },
    });
    const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u.senderId, u._count.id]));

    // Points (streak sum last 30 days) per user
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const streaks = await prisma.streak.findMany({
      where: { userId: { in: otherIds }, date: { gte: since } },
    });
    const pointsByUser = {};
    for (const s of streaks) {
      pointsByUser[s.userId] = (pointsByUser[s.userId] || 0) + s.count;
    }

    const result = list.map((c) => ({
      ...c,
      unreadCount: unreadMap[c.userId] ?? 0,
      points: pointsByUser[c.userId] ?? 0,
    }));

    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Get messages with a user
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { include: { profile: true }, select: { id: true, profile: true } },
      },
    });
    await prisma.message.updateMany({
      where: { senderId: userId, receiverId: req.user.id },
      data: { read: true },
    });
    res.json(messages);
  } catch (e) {
    next(e);
  }
});

// Send message
router.post(
  '/',
  [body('receiverId').notEmpty(), body('body').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { receiverId, body } = req.body;
      const message = await prisma.message.create({
        data: { senderId: req.user.id, receiverId, body },
        include: { sender: { include: { profile: true }, select: { id: true, profile: true } } },
      });
      res.status(201).json(message);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
