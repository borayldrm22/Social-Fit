// prisma.js — Tek paylaşılan PrismaClient (singleton).
// Önceden her route/middleware/service kendi `new PrismaClient()`'ını açıyordu (15 ayrı havuz) —
// Supabase/Render bağlantı limitinde "too many connections" riski. Tüm dosyalar buradan import eder.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
