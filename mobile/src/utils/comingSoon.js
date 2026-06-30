// comingSoon.js — backend'i henüz olmayan butonlar için tutarlı geri bildirim.
// Hiçbir buton sessiz kalmasın diye; özellik gelince burayı gerçek aksiyonla değiştir.
import { Alert } from 'react-native';

export function comingSoon(feature) {
  Alert.alert(
    feature ? `${feature} — Yakında` : 'Yakında',
    'Bu özellik çok yakında geliyor! 🚀'
  );
}
