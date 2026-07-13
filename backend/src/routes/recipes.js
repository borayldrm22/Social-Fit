const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

// GET /api/recipes — public, tüm tarifler (JSON alanları parse edilmiş döner)
router.get('/', async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({ orderBy: { createdAt: 'asc' } });
    const parsed = recipes.map((r) => ({
      ...r,
      tags: safeParse(r.tags, []),
      ingredients: safeParse(r.ingredients, []),
      steps: safeParse(r.steps, []),
    }));
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
