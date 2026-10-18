import { Share } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { File, Paths } from 'expo-file-system';

/**
 * Membagikan teks sebagai BERKAS (.csv, .json), bukan sebagai pesan.
 *
 * `Share.share({ message })` mengirim teks biasa: WhatsApp menempelkannya
 * sebagai obrolan dan memotong yang panjang, sehingga data mentah uji energi
 * (ribuan baris) sampai di laptop tinggal beberapa KB. Berkas dikirim utuh dan
 * langsung bisa dibuka di Excel atau dibaca skrip.
 *
 * Modul ExpoSharing baru ada di APK 1.4.0 ke atas. APK lama yang menerima
 * pembaruan OTA tidak punya modulnya, dan mengimpor `expo-sharing` di sana
 * langsung melempar galat, jadi modulnya diperiksa dulu dan dimuat belakangan.
 * Tanpa modul itu, teksnya tetap dibagikan sebagai pesan seperti dulu.
 */
const hasSharing = requireOptionalNativeModule('ExpoSharing') !== null;

export async function shareTextFile(
  filename: string,
  content: string,
  mimeType: 'text/csv' | 'application/json',
): Promise<void> {
  if (!hasSharing) {
    await Share.share({ message: content });
    return;
  }

  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(content);

  const Sharing = await import('expo-sharing');
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
}

/** Cap waktu untuk nama berkas: 2026-10-18_15-49. */
export function fileStamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
}
