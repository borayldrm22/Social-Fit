// dateUtils.js — Gün anahtarı hesabı, Türkiye saatine göre (kalıcı UTC+3, DST yok).
// Server nerede çalışırsa çalışsın (Render = UTC) "bugün" TR duvar saatiyle belirlenir;
// anahtar o TR gününün UTC gece yarısı olarak saklanır — mevcut kayıt formatıyla uyumlu.
// Önceden her dosya server-local toDateOnly kullanıyordu → Render'da gün 03:00 TRT'de
// dönüyor, 00:00–03:00 arası loglar önceki güne yazılıyordu (streak/leaderboard bozulması).
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

function toDateOnly(d) {
  const shifted = new Date(new Date(d).getTime() + TR_OFFSET_MS); // TR duvar saati
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

module.exports = { toDateOnly, TR_OFFSET_MS };
