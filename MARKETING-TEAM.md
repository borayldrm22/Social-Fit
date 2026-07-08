# Social Fit — Pazarlama Yapay Zekâ Takımı

Bu doküman, Social Fit projesindeki **pazarlama multi-agent sistemini** anlatır: ne olduğunu, nasıl çalıştığını, hangi agent/skill'in ne işe yaradığını ve bir kampanyayı uçtan uca nasıl yürüttüğünü.

> Kaynak dosyalar: `.claude/agents/marketing/` (6 agent) · `.claude/skills/marketing/` (14 skill) · `.claude/handoffs/_CAMPAIGN_TEMPLATE.md` (kampanya handoff'u). Cursor'da eşdeğeri `.cursor/` altında.

---

## 1. Ne ve neden

Ürün/kod tarafındaki **feature takımına birebir paralel**, kullanıcı kazanımı odaklı ikinci bir takım. Amaç: "büyüme" gibi muğlak bir hedefi, ölçülebilir bir kampanyaya çevirip doğru kanallara dağıtmak, uygulamak ve sonucu dürüstçe ölçmek.

**Temel prensip:** Tek bir dev agent gibi tek bir "pazarlamacı" yok. İş, uzmanlaşmış rollere bölünür; her rol kendi context'inde çalışır ve ortak bir dosya (handoff) üzerinden koordine olur. Bu, hem kaliteyi hem de tutarlılığı (aynı marka sesi, aynı KVKK sınırı) yükseltir.

```
                    ┌─────────────────────────────┐
                    │  SEN (ana oturum)           │
                    │  = Supervisor / Orchestrator│
                    └──────────────┬──────────────┘
                     ürün/kod │    │ pazarlama/kazanım
              ┌───────────────┘    └───────────────┐
              ▼                                     ▼
      FEATURE TAKIMI                       PAZARLAMA TAKIMI
   feature-spec → ui/backend            growth-strategist → 4 kanal
        → qa-reviewer                        → marketing-analyst

        └──────── paylaşımlı katman: skills + handoff ────────┘
```

---

## 2. Altı agent

| Agent | Rol | Yetki | Dev muadili |
|---|---|---|---|
| **`mkt-growth-strategist`** | Orkestratör. Hedefi ölçülebilir brief'e çevirir, funnel'ı teşhis eder, kanallara dağıtır, kampanya handoff'unu açar. **Kopya/kreatif ÜRETMEZ.** | read-only | `feature-spec` |
| **`mkt-social-content-creator`** | Organik içerik: Instagram Reels / TikTok senaryosu, hook, caption, hashtag, içerik takvimi, haftalık streak/liderlik kartı metni. | yazar | — |
| **`mkt-paid-ads-specialist`** | Ücretli reklam: Meta / Google App Campaigns / Apple Search Ads kreatif metni, hedefleme, kampanya yapısı, bütçe/teklif, UTM, A/B test. | yazar | — |
| **`mkt-influencer-community`** | TR influencer/diyetisyen sourcing + tier'lama, outreach DM/e-posta, collab brief, WhatsApp benzeri topluluk büyütme. | yazar | — |
| **`mkt-aso-seo`** | App Store & Google Play metadata + keyword (TR+EN), screenshot/preview stratejisi, blog SEO konu kümeleri, landing/waitlist copy. | yazar | — |
| **`mkt-marketing-analyst`** | Kampanya sonrası bağımsız review. Funnel, CAC, LTV, retention, ROAS okur/hesaplar; **PASS / İYİLEŞTİR / DUR** kararı verir. | read-only | `qa-reviewer` |

**Simetri:** Nasıl feature tarafında `feature-spec` (giriş, read-only) → uzmanlar → `qa-reviewer` (kapı, read-only) akıyorsa; pazarlamada `growth-strategist` (giriş) → 4 kanal uzmanı → `marketing-analyst` (kapı) aynı deseni izler.

---

## 3. On dört skill

Skill'ler agent'ların **progressive disclosure** ile gerektiğinde okuduğu bilgi/şablon dosyalarıdır. Her SKILL.md kısa ve odaklıdır.

**Temel / strateji**
- `mkt-strategy` — AARRR funnel, ICP, konumlandırma (April Dunford 5 adım), brief şablonu
- `mkt-brand-voice` — marka sesi, ton, hashtag setleri, **KVKK-güvenli dil sınırı** (ortak omurga)
- `mkt-metrics` — CAC, LTV, D1/D7/D30 retention, ROAS, funnel, A/B test tasarımı
- `mkt-copy-patterns` — hook / başlık / CTA formülleri, reusable kopya kalıpları

**Kanal playbook'ları**
- `mkt-organic-social` — Reels/TikTok formatları, hook kütüphanesi, takvim
- `mkt-paid-ads` — Meta/Google/Apple kampanya yapısı, kreatif, bütçe
- `mkt-influencer` — TR sourcing kriterleri, tier, outreach, ifşa kuralı
- `mkt-aso` — App Store/Play metadata alanları, TR keyword
- `mkt-content-seo` — blog pillar/cluster, TR SEO

**Büyüme sistemleri (yeni)**
- `mkt-experiments` — hipotez backlog'u, ICE önceliklendirme, deney işletim sistemi
- `mkt-lifecycle-retention` — D1/D3/D7 aktivasyon, geri kazanım, lifecycle
- `mkt-referral-viral` — davet mekanizması, paylaşım kartı, viral döngü, K-factor
- `mkt-content-ops` — brief → üretim → KVKK/brand kontrol → yayın operasyonu

**Kalite**
- `mkt-campaign-checklist` — kampanya Definition of Done (analyst kullanır)

> Ayrıca dev tarafından `social-fit-domain` skill'i (ürün vizyonu, 5 fazlı roadmap, gamification, KVKK) her iki takımda da ortaktır.

### Skill ↔ agent haritası

| Skill | Kullanan agent(lar) |
|---|---|
| `social-fit-domain` | strategist, aso-seo, influencer (ürün bağlamı) |
| `mkt-brand-voice` | neredeyse hepsi (ortak ses + KVKK) |
| `mkt-strategy` | growth-strategist |
| `mkt-metrics` | strategist, paid-ads, analyst |
| `mkt-copy-patterns` | social, paid-ads |
| `mkt-organic-social` | social |
| `mkt-paid-ads` | paid-ads |
| `mkt-influencer` | influencer-community |
| `mkt-aso` + `mkt-content-seo` | aso-seo |
| `mkt-campaign-checklist` | analyst |
| `mkt-lifecycle-retention` | social, analyst |
| `mkt-referral-viral` | social, influencer, analyst |
| `mkt-experiments` | strategist, analyst, paid-ads, aso-seo |
| `mkt-content-ops` | social, influencer, aso-seo |

---

## 4. Kampanya yaşam döngüsü

```
İstek ("launch haftası waitlist kampanyası")
   │
   ▼
① mkt-growth-strategist
   • hedefi ölçülebilir tek cümleye indirir ("4 haftada 500 waitlist, CAC<15TL")
   • zayıf funnel aşamasını teşhis eder (farkındalık? edinim? aktivasyon?)
   • ücretli reklam hazırlık kapısını kontrol eder (store + retention hazır mı?)
   • kanal dağıtım tablosu yapar
   • _CAMPAIGN_TEMPLATE.md'yi kopyalayıp brief bölümünü doldurur
   │
   ▼
② Kanal uzmanları (paralel) — aynı handoff'a APPEND eder, üstüne yazmaz
   • mkt-social-content-creator → Reels senaryoları + takvim
   • mkt-influencer-community   → aday liste + outreach mesajları
   • mkt-aso-seo                → landing/waitlist copy + store metadata
   • mkt-paid-ads-specialist    → (kapı açıksa) kreatif + hedefleme + bütçe
   │
   ▼
③ mkt-marketing-analyst
   • baştaki hedef metriğini alır, sonuçla kıyaslar
   • hangi kanal/kreatif kazandı, CAC sürdürülebilir mi, retention sinyali ne
   • KARAR: PASS (ölçekle) / İYİLEŞTİR (şu değişiklikle iterasyon) / DUR (kes/pivot)
   • sonraki adımı ilgili uzmana @mention ile pas verir
```

**Handoff** = tüm agent'ların ortak okuyup **append-only** yazdığı `.claude/handoffs/_CAMPAIGN_<slug>.md` dosyası. Agent'lar birbiriyle doğrudan konuşmaz; koordinasyon bu dosya üzerinden olur (kim ne yaptı, hangi karar verildi, açık sorular).

---

## 5. Routing — hangi istek nereye

1. **Ürün / kod feature** ("şu ekranı ekle", "API bağla") → **feature takımı** (`feature-spec` …).
2. **Pazarlama / kullanıcı kazanımı** (kampanya, waitlist, launch, reklam, influencer, ASO):
   - Muğlak / çok kanallı ise → **`mkt-growth-strategist`** başlar, dağıtır.
   - Kanal netse → doğrudan ilgili uzman (ör. "3 Reels senaryosu yaz" → `mkt-social-content-creator`).
3. **Kampanya sonrası** ("ne çalıştı?", "metrikleri değerlendir") → **`mkt-marketing-analyst`**.

---

## 6. Değişmez kurallar

- **Ücretli reklam kapısı:** Store sayfası + dönüşüm event + retention oturmadan paralı reklamı ölçekleme. Strategist bunu "sonra" diye işaretler, önce **organik + influencer**'a ağırlık verir.
- **KVKK:** Sağlık verisi özel nitelikli. Hiçbir mesajda **"tedavi / teşhis"** vaadi olamaz; "öneri" tamam. Sağlık verisiyle hedefleme yok.
- **Influencer ifşası:** Tüm işbirliklerinde **#işbirliği / #reklam** zorunlu.
- **Marka sesi:** `mkt-brand-voice` tüm kanallarda ortak — tutarlı ton, aynı hashtag omurgası. Aynı hafta çelişen mesaj yok (hem "kıtlık" hem "herkese açık" deme).
- **Dürüst analiz:** Analyst vanity metric'le (beğeni/görüntülenme) başarı ilan etmez; edinim/aktivasyon/retention'a bağlar. Veri yoksa "ölçüm eksik" der, uydurmaz.

---

## 7. Örnek: uçtan uca kampanya

**İstek:** "Launch öncesi 4 haftada 500 kişilik waitlist."

1. `mkt-growth-strategist` → Hedef: *"4 haftada 500 waitlist kaydı, CAC < 15 TL."* Funnel teşhisi: farkındalık zayıf. Store hazır değil → ücretli reklam "sonra". Dağıtım: organik (hafta 1-4) + influencer (hafta 2-3) + ASO/landing (hafta 1). Handoff açılır.
2. `mkt-aso-seo` → waitlist landing copy + başlık/CTA (`mkt-content-ops` akışıyla).
3. `mkt-social-content-creator` → haftalık Reels takvimi, hook'lar, waitlist CTA'lı caption'lar.
4. `mkt-influencer-community` → 8 TR fitness/diyetisyen adayı + outreach DM'leri + barter collab brief.
5. Hafta sonu `mkt-marketing-analyst` → kayıt sayısı vs 500 hedefi, kanal başına CAC, hangi hook dönüştürdü. Karar: **İYİLEŞTİR** — "influencer kanalı kazanıyor, bütçeyi oraya kaydır; Reels hook B'yi kes."

---

## 8. Nasıl çağrılır

**Doğal dil** (supervisor otomatik yönlendirir):
> "Launch haftası için waitlist kampanyası planla."
> "3 tane streak temalı Reels senaryosu yaz."
> "Kampanya bitti, ne çalıştı değerlendir."

**Doğrudan (slash):**
```
/mkt-growth-strategist 4 haftada 500 waitlist hedefiyle kampanya planla
/mkt-social-content-creator streak temalı 3 Reels senaryosu
/mkt-paid-ads-specialist Meta Ads kreatif + hedefleme
/mkt-influencer-community TR diyetisyen influencer listesi + outreach
/mkt-aso-seo App Store açıklaması + TR keyword
/mkt-marketing-analyst kampanya sonucunu değerlendir
```

> **Maliyet notu:** Subagent kullanımı tek oturuma göre çok daha fazla token tüketir. Trivial iş (tek caption, kısa metin) için doğrudan ana oturumda hallet; çok adımlı/çok kanallı kampanyalar için takımı çalıştır.

---

## 9. Görsel üretim (opsiyonel entegrasyon)

Pazarlama agent'ları **metin/strateji** üretir; gerçek görseli üretmez. İstenirse görsel için **`mcpollinations`** MCP'si (Pollinations · flux, anahtarsız/ücretsiz) bağlıdır: `generateImage` / `generateImageUrl`. Çıktı `generated-images/` (gitignore'lu). Böylece `mkt-social-content-creator` / `mkt-paid-ads-specialist` senaryo + kapak görselini birlikte üretebilir. (Anonim rate-limit için ücretsiz Pollinations token'ı önerilir.)

---

*Bu doküman sistemi tanıtır; detaylı orkestrasyon için `.claude/ARCHITECTURE.md` "Pazarlama takımı" bölümüne, ürün bağlamı için `CLAUDE.md`'ye bakılabilir.*
