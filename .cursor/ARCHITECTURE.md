# Social Fit — Multi-Agent Mimarisi (Cursor)

Bu döküman Social Fit projesinde Cursor subagent + skill yapısının nasıl çalıştığını anlatır. Claude Code uyumluluğu için `.claude/` altında paralel kopya durur; **Cursor'da kaynak `.cursor/`**.

## Bir bakışta

```
                ┌──────────────────────────────┐
                │  SEN (ana Cursor Agent)      │
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
       │  .cursor/handoffs/<feat>.md │  ← agent'lar buraya yazar/okur
       │  .cursor/skills/*/SKILL.md  │  ← progressive disclosure
       └─────────────────────────────┘
```

## Cursor vs Claude Code

| Bileşen | Cursor | Claude Code |
|---|---|---|
| Subagent'lar | `.cursor/agents/*.md` | `.claude/agents/*.md` |
| Skill'ler | `.cursor/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` |
| Handoff | `.cursor/handoffs/` | `.claude/handoffs/` |
| Proje kuralı | `.cursor/rules/*.mdc` | `CLAUDE.md` (otomatik) |

Cursor, `.claude/agents/` dosyalarını da okur ama isim çakışmasında `.cursor/` önceliklidir.

## Dört agent

### 1. `feature-spec` — Product / Feature Specifier
**Rol:** Türkçe feature isteğini spec'e çevirir.
**Tetikleyici:** "yeni feature", "spec yaz", "bunu nasıl yapalım"
**Cursor config:** `readonly: true`
**Çağırma:** `/feature-spec streak paylaşımını spec'le`

### 2. `ui-designer` — UI Beautification
**Rol:** Mobile ekranları design token'larına uygun hale getirir.
**Tetikleyici:** "UI'yı güzelleştir", "şu ekranı redesign et"
**Skill'ler:** `ui-design-system`, `mobile-screen-patterns`

### 3. `backend-ui-bridge` — Backend ↔ UI Contract
**Rol:** Mobile API ↔ backend route kontratı + state/data-flow.
**Tetikleyici:** "API bağla", "endpoint 404", "backend'e bağlanmadı"
**Skill'ler:** `api-contract-check`, `backend-route-patterns`, `state-data-flow-patterns`

### 4. `qa-reviewer` — Kalite Kapısı
**Rol:** Bağımsız review, PASS/NEEDS-FIX/BLOCKED döner.
**Tetikleyici:** "QA yap", "review et", "handoff'u kontrol et"
**Ne zaman çağırma:** Trivial fix (< 10 satır, tek dosya)

## Dokuz skill

Tüm skill'ler `.cursor/skills/<isim>/SKILL.md`. Agent'lar progressive disclosure ile gerektiğinde okur.

| Skill | Kim kullanır | Amaç |
|---|---|---|
| `social-fit-domain` | hepsi | Ürün vizyonu, roadmap, gamification, KVKK |
| `ui-design-system` | ui-designer | Token kullanım kuralları |
| `mobile-screen-patterns` | ui-designer | Ekran iskelet pattern'leri |
| `api-contract-check` | backend-ui-bridge | Mobile ↔ backend eşleştirme |
| `backend-route-patterns` | backend-ui-bridge | Express route konvansiyonları |
| `state-data-flow-patterns` | backend-ui-bridge | loading/error/empty/optimistic/store |
| `feature-spec-writer` | feature-spec | Spec şablonu |
| `feature-delivery-checklist` | supervisor + qa-reviewer | Definition of Done |
| `qa-review-checklist` | qa-reviewer | QA kontrol maddeleri |

## Handoff dosya katmanı

`.cursor/handoffs/` — subagent'lar arası kalıcı paylaşım.
- `_TEMPLATE.md` — her feature buradan kopyalanır
- `<feature-slug>.md` — açık feature koordinasyon dosyası
- `archive/` — tamamlanan feature'lar

## Orkestrasyon — tipik akışlar

**Yeni feature (tam akış):**
1. `_TEMPLATE.md` → `.cursor/handoffs/<slug>.md`
2. `/feature-spec` → Spec bölümünü doldur
3. Paralel: `/ui-designer` + `/backend-ui-bridge`
4. `/qa-reviewer` → PASS/NEEDS-FIX/BLOCKED

