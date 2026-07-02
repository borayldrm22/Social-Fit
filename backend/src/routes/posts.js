const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { getStarPointsForUserIds } = require('../lib/streakStats');
const { awardPoints } = require('../services/starService');
const { recordStreak } = require('./streaks');

const prisma = new PrismaClient();
const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `post-${uuidv4()}${path.extname(file.originalname) || '.jpg'}`),
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB for videos

router.use(authMiddleware);

function parseTags(s) {
  if (Array.isArray(s)) return s;
  try { return s ? JSON.parse(s) : []; } catch (_) { return []; }
}
function parseMetadata(s) {
  if (s == null) return null;
  if (typeof s === 'object') return s;
  try { return s ? JSON.parse(s) : null; } catch (_) { return null; }
}

async function decoratePosts(items, viewerId) {
  const authorIds = items.map((p) => p.user.id);
  const postIds = items.map((p) => p.id);
  const [starPointsMap, likes, savedPosts] = await Promise.all([
    getStarPointsForUserIds(prisma, authorIds),
    prisma.like.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    }),
    prisma.savedPost.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    }),
  ]);
  const likedIds = new Set(likes.map((like) => like.postId));
  const savedIds = new Set(savedPosts.map((saved) => saved.postId));
  return items.map((p) => {
    const user = { ...p.user, starPoints: starPointsMap[p.user.id] ?? 0 };
    return {
      ...p,
      user,
      tags: parseTags(p.tags),
      metadata: parseMetadata(p.metadata),
      liked: likedIds.has(p.id),
      saved: savedIds.has(p.id),
    };
  });
}

// Feed: posts from friends + own (or global for MVP)
router.get('/feed', async (req, res, next) => {
  try {
    const cursor = req.query.cursor;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const friendIds = await prisma.friendship
      .findMany({
        where: {
          OR: [{ userId: req.user.id }, { friendId: req.user.id }],
          status: 'accepted',
        },
        select: { userId: true, friendId: true },
      })
      .then((rows) => [...new Set(rows.flatMap((r) => [r.userId, r.friendId]).filter((id) => id !== req.user.id))]);
    const userIds = [req.user.id, ...friendIds];
    const where = { userId: { in: userIds }, groupId: null };
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    const decoratedPosts = await decoratePosts(items, req.user.id);
    res.json({ posts: decoratedPosts, nextCursor });
  } catch (e) {
    next(e);
  }
});

// Discover: public profile kullanıcılarının gönderileri (rastgele/son)
router.get('/discover', async (req, res, next) => {
  try {
    const cursor = req.query.cursor;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    // Raw SQL ile public profile'lı user id'leri çek
    const publicProfiles = await prisma.$queryRaw`
      SELECT user_id FROM "Profile" WHERE is_public = 1
    `;
    const publicUserIds = publicProfiles.map((r) => r.user_id);

    // Takip edilen kullanıcı id'leri
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: req.user.id }, { friendId: req.user.id }],
        status: 'accepted',
      },
      select: { userId: true, friendId: true },
    });
    const followingIds = new Set(
      friendships.flatMap((r) => [r.userId, r.friendId]).filter((id) => id !== req.user.id)
    );
    // Keşfet'ten çıkarılacaklar: kendi id + takip edilenler
    const excludeIds = [req.user.id, ...followingIds];
    const discoverIds = publicUserIds.filter((id) => !excludeIds.includes(id));

    const where = {
      groupId: null,
      userId: { in: discoverIds.length ? discoverIds : ['__none__'] },
    };
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    const decoratedPosts = await decoratePosts(items, req.user.id);
    res.json({ posts: decoratedPosts, nextCursor });
  } catch (e) {
    next(e);
  }
});

// Saved posts
router.get('/saved', async (req, res, next) => {
  try {
    const savedRows = await prisma.savedPost.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            user: { select: { id: true, profile: true } },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    });
    const posts = savedRows.map((row) => ({ ...row.post, savedAt: row.createdAt }));
    const decoratedPosts = await decoratePosts(posts, req.user.id);
    res.json({ posts: decoratedPosts });
  } catch (e) {
    next(e);
  }
});

