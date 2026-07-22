const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { getStarPointsForUserIds } = require('../lib/streakStats');
const { publicProfileSelect } = require('../lib/publicProfile');
const { awardPoints } = require('../services/starService');
const { recordStreak } = require('./streaks');
const { uploadFile } = require('../services/storageService');

const prisma = require('../lib/prisma');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB for videos

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

function hasSavedPostModel() {
  return prisma.savedPost && typeof prisma.savedPost.findMany === 'function';
}

async function getSavedPostIds(viewerId, postIds) {
  if (!hasSavedPostModel()) return [];
  try {
    const savedRows = await prisma.savedPost.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    });
    return savedRows.map((row) => row.postId);
  } catch (e) {
    if (e.code === 'P2021') return [];
    throw e;
  }
}

async function decoratePosts(items, viewerId) {
  const authorIds = items.map((p) => p.user.id);
  const postIds = items.map((p) => p.id);
  const savedPostIdsPromise = getSavedPostIds(viewerId, postIds);
  const [starPointsMap, likes, savedPosts] = await Promise.all([
    getStarPointsForUserIds(prisma, authorIds),
    prisma.like.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    }),
    savedPostIdsPromise,
  ]);
  const likedIds = new Set(likes.map((like) => like.postId));
  const savedIds = new Set(savedPosts);
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
        user: { select: { id: true, profile: { select: publicProfileSelect } } },
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
      SELECT user_id FROM "Profile" WHERE is_public = true
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
        user: { select: { id: true, profile: { select: publicProfileSelect } } },
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
    if (!hasSavedPostModel()) return res.json({ posts: [] });
    let savedRows = [];
    try {
      savedRows = await prisma.savedPost.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              user: { select: { id: true, profile: { select: publicProfileSelect } } },
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
      });
    } catch (e) {
      if (e.code === 'P2021') return res.json({ posts: [] });
      throw e;
    }
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
    body('type').optional().isIn(['meal', 'workout', 'text', 'general']),
    body('caption').optional().trim(),
    body('groupId').optional().isUUID(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { caption, groupId } = req.body;
      // Gruba paylaşım yalnız üyelere — groupId doğrulanmadan herkes grup akışına post atabiliyordu
      if (groupId) {
        const member = await prisma.groupMember.findUnique({
          where: { userId_groupId: { userId: req.user.id, groupId } },
        });
        if (!member) return res.status(403).json({ error: 'Bu gruba üye değilsiniz' });
      }
      const type = req.body.type || 'meal';
      const tagsArr = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [];
      const tagsStr = JSON.stringify(tagsArr);
      const metadataObj = req.body.metadata ? (typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata) : null;
      const metadataStr = metadataObj ? JSON.stringify(metadataObj) : null;
      let imageUrl = null;
      if (req.file) imageUrl = await uploadFile(req.file.buffer, { prefix: 'post', originalname: req.file.originalname, contentType: req.file.mimetype });
      console.log('[POST /api/posts] body:', req.body, 'file:', req.file?.originalname);
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
          user: { select: { id: true, profile: { select: publicProfileSelect } } },
        },
      });
      // Streak + günlük yıldız puanı (günde max 1 — recordStreak içinde). Await edilir ki
      // kazanılan puan yanıtla dönsün (mobil kutlama); hata post'u düşürmesin (non-fatal).
      let streak = null;
      try {
        streak = await recordStreak(req.user.id);
      } catch (e) {
        console.error('[recordStreak] failed:', e.message);
      }
      res.status(201).json({ ...post, tags: tagsArr, metadata: metadataObj, awarded: streak?.awarded || 0, bonus: streak?.bonus || 0 });
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
    // Kendi postunu beğenmek puan/bildirim getirmez (self-farm önlemi)
    if (post && post.userId !== req.user.id) {
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
    // Beğeni geri alınınca +1'i de geri al — aç/kapa/aç ile puan farming'ini kapatır
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });
    if (post && post.userId !== req.user.id) {
      await awardPoints(post.userId, -1, 'like_received', req.params.id);
    }
    res.json({ liked: false });
  } catch (e) {
    if (e.code === 'P2025') return res.json({ liked: false });
    next(e);
  }
});