**Sadece UI rötuşu:** `/ui-designer` doğrudan, qa yok

**API kopukluğu:** `/backend-ui-bridge` → multi-file ise qa

## Subagent çağırma (Cursor)

```
/feature-spec kullanıcı streak'ini paylaşabilsin — spec yaz
/ui-designer Profil ekranını redesign et
/backend-ui-bridge FoodLogScreen 404 atıyor, düzelt
/qa-reviewer handoff'u kontrol et
```

Paralel: "ui-designer ve backend-ui-bridge'i paralel çalıştır"

## Maliyet notu

Subagent kullanımı ~15× daha fazla token tüketebilir. Trivial işler için doğrudan ana agent kullan.

## Pazarlama takımı (Marketing) — orkestrasyon playbook

Feature takımına **paralel**, kullanıcı kazanımı odaklı ikinci takım. Dosyalar `.cursor/agents/marketing/` (6 agent) + `.cursor/skills/marketing/` (14 skill), hepsi `mkt-` prefix'li. Handoff: `.cursor/handoffs/_CAMPAIGN_TEMPLATE.md`.

### Altı agent (dev takımına birebir paralel)

| Agent | Rol | readonly | Muadili |
|---|---|---|---|
| `mkt-growth-strategist` | Hedef → ölçülebilir brief → kanal dağıtımı → handoff açar. Kopya ÜRETMEZ. | true | `feature-spec` |
| `mkt-social-content-creator` | Organik: Reels/TikTok, caption, hashtag, takvim, haftalık kart | false | — |
| `mkt-paid-ads-specialist` | Meta/Google/Apple Ads: kreatif, hedefleme, bütçe, UTM | false | — |
| `mkt-influencer-community` | TR influencer/diyetisyen outreach, collab, topluluk | false | — |
| `mkt-aso-seo` | Store metadata+keyword, blog SEO, landing/waitlist | false | — |
| `mkt-marketing-analyst` | Kampanya sonrası review, PASS/İYİLEŞTİR/DUR | true | `qa-reviewer` |

### On dört skill — skill ↔ agent

`mkt-brand-voice` (ortak ses + KVKK, 5 agent) · `mkt-metrics` (strategist/paid/analyst) · `mkt-copy-patterns` (social/paid) · `mkt-strategy`→strategist · `mkt-organic-social`→social · `mkt-paid-ads`→paid · `mkt-influencer`→influencer · `mkt-aso`+`mkt-content-seo`→aso-seo · `mkt-campaign-checklist`→analyst · `mkt-lifecycle-retention` (social+analyst) · `mkt-referral-viral` (social+influencer+analyst) · `mkt-experiments` (strategist+analyst+paid+aso) · `mkt-content-ops` (social+influencer+aso). Ortak: `social-fit-domain`.

### Routing

1. Ürün/kod feature → feature takımı (`feature-spec` …).
2. Pazarlama/kazanım (kampanya, waitlist, launch, reklam, influencer) → muğlak/çok kanal ise `mkt-growth-strategist` başlar; kanal netse doğrudan uzman.
3. Kampanya sonrası ("ne çalıştı") → `mkt-marketing-analyst`.

### Lifecycle

`strategist` (brief + funnel teşhisi + kanal tablosu, `_CAMPAIGN_...` handoff açar) → kanal uzmanları asset üretir, **aynı handoff'a append** → `analyst` hedefe göre ölçer → PASS / İYİLEŞTİR / DUR.

### Ücretli reklam kapısı

Store sayfası + dönüşüm event + retention hazır değilse strategist paralı reklamı "sonra" işaretler, organik + influencer'a ağırlık verir.

## Genişletme

- Yeni uzmanlık: `.cursor/agents/<isim>.md` ekle (YAML frontmatter + prompt)
- Yeni bilgi/template: `.cursor/skills/<isim>/SKILL.md` ekle
- Cursor subagent alanları: `name`, `description`, `model`, `readonly`, `is_background`

Resmi dokümantasyon: https://cursor.com/docs/subagents
