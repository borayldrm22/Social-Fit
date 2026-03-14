const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { awardPoints } = require('../services/starService');

const prisma = new PrismaClient();
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
      await awardPoints(req.user.id, 25, 'coach_booked', booking.id);
      res.status(201).json(booking);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
