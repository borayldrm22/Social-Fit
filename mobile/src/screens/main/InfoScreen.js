// InfoScreen.js — SocialFit · Statik bilgi sayfaları (SSS, Şartlar, Gizlilik, Hakkımızda, İletişim)
// Tek ekran; içerik route param key'ine göre INFO_CONTENT'ten seçilir.
// Native header başlığı route param title ile ayarlanır (MainTabs kaydına bak).
import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors, font, shadow } from '../../theme/socialFitTheme';

const SUPPORT_EMAIL = 'destek@socialfit.app';
const LEGAL_DRAFT = 'Bu metin taslaktır; nihai yasal metin yayına alınmadan önce güncellenecektir.';
const KVKK_LINE = 'Sağlık ve beslenme verileriniz özel nitelikli kişisel veri kapsamındadır. Bu veriler yalnızca açık rızanızla işlenir.';

export const INFO_CONTENT = {
  faq: {
    title: 'Sıkça Sorulan Sorular',
    sections: [
      { h: 'Streak (seri) nasıl çalışır?', p: 'Her gün en az bir paylaşım, öğün veya rutin tamamlaman serini +1 artırır. Bir gün atlarsan seri sıfırlanır. Gün dönüşü gece 00:00.' },
      { h: 'Yıldız puanı ne işe yarar?', p: 'Paylaşım, yorum, öğün girişi ve rutin tamamlama gibi eylemler yıldız kazandırır. Yıldızlar lider tablosundaki sıralamanı belirler.' },
      { h: 'Profilimi gizli yapabilir miyim?', p: 'Evet. Ayarlar > Gizlilik & Güvenlik > Hesap gizliliği bölümünden hesabını gizliye alabilirsin. Gizli hesapta seni yalnızca onayladığın kişiler takip eder.' },
      { h: 'Verilerim güvende mi?', p: KVKK_LINE },
    ],
  },
  terms: {
    title: 'Kullanım Şartları',
    sections: [
      { h: 'Taslak', p: LEGAL_DRAFT },
      { h: 'Özet', p: 'SocialFit\'i sağlıklı yaşam motivasyonu için kullanırsın. Paylaştığın içerikten sen sorumlusun; başkalarını rahatsız edici, yanıltıcı veya yasa dışı içerik paylaşamazsın.' },
      { h: 'Sağlık uyarısı', p: 'Uygulama içeriği bilgilendirme amaçlıdır, tıbbi teşhis veya tedavi yerine geçmez. Sağlık kararları için bir uzmana danış.' },
    ],
  },
  privacy: {
    title: 'Gizlilik Sözleşmesi',
    sections: [
      { h: 'Taslak', p: LEGAL_DRAFT },
      { h: 'Verilerin', p: KVKK_LINE },
      { h: 'Ne topluyoruz?', p: 'Hesap bilgilerin (ad, e-posta, telefon), paylaşımların ve isteğe bağlı sağlık verilerin (kilo, boy, hedef). Bunları hizmeti sunmak dışında satmayız.' },
      { h: 'Haklarına', p: `Verilerine erişme, düzeltme ve silme talebinde bulunabilirsin: ${SUPPORT_EMAIL}` },
    ],
  },
  about: {
    title: 'Hakkımızda',
    sections: [
      { h: 'SocialFit', p: 'SocialFit, sağlıklı yaşamı sosyal ve eğlenceli hâle getiren bir topluluk uygulamasıdır. Öğünlerini ve sporunu paylaş, streak ve yıldız kazan, arkadaşlarınla motive ol.' },
      { h: 'Misyonumuz', p: 'Sağlıklı alışkanlıkları yalnız başına değil, birlikte sürdürülebilir kılmak. Gamification ve topluluk desteğiyle küçük günlük adımları kalıcı hâle getiriyoruz.' },
    ],
  },
  contact: {
    title: 'İletişim',
    sections: [
      { h: 'Bize ulaş', p: `Soru, öneri veya sorunların için: ${SUPPORT_EMAIL}` },
      { h: 'Destek saatleri', p: 'Hafta içi 09:00–18:00 arası e-postalarını yanıtlıyoruz.' },
    ],
    email: SUPPORT_EMAIL,
  },
};

export default function InfoScreen({ route, navigation }) {
  const key = route?.params?.page;
  const content = INFO_CONTENT[key];

  useEffect(() => {
    if (content?.title) navigation.setOptions({ title: content.title });
  }, [content, navigation]);

  if (!content) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>İçerik bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {content.sections.map((s, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.h}>{s.h}</Text>
          <Text style={styles.p}>{s.p}</Text>
        </View>
      ))}
      {content.email ? (
        <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={() => Linking.openURL(`mailto:${content.email}`).catch(() => {})}>
          <Text style={styles.ctaText}>E-posta gönder</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.surface, borderRadius: 16, ...shadow.soft, padding: 16, marginBottom: 12 },
  h: { fontFamily: font.bodyBold, fontSize: 15, color: colors.ink, marginBottom: 6 },
  p: { fontFamily: font.body, fontSize: 14, color: colors.text, lineHeight: 21 },
  cta: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4, ...shadow.cta },
  ctaText: { fontFamily: font.bodyBold, fontSize: 15, color: colors.white },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.faint },
});
