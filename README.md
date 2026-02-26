# 🌟 Social Fit  
### A Social Nutrition & Healthy Lifestyle Mobile App

Social Fit is a gamified social media mobile application designed to help users build healthy habits together.

Users can share meals, track streaks, join groups, compete on leaderboards, and stay motivated through community interaction.

---

## 🚀 Vision

We believe healthy habits are easier to maintain when done socially.

Social Fit combines:
- 📸 Instagram-style meal sharing  
- 🔥 Duolingo-style streak system  
- 🏆 Competitive leaderboard with star points  
- 👥 Group-based challenges  
- 💬 Real-time messaging  

---

## 🧠 Core Features (MVP)

### 🔐 Authentication
- Email & password registration
- Passwords hashed with bcrypt
- JWT-based authentication
- Token stored securely on the client

### 👤 Profile System
- Username
- Profile photo
- Bio
- Streak counter
- Star points

### 📸 Post & Feed
- Upload meal photos
- Add captions
- View global / friends feed
- Like and comment

### 🔥 Streak System
- Daily activity tracking
- Consecutive day streak logic
- Bonus star multipliers
- Reset if a day is missed

### ⭐ Star Point System
Users earn star points for:
- Posting meals
- Daily activity logs
- Maintaining streaks
- Participating in challenges
- Receiving engagement

### 🏆 Leaderboard
- Weekly ranking
- Monthly ranking
- All-time ranking
- Top 3 highlighted (Gold / Silver / Bronze)
- Users can see their own rank

### 👥 Groups & Challenges
- Create or join groups
- Group-based competitions
- Community interaction

### 💬 Messaging (Planned)
- 1-on-1 real-time chat
- Group chat

---

## 🏗 Tech Stack

### 📱 Mobile
- React Native

### 🖥 Backend
- Node.js
- Express / NestJS
- JWT Authentication
- bcrypt password hashing

### 🗄 Database
- Prisma ORM
- SQLite (MVP phase)
- Planned migration to PostgreSQL for production

### ☁ Storage
- Image storage (planned: AWS S3 or Supabase Storage)

### 🔔 Notifications
- Firebase Cloud Messaging (planned)

---

## 🔐 Security

- Passwords are hashed (bcrypt)
- JWT_SECRET stored in environment variables
- No plain-text password storage
- Auth-protected API routes

---

## 📂 Project Structure

- **backend/** — Node.js + Express + Prisma API
- **mobile/** — React Native (Expo) iOS/Android app

## Backend

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

## Mobile

```bash
cd mobile
npm install
# Update API_BASE in src/config.js to your backend URL (emulator: localhost, device: computer IP)
npx expo start
```
