# Social Fit (SosyalFit)

**"Birlikte hareket et, birlikte güçlen."** *(Move together, grow stronger.)*

Mobile-first social app for healthy living, nutrition tracking, and community motivation — Turkey primary, with international expansion in mind.

---

# Social Fit — LLM Project README

> **Purpose:** This document gives an AI coding assistant full context about the Social Fit app so it can generate accurate, consistent code, architecture decisions, and content without repeated explanation.

---

## 1. Project Overview

**App Name:** Social Fit (`SosyalFit` / `Social Fit`)
**Tagline:** "Birlikte hareket et, birlikte güçlen." *(Move together, grow stronger.)*
**Type:** Mobile-first social media app focused on healthy living, nutrition tracking, and community motivation.
**Target Market:** Turkey (primary), with future international expansion in mind.
**Platforms:** iOS + Android (cross-platform via React Native or Flutter)

---

## 2. Core Feature Set

### 2.1 Social Feed
- Users share meal photos, workout logs, and daily health updates.
- Feed shows posts from friends and followed groups.
- Posts support likes and comments.
- A "consult my dietitian" floating button appears in the feed corner.
- User display names show their star point score next to their name.

### 2.2 Groups / Channels
- WhatsApp-style community channels grouped by interest (e.g., "7-Day Challenge", "70+ Age Fitness").
- Users can create or join groups.
- Group-level daily/weekly challenges can be defined by admins.

### 2.3 Streak & Gamification
- **Daily Streak:** Counter increments when user logs at least one meal or activity per day.
- **Reset Rule:** Missing a single day resets the streak to zero.
- **Badges:** Awarded at 7, 14, and 30-day milestones.
- **Star Points:** Earned by daily sharing/activity; displayed next to usernames.
- **Leaderboard:** Monthly rankings of top point-earners. Monthly winner receives a prize (e.g., diet plan, sponsor product).
- **Streak timer:** Day resets at 00:00 local time.

### 2.4 Nutrition Tools
- **Calorie intake tracker** (daily log with photo support).
- **BMI calculator** built into the app.
- **Meal recipe channels** (curated healthy recipes).
- **Daily calorie quiz/challenge.**

### 2.5 Blog / Articles
- In-app content feed for scientific research and healthy eating articles.
- Categorized (e.g., Weight Control, Disease Nutrition, Sports Diet).
- Updated regularly; linked to website blog for SEO.

### 2.6 Coach / Dietitian Booking
- List of registered dietitians/coaches.
- User selects a coach → views available time slots → books a session.
- Paid booking with payment provider integration.
- **Quick-access "Talk to My Dietitian" button** visible in the main feed.

### 2.7 Messaging
- **1-on-1 chat:** Real-time direct messaging between friends.
- **Group chat:** Available within each community group.

### 2.8 Notifications
- Push notifications for: new messages, group comments, badge awards, streak reminders.
- User-controlled notification preferences in Settings.

### 2.9 Weekly / Monthly / Yearly Summary Card
- Visual summary panel showing user stats.
- Shareable to Instagram, Facebook, and other platforms as a card/image.

### 2.10 Premium Membership
- **Free tier:** Full social features with ads.
- **Premium (monthly subscription, first month free):**
  - Personalized diet plan.
  - 1 dietitian session per month.
  - Ad-free experience.

---

## 3. Authentication

- **Login methods:** Email/password AND phone number (both supported).
- Email verification required on registration.
- Future: Google and Facebook OAuth (listed as "Could-Have").
- On successful login → redirected to Profile Setup (first time) or Feed (returning user).

---

## 4. User Flows (Summary)

| Flow | Entry Point | Key Steps | Exit |
|---|---|---|---|
| Register/Login | Launch screen | Email or phone → verify → profile setup | Feed |
| Post to Feed | "+" button | Photo → caption → tags → publish | Feed |
| Join/Create Group | Groups tab | Browse → join or create → group feed | Group feed |
| Book a Coach | Coaches screen | Browse → select → pick slot → pay | Confirmation |
| Streak tracking | Auto (background) | Log meal/activity daily → badge at milestones | Profile |
| Direct Message | Message icon | Select contact → chat in real time | Chat screen |
| Settings | Profile menu | Edit profile, notifications, privacy, KVKK consents | — |

---

## 5. MVP Scope (MoSCoW)

### Must-Have (Launch Blockers)
- Email + phone number registration/login
- User profile (name, photo, goals, calorie targets)
- Nutrition log (photo + text entry)
- Social feed (post, like, comment)
- Friends + group creation and messaging
- Streak counter and badge system
- Push notifications
- Payment integration (subscription + coach booking)

