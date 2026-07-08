# Campaign Handoff: Waitlist Pilot (4 Weeks)

**Slug:** `waitlist-pilot-4w`
**Açıldı:** 2026-07-06
**Owner (supervisor):** Bora
**Funnel aşaması (birincil):** acquisition
**Kampanya tipi:** launch
**Bütçe tavanı:** 15000 TL (hafta 1-2 organik/influencer ağırlıklı, ücretli test sınırlı)
**Review tarihleri:** mid-campaign 2026-07-20 · final 2026-08-03

## Status

| Bölüm | Durum |
|---|---|
| Strateji / Brief | done |
| Organik sosyal | in-progress |
| Ücretli reklam | pending |
| Influencer & topluluk | in-progress |
| ASO / SEO | pending |
| Tracking plan | done |
| Mid-campaign review | pending |
| Retention / referral | in-progress |
| Analiz (review) | pending |

## User Request

```
Marketing Agent + Growth Plan'ı uygulayarak uygulamayı daha fazla kişinin karşısına çıkaracak ve içerik üretimini sistematik hale getirecek şekilde ilerle.
```

---

## Strateji / Brief
*Sahip: `mkt-growth-strategist`*

- **Hedef (ölçülebilir):** 4 haftada 500 waitlist kaydı; waitlist CAC <= 30 TL; install->first_log activation >= 35%.
- **Funnel aşaması:** acquisition (ikincil: activation).
- **Hedef kitle:** 18-45 TR, diyete başlayıp sürdüremeyen mobil-first kullanıcı.
- **Ana mesaj:** "Kalori saymaktan fazlası: Social Fit ile sosyal baskı ve streak sistemi sayesinde diyeti yarıda bırakma."
- **Zaman çizelgesi:** hafta 1 setup, hafta 2 içerik+influencer, hafta 3 ASO+paid test, hafta 4 analyst review.

### Kanal dağıtımı

| Kanal | Sahip | Görev |
|---|---|---|
| Organik sosyal | `mkt-social-content-creator` | Haftada 4 içerik, 3 hook varyantlı kısa video paketi |
| Ücretli reklam | `mkt-paid-ads-specialist` | Hafta 3'te sınırlı Meta app promotion testi (hazırlık geçerse) |
| Influencer | `mkt-influencer-community` | 10 mikro creator outreach, minimum 3 aktif collab |
| ASO / SEO | `mkt-aso-seo` | Store listing deney planı + waitlist landing copy iyileştirmesi |

### Başarı kriteri (analyst ölçer)

- Waitlist signups >= 500
- Paid testte CAC <= 30 TL (yalnızca readiness geçerse)
- Influencer kaynaklı signup payı >= %20
- D7 retention baseline'a göre artış trendi

---

## Tracking Plan
*Sahip: `mkt-growth-strategist` + `mkt-marketing-analyst`*

| Event / metrik | Tanım | Kaynak | Sorumlu |
|---|---|---|---|
| waitlist_signup | Landing form submit | landing + UTM | strategist |
| app_install | App ilk açılış | store / MMP | paid specialist |
| onboarding_complete | onboarding tamamlandı | product analytics | analyst |
| first_food_log | ilk anlamlı değer aksiyonu | product analytics | analyst |
| share_card_posted | haftalık kart paylaşımı | in-app event | social creator |

- **UTM şeması:** `utm_source=...&utm_medium=...&utm_campaign=waitlist-pilot-4w&utm_content=<variant>`
- **Primary metric:** waitlist_signup
- **Guardrail metric:** install->first_food_log activation rate
- **Minimum örneklem / süre:** her deney için minimum 7 gün veya anlamlı trafik

---

## Experiment Backlog
*Sahip: `mkt-growth-strategist` · Güncelleyen: kanal uzmanları*

| ID | Hipotez | Tek değişken | Kanal | Öncelik (ICE) | Durum |
|---|---|---|---|---|---|
| EXP-01 | Problem-led hook CTR'ı artırır | Hook tipi | Organik sosyal | 25 | running |
| EXP-02 | Creator tier (nano vs mikro) signup kalitesini değiştirir | Creator tier | Influencer | 20 | planned |
| EXP-03 | Screenshot 1 mesajı dönüşümü artırır | İlk screenshot başlığı | ASO | 18 | planned |
| EXP-04 | App Event Optimization, install objective'e göre daha iyi kalite getirir | Optimization event | Paid | 16 | blocked (readiness) |

- **Bu kampanyada aktif deneyler:** EXP-01
- **Sonraki sprint backlog adayı:** EXP-02, EXP-03

---

## Organik Sosyal
*Sahip: `mkt-social-content-creator`*

- Format(lar): Reels + TikTok kısa video, haftalık kart senaryosu, 3 hook ailesi
- İçerik takvimi: Pzt / Çar / Cum / Paz
- Üretilen dosyalar: script + caption + hashtag paketi
- Hook varyantları: problem-led, proof-led, streak-led

