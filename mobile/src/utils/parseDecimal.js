// parseDecimal.js — TR ondalık virgülünü destekleyen güvenli sayı parse'ı.
// TR klavyede decimal-pad virgül üretir; parseFloat("70,5") === 70 sessizce yanlış değer verir.
// Bu helper virgülü noktaya çevirir ve geçersiz girdide NaN döner.
export function parseDecimal(value) {
  if (typeof value === 'number') return value;
  const s = String(value ?? '').trim().replace(',', '.');
  if (s === '') return NaN; // boş girdi geçersiz — Number("") === 0 tuzağını önle
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
