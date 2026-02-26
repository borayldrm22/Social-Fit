require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

async function main() {
  await prisma.badge.upsert({ where: { key: 'streak_7' }, create: { key: 'streak_7', name: '7 Gün Seri', description: '7 gün üst üste paylaşım', daysRequired: 7 }, update: {} });
  await prisma.badge.upsert({ where: { key: 'streak_14' }, create: { key: 'streak_14', name: '14 Gün Seri', description: '14 gün üst üste paylaşım', daysRequired: 14 }, update: {} });
  await prisma.badge.upsert({ where: { key: 'streak_30' }, create: { key: 'streak_30', name: '30 Gün Seri', description: '30 gün üst üste paylaşım', daysRequired: 30 }, update: {} });
  console.log('Badges seeded');

  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    create: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      emailVerified: false,
      profile: { create: { displayName: 'Admin' } },
    },
    update: { passwordHash: adminHash },
  });
  console.log('Admin user seeded (admin@example.com / admin123)');

  // Example feed posts with images (owned by admin; images in backend/uploads)
  await prisma.post.deleteMany({ where: { userId: admin.id } });
  await prisma.post.createMany({
    data: [
      {
        userId: admin.id,
        type: 'meal',
        caption: 'Tavuklu pilav kase – taze sebzelerle dengeli öğle yemeği. 🍚🥗',
        tags: '[]',
        groupId: null,
        imageUrl: `${BASE_URL}/uploads/chicken-rice-bowl.png`,
      },
      {
        userId: admin.id,
        type: 'meal',
        caption: 'Bugün öğle yemeğim: Tavuklu salata ve taze sıkılmış portakal suyu. 🥗🍊',
        tags: '[]',
        groupId: null,
        imageUrl: `${BASE_URL}/uploads/smoothie-bowl.png`,
      },
      {
        userId: admin.id,
        type: 'workout',
        caption: 'Sabah koşusu tamamlandı! 5 km, 25 dakika. #Koşu 🏃‍♂️☁️',
        tags: '["Koşu"]',
        groupId: null,
        imageUrl: `${BASE_URL}/uploads/runner.png`,
      },
    ],
  });
  console.log('Example feed posts seeded (with images)');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
