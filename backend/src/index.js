require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Prod'a çıkmadan önce güçlü bir JWT_SECRET zorunlu — 'secret' fallback'i kaldırıldı.
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET tanımlı değil. backend/.env içine güçlü bir JWT_SECRET ekleyin.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const streakRoutes = require('./routes/streaks');
const leaderboardRoutes = require('./routes/leaderboard');
const toolsRoutes = require('./routes/tools');
const coachesRoutes = require('./routes/coaches');
const bookingsRoutes = require('./routes/bookings');
const foodlogRoutes = require('./routes/foodlog');
const recipeRoutes = require('./routes/recipes');
const { router: notificationRoutes } = require('./routes/notifications');

const app = express();
// Render/Heroku gibi tek reverse proxy arkasında: gerçek IP X-Forwarded-For'dan gelir.
// rate-limit'in IP'yi doğru okuması için ilk proxy hop'una güven (true değil — spoofing riski).
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

// CORS: prod'da CORS_ORIGINS (virgülle ayrık) ile daralt; tanımsızsa dev için tüm origin'ler.
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : true;
app.use(cors({ origin: corsOrigins }));
// helmet: güvenlik header'ları. Resimler farklı origin'den (mobil/Supabase) yüklendiği için cross-origin izinli.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
// Rozet gorselleri — repoya commit'li statik varliklar (generateBadges.js ile uretilir).
app.use('/badges', express.static(path.join(__dirname, '..', 'assets', 'badges')));

// Auth uçlarına brute-force koruması (IP başına 15 dakikada 30 deneme).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/coaches', coachesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/foodlog', foodlogRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Social Fit API running on http://localhost:${PORT}`);
});
