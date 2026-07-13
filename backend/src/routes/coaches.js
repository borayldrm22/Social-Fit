const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// List coaches (public for browsing; auth required to book)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const coaches = await prisma.coach.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, displayName: true, bio: true, avatarUrl: true },
    });
    res.json(coaches);
  } catch (e) {
    next(e);
  }
});

// Get single coach by id (for booking screen when opened with coachId only)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { id: req.params.id },
      select: { id: true, displayName: true, bio: true, avatarUrl: true },
    });
    if (!coach) return res.status(404).json({ error: 'Koç bulunamadı' });
    res.json(coach);
  } catch (e) {
    next(e);
  }
});

// Available slots for a coach
function generateSlotsForCoach(daysAhead = 14, slotsPerDay = ['09:00', '14:00', '18:00']) {
  const slots = [];
  const now = new Date();
  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    date.setHours(0, 0, 0, 0);
    for (const time of slotsPerDay) {
      const [h, m] = time.split(':').map(Number);
      const slotAt = new Date(date);
      slotAt.setHours(h, m, 0, 0);
      if (slotAt > now) slots.push({ slotAt: slotAt.toISOString() });
    }
  }
  return slots;
}

router.get('/:id/slots', authMiddleware, async (req, res, next) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!coach) return res.status(404).json({ error: 'Koç bulunamadı' });
    const slots = generateSlotsForCoach();
    res.json({ coachId: coach.id, slots });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
