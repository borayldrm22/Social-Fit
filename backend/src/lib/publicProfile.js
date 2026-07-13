// publicProfile.js — Başka kullanıcılara gösterilebilir profil alanları.
// KVKK: sağlık (kilo/boy/yaş/kalori) ve iletişim (telefon) verileri özel nitelikli —
// yalnızca sahibinin görebildiği /users/me dışında ASLA serialize edilmez.
// Kullanım: user: { select: { id: true, profile: { select: publicProfileSelect } } }
const publicProfileSelect = {
  userId: true,
  displayName: true,
  username: true,
  avatarUrl: true,
  goalNote: true, // UI'da bio olarak gösteriliyor
  isPublic: true,
};

module.exports = { publicProfileSelect };