// Create post
router.post(
  '/',
  upload.single('image'),
  [
    body('type').optional().isIn(['meal', 'workout', 'text']),
    body('caption').optional().trim(),
    body('groupId').optional().isUUID(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { caption, groupId } = req.body;
      const type = req.body.type || 'meal';
      const tagsArr = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [];
      const tagsStr = JSON.stringify(tagsArr);
      const metadataObj = req.body.metadata ? (typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata) : null;
      const metadataStr = metadataObj ? JSON.stringify(metadataObj) : null;
      let imageUrl = null;
      if (req.file) imageUrl = `${BASE_URL}/uploads/${req.file.filename}`;
      console.log('[POST /api/posts] body:', req.body, 'file:', req.file?.filename);
      const post = await prisma.post.create({
        data: {
          userId: req.user.id,
          groupId: groupId || null,
          type,
          imageUrl,
          caption: caption || null,
          tags: tagsStr,
          metadata: metadataStr,
        },
        include: {
          user: { select: { id: true, profile: true } },
        },
      });
      // Streak + günlük yıldız puanı (günde max 1, recordStreak içinde) — non-fatal
      recordStreak(req.user.id).catch((e) =>
        console.error('[recordStreak] failed:', e.message)
      );
      res.status(201).json({ ...post, tags: tagsArr, metadata: metadataObj });
    } catch (e) {
      next(e);
    }
  }
);

// Like
router.post('/:id/like', async (req, res, next) => {
  try {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.user.id, postId: req.params.id } },
    });
    if (existing) {
      res.json({ liked: true });
      return;
    }
    await prisma.like.create({
      data: { userId: req.user.id, postId: req.params.id },
    });
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });
    if (post) {
      await awardPoints(post.userId, 1, 'like_received', req.params.id);
      const { createNotification } = require('./notifications');
      await createNotification(post.userId, req.user.id, 'like', req.params.id);
    }
    res.json({ liked: true });
  } catch (e) {
    if (e.code === 'P2023') return res.status(404).json({ error: 'Gönderi bulunamadı' });
    if (e.code === 'P2002') {
      res.json({ liked: true });
      return;
    }
    next(e);
  }
});

// Unlike
router.delete('/:id/like', async (req, res, next) => {
  try {
    await prisma.like.delete({
      where: { userId_postId: { userId: req.user.id, postId: req.params.id } },
    });
    res.json({ liked: false });
  } catch (e) {
    if (e.code === 'P2025') return res.json({ liked: false });
    next(e);
  }
});

// Save post
router.post('/:id/save', async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!post) return res.status(404).json({ error: 'Gönderi bulunamadı' });
    await prisma.savedPost.create({
      data: { userId: req.user.id, postId: req.params.id },
    });
    res.json({ saved: true });
  } catch (e) {
    if (e.code === 'P2002') {
      res.json({ saved: true });
      return;
    }
    next(e);
  }
});

// Unsave post
router.delete('/:id/save', async (req, res, next) => {
  try {
    await prisma.savedPost.delete({
      where: { userId_postId: { userId: req.user.id, postId: req.params.id } },
    });
    res.json({ saved: false });
  } catch (e) {
    if (e.code === 'P2025') return res.json({ saved: false });
    next(e);
  }
});

// Comments list
router.get('/:id/comments', async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, profile: true } } },
    });
    const commenterIds = comments.map((c) => c.user.id);
    const starPointsMap = await getStarPointsForUserIds(prisma, commenterIds);
    const withStars = comments.map((c) => ({
      ...c,
      user: { ...c.user, starPoints: starPointsMap[c.user.id] ?? 0 },
    }));
    res.json(withStars);
  } catch (e) {
    next(e);
  }
});

// Add comment
router.post(
  '/:id/comments',
  [body('body').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const comment = await prisma.comment.create({
        data: { userId: req.user.id, postId: req.params.id, body: req.body.body },
        include: { user: { select: { id: true, profile: true } } },
      });
      await awardPoints(req.user.id, 2, 'comment_created', comment.id);
      res.status(201).json(comment);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