### Should-Have (Soon After Launch)
- Real-time chat (WebSocket/socket-based)
- Group challenges
- Blog/article content feed
- Health app integration (Apple HealthKit / Google Fit)

### Could-Have (Later Sprints)
- Google / Facebook login
- Leaderboard / level system expansions
- Recipe section
- AI-powered food photo recognition
- Multi-language support

### Nice-to-Have (Future Roadmap)
- Live video coaching sessions
- Full public API
- Commercial ad integration

---

## 6. Data Model

```
USER         — id, name, email, phone, photo, goals, streak_count, star_points, is_premium
POST         — id, user_id, image_url, caption, tags, created_at
GROUP        — id, name, description, challenge, members[]
MESSAGE      — id, sender_id, receiver_id, group_id, content, timestamp
STREAK       — id, user_id, current_streak, last_log_date, badges[]
BADGE        — id, user_id, type (7day/14day/30day), awarded_at
BOOKING      — id, user_id, coach_id, slot_datetime, status, payment_status
COACH        — id, name, bio, specialties, available_slots[]
BLOG_POST    — id, title, content, category, author, published_at
NOTIFICATION — id, user_id, type, payload, read, created_at
```

**Relationships (ER Summary):**
- USER creates many POSTs
- USER sends many MESSAGEs
- USER joins many GROUPs
- GROUP contains many POSTs
- USER holds many STREAKs
- USER earns many BADGEs
- USER makes many BOOKINGs
- COACH offers many BOOKINGs

---

## 7. Tech Stack

### Mobile
- **Recommended:** React Native (single codebase for iOS + Android, faster MVP)
- **Alternative:** Flutter (also acceptable)

### Backend
- **Runtime:** Node.js/Express or Go (high concurrency)
- **Database:** PostgreSQL (relational user/booking data) + MongoDB or JSON fields (flexible nutrition logs)
- **Real-time chat:** Firebase Realtime DB / Supabase Realtime, or Sendbird/Stream Chat
- **Push notifications:** Firebase Cloud Messaging (FCM) or OneSignal

### Payments
- **Turkey:** Iyzico or PayTR
- **International (future):** Stripe

### Hosting
- AWS / GCP / Azure
- Suggested stack: EC2 + RDS + Fargate (Docker containers), or serverless API on Vercel/Netlify for frontend

### CMS (Blog)
- Headless CMS: Contentful or Strapi

---

## 8. Monetization

| Model | Notes |
|---|---|
| Premium subscription | Monthly/yearly; first month free; primary revenue model |
| Single-session coaching | One-time purchase; secondary revenue |
| Session packages | e.g., 5-session bundles |
| In-app ads | Free tier only; must comply with KVKK |
| Affiliate/sponsored content | Health products; must be carefully vetted |

**Strategy for Turkey:** Lead with single-session and package sales first, then convert users to subscription. Turkish users are more familiar with one-time payments initially.

---

## 9. Legal & Compliance (Turkey)

- **KVKK (Turkish GDPR equivalent):** Health/nutrition data is "special category personal data" under KVKK Article 6. Explicit consent required at registration.
- **Medical disclaimer:** All nutrition content must be framed as general advice, not medical treatment or diagnosis. Include: *"Beslenme önerileri doktor onayıyla değerlendirilmelidir."*
- **Payment regulation:** Iyzico/PayTR comply with Turkish Electronic Money Law (Law No. 6493).
- **GDPR:** Required if expanding to EU.
- **HIPAA:** Required if expanding to the US.
- **Required legal pages:** Privacy Policy, Terms of Service, Cookie Policy, KVKK disclosure.

---

## 10. Security

- SSL/TLS on all connections.
- Passwords hashed (bcrypt).
- Personal data encrypted at rest.
- SMS or email verification on signup.
- KYC verification for coaches (optional but recommended).
- Content moderation: AI-based image/text flagging + human review queue.
- Report button on every post and message.
- Rate limiting on posts, messages, and API calls.
- Suspicious account auto-freeze mechanism.

---

## 11. Branding & Design

**Brand Identity:**
- Community-first, not solo fitness.
- Warm, energetic, trustworthy.

**Color Palette (Recommended):**
- Primary: Mint green / Turquoise (health, nature)
- Accent: Orange (energy, motivation)
- Alternative: Dark navy + mint, or charcoal + orange

**Logo Concepts (choose one):**
1. Speech bubble containing a dumbbell or heartbeat line → social + fitness
2. "SF" monogram — S as flowing path, F with barbell crossbar
3. Running human silhouette with heart icon on chest
4. Infinity symbol (∞) — one side dumbbell, one side leaf
5. Plate icon where the rim doubles as a barbell

**Design Inspiration Apps:** Supatrack, Lifesum, MyFitnessPal, Strava, BeReal, Duolingo, Habitica, YAZIO, MealLogger

