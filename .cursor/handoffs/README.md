# Handoffs

Bu klasör subagent'lar arası **structured haberleşme dosyalarını** tutar. Her non-trivial feature için bir `.md` dosyası açılır, agent'lar buna yazar ve okur.

## Ne zaman handoff aç

**Aç:**
- Yeni feature (UI + backend dokunan)
- Multi-file refactor
- Birden fazla agent çağrılacak iş

**Açma:**
- Tek satır typo / copy fix
- Açık ve risksiz tek dosya bug fix
- Tek component'te küçük style düzeltmesi

## Kullanım

1. Supervisor (sen) `_TEMPLATE.md`'i kopyala: `.cursor/handoffs/<feature-slug>.md` (örn. `star-economy.md`)
2. Status'a "Spec: pending" yaz, kullanıcının orijinal isteğini yapıştır
3. `feature-spec` agent'ı çağırırken prompt'a handoff dosyasının yolunu ver — okuyup `Spec` bölümünü doldursun
4. `ui-designer` ve `backend-ui-bridge`'i çağırırken aynı dosyaya yönlendir
5. Her agent kendi bölümünü günceller (`UI Status`, `API Status`)
6. `qa-reviewer` `QA Review` bölümünü doldurur, PASS/NEEDS-FIX/BLOCKED işaretler
7. Feature kapanınca dosya repo'da kalır — geçmiş kararların kaydı

## Append-only kuralı

`Handoff Messages` bölümü append-only — agent'lar mesaj siler değil, üst üste yazar. Geriye dönük bakıldığında karar akışı bozulmasın.

## Dosya isimleri

- `star-economy.md` — yıldız puan ekonomisi
- `food-log-screens.md` — yemek günlüğü mobile ekranlar
- `socket-io-migration.md` — polling → socket geçişi
- `_TEMPLATE.md` — sakın silme

## Temizlik

Production'a giden feature'ların handoff dosyalarını **silme** — `.cursor/handoffs/archive/` altına taşı. Geçmiş kararlar gelecekteki agent'lara değerli context.