// Save post
router.post('/:id/save', async (req, res, next) => {
  try {
    if (!hasSavedPostModel()) {
      return res.status(503).json({ error: 'Kaydetme ozelligi icin migration gerekli. Backend icinde "npx prisma migrate dev" calistirin.' });
    }
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
    if (e.code === 'P2021') {
      return res.status(503).json({ error: 'Kaydetme ozelligi icin tablo olusmamis. Backend icinde "npx prisma db push" calistirin.' });
    }
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
    if (!hasSavedPostModel()) {
      return res.status(503).json({ error: 'Kaydetme ozelligi icin migration gerekli. Backend icinde "npx prisma migrate dev" calistirin.' });
    }
    await prisma.savedPost.delete({
      where: { userId_postId: { userId: req.user.id, postId: req.params.id } },
    });
    res.json({ saved: false });
  } catch (e) {
    if (e.code === 'P2021') {
      return res.status(503).json({ error: 'Kaydetme ozelligi icin tablo olusmamis. Backend icinde "npx prisma db push" calistirin.' });
    }
    if (e.code === 'P2025') return res.json({ saved: false });
    next(e);
  }
});

// Görüntülenme sayacı — feed'de post göründüğünde çağrılır (client oturum başına 1 kez)
router.post('/:id/view', async (req, res, next) => {
  try {
    await prisma.post.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });
    res.json({ ok: true });
  } catch (e) {
    // Post silinmişse sessizce geç — görüntülenme kritik değil
    res.json({ ok: false });
  }
});

// Comments list
router.get('/:id/comments', async (req, res, next) => {
  try {
    const [comments, post] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: req.params.id },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, profile: { select: publicProfileSelect } } } },
      }),
      prisma.post.findUnique({ where: { id: req.params.id }, select: { userId: true } }),
    ]);
    const commenterIds = comments.map((c) => c.user.id);
    const starPointsMap = await getStarPointsForUserIds(prisma, commenterIds);
    const isPostOwner = post?.userId === req.user.id;
    const withStars = comments.map((c) => ({
      ...c,
      user: { ...c.user, starPoints: starPointsMap[c.user.id] ?? 0 },
      canEdit: c.userId === req.user.id,
      canDelete: c.userId === req.user.id || isPostOwner,
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
      // Puan kararı için: postun sahibi + kullanıcının bu posta önceki yorum sayısı
      const post = await prisma.post.findUnique({ where: { id: req.params.id }, select: { userId: true } });
      const priorComments = await prisma.comment.count({ where: { postId: req.params.id, userId: req.user.id } });
      const comment = await prisma.comment.create({
        data: { userId: req.user.id, postId: req.params.id, body: req.body.body },
        include: { user: { select: { id: true, profile: { select: publicProfileSelect } } } },
      });
      // +2 yalnızca BAŞKASININ postuna İLK yorumda — çoklu-yorum farming önlemi
      if (post && post.userId !== req.user.id && priorComments === 0) {
        await awardPoints(req.user.id, 2, 'comment_created', comment.id);
      }
      res.status(201).json({ ...comment, canEdit: true, canDelete: true });
    } catch (e) {
      next(e);
    }
  }
);

// Edit own comment
router.patch(
  '/:id/comments/:commentId',
  [body('body').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
      if (!comment || comment.postId !== req.params.id) return res.status(404).json({ error: 'Yorum bulunamadı' });
      if (comment.userId !== req.user.id) return res.status(403).json({ error: 'Sadece kendi yorumunu düzenleyebilirsin' });
      const updated = await prisma.comment.update({
        where: { id: comment.id },
        data: { body: req.body.body },
        include: { user: { select: { id: true, profile: { select: publicProfileSelect } } } },
      });
      res.json({ ...updated, canEdit: true, canDelete: true });
    } catch (e) {
      next(e);
    }
  }
);

// Delete comment — yorum sahibi veya gönderi sahibi silebilir
router.delete('/:id/comments/:commentId', async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
    if (!comment || comment.postId !== req.params.id) return res.status(404).json({ error: 'Yorum bulunamadı' });
    const post = await prisma.post.findUnique({ where: { id: req.params.id }, select: { userId: true } });
    if (comment.userId !== req.user.id && post?.userId !== req.user.id) {
      return res.status(403).json({ error: 'Bu yorumu silme yetkin yok' });
    }
    await prisma.comment.delete({ where: { id: comment.id } });
    res.json({ message: 'Yorum silindi' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
