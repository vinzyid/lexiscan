import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Pengingat "Tips Belajar Harian" — satu notifikasi tiap pagi.
 *
 * KENAPA HANYA SATU, DAN HANYA PAGI. Aplikasi ini dipakai anak sekolah, dan
 * pemberitahuan yang datang berkali-kali sehari berakhir dimatikan seluruhnya
 * lewat pengaturan HP — bukan cuma di aplikasi ini. Satu ketukan di pagi hari
 * sebelum berangkat sekolah cukup untuk mengingatkan tanpa jadi gangguan.
 *
 * Seluruh berkas ini aman dipanggil di perangkat yang menolak izin: setiap
 * fungsinya mengembalikan keadaan apa adanya, bukan melempar galat, karena
 * pemanggilnya adalah sakelar di layar Pengaturan yang tidak boleh gagal
 * dengan layar merah.
 */

/** Jam munculnya, waktu setempat. */
const HOUR = 7;
const MINUTE = 0;

/**
 * Penanda tetap, supaya penjadwalan ulang menimpa yang lama alih-alih
 * menumpuk. Tanpa ini, menyalakan-mematikan sakelar beberapa kali meninggalkan
 * beberapa notifikasi kembar yang berbunyi bersamaan di pagi berikutnya.
 */
const IDENTIFIER = 'lexiscan-daily-tip';

/** Nama saluran Android; wajib ada, kalau tidak notifikasinya tidak muncul. */
const CHANNEL = 'daily-tip';

export type DailyTipCopy = { title: string; body: string };

/**
 * Minta izin kalau belum pernah diberikan.
 *
 * Tidak pernah meminta dua kali: `getPermissionsAsync` diperiksa lebih dulu,
 * sebab permintaan yang sudah ditolak permanen tidak akan memunculkan dialog
 * lagi dan hanya membuat sakelarnya seperti macet tanpa penjelasan.
 */
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync();

  return asked.granted;
}

/**
 * Nyalakan pengingat harian.
 *
 * @returns `true` kalau benar-benar terjadwal. `false` berarti izinnya ditolak
 *          — pemanggil harus mengembalikan sakelarnya ke posisi mati, supaya
 *          tidak ada sakelar menyala yang tidak berakibat apa-apa.
 */
export async function enableDailyTip(copy: DailyTipCopy): Promise<boolean> {
  try {
    if (!(await ensurePermission())) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: copy.title,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    // Dibatalkan dulu, bukan ditambah — lihat alasan di IDENTIFIER.
    await disableDailyTip();

    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIER,
      content: { title: copy.title, body: copy.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: HOUR,
        minute: MINUTE,
        channelId: CHANNEL,
      },
    });

    return true;
  } catch {
    /*
     * Emulator tanpa Google Play, atau ROM yang memangkas layanan
     * notifikasinya. Bukan alasan menjatuhkan layar Pengaturan; sakelarnya
     * cukup kembali ke posisi mati.
     */
    return false;
  }
}

export async function disableDailyTip(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
  } catch {
    // Membatalkan sesuatu yang memang belum terjadwal bukan kegagalan.
  }
}
