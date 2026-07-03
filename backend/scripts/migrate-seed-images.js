// migrate-seed-images.js — Tek seferlik: seed sırasında localhost URL'iyle kaydedilmis
// resimleri (backend/uploads icindeki tarif + ornek feed gorselleri) Supabase Storage'a
// yukler ve ilgili DB kayitlarinin imageUrl'ini public URL ile gunceller.
//
// Calistir: cd backend && node scripts/migrate-seed-images.js
// Gerekli env: SUPABASE_URL, SUPABASE_SERVICE_KEY (.env icinde).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_KEY tanimli degil. .env kontrol et.');
  process.exit(1);
}

const prisma = new PrismaClient();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

function contentTypeFor(name) {
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

// relPath: uploads koku icinde gorece yol; key: bucket icindeki hedef yol
async function uploadLocal(relPath, key) {
  const full = path.join(UPLOAD_DIR, relPath);
  if (!fs.existsSync(full)) {
    console.warn(`  ! dosya yok, atlaniyor: ${relPath}`);
    return null;
  }
  const buffer = fs.readFileSync(full);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, { contentType: contentTypeFor(key), upsert: true });
  if (error) throw new Error(`${key}: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

async function main() {
  console.log('== Tarif resimleri ==');
  const recipes = await prisma.recipe.findMany();
  for (const r of recipes) {
    const rel = `recipes/${r.slug}.jpg`;
    const url = await uploadLocal(rel, rel);
    if (url) {
      await prisma.recipe.update({ where: { id: r.id }, data: { imageUrl: url } });
      console.log(`  ${r.slug} -> ${url}`);
    }
  }

  console.log('== Ornek feed postlari (localhost gorselleri) ==');
  const posts = await prisma.post.findMany({ where: { imageUrl: { contains: '/uploads/' } } });
  for (const p of posts) {
    const rel = p.imageUrl.split('/uploads/')[1];
    if (!rel || rel.startsWith('http')) continue;
    // Zaten Supabase public URL ise atla
    if (p.imageUrl.includes('/storage/v1/object/public/')) continue;
    const url = await uploadLocal(rel, rel);
    if (url) {
      await prisma.post.update({ where: { id: p.id }, data: { imageUrl: url } });
      console.log(`  ${rel} -> ${url}`);
    }
  }

  console.log('Bitti.');
}

main()
  .catch((e) => {
    console.error('HATA:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
