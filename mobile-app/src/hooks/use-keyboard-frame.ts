import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export type KeyboardFrame = { screenY: number; height: number };

/**
 * Posisi papan tik selagi terbuka, `null` saat tertutup.
 *
 * Aplikasi ini edge-to-edge, jadi di Android jendelanya tidak ikut memendek
 * saat papan tik muncul dan `KeyboardAvoidingView` tanpa `behavior` tidak
 * berbuat apa-apa. Layar yang punya kolom isian memakai posisi ini untuk
 * menghindari papan tiknya sendiri.
 *
 * iOS memakai event "will" supaya isinya naik berbarengan dengan papan tik;
 * Android hanya punya event "did".
 */
export function useKeyboardFrame() {
  const [frame, setFrame] = useState<KeyboardFrame | null>(() => {
    const metrics = Keyboard.isVisible() ? Keyboard.metrics() : undefined;

    return metrics ? { screenY: metrics.screenY, height: metrics.height } : null;
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subs = [
      Keyboard.addListener(showEvent, (e) =>
        setFrame(
          e.endCoordinates.height > 0
            ? { screenY: e.endCoordinates.screenY, height: e.endCoordinates.height }
            : null,
        ),
      ),
      Keyboard.addListener(hideEvent, () => setFrame(null)),
    ];

    return () => subs.forEach((sub) => sub.remove());
  }, []);

  return frame;
}

/**
 * Seberapa tinggi papan tik menutupi sebuah lapisan setinggi `rootHeight`,
 * dihitung dari tepi atas papan tiknya. Di Android `height` dari RN sudah
 * dikurangi bilah navigasi, padahal lapisannya menempel sampai ke dasar layar
 * (edge-to-edge), jadi yang dipakai adalah yang lebih besar dari keduanya.
 */
export function keyboardOverlap(keyboard: KeyboardFrame | null, rootHeight: number) {
  if (!keyboard || rootHeight <= 0) {
    return 0;
  }

  return Math.max(
    rootHeight - keyboard.screenY,
    Platform.OS === 'android' ? keyboard.height : 0,
    0,
  );
}
