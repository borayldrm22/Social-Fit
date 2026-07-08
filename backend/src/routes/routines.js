const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { awardPoints } = require('../services/starService');
const { recordStreak } = require('./streaks');

const prisma = new PrismaClient();
const router = express.Router();
router.use(authMiddleware);

const ROUTINE_POINTS = 3;

function toDateOnly(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

function normalize(r) {
  return {
    title: String(r.title).trim(),
    icon: r.icon || null,
    frequency: r.frequency === 'weekly' ? 'weekly' : 'daily',
    target: Number.isFinite(+r.target) && +r.target > 0 ? Math.round(+r.target) : 1,
    unit: r.unit || null,
  };
}

// GET /api/routines — aktif rutinler + bugünkü tamamlanma durumu
router.get('/', async (req, res, next) => {
  try {
    const today = toDateOnly(new Date());
    const routines = await prisma.routine.findMany({
      where: { userId: req.user.id, active: true },
      orderBy: { createdAt: 'asc' },
      include: { logs: { where: { date: today } } },
    });
    res.json(routines.map((r) => ({
      id: r.id, title: r.title, icon: r.icon, frequency: r.frequency,
      target: r.target, unit: r.unit,
      doneToday: r.logs[0]?.done ?? false,
      countToday: r.logs[0]?.count ?? 0,
    })));
  } catch (e) { next(e); }
});

// POST /api/routines — tek rutin oluştur
router.post('/', [body('title').trim().notEmpty()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const routine = await prisma.routine.create({
      data: { userId: req.user.id, ...normalize(req.body) },
    });
    res.status(201).json(routine);
  } catch (e) { next(e); }
});

// POST /api/routines/bulk — onboarding'de seçilen birden fazla rutin
router.post('/bulk', async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.routines) ? req.body.routines : [];
    const clean = items
      .filter((r) => r && String(r.title || '').trim())
      .map((r) => ({ userId: req.user.id, ...normalize(r) }));
    if (clean.length === 0) return res.json({ created: 0 });
    await prisma.routine.createMany({ data: clean });
    res.status(201).json({ created: clean.length });
  } catch (e) { next(e); }
});

// PATCH /api/routines/:id/complete — bugün için tamamla (toggle) → puan + streak
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const routine = await prisma.routine.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!routine) return res.status(404).json({ error: 'Rutin bulunamadı' });
    const today = toDateOnly(new Date());
    const existing = await prisma.routineLog.findUnique({
      where: { routineId_date: { routineId: routine.id, date: today } },
    });
    const nextDone = !existing?.done;
    // Puanı gün başına yalnızca bir kez ver — aç/kapa/aç toggle'ıyla tekrar kazanmayı önle
    const shouldAward = nextDone && !existing?.awarded;
    const log = await prisma.routineLog.upsert({
      where: { routineId_date: { routineId: routine.id, date: today } },
      create: { routineId: routine.id, userId: req.user.id, date: today, done: nextDone, count: nextDone ? routine.target : 0, awarded: shouldAward },
      update: { done: nextDone, count: nextDone ? routine.target : 0, awarded: existing?.awarded || shouldAward },
    });
    let awarded = 0;
    if (shouldAward) {
      awarded = ROUTINE_POINTS;
      await awardPoints(req.user.id, ROUTINE_POINTS, 'routine_done', log.id);
      await recordStreak(req.user.id); // rutin de günlük aktivite sayılır (streak)
    }
    res.json({ id: routine.id, doneToday: nextDone, awarded });
  } catch (e) { next(e); }
});

// DELETE /api/routines/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const routine = await prisma.routine.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!routine) return res.status(404).json({ error: 'Rutin bulunamadı' });
    await prisma.routine.delete({ where: { id: routine.id } });
    res.json({ message: 'Rutin silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
