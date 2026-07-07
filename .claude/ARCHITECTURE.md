# Social Fit — Multi-Agent Mimarisi

Bu döküman Social Fit projesinde Claude Code subagent + skill yapısının nasıl çalıştığını anlatır. PDF araştırmasındaki **Supervisor-Worker** desenine göre kuruldu (UI, backend-entegrasyon, feature spec gibi net modüller olduğu için en uygun seçim).

## Bir bakışta

```
                ┌──────────────────────────────┐
                │  SEN (ana Claude oturumu)    │
                │  = Supervisor / Orchestrator │
                └──────────────┬───────────────┘
                               │ Task tool ile delege
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐      ┌───────────────────┐    ┌──────────────────┐
│ feature-spec │      │ ui-designer       │    │ backend-ui-bridge│
│ (TR → spec)  │      │ (mobile UI/tema)  │    │ (API + state)    │
└──────┬───────┘      └─────────┬─────────┘    └────────┬─────────┘
       │                        │                       │
       └────────────────────────┼───────────────────────┘
                                ▼
                     ┌────────────────────┐
                     │ qa-reviewer        │
                     │ (PASS/NEEDS/BLOCK) │
                     └────────────────────┘

       ┌── kalıcı paylaşım katmanı ──┐
       │  .claude/handoffs/<feat>.md │  ← agent'lar buraya yazar/okur
       │  .claude/skills/*/SKILL.md  │  ← progressive disclosure
       └─────────────────────────────┘
```

Sen ana Claude oturumunda kalırsın. Karmaşık bir iş geldiğinde `Task` tool ile uygun subagent'a delege edersin. Her subagent **kendi context penceresinde** çalışır — context izolasyonu sağlar. Subagent'lar birbiriyle doğrudan konuşmaz — paylaşım dosya katmanı (`handoffs/`) üzerinden olur.

## Dört agent

### 1. `feature-spec` — Product / Feature Specifier
**Rol:** Senin Türkçe feature isteğini (örn. "kullanıcılar streak'lerini paylaşabilsin") spec'e çevirir: acceptance criteria, edge case'ler, hangi ekran/route etkilenecek listesi.
**Tetikleyici:** "yeni feature", "şunu eklemek istiyorum", "spec yaz"
**Çıktı:** Markdown spec. Bu spec sonra `ui-designer` ve `backend-ui-bridge`'in input'u olur.
**Tools:** Read, Grep, Glob (yazma yok — sadece spec üretir).

### 2. `ui-designer` — UI Beautification
**Rol:** `mobile/src/screens` ve `mobile/src/components` altındaki React Native ekranlarını Social Fit design token'larına (`mobile/src/theme/socialFitTheme.js`) uygun hale getirir. Yeni component üretir, mevcut ekranı baştan tasarlar.
**Tetikleyici:** "UI'yı güzelleştir", "şu ekranı yeniden tasarla", "component yap"
**Tools:** Read, Edit, Write, Grep, Glob, Bash (Expo dev başlatmaz — sadece dosya işi).
**Yüklediği skill'ler:** `ui-design-system`, `mobile-screen-patterns`.

### 3. `backend-ui-bridge` — Backend ↔ UI Contract + State/Data-Flow
**Rol:** `mobile/src/api/client.js` ile yapılan API çağrılarının `backend/src/routes/*.js` altındaki gerçek route'lara uyup uymadığını kontrol eder. Eksik endpoint varsa backend'e ekler, mobile tarafında çağrı yoksa onu yazar. Prisma schema değişikliklerini route'lara yansıtır. **Ek sorumluluk:** mobile state akışı — loading/error/empty state, cache, optimistic update, store kararları.
**Tetikleyici:** "API bağla", "endpoint çalışmıyor", "şu ekran backend'e bağlanmadı"
**Tools:** Read, Edit, Write, Grep, Glob, Bash (testler için).
**Yüklediği skill'ler:** `api-contract-check`, `backend-route-patterns`, `state-data-flow-patterns`.

### 4. `qa-reviewer` — Kalite Kapısı
**Rol:** Bir feature/refactor tamamlandıktan sonra kod yazmadan bağımsız review yapar. Acceptance criteria, design token kullanımı, API contract uyumu, loading/error/empty state, auth middleware, build sağlığı kontrolü. Supervisor'a `PASS | NEEDS-FIX | BLOCKED` döner.
**Tetikleyici:** "QA yap", "review et", "bu feature tamam mı kontrol et", "handoff'u kontrol et"
**Ne zaman çağırma:** Trivial fix (tek satır typo, < 10 satır bug fix). Pahalı bir agent — değer/maliyet dengele.
**Tools:** Read, Grep, Glob, Bash (Edit sadece "küçük fix izni" kapsamında).
**Yüklediği skill'ler:** `qa-review-checklist`, `feature-delivery-checklist`.

