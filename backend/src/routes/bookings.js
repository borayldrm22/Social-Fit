const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { awardPoints } = require('../services/starService');
const prisma = require('../lib/prisma');

const router = express.Router();

router.use(authMiddleware);

// List my bookings
router.get('/', async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      orderBy: { slotAt: 'desc' },
      include: {
        coach: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
    res.json(bookings);
  } catch (e) {
    next(e);
  }
});

// Create booking
router.post(
  '/',
  [body('coachId').isUUID(), body('slotAt').isISO8601()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { coachId, slotAt } = req.body;
      const coach = await prisma.coach.findUnique({ where: { id: coachId }, select: { id: true } });
      if (!coach) return res.status(404).json({ error: 'Koç bulunamadı' });
      const slotDate = new Date(slotAt);
      if (slotDate <= new Date()) return res.status(400).json({ error: 'Geçmiş bir tarih seçilemez' });
      // Aynı koç + aynı saat için mükerrer randevuyu engelle
      const dupe = await prisma.booking.findFirst({
        where: { userId: req.user.id, coachId, slotAt: slotDate },
        select: { id: true },
      });
      if (dupe) return res.status(409).json({ error: 'Bu saat için zaten randevun var' });
      // Puan farming önlemi: +25 yıldız koç başına yalnızca İLK randevuda verilir
      const priorWithCoach = await prisma.booking.findFirst({
        where: { userId: req.user.id, coachId },
        select: { id: true },
      });
      const booking = await prisma.booking.create({
        data: {
          userId: req.user.id,
          coachId,
          slotAt: slotDate,
          status: 'pending',
        },
        include: {
          coach: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });
      if (!priorWithCoach) await awardPoints(req.user.id, 25, 'coach_booked', booking.id);
      res.status(201).json(booking);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