### Acceptance Criteria (Organik)
- [ ] Her asset'te net hook + CTA var
- [ ] Marka sesi ve KVKK kontrolü geçti
- [ ] Takvimde en az 3 içerik var (kampanya haftası)
- [ ] Handoff Messages'a teslim özeti eklendi

---

## Ücretli Reklam
*Sahip: `mkt-paid-ads-specialist`*

- Hazırlık kontrolü: store ✅, dönüşüm event ✅, retention ⚠ (yakından izle)
- Kanal(lar): Meta app promotion (küçük bütçe test)
- Kampanya yapısı + kreatif varyantlar: hafta 3'te 3 kreatif varyantla başlat
- Bütçe / UTM: günlük 500-700 TL test bütçesi, standart UTM

### Acceptance Criteria (Paid)
- [ ] Objective + optimization event açıkça tanımlı
- [ ] En az 3 kreatif varyant ve tek değişken test planı var
- [ ] iOS attribution (SKAN/AEM) notu mevcut
- [ ] Handoff Messages'a teslim özeti eklendi

---

## Influencer & Topluluk
*Sahip: `mkt-influencer-community`*

- Segment + tier: 70% mikro (10k-50k), 30% nano (1k-10k)
- Aday liste (doğrulanacak): 20 aday, 10 outreach, minimum 3 aktif içerik
- Outreach + collab brief: #işbirliği ifşalı, UTM/promo kodlu

### Acceptance Criteria (Influencer)
- [ ] Adaylar kaynak/link ile listelendi
- [ ] DM + follow-up şablonu hazır
- [ ] #işbirliği/#reklam ifşası her brief'te var
- [ ] Handoff Messages'a teslim özeti eklendi

---

## ASO / SEO
*Sahip: `mkt-aso-seo`*

- Metadata / keyword: TR odaklı motivasyon + streak intent kümesi
- Screenshot / landing / blog: ilk 2 screenshot mesajı ve hero copy A/B

### Acceptance Criteria (ASO/SEO)
- [ ] Tek değişkenli test hipotezleri yazıldı
- [ ] Apple PPO / Play experiment yaklaşımı belirtildi
- [ ] Landing/SEO içeriği hedef keyword ile eşleşiyor
- [ ] Handoff Messages'a teslim özeti eklendi

---

## Retention & Referral
*Sahip: `mkt-marketing-analyst` + ilgili kanal uzmanı*

- **Hedef metrikler:** D1 >= %30, D7 >= %15, share-card rate >= %8, K-factor trend yukarı
- **Lifecycle temasları (varsa):** D1 başarı mesajı, D3 geri dönüş nudge, D7 haftalık kart tetikleme
- **Davet mekaniği:** paylaşım kartı story + arkadaş davet CTA + koşullu yıldız ödülü
- **Riskler / guardrail:** düşük kaliteli paid traffic, hızlı churn, yanlış sağlık iddiaları

---

## Mid-Campaign Review (Gün 3/7)
*Sahip: `mkt-marketing-analyst`*

| Metrik | Hedef pace | Gerçek | Sinyal |
|---|---|---|---|
| Waitlist signup | >= 180 (hafta 2 sonu) | TBD | TBD |
| install->first_log | >= %35 | TBD | TBD |
| influencer katkı payı | >= %20 | TBD | TBD |

- **Karar:** devam / pivot / durdur
- **Aksiyon:** bütçe kaydır, kreatif değiştir, kanal durdur vb.

---

## Analiz / Review
*Sahip: `mkt-marketing-analyst`*

### Hedef vs Sonuç

| Metrik | Hedef | Sonuç |
|---|---|---|
| Waitlist signup | >= 500 | TBD |
| CAC | <= 30 TL | TBD |
| Activation (install->first_log) | >= %35 | TBD |
| Influencer katkı payı | >= %20 | TBD |

- **Kazanan:** TBD
- **Kaybeden:** TBD
- **Karar:** `PASS` / `İYİLEŞTİR` / `DUR`
- **Sonraki adım:** TBD

### Iteration Backlog (sonraki sprint)

1. TBD
2. TBD
3. TBD

---

## Decisions Log

- 2026-07-06: Pilot hedefi acquisition + activation olarak sabitlendi.
- 2026-07-06: Paid ölçekleme hafta 3 readiness kontrolüne bağlandı.

## Open Questions

- @user: Pilotta birincil başarı metriği waitlist mi, yoksa doğrudan install mı kalacak?

## Handoff Messages
*Append-only — agent'lar üst üste yazar, silmez.*

- 2026-07-06 15:50 `@mkt-growth-strategist`: 4 haftalık pilot brief oluşturuldu, kanal görevleri dağıtıldı.
