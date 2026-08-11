/**
 * Menerjemahkan kotak panduan di layar menjadi kotak potong di foto aslinya.
 *
 * MASALAH YANG DIPECAHKAN. Pratinjau kamera MEMENUHI kotaknya dengan cara
 * memangkas — bukan memuat seluruh gambar sensor lalu menyisakan bilah kosong.
 * Sensor ponsel menghasilkan foto 4:3, sedangkan kotak pratinjau di layar Pindai
 * jauh lebih lebar daripada tinggi, jadi yang TAMPIL cuma sepotong pita
 * mendatar dari tengah foto. Bagian atas dan bawah foto tetap terekam meski
 * tidak pernah terlihat.
 *
 * Versi sebelumnya memotong "tengah 60%" dari foto dengan angka tetap, tanpa
 * tahu berapa yang sebenarnya terlihat. Akibatnya persis yang dilaporkan
 * pengguna: dokumen sudah dipaskan ke kotak di layar, tapi tulisan di luar
 * kotak — yang tak pernah tampak di pratinjau — ikut terbaca.
 *
 * Fungsi ini menghitungnya, bukan menebaknya. Semua satuan masuk apa adanya:
 * ukuran pratinjau dalam poin layar, ukuran foto dalam piksel.
 */

export type Size = { width: number; height: number };

export type CropRect = { originX: number; originY: number; width: number; height: number };

/**
 * @param photo   Ukuran foto hasil jepretan, dalam piksel.
 * @param preview Ukuran kotak pratinjau di layar, dari `onLayout`.
 * @param inset   Jarak siku panduan dari tepi pratinjau, dalam poin layar.
 * @returns Kotak potong dalam piksel foto, atau `null` kalau ukurannya belum
 *          terukur — pemanggil harus memakai foto utuh, sebab memotong dengan
 *          angka karangan lebih buruk daripada tidak memotong.
 */
export function cropRectForGuide(photo: Size, preview: Size, inset: number): CropRect | null {
  if (photo.width <= 0 || photo.height <= 0) return null;
  if (preview.width <= 0 || preview.height <= 0) return null;

  /*
   * Skala "cover": sisi yang paling kekurangan menentukan, sehingga kotaknya
   * penuh tanpa celah. Sisi yang berlebih itulah yang terpangkas.
   */
  const scale = Math.max(preview.width / photo.width, preview.height / photo.height);

  // Bagian foto yang benar-benar terlihat di pratinjau, dalam piksel foto.
  const visibleWidth = preview.width / scale;
  const visibleHeight = preview.height / scale;

  // Pemangkasan cover selalu simetris, jadi tepi kirinya separuh dari sisanya.
  const offsetX = (photo.width - visibleWidth) / 2;
  const offsetY = (photo.height - visibleHeight) / 2;

  // `inset` dalam poin layar, jadi harus dibagi skala untuk jadi piksel foto.
  const insetInPixels = inset / scale;

  const rect = {
    originX: offsetX + insetInPixels,
    originY: offsetY + insetInPixels,
    width: visibleWidth - insetInPixels * 2,
    height: visibleHeight - insetInPixels * 2,
  };

  /*
   * Dibulatkan DAN dijepit ke dalam batas foto. ImageManipulator menolak kotak
   * pecahan maupun yang melewati tepi, dan pembulatan ke luar bisa membuat
   * originX + width lebih besar satu piksel daripada lebarnya sendiri.
   */
  const originX = clamp(Math.round(rect.originX), 0, photo.width - 1);
  const originY = clamp(Math.round(rect.originY), 0, photo.height - 1);

  return {
    originX,
    originY,
    width: clamp(Math.round(rect.width), 1, photo.width - originX),
    height: clamp(Math.round(rect.height), 1, photo.height - originY),
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
