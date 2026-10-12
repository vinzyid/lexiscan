/**
 * UUID v4 sederhana untuk `session_group_id`.
 *
 * Tidak memakai `expo-crypto`/`Crypto.randomUUID` karena keduanya menuntut
 * modul native tambahan, dan itu berarti membangun ulang APK hanya untuk satu
 * string acak. Nilai ini bukan kredensial: fungsinya cuma mengelompokkan sesi
 * baseline dan berbantuan atas teks yang sama, jadi PRNG JavaScript sudah
 * memadai. Backend tetap memvalidasi formatnya sebagai uuid.
 */
export function randomUuid(): string {
  const hex = () => Math.floor(Math.random() * 16).toString(16);

  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  let result = '';

  for (const char of template) {
    if (char === 'x') {
      result += hex();
    } else if (char === 'y') {
      // Varian RFC 4122: 8, 9, a, atau b.
      result += ((Math.floor(Math.random() * 4) + 8) & 0xf).toString(16);
    } else {
      result += char;
    }
  }

  return result;
}