## Sekiz skill

Tüm skill'ler `.claude/skills/<isim>/SKILL.md` formatında. Agent'lar **progressive disclosure** prensibiyle çalışır: başlangıçta sadece skill isimlerini bilir, gerektiğinde içeriğini okur. Bu yüzden her SKILL.md kısa ve odaklı.

| Skill | Kim kullanır | Amaç |
|---|---|---|
| `social-fit-domain` | hepsi | Ürün vizyonu, onboarding modeli, 5 fazlı roadmap, gamification, KVKK |
| `ui-design-system` | ui-designer | Social Fit renk/font/radius/shadow token'ları ve kullanım kuralları |
| `mobile-screen-patterns` | ui-designer | Mevcut ekranlardaki ortak pattern'ler (header, card, CTA, list item) |
| `api-contract-check` | backend-ui-bridge | Mobile API call → backend route eşleştirme adımları |
| `backend-route-patterns` | backend-ui-bridge | Express route, auth middleware, validator, response shape kuralları |
| `state-data-flow-patterns` | backend-ui-bridge | loading/error/empty/optimistic/store kullanımı |
| `feature-spec-writer` | feature-spec | Spec şablonu: user story, acceptance criteria, mobile + backend impact |
| `feature-delivery-checklist` | supervisor + qa-reviewer | Definition of Done (16 maddelik kapatma kontrolü) |
| `qa-review-checklist` | qa-reviewer | QA review zorunlu kontrol maddeleri |

## Handoff dosya katmanı

`.claude/handoffs/` — subagent'ların kalıcı paylaşım katmanı.
- `_TEMPLATE.md` — sakın silme, her feature buradan kopyalanır
- `README.md` — kullanım kuralları
- `<feature-slug>.md` — açık feature'ın koordinasyon dosyası
- `archive/` — tamamlanan feature'lar (silinmez, taşınır)

Subagent'lar birbiriyle **dosya** üzerinden konuşur, doğrudan mesaj yok. Her agent kendi bölümünü günceller (Spec, UI, API, QA).

## Orkestrasyon — tipik akışlar

