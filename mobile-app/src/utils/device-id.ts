import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Penanda perangkat anonim yang dikirim ke backend di setiap permintaan AI.
 *
 * BUKAN akun dan BUKAN token. LexiScan sengaja tidak mewajibkan pendaftaran:
 * formulir masuk menuntut ketepatan mengeja dan mengingat sandi, dua hal yang
 * justru menjadi hambatan bagi penyandang disleksia. Yang dikirim hanya UUID
 * acak tanpa kaitan ke nama, email, maupun apa pun tentang penggunanya.
 *
 * Gunanya menjaga keberlanjutan kuota LLM: satu perangkat yang memakai layanan
 * secara tidak wajar bisa dihentikan tanpa ikut menjatuhkan pengguna lain yang
 * kebetulan berbagi alamat IP.
 */

const STORAGE_KEY = 'lexiscan-device-id';

/**
 * Dibaca sekali lalu dipakai ulang. Tanpa ini, tiga permintaan yang berangkat
 * bersamaan bisa sama-sama menemukan penyimpanan kosong lalu menulis tiga UUID
 * berbeda, dan yang terakhir menang.
 */
let pending: Promise<string | null> | null = null;

export function currentDeviceId(): Promise<string | null> {
  pending ??= resolve();

  return pending;
}

async function resolve(): Promise<string | null> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);

    if (saved) {
      return saved;
    }

    const fresh = uuidV4();
    await AsyncStorage.setItem(STORAGE_KEY, fresh);

    return fresh;
  } catch {
    /*
     * Penyimpanan tidak terbaca. Sengaja null, bukan UUID sementara: yang
     * sementara akan berbeda tiap aplikasi dijalankan dan hanya memenuhi tabel
     * perangkat di server dengan baris sekali pakai. Backend memang menerima
     * permintaan tanpa penanda ini.
     */
    return null;
  }
}

/**
 * UUID v4 buatan sendiri, memakai Math.random.
 *
 * Bukan sumber acak kriptografis, dan memang tidak perlu: nilainya sekadar
 * label, bukan rahasia. Memalsukan penanda milik perangkat lain tidak
 * memberi keuntungan apa pun — paling banter mewarisi status blokirnya.
 *
 * Ditulis manual supaya tidak menambah dependensi native (expo-crypto), yang
 * akan memaksa folder android/ dibangun ulang.
 */
function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    // Digit ke-13 selalu '4' dan ke-17 salah satu dari 8/9/a/b — itu yang
    // membuat bentuknya lolos validasi UUID v4 di sisi server.
    const value = char === 'x' ? random : (random & 0x3) | 0x8;

    return value.toString(16);
  });
}