**UI Patterns to Use:**
- Streak counter prominent on profile (Duolingo-style)
- Card-based feed (swipeable)
- Badge pop-ups on milestone completion
- Red/orange highlight on consecutive streak days
- Dynamic notification badges on group chats

---

## 12. Website (Companion)

The app is accompanied by a marketing/dietitian website. Key pages:

- **Homepage** — Hero CTA ("Download App", "Book a Session")
- **About** — Dietitian bios, mission
- **Services** — Online diet, in-person, sports nutrition, pregnancy, family
- **Blog/Articles** — SEO-driven, categorized content
- **Online Consulting** — Package details, pricing, booking flow
- **Contact/Booking** — Calendar integration (Calendly or Sağlıkie)
- **FAQ**
- **Legal pages** (Privacy, Terms, KVKK)
- **References/Gallery** — Testimonials, before/after

---

## 13. ASO & Marketing Strategy

### App Store Optimization (ASO)
- Title format: `Diyet & Kalori Takip – Social Fit`
- Keywords in: app name, subtitle, short description, long description, tags
- First 3 screenshots must follow: Problem → Solution → Result
- Include app preview video
- Prompt satisfied users for reviews at the right moment

### Growth Channels
1. **Google App Campaigns** — Search, YouTube, Play Store, Display
2. **Apple Search Ads** — Target keywords like "kalori hesaplama", "diyet takip"
3. **Meta Ads (Instagram/Facebook)** — Interest targeting, retargeting, lookalike audiences
4. **Influencer Marketing** — Health/fitness/nutrition creators; experience-sharing format over hard ads
5. **SEO Blog Content** — 800–1200 word articles targeting long-tail Turkish keywords

### First 10 Blog Topics
1. 7 Gün Streak Nasıl Bozulmaz?
2. Diyette Motivasyon Nasıl Korunur?
3. Neden Arkadaşlarla Diyet Daha Kolay?
4. Günlük Yemek Paylaşımı Neden İşe Yarar?
5. Sağlıklı Beslenmede En Büyük 5 Hata
6. Diyete Başlayanların İlk Haftada Yaptığı Hatalar
7. Cheat Meal Psikolojisi
8. Sosyal Medya Motivasyonu Gerçekten İşe Yarıyor mu?
9. Diyet Yaparken Sosyal Baskının Gücü
10. Küçük Alışkanlıklar Nasıl Büyük Sonuç Verir?

---

## 14. Phase 1 Task Split (Team Reference)

| Owner | Tasks |
|---|---|
| **Bora (Dev)** | Backend API, auth, feed, messaging, streak logic, payment integration |
| **Atahan (Design/Marketing)** | UI benchmark screenshots (Supatrack, Lifesum, MFP, Strava, BeReal, Duolingo, Habitica), blog content writing, app store visuals, social media post templates, hero/landing page visuals |

**Atahan Figma/Notion Deliverable Structure:**
- Page 1: Feed Inspirations
- Page 2: Profile Inspirations
- Page 3: Streak & Gamification
- Page 4: Post Creation Flow

---

## 15. Key Constraints & Notes for the LLM

- **Language:** App UI should be in Turkish. Code/comments can be in English.
- **Phone number login is required** (not optional) — both email and phone must work at launch.
- **Star points must be visible next to usernames** everywhere they appear in the app.
- **"Talk to my dietitian" button** must always be accessible from the main feed screen.
- **Streak resets are strict** — no grace periods unless explicitly added later.
- **KVKK consent must be collected** before any health data is stored.
- **First month of premium is free** — implement trial logic in subscription flow.
- **Iyzico is the primary payment provider** for Turkey.
- **Do not use HIPAA-regulated patterns** unless building for US market.
- When suggesting libraries or services, **prefer solutions with Turkish market support**.

---

## Implementation Status

*Current state of the codebase vs the spec above. Use this to prioritize remaining work.*

### What’s in place

- **Backend ([backend/](backend/)):** Express API, Prisma schema with User, Profile, Post, Like, Comment, Group, GroupMember, Message, Friendship, Streak, Badge, UserBadge, Coach, Booking, Subscription. Routes: auth, users, posts, groups, streaks, leaderboard, messages, tools. Auth: email/password, JWT, bcrypt. SQLite (MVP); migration path to PostgreSQL noted in spec.
- **Mobile ([mobile/](mobile/)):** React Native (Expo), auth flow (welcome, login, register), main tabs: Feed, Create Post, Groups, Leaderboard, Messages, More. Screens: Feed, CreatePost, Comment, Groups, GroupFeed, CreateGroup, Leaderboard, Messages, Chat, Profile, EditProfile, Settings, Tools (e.g. BMI), Blog list/detail. Settings includes KVKK link. No phone login, no star points in UI, no “Talk to my dietitian” button on feed, no payment or push yet.

