require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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
const { router: notificationRoutes } = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

app.use(cors({ origin: true }));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api/auth', authRoutes);
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
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Social Fit API running on http://localhost:${PORT}`);
});
