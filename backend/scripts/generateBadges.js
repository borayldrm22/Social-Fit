// generateBadges.js — Streak rozet gorsellerini ucretsiz Pollinations ile uretir.
// Anahtar/billing YOK. Ciktilar backend/assets/badges/<key>.png (repoya commit'lenir).
//
// Calistir: cd backend && node scripts/generateBadges.js
// Belirli tier(lar) icin: node scripts/generateBadges.js streak_7 streak_365

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'badges');

// Tutarli sanat stili — tier sayisi ve prestij metali farklilastirir, geri kalan ayni.
const STYLE =
  'circular achievement medal badge for a healthy lifestyle app, laurel wreath border, ' +
  'a fresh green leaf and healthy meal motif in the center, clean flat vector illustration, ' +
  'soft shadow, centered composition, plain light neutral background, crisp high detail, no text clutter';

const BADGES = [
  { key: 'streak_7', days: 7, accent: 'polished bronze and emerald green palette, glowing number 7' },
  { key: 'streak_14', days: 14, accent: 'brushed silver and emerald green palette, glowing number 14' },
  { key: 'streak_30', days: 30, accent: 'shiny gold and emerald green palette, glowing number 30' },
  { key: 'streak_60', days: 60, accent: 'gold and teal palette with small gems, glowing number 60' },
  { key: 'streak_90', days: 90, accent: 'gold and royal purple palette with gems, glowing number 90' },
  { key: 'streak_180', days: 180, accent: 'gold and ruby red palette, ornate, glowing number 180' },
  { key: 'streak_365', days: 365, accent: 'prestigious diamond and rainbow holographic gold palette, radiant crown, glowing number 365' },
];

async function fetchImage(prompt, seed) {
  const url =
    'https://image.pollinations.ai/prompt/' +
    encodeURIComponent(prompt) +
    `?width=768&height=768&model=flux&nologo=true&enhance=true&seed=${seed}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const only = process.argv.slice(2);
  const targets = only.length ? BADGES.filter((b) => only.includes(b.key)) : BADGES;
  if (!targets.length) {
    console.error('Eslesen rozet yok. Gecerli key\'ler:', BADGES.map((b) => b.key).join(', '));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Rozet gorselleri uretiliyor -> ${OUT_DIR}`);

  for (const badge of targets) {
    const prompt = `${STYLE}, ${badge.accent}`;
    process.stdout.write(`  ${badge.key} ... `);
    try {
      const buffer = await fetchImage(prompt, badge.days);
      const dest = path.join(OUT_DIR, `${badge.key}.png`);
      fs.writeFileSync(dest, buffer);
      console.log(`ok (${Math.round(buffer.length / 1024)} KB)`);
    } catch (e) {
      console.log(`HATA: ${e.message}`);
    }
  }

  console.log('Bitti.');
}

main();