### Gap vs Must-Have (launch blockers)

- Phone number registration/login (schema and flows).
- Star points: persist and display next to usernames everywhere (schema/API + all relevant screens).
- “Talk to my dietitian” floating button on main feed (quick access to coach booking).
- Payment integration: Iyzico for subscription and coach booking (plus first-month-free trial logic for premium).
- Push notifications (e.g. FCM) and user-controlled preferences in Settings.
- KVKK: explicit consent before storing health data (e.g. profile goals, calorie targets, nutrition log).

### Gap vs Should-Have (soon after launch)

- Real-time chat (WebSocket or Supabase/Firebase Realtime).
- Group challenges (admin-defined daily/weekly).
- Blog/article feed (backend + CMS or static; SEO linkage).
- Health app integration (Apple HealthKit / Google Fit) as optional.

### Roadmap (48 görev / 5 faz)

**Faz 1 — Çekirdek Geliştirme** (şu an aktif, **2/10**)
- ✅ Onboarding akışı  ·  ✅ Onboarding tekrar gösterim fix
- ⏳ Yemek günlüğü (backend + mobile) · Yıldız puan ekonomisi · Liderlik tablosu · Step2→Step3 kalori parseFloat bug · Grup challenge · SQLite→PostgreSQL · Polling→Socket.io

**Faz 2 — Monetizasyon & Altyapı** (4-8 hafta, 0/8)
- Iyzico ödeme · Premium abonelik (ilk ay ücretsiz) · FCM push · Firebase OTP telefon girişi · Haftalık paylaşım kartı · Blog CMS (Strapi/Contentful) · Rate limiting · İçerik moderasyonu

**Faz 3 — Mağaza Hazırlığı** (8-12 hafta, 0/12)
- Apple Developer ($99/yıl) + Google Play ($25) · App icon + splash · Store screenshot'ları · TR+EN açıklama · Preview video · KVKK + kullanım koşulları · TestFlight beta · Sentry/Crashlytics · App Review

**Faz 4 — Launch Öncesi Pazarlama** (10-14 hafta, 0/8)
- Landing page + waitlist · @SosyalFit sosyal medya hesapları · İlk 10 blog yazısı · Influencer listesi · Beta kullanıcı görüşmeleri · Rakip analizi · Fiyat kararı

**Faz 5 — Launch & Büyüme** (launch sonrası, 0/10)
- Soft launch (davet kodlu) · Influencer işbirlikleri · Google App Campaigns + Apple Search Ads · Aylık ödül · Diyetisyen partnerlikleri · D1/D7/D30 retention · ASO · Yorum kampanyası · HealthKit/Google Fit

Detaylı görev listesi ve sahiplik: `.claude/skills/social-fit-domain/SKILL.md`.

### Onboarding Modeli — Curiosity Hook

Akış: **İlgi → Empati → Motivasyon → Hedef → Profil → İlerleme → Kimlik → Kanal → Taahhüt → İlk mikro-görev → Sonuç**.

Kurallar: tek soru/tek ekran, her ekranda progress bar, büyük seçim butonları, **sonuç ekranı kişisel değer üretmeli** (günlük kalori hedefi, hedef süresi gibi). Toplam 10-12 ekran ideal. Mevcut implementasyon: `mobile/src/screens/onboarding/`.

Detaylı adım adım soru seti: `.claude/skills/social-fit-domain/SKILL.md`.

### Claude Code Çoklu Ajan Sistemi

Proje `.claude/` altında 3 subagent + 6 skill ile çalışacak şekilde yapılandırıldı:
- `feature-spec` — TR feature isteğini spec'e çevirir
- `ui-designer` — mobile ekran tasarımı/redesign
- `backend-ui-bridge` — API kontratını mobile ↔ backend tutarlı tutar

Mimari detay: `.claude/ARCHITECTURE.md`. Otomatik yüklenen proje memory: `CLAUDE.md`.

---

## Development / Getting started

**Project structure:** `backend/` — Node.js + Express + Prisma API; `mobile/` — React Native (Expo) iOS/Android app.

### Backend

```bash
cd backend
cp .env.example .env   # Set DATABASE_URL and JWT_SECRET
npm install
mkdir -p uploads
npx prisma db push
node prisma/seed.js
npm run dev
```

API: `http://localhost:4000`

### Mobile

```bash
cd mobile
npm install
# Update API_BASE in src/config.js to your backend URL (emulator: localhost, device: computer IP)
npx expo start
```

---

*Last updated: Based on project brief documents — Social Fit v0.1 planning phase.*
