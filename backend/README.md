# Social Fit Backend

Node.js + Express + Prisma (PostgreSQL) API.

## Setup

Uses **SQLite** by default (no PostgreSQL or Docker needed).

1. Copy `.env.example` to `.env` (default `DATABASE_URL="file:./dev.db"`).
2. `npm install`
3. `mkdir -p uploads`
4. `npx prisma generate && npx prisma db push`
5. `node prisma/seed.js` (creates badges + admin user: **admin@example.com** / **admin123**)
6. `npm run dev`

## Endpoints

- `POST /api/auth/register` - Register (email, password, displayName)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (Bearer token)
- `GET/PATCH /api/users/me` - Profile
- `GET /api/users/search?q=` - Search users
- `GET/POST /api/users/friends` - Friends list / send request
- `GET /api/posts/feed` - Feed
- `POST /api/posts` - Create post (multipart: image, type, caption, tags, groupId)
- `POST/DELETE /api/posts/:id/like` - Like / unlike
- `GET /api/posts/:id/comments` - Comments
- `POST /api/posts/:id/comments` - Add comment
- `GET/POST /api/groups` - List / create group
- `GET /api/groups/discover` - Discover groups
- `POST /api/groups/:id/join` - Join group
- `GET /api/groups/:id/posts` - Group feed
- `GET /api/messages/conversations` - Conversations
- `GET /api/messages/:userId` - Messages with user
- `POST /api/messages` - Send message (receiverId, body)
- `GET /api/streaks/me` - My streak & badges
- `POST /api/streaks/record` - Record today's activity
- `GET /api/leaderboard?period=week|month` - Leaderboard
- `POST /api/tools/bmi` - BMI (weightKg, heightCm)
- `POST /api/tools/calorie` - Daily calorie (weightKg, heightCm, age, gender, activityLevel)
