import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Fotoğrafı yüklemeden önce küçültür + JPEG olarak sıkıştırır.
// Amaç: Supabase Storage/egress kullanımını düşürmek (free tier ömrünü uzatır).
// - maxWidth'ten genişse orana göre küçültür (küçükse dokunmaz).
// - compress: 0 (en küçük) .. 1 (en kaliteli).
// Hata olursa orijinal uri döner ki yükleme yine de çalışsın.
export async function compressImage(uri, { maxWidth = 1440, compress = 0.6, width } = {}) {
  try {
    const context = ImageManipulator.manipulate(uri);
    if (!width || width > maxWidth) context.resize({ width: maxWidth });
    const image = await context.renderAsync();
    const result = await image.saveAsync({ compress, format: SaveFormat.JPEG });
    return result.uri;
  } catch (e) {
    console.warn('[compressImage] basarisiz, orijinal kullanilacak:', e?.message);
    return uri;
  }
}
