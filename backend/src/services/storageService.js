// storageService.js — Dosya yükleme soyutlaması.
// SUPABASE_URL + SUPABASE_SERVICE_KEY tanımlıysa Supabase Storage'a yükler;
// tanımlı değilse yerel diske düşer (dev'de Supabase kurulmadan çalışmaya devam eder).
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

const useSupabase = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);

let supabase = null;
if (useSupabase) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  console.log(`[storage] Supabase Storage aktif · bucket: ${SUPABASE_BUCKET}`);
} else {
  console.log('[storage] Yerel disk kullanılıyor (SUPABASE_URL/SERVICE_KEY tanımlı değil)');
}

function guessExt(contentType) {
  if (!contentType) return '.jpg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('mp4')) return '.mp4';
  if (contentType.includes('quicktime')) return '.mov';
  return '.jpg';
}

/**
 * Bir dosya buffer'ını yükler ve erişilebilir URL döndürür.
 * @param {Buffer} buffer - multer memoryStorage'dan gelen req.file.buffer
 * @param {object} opts
 * @param {string} opts.prefix - dosya adı öneki (post | foodlog | avatar | group)
 * @param {string} [opts.originalname] - uzantı çıkarmak için
 * @param {string} [opts.contentType] - req.file.mimetype
 * @param {string} [opts.folder] - alt klasör (ör. 'foodlog')
 * @returns {Promise<string>} public URL
 */
async function uploadFile(buffer, { prefix = 'file', originalname = '', contentType, folder = '' } = {}) {
  const ext = path.extname(originalname) || guessExt(contentType);
  const name = `${prefix}-${uuidv4()}${ext}`;
  const key = folder ? `${folder}/${name}` : name;

  if (useSupabase) {
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(key, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: false,
    });
    if (error) throw new Error(`Supabase Storage yükleme hatası: ${error.message}`);
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  // Yerel disk fallback — mevcut /uploads static serve ile uyumlu
  const destDir = folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR;
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, name), buffer);
  return `${BASE_URL}/uploads/${folder ? `${folder}/` : ''}${name}`;
}

module.exports = { uploadFile, isCloud: () => useSupabase };
