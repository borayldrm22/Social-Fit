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

  // Coaches for dietitian booking
  await prisma.coach.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      displayName: 'Dr. Ayşe Yılmaz',
      bio: 'Beslenme ve diyet uzmanı. Kilo yönetimi, spor beslenmesi ve hastalıkta beslenme alanında 10 yıllık deneyim.',
    },
    update: {},
  });
  await prisma.coach.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      displayName: 'Uzm. Dyt. Mehmet Kaya',
      bio: 'Klinik diyetisyen. Diyabet, kolesterol ve metabolik sendromda beslenme danışmanlığı.',
    },
    update: {},
  });
  await prisma.coach.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      displayName: 'Dyt. Zeynep Demir',
      bio: 'Online diyet danışmanlığı. Sağlıklı yaşam ve sürdürülebilir beslenme alışkanlıkları.',
    },
    update: {},
  });
  console.log('Coaches seeded');

  // Recipes (tarifler) — 7 gerçek tarif. Görseller: backend/uploads/recipes/<slug>.jpg
  const recipes = [
    {
      slug: 'protein-pancake', title: 'Protein Pancake', category: 'Kahvaltı',
      fullText: 'Güne enerjik başlamak isteyenler için ideal bir tarif. Önce bir muzu çatalla iyice ezin ve üzerine 3 yumurtayı kırıp çırpın. Karışıma 5 yemek kaşığı yulaf, 1 tatlı kaşığı kabartma tozu, 1 tatlı kaşığı kakao ve 1 tatlı kaşığı tarçın ekleyip pürüzsüz bir hamur elde edene kadar karıştırın. Tavayı kısık ateşte çok az yağla ısıtın; kepçeyle aldığınız karışımı dökerek her iki yüzü altın rengini alana kadar pişirin. Servis ederken üzerine 1 tatlı kaşığı fıstık ezmesi gezdirin. Şeker eklemeye gerek yok, muzun doğal tatlılığı yeterli olur; antrenman öncesi veya sonrası dengeli bir protein ve karbonhidrat kaynağıdır.',
      tags: ['Yüksek Protein'], timeMinutes: 15, calories: 486, protein: 27, carbs: 45, fat: 22,
      servings: 1, difficulty: 'Kolay', isFeatured: true,
      ingredients: [
        { name: 'Yumurta', amount: '3 adet' }, { name: 'Muz', amount: '1 adet' },
        { name: 'Yulaf', amount: '5 yemek kaşığı' }, { name: 'Kabartma tozu', amount: '1 tatlı kaşığı' },
        { name: 'Kakao', amount: '1 tatlı kaşığı' }, { name: 'Tarçın', amount: '1 tatlı kaşığı' },
        { name: 'Fıstık ezmesi', amount: '1 tatlı kaşığı' },
      ],
      steps: [
        'Muzu ezip yumurtaları çırp.',
        'Yulaf, kabartma tozu, kakao ve tarçını ekleyip pürüzsüz olana dek karıştır.',
        'Tavayı kısık ateşte az yağla ısıt.',
        'Kepçeyle karışımı dök, her iki yüzü altın rengi olana dek pişir.',
        'Üzerine fıstık ezmesi gezdirip servis et.',
      ],
      fitNote: 'Yüksek protein + kompleks karbonhidrat; antrenman öncesi/sonrası ideal. Şeker eklemeden muzun doğal tatlılığı yeter.',
    },
    {
      slug: 'proteinli-fit-tost', title: 'Proteinli Fit Tost', category: 'Kahvaltı',
      fullText: 'Pratik ve doyurucu bir kahvaltı. 2 yumurtayı bir kapta çırpın, dilerseniz karabiber ve pul biber ekleyin. Tavada 1 tatlı kaşığı zeytinyağını ısıtıp yumurtaları omlet şeklinde pişirin. 2 dilim tam buğday ekmeğinin arasına bu omleti ve 50 gram lor peynirini yerleştirin. Tost makinesinde ya da tavada bastırarak kızartın ve sıcak servis edin. Yumurta ile lor peynirinin birleşimi protein oranını yükseltir; karbonhidratı azaltmak isterseniz tek dilim ekmek de kullanabilirsiniz.',
      tags: ['Yüksek Protein'], timeMinutes: 10, calories: 400, protein: 25, carbs: 30, fat: 20,
      servings: 1, difficulty: 'Kolay', isFeatured: false,
      ingredients: [
        { name: 'Tam buğday ekmeği', amount: '2 dilim' }, { name: 'Yumurta', amount: '2 adet' },
        { name: 'Lor peyniri', amount: '50 g' }, { name: 'Zeytinyağ', amount: '1 tatlı kaşığı' },
        { name: 'Karabiber, pul biber', amount: 'isteğe bağlı' },
      ],
      steps: [
        'Yumurtaları çırp, baharatları ekle.',
        'Tavada zeytinyağını ısıt, omlet şeklinde pişir.',
        'Ekmeğin arasına omleti ve lor peynirini koy.',
        'Tost makinesinde veya tavada bastırarak kızart.',
        'Sıcak şekilde servis et.',
      ],
      fitNote: 'Yumurta + lor peyniri ile protein oranı yüksek. Karbonhidratı azaltmak için tek dilim ekmek kullanabilirsin.',
    },
    {
      slug: 'ton-balikli-sandvic', title: 'Proteinli Ton Balıklı Sandviç', category: 'Atıştırmalık',
      fullText: 'Öğle ya da ara öğün için hızlı ve yüksek proteinli bir seçenek. Yarım avokado ile 25 gram beyaz peyniri bir kasede çatalla ezerek kremamsı bir karışım hazırlayın. Bu karışımı 1 dilim tam tahıllı ekmeğin üzerine sürün, ardından suyunu süzdüğünüz 1 kutu ton balığını ekleyin. Üzerine önce 2-3 yaprak marul, sonra 2-3 dilim domates dizip sandviçi kapatın. İsterseniz ekmekleri önceden tost makinesinde hafifçe kızartabilirsiniz. Daha düşük kalori için peyniri azaltabilir, daha fazla protein için ekstra ton balığı ekleyebilirsiniz.',
      tags: ['Yüksek Protein'], timeMinutes: 10, calories: 485, protein: 30, carbs: 32, fat: 26,
      servings: 1, difficulty: 'Kolay', isFeatured: false,
      ingredients: [
        { name: 'Ton balığı (suyu süzülmüş)', amount: '1 kutu' }, { name: 'Avokado', amount: '½ adet' },
        { name: 'Beyaz peynir', amount: '25 g' }, { name: 'Tam tahıllı ekmek', amount: '2 dilim' },
        { name: 'Marul', amount: '2-3 yaprak' }, { name: 'Domates', amount: '2-3 dilim' },
        { name: 'Baharat', amount: 'isteğe bağlı' },
      ],
      steps: [
        'Avokado ile beyaz peyniri bir kasede çatalla ez.',
        'Bir dilim ekmeğin üzerine karışımı sür.',
        'Süzülmüş ton balığını üzerine ekle.',
        'Önce marulu, sonra domatesi dizip sandviçi kapat.',
        'İstersen ekmekleri önce tost makinesinde kızartabilirsin.',
      ],
      fitNote: 'Ton balığı + peynir ile yüksek protein. Kaloriyi düşürmek için peyniri azalt; daha fazla protein için ekstra ton balığı ekle.',
    },
    {
      slug: 'fit-protein-pogaca', title: 'Fit Protein Poğaça', category: 'Atıştırmalık',
      fullText: 'Unsuz ama doyurucu bir ara öğün. 2 yumurta, 4 yemek kaşığı yulaf, 100 gram lor, 1 tatlı kaşığı kabartma tozu, 1 tatlı kaşığı zeytinyağı, bir tutam tuz ve ince kıyılmış yeşilliği bir kapta pürüzsüz olana dek karıştırın. Karışımı kaşıkla, yağlı kağıt serili fırın tepsisine porsiyonlar halinde koyun. 180 dereceye ısıttığınız fırında üzerleri altın rengini alana kadar 20-25 dakika pişirin. Ilıdıktan sonra servis edin. Lor ve yumurtanın birleşimi uzun süre tok tutar; çalışırken yanınızda bulundurabileceğiniz pratik bir tariftir.',
      tags: ['Yüksek Protein'], timeMinutes: 30, calories: 414, protein: 35, carbs: 28, fat: 18,
      servings: 1, difficulty: 'Orta', isFeatured: false,
      ingredients: [
        { name: 'Yumurta', amount: '2 adet' }, { name: 'Yulaf', amount: '4 yemek kaşığı' },
        { name: 'Lor', amount: '100 g' }, { name: 'Kabartma tozu', amount: '1 tatlı kaşığı' },
        { name: 'Zeytinyağ', amount: '1 tatlı kaşığı' }, { name: 'Tuz', amount: '1 tutam' },
        { name: 'Yeşillik', amount: '1 avuç' },
      ],
      steps: [
        'Tüm malzemeleri bir kapta karıştır.',
        'Kaşıkla yağlı kağıt serili tepsiye porsiyonlar koy.',
        '180°C fırında 20-25 dakika, üzeri kızarana dek pişir.',
        'Ilıyınca servis et.',
      ],
      fitNote: 'Unsuz, yüksek protein. Lor + yumurta tokluk verir; ara öğün için ideal.',
    },
    {
      slug: 'kabakli-protein-tost', title: 'Kabaklı Protein Tost (Ekmeksiz)', category: 'Kahvaltı',
      fullText: 'Ekmeksiz, düşük karbonhidratlı ve glutensiz bir alternatif. 1 orta boy kabağı rendeleyip fazla suyunu elinizle iyice sıkın. Üzerine 2 yumurtayı kırın; 1 yemek kaşığı ince öğütülmüş yulaf, bir tutam tuz ve dilediğiniz baharatları ekleyerek homojen bir karışım elde edin. Karışımı iki eşit parçaya bölün, bu parçalar tostun ekmek katmanları olacak. Tavada az zeytinyağıyla her iki parçayı arkalı önlü pişirin. Pişen parçaların arasına 50 gram beyaz peynir (dilerseniz lor) koyup kapatın ve tost gibi bastırarak birkaç dakika daha pişirin. Son aşamayı tost makinesinde de yapabilirsiniz. Diyet ve definisyon dönemleri için oldukça uygundur.',
      tags: ['Yüksek Protein', 'Glutensiz'], timeMinutes: 15, calories: 361, protein: 24, carbs: 10, fat: 25,
      servings: 1, difficulty: 'Kolay', isFeatured: false,
      ingredients: [
        { name: 'Orta boy kabak', amount: '1 adet' }, { name: 'Yumurta', amount: '2 adet' },
        { name: 'Beyaz peynir (ops. lor)', amount: '50 g' }, { name: 'İnce öğütülmüş yulaf', amount: '1 yemek kaşığı' },
        { name: 'Tuz', amount: '1 tutam' }, { name: 'Baharat', amount: 'isteğe bağlı' },
        { name: 'Zeytinyağ', amount: '1 tatlı kaşığı' },
      ],
      steps: [
        'Kabağı rendele ve fazla suyunu iyice sık.',
        'Üzerine yumurtaları kırıp karıştır.',
        'Yulaf, tuz ve baharatları ekleyip homojen olana dek karıştır.',
        'Karışımı iki eşit parçaya böl (tostun ekmekleri).',
        'Tavada az zeytinyağ ile iki parçayı arkalı önlü pişir.',
        'Arasına beyaz peyniri koy, kapat ve bastırarak birkaç dakika daha pişir.',
      ],
      fitNote: 'Düşük karbonhidrat, yüksek protein. Diyet/definisyon dönemleri ve glutensiz beslenme için uygun.',
    },
    {
      slug: 'yag-yakan-fit-sos', title: 'Yağ Yakan Fit Sos', category: 'Atıştırmalık',
      fullText: 'Ekmeğin yanında ya da üzerine sürülecek, metabolizma dostu bir sos. Yarım avokadoyu bir kasede çatalla ezin ve 2 yemek kaşığı yoğurdu ekleyerek karıştırın. Üzerine 1 tatlı kaşığı zeytinyağı, 1 çay kaşığı toz zerdeçal, yarım çay kaşığı zencefil, birer tutam karabiber ve pul biber ilave edin. Çeyrek limonun suyunu sıkın ve tüm malzemeler homojen bir kıvama gelene kadar karıştırın. Zerdeçal ile karabiber ikilisi antioksidan etki sağlayıp metabolizmayı destekler, zencefil sindirime yardımcı olur; avokadonun sağlıklı yağları ise uzun süreli tokluk verir.',
      tags: ['Vejetaryen'], timeMinutes: 5, calories: 216, protein: 3, carbs: 10.5, fat: 18,
      servings: 1, difficulty: 'Kolay', isFeatured: false,
      ingredients: [
        { name: 'Avokado', amount: '½ adet' }, { name: 'Yoğurt', amount: '2 yemek kaşığı' },
        { name: 'Zeytinyağ', amount: '1 tatlı kaşığı' }, { name: 'Toz zerdeçal', amount: '1 çay kaşığı' },
        { name: 'Zencefil (toz/rende)', amount: '½ çay kaşığı' }, { name: 'Karabiber', amount: '1 tutam' },
        { name: 'Pul biber', amount: '1 tutam' }, { name: 'Limon suyu', amount: '¼ limon' },
        { name: 'Tuz', amount: 'isteğe bağlı' },
      ],
      steps: [
        'Avokadoyu bir kasede çatalla ez.',
        'Yoğurdu ekleyip karıştır.',
        'Zeytinyağ, zerdeçal, zencefil, karabiber ve pul biberi ekle.',
        'Limon suyunu sık ve tüm malzemeler homojen olana dek karıştır.',
        'Ekmeğin üzerine sürerek tüketebilirsin.',
      ],
      fitNote: 'Zerdeçal + karabiber metabolizmayı destekler ve antioksidan etki sağlar. Zencefil sindirime iyi gelir; avokado uzun süreli tokluk verir.',
    },
    {
      slug: 'yuksek-proteinli-yulaf-kasesi', title: 'Yüksek Proteinli Fit Yulaf Kasesi', category: 'Kahvaltı',
      fullText: 'Sıcak, kremamsı ve yüksek proteinli bir kase. 4 yemek kaşığı yulaf ve 1 ölçek whey protein tozunu bir tencereye alın. Üzerine 1 su bardağı su dökerek orta ateşte, yulaflar yumuşayana kadar karıştırarak pişirin. Ocaktan aldıktan sonra 1 yemek kaşığı chia tohumunu ekleyip karıştırın ve karışımı bir kaseye alarak hafifçe soğumaya bırakın. Üzerine dilimlenmiş 1 küçük muzu yerleştirin, 1 tatlı kaşığı şekersiz fıstık ezmesi ya da tahini gezdirin ve dilerseniz tarçın serpin. Muz yerine farklı meyveler kullanabilir, karbonhidratı azaltmak için yulaf miktarını düşürebilirsiniz.',
      tags: ['Yüksek Protein'], timeMinutes: 10, calories: 390, protein: 31, carbs: 44, fat: 10,
      servings: 1, difficulty: 'Kolay', isFeatured: false,
      ingredients: [
        { name: 'Yulaf', amount: '4 yemek kaşığı' }, { name: 'Whey protein tozu', amount: '1 ölçek' },
        { name: 'Muz', amount: '1 küçük' }, { name: 'Chia tohumu', amount: '1 yemek kaşığı' },
        { name: 'Şekersiz fıstık ezmesi / tahin', amount: '1 tatlı kaşığı' }, { name: 'Su', amount: '1 su bardağı' },
        { name: 'Tarçın', amount: 'isteğe bağlı' },
      ],
      steps: [
        'Yulaf ve protein tozunu bir tencereye al.',
        'Suyu dök, orta ateşte yulaflar yumuşayana dek karıştırarak pişir.',
        'Ocaktan al, chia tohumunu ekleyip karıştır.',
        'Karışımı kaseye al, biraz soğumaya bırak.',
        'Üzerine dilimlenmiş muzu ekle.',
        'Fıstık ezmesini gezdirip tarçın serp.',
      ],
      fitNote: 'Muz yerine farklı meyveler eklenebilir. Chia uzun süreli tokluk sağlar; karbonhidratı azaltmak için yulafı azalt.',
    },
  ];

  for (const r of recipes) {
    const data = {
      slug: r.slug, title: r.title, category: r.category,
      tags: JSON.stringify(r.tags),
      timeMinutes: r.timeMinutes, calories: r.calories,
      protein: r.protein, carbs: r.carbs, fat: r.fat,
      servings: r.servings, difficulty: r.difficulty,
      imageUrl: `${BASE_URL}/uploads/recipes/${r.slug}.jpg`,
      ingredients: JSON.stringify(r.ingredients),
      steps: JSON.stringify(r.steps),
      fitNote: r.fitNote, fullText: r.fullText, isFeatured: r.isFeatured,
    };
    await prisma.recipe.upsert({ where: { slug: r.slug }, update: data, create: data });
  }
  console.log('Recipes seeded');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
