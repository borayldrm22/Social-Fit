const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();
router.use(authMiddleware);

// Bildirim oluşturma yardımcısı (diğer route'lardan import için)
async function createNotification(userId, fromUserId, type, postId = null) {
  if (userId === fromUserId) return; // Kendine bildirim gönderme
  try {
    await prisma.$executeRaw`
      INSERT INTO notifications (id, user_id, from_user_id, type, post_id, read, created_at)
      VALUES (${uuidv4()}, ${userId}, ${fromUserId}, ${type}, ${postId}, false, CURRENT_TIMESTAMP)
    `;
  } catch (e) {
    console.error('[createNotification] error:', e.message);
  }
}

// GET /api/notifications — okunmamış + son 30 bildirim
router.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        n.id, n.type, n.post_id as postId, n.read, n.created_at as createdAt,
        n.from_user_id as fromUserId,
        p.display_name as fromDisplayName,
        p.avatar_url as fromAvatarUrl
      FROM notifications n
      LEFT JOIN "User" u ON u.id = n.from_user_id
      LEFT JOIN "Profile" p ON p.user_id = n.from_user_id
      WHERE n.user_id = ${req.user.id}
      ORDER BY n.created_at DESC
      LIMIT 50
    `;

    const unreadCount = rows.filter((r) => !r.read).length;
    res.json({ notifications: rows, unreadCount });
  } catch (e) {
    next(e);
  }
});

// POST /api/notifications/read-all — hepsini okundu yap
router.post('/read-all', async (req, res, next) => {
  try {
    await prisma.$executeRaw`
      UPDATE notifications SET read = true WHERE user_id = ${req.user.id}
    `;
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res, next) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ${req.user.id} AND read = false
    `;
    res.json({ count: Number(rows[0]?.count ?? 0) });
  } catch (e) {
    next(e);
  }
});

// POST /api/notifications/follow-requests/:fromUserId/accept
router.post('/follow-requests/:fromUserId/accept', async (req, res, next) => {
  try {
    const { fromUserId } = req.params;
    await prisma.friendship.updateMany({
      where: { userId: fromUserId, friendId: req.user.id, status: 'pending' },
      data: { status: 'accepted' },
    });
    // Kabul eden kişiyi de takip et (mutual)
    const existing = await prisma.friendship.findFirst({
      where: { userId: req.user.id, friendId: fromUserId },
    });
    if (!existing) {
      await prisma.friendship.create({
        data: { userId: req.user.id, friendId: fromUserId, status: 'accepted' },
      });
    }
    // Kabul bildirimini bildir
    await createNotification(fromUserId, req.user.id, 'follow_accepted');
    // İlgili follow_request bildirimini okundu yap
    await prisma.$executeRaw`
      UPDATE notifications SET read = true
      WHERE user_id = ${req.user.id} AND from_user_id = ${fromUserId} AND type = 'follow_request'
    `;
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// POST /api/notifications/follow-requests/:fromUserId/reject
router.post('/follow-requests/:fromUserId/reject', async (req, res, next) => {
  try {
    const { fromUserId } = req.params;
    await prisma.friendship.deleteMany({
      where: { userId: fromUserId, friendId: req.user.id, status: 'pending' },
    });
    await prisma.$executeRaw`
      UPDATE notifications SET read = true
      WHERE user_id = ${req.user.id} AND from_user_id = ${fromUserId} AND type = 'follow_request'
    `;
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = { router, createNotification };
