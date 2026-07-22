# A/B Deney Planı — Apple PPO + Google Play Store Listing Experiments

> `mkt-aso`: 2 varyant (başlık / ikon / ilk screenshot), **tek değişken** test et, **dönüşümü** (impression→install / product page view→install) ölç. Apple **PPO** = Product Page Optimization (aynı anda ≤3 treatment). Google Play = **Store Listing Experiments**.
> Öncelik sırası: önce **başlık**, sonra **ilk screenshot**, sonra **ikon**. Bir seferde bir platformda tek değişken.

## Deney sırası

| # | Hipotez | Tek değişken | Platform | Süre | Başarı metriği |
|---|---|---|---|---|---|
| **EXP-01** | Keyword-öne başlık (A) install taban yokken daha çok arama→install getirir | Başlık A `Diyet & Kalori: Social Fit` **vs** B `Social Fit: Sosyal Diyet` | Apple PPO + Play Listing Exp. | 2–4 hafta veya ≥ istatistik anlamlılık | Product page view → install dönüşümü (%) |
| **EXP-02** | Sosyal/streak ilk screenshot, kalori-odaklı ilk screenshot'tan daha çok dönüştürür | 1. screenshot başlığı: "Diyeti bırakma, streak'inle yolda kal" **vs** "Ne yediğini saniyede logla" | Apple PPO + Play | 2–3 hafta | Install dönüşümü (%) |
| **EXP-03** | Alt başlıkta "arkadaşla" (sosyal) vurgusu, "motive ol"dan daha yüksek dönüşüm | Alt başlık: `Arkadaşla kilo ver, streak yap` **vs** `Arkadaşla kilo ver, motive ol` | Apple PPO | 2 hafta | İnstall dönüşümü (%) |
| **EXP-04** | Streak-alevli ikon, sade yaprak ikondan daha çok tıklanır | İkon: alevli streak **vs** sade yaprak | Apple PPO + Play | 3–4 hafta | Impression → product page view (tap-through) |

## Kurallar
- **Aynı anda tek değişken.** EXP-01 bitmeden EXP-02'yi başlatma (aynı platformda).
- **Yeterli trafik** yoksa (yeni app, düşük impression) sonuç güvenilmez → önce organik + landing/waitlist ile taban trafik oluştur (`social-fit-domain` Faz 4), sonra deney. Bu, "store + retention oturmadan reklam ölçekleme" kuralıyla uyumlu.
- Kazananı **kalıcı** yap, kaybedeni arşivle, sonucu ilgili campaign handoff'una not düş (`_CAMPAIGN_*`, `## Handoff Messages`).
- Metrik kaynağı: App Store Connect (PPO) / Play Console (Experiments) native dönüşüm raporları.

## Launch anı — hangi varyantla çıkılır?
İlk yayında **başlık A (keyword-öne)** + **ilk screenshot: sosyal/streak** ile çık (install tabanı yokken keşfedilebilirlik önce). B varyantlarını EXP-01/02'ye koy. İlk 2 hafta yorum/rating ivmesine odaklan (ASO sıralamasını en çok bu besler).
