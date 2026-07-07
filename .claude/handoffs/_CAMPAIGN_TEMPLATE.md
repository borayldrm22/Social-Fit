# Campaign Handoff: <kampanya-adı>

**Slug:** `<kampanya-slug>`
**Açıldı:** YYYY-MM-DD
**Owner (supervisor):** Bora
**Funnel aşaması (birincil):** acquisition / activation / retention / referral / revenue
**Kampanya tipi:** launch / always-on / experiment / seasonal
**Bütçe tavanı:** `<TL veya "organik only">`
**Review tarihleri:** mid-campaign YYYY-MM-DD · final YYYY-MM-DD

## Status

| Bölüm | Durum |
|---|---|
| Strateji / Brief | pending / in-progress / done / blocked |
| Organik sosyal | pending / in-progress / done / blocked |
| Ücretli reklam | pending / in-progress / done / blocked |
| Influencer & topluluk | pending / in-progress / done / blocked |
| ASO / SEO | pending / in-progress / done / blocked |
| Tracking plan | pending / in-progress / done / blocked |
| Mid-campaign review | pending / in-progress / done / n/a |
| Retention / referral | pending / in-progress / done / n/a |
| Analiz (review) | pending / passed / needs-fix / blocked |

## User Request

```
Kullanıcının orijinal isteği — değiştirme, kopyala yapıştır.
```

---

## Strateji / Brief
*Sahip: `mkt-growth-strategist`*

- **Hedef (ölçülebilir):** <metrik + eşik + tarih>
- **Funnel aşaması:** acquisition / activation / retention / referral / revenue
- **Hedef kitle:** <ICP alt segmenti>
- **Ana mesaj:** <tek cümle>
- **Zaman çizelgesi:** <hafta hafta>

### Kanal dağıtımı

| Kanal | Sahip | Görev |
|---|---|---|
| Organik sosyal | `mkt-social-content-creator` | ... |
| Ücretli reklam | `mkt-paid-ads-specialist` | ... / sonra |
| Influencer | `mkt-influencer-community` | ... |
| ASO / SEO | `mkt-aso-seo` | ... |

### Başarı kriteri (analyst ölçer)

- <metrik + eşik>

---

## Tracking Plan
*Sahip: `mkt-growth-strategist` + `mkt-marketing-analyst`*

| Event / metrik | Tanım | Kaynak | Sorumlu |
|---|---|---|---|
| waitlist_signup | Form submit | landing + UTM | ... |
| app_install | İlk açılış | store / MMP | ... |
| onboarding_complete | onboarding bitti | product analytics | ... |
| first_food_log | ilk değer anı | product analytics | ... |
| share_card_posted | haftalık kart paylaşımı | in-app event | ... |

- **UTM şeması:** `utm_source=...&utm_medium=...&utm_campaign=<slug>&utm_content=<variant>`
- **Primary metric:** ...
- **Guardrail metric:** ...
- **Minimum örneklem / süre:** ...

---

## Experiment Backlog
*Sahip: `mkt-growth-strategist` · Güncelleyen: kanal uzmanları*

| ID | Hipotez | Tek değişken | Kanal | Öncelik (ICE) | Durum |
|---|---|---|---|---|---|
| EXP-01 | ... | ... | ... | ... | planned/running/done |
| EXP-02 | ... | ... | ... | ... | planned/running/done |

- **Bu kampanyada aktif deneyler:** ...
- **Sonraki sprint backlog adayı:** ...

---

## Organik Sosyal
*Sahip: `mkt-social-content-creator`*

- Format(lar): ...
- İçerik takvimi: ...
- Üretilen dosyalar: ...
- Hook varyantları: ...

### Acceptance Criteria (Organik)
- [ ] Her asset'te net hook + CTA var
- [ ] Marka sesi ve KVKK kontrolü geçti
- [ ] Takvimde en az 3 içerik var (kampanya haftası)
- [ ] Handoff Messages'a teslim özeti eklendi

---

## Ücretli Reklam
*Sahip: `mkt-paid-ads-specialist`*

- Hazırlık kontrolü: store ✅/❌, dönüşüm event ✅/❌, retention ✅/❌
- Kanal(lar): ...
- Kampanya yapısı + kreatif varyantlar: ...
- Bütçe / UTM: ...

### Acceptance Criteria (Paid)
- [ ] Objective + optimization event açıkça tanımlı
- [ ] En az 3 kreatif varyant ve tek değişken test planı var
- [ ] iOS attribution (SKAN/AEM) notu mevcut
- [ ] Handoff Messages'a teslim özeti eklendi

---

## Influencer & Topluluk
*Sahip: `mkt-influencer-community`*

- Segment + tier: ...
- Aday liste (doğrulanacak): ...
- Outreach + collab brief: ...

### Acceptance Criteria (Influencer)
- [ ] Adaylar kaynak/link ile listelendi
- [ ] DM + follow-up şablonu hazır
- [ ] #işbirliği/#reklam ifşası her brief'te var
- [ ] Handoff Messages'a teslim özeti eklendi

---

## ASO / SEO
*Sahip: `mkt-aso-seo`*

- Metadata / keyword: ...
- Screenshot / landing / blog: ...

### Acceptance Criteria (ASO/SEO)
- [ ] Tek değişkenli test hipotezleri yazıldı
- [ ] Apple PPO / Play experiment yaklaşımı belirtildi
- [ ] Landing/SEO içeriği hedef keyword ile eşleşiyor
- [ ] Handoff Messages'a teslim özeti eklendi

---

## Retention & Referral
*Sahip: `mkt-marketing-analyst` + ilgili kanal uzmanı*

- **Hedef metrikler:** D1 ..., D7 ..., D30 ..., share-card rate ..., K-factor ...
- **Lifecycle temasları (varsa):** D1 / D3 / D7 mesajları ...
- **Davet mekaniği:** link/kod + ödül ...
- **Riskler / guardrail:** churn sinyali, düşük kalite edinim, ifşa/KVKK ...

---

## Mid-Campaign Review (Gün 3/7)
*Sahip: `mkt-marketing-analyst`*

| Metrik | Hedef pace | Gerçek | Sinyal |
|---|---|---|---|
| ... | ... | ... | green/yellow/red |
| ... | ... | ... | green/yellow/red |

- **Karar:** devam / pivot / durdur
- **Aksiyon:** bütçe kaydır, kreatif değiştir, kanal durdur vb.

---

## Analiz / Review
*Sahip: `mkt-marketing-analyst`*

### Hedef vs Sonuç

| Metrik | Hedef | Sonuç |
|---|---|---|
| ... | ... | ... |

- **Kazanan:** ...
- **Kaybeden:** ...
- **Karar:** `PASS` / `İYİLEŞTİR` / `DUR`
- **Sonraki adım:** ...

---

## Decisions Log

- ...

## Open Questions

- @user: ...

## Handoff Messages
*Append-only — agent'lar üst üste yazar, silmez.*

- YYYY-MM-DD HH:MM `@mkt-...`: ...
