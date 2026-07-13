const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token gerekli' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true },
    });
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    req.user = user;
    // Presence: son görülme — dakikada en fazla bir kez yaz, isteği bloklama (fire-and-forget)
    const last = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
    if (Date.now() - last > 60000) {
      prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}

module.exports = { authMiddleware };
