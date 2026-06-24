const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('displayName').trim().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email, password, displayName } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Bu e-posta zaten kayıtlı' });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          emailVerified: false,
          profile: {
            create: { displayName },
          },
        },
        include: { profile: true },
      });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      res.status(201).json({
        user: { id: user.id, email: user.email, emailVerified: user.emailVerified, profile: user.profile },
        token,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').exists()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });
      if (!user) return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      res.json({
        user: { id: user.id, email: user.email, emailVerified: user.emailVerified, profile: user.profile },
        token,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Forgot Password — OTP gönder
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-posta gerekli' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    // Güvenlik: kullanıcı yoksa da aynı yanıtı dön
    if (user) {
      // Önceki geçersiz kodları temizle
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 haneli
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 dk

      await prisma.passwordResetToken.create({
        data: { id: require('crypto').randomUUID(), userId: user.id, code, expiresAt },
      });

      // TODO: e-posta gönderimi (nodemailer / SendGrid) buraya eklenecek
      // Geliştirme modunda kodu konsola yazdır:
      console.log(`[DEV] Şifre sıfırlama kodu → ${email}: ${code}`);
    }

    res.json({ message: 'Eğer bu e-posta kayıtlıysa sıfırlama kodu gönderildi.' });
  } catch (e) {
    next(e);
  }
});

// Reset Password — kodu doğrula ve şifreyi güncelle
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'E-posta, kod ve yeni şifre gerekli' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(400).json({ error: 'Geçersiz kod' });

    const token = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, code, used: false, expiresAt: { gt: new Date() } },
    });
    if (!token) return res.status(400).json({ error: 'Kod geçersiz veya süresi dolmuş' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.passwordResetToken.update({ where: { id: token.id }, data: { used: true } });

    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (e) {
    next(e);
  }
});

// Me (current user)
router.get('/me', authMiddleware, (req, res) => {
  const u = req.user;
  res.json({
    user: {
      id: u.id,
      email: u.email,
      emailVerified: u.emailVerified,
      profile: u.profile,
    },
  });
});

module.exports = router;