**Yeni feature ekleme (handoff'lu, tam akış):**
1. Sen: "Kullanıcılar yemek log'unu story'e paylaşabilsin"
2. Supervisor `_TEMPLATE.md`'i kopyalar: `.claude/handoffs/food-log-story.md`
3. `feature-spec` çağrılır → spec markdown'u üretir, handoff'un `Spec` bölümünü doldurur
4. Supervisor handoff'tan spec'i okuyup paralel olarak `ui-designer` + `backend-ui-bridge` çağırır — ikisi de handoff'u okuyup kendi bölümlerini doldurur
5. `qa-reviewer` çağrılır → `qa-review-checklist` üzerinden geçer, PASS/NEEDS-FIX/BLOCKED döner
6. NEEDS-FIX ise ilgili agent tekrar çağrılır; PASS ise supervisor final rapor verir

**Sadece UI rötuşu (handoff yok, qa yok):**
1. Sen: "Profil ekranını yeniden tasarla"
2. `ui-designer` doğrudan çağrılır (mevcut feature, spec gereksiz)
3. Trivial olduğu için qa-reviewer çağrılmaz

**API kopukluğu debug:**
1. Sen: "Streak ekranı 404 atıyor"
2. `backend-ui-bridge` çağrılır → mobile çağrıyı ve backend route'u karşılaştırır, eksiği yazar
3. Multi-file fix ise qa-reviewer çağrılır; tek dosya ise atlanır

## Definition of Done

Bir feature ancak `.claude/skills/feature-delivery-checklist/SKILL.md`'deki 16 maddenin tamamı ✅ olduğunda "done" kabul edilir. Trivial fix bu kuraldan muaftır.

## Maliyet & limit notları (PDF'den)

- Subagent kullanımı tek oturuma göre **~15× daha fazla token** tüketebilir → trivial işler için agent çağırma, doğrudan yap.
- 3–7 agent sınırında kal (sende 3 var, doğru aralık).
- Karmaşık tasarım kararı çıkarsa **Explorer + Critic** (3 alternatif üreten + 1 değerlendiren) ekleyebiliriz, ama şimdilik gerek yok.

## Pazarlama takımı (Marketing) — orkestrasyon playbook

Feature takımına **paralel**, kullanıcı kazanımı odaklı ikinci takım. Dosyalar `.claude/agents/marketing/` (6 agent) + `.claude/skills/marketing/` (14 skill), hepsi `mkt-` prefix'li. Handoff: `.claude/handoffs/_CAMPAIGN_TEMPLATE.md`.

### Altı agent (dev takımına birebir paralel)

| Agent | Rol | R/W | Muadili |
|---|---|---|---|
| `mkt-growth-strategist` | Hedef → ölçülebilir brief → kanal dağıtımı → handoff açar. Kopya/kreatif ÜRETMEZ. | read-only | `feature-spec` |
| `mkt-social-content-creator` | Organik: Reels/TikTok, caption, hashtag, takvim, haftalık kart | write | — |
| `mkt-paid-ads-specialist` | Meta/Google/Apple Ads: kreatif, hedefleme, bütçe, UTM | write | — |
| `mkt-influencer-community` | TR influencer/diyetisyen outreach, collab, topluluk büyütme | write (+WebSearch) | — |
| `mkt-aso-seo` | Store metadata+keyword, blog SEO, landing/waitlist | write (+WebSearch) | — |
| `mkt-marketing-analyst` | Kampanya sonrası review, PASS/İYİLEŞTİR/DUR | read-only | `qa-reviewer` |

### On dört skill — skill ↔ agent haritası

`mkt-brand-voice` (ortak ses + KVKK sınırı, 5 agent) · `mkt-metrics` (strategist/paid/analyst) · `mkt-copy-patterns` (social/paid) · `mkt-strategy`→strategist · `mkt-organic-social`→social · `mkt-paid-ads`→paid · `mkt-influencer`→influencer · `mkt-aso`+`mkt-content-seo`→aso-seo · `mkt-campaign-checklist`→analyst · `mkt-lifecycle-retention` (social+analyst) · `mkt-referral-viral` (social+influencer+analyst) · `mkt-experiments` (strategist+analyst+paid+aso) · `mkt-content-ops` (social+influencer+aso). Ortak dev skill: `social-fit-domain` (strategist/aso/influencer her zaman yükler).

### Routing (supervisor kararı)

1. **Ürün/kod feature** ("şu ekranı ekle", "bug") → feature takımı (`feature-spec` …).
2. **Pazarlama/kullanıcı kazanımı** ("kampanya", "waitlist", "launch", "reklam", "influencer") →
   - Hedef muğlak / çok kanal → `mkt-growth-strategist` başlar, dağıtır.
   - Kanal net ("bir Reels senaryosu yaz") → doğrudan ilgili uzman.
3. **Kampanya sonrası** ("ne çalıştı", "metrikleri değerlendir") → `mkt-marketing-analyst`.

### Kampanya lifecycle

`strategist` (brief + funnel teşhisi + kanal tablosu, `_CAMPAIGN_...` handoff açar) → kanal uzmanları asset üretir ve **aynı handoff'a append eder** (üstüne yazmaz) → `analyst` baştaki hedef metriğe göre ölçer → `PASS` (ölçekle) / `İYİLEŞTİR` (tek değişkenli A/B iterasyonu) / `DUR` (bütçe kes/pivot).

### Ücretli reklam hazırlık kapısı

`strategist` ürün fazına bakar: **store sayfası + dönüşüm event + retention hazır değilse** paralı reklamı "sonra" işaretler, organik + influencer'a ağırlık verir. (Boş kovaya para dökme.)

### Örnek uçtan uca

"4 haftada 500 waitlist, CAC < 15 TL" → strategist: funnel=awareness zayıf → organik (haftalık Reels serisi) + influencer (5 mikro TR fit-anne) + ASO/landing (waitlist copy); paid "sonra" → uzmanlar handoff'a asset → hafta 4 analyst: hedef vs sonuç + kazanan kanal + karar.

## Bu mimariyi nasıl genişletirsin?

- Yeni bir uzmanlık alanı çıkarsa: `.claude/agents/<isim>.md` ekle. Frontmatter şart, body'de rolünü ve hangi skill'leri kullandığını yaz.
- Tekrarlanan bir bilgi/template oluşursa: `.claude/skills/<isim>/SKILL.md` ekle, ilgili agent'a referans ver.
- Agent içinden subagent çağırılabilir ama dikkatli ol — zincir uzadıkça context aktarımındaki kayıp artar.

## Kurulum

1. Bu klasörü (`social-fit-claude/`) Finder'da `.claude` olarak yeniden adlandır.
2. Social Fit kök klasörüne taşı (mevcut `.claude/agents` ve `.claude/skills` boş — birleşecek).
3. Claude Code'u Social Fit kökünden başlat: `claude` veya VS Code Claude eklentisi.
4. Doğrula: Claude Code içinde `/agents` komutu üç agent'ı listelemeli.
5. Bir agent'ı çağırmak için doğrudan iste: "feature-spec ile şu özelliği spec'le" veya Task tool ile programatik çağır.
