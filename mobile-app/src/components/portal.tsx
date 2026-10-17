import { Fragment, useId, useLayoutEffect, useSyncExternalStore, type ReactNode } from 'react';

/**
 * Portal kecil: isi dirender di `PortalHost` di akar aplikasi, bukan di tempat
 * komponennya ditulis.
 *
 * Dipakai untuk lembar yang berisi kolom isian sebagai pengganti `Modal`. Di
 * Android, `Modal` adalah jendela dialog tersendiri, sedangkan event papan tik
 * React Native (dan KeyboardAvoidingView yang bergantung padanya) hanya dibaca
 * dari jendela Activity. Di HP asli Android 11 ke atas, inset papan tik hanya
 * dikirim ke jendela yang sedang fokus, yaitu dialognya, sehingga isi `Modal`
 * tidak pernah tahu papan tik muncul dan kolomnya tertimbun. Isi yang dirender
 * di jendela Activity tidak punya masalah itu.
 */

let entries: [string, ReactNode][] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setEntry(id: string, node: ReactNode) {
  const index = entries.findIndex(([key]) => key === id);
  entries =
    index === -1
      ? [...entries, [id, node]]
      : entries.map((entry, i) => (i === index ? [id, node] : entry));
  emit();
}

function removeEntry(id: string) {
  entries = entries.filter(([key]) => key !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Mengirim `children` ke `PortalHost`. Isinya dicabut begitu ini dilepas. */
export function Portal({ children }: { children: ReactNode }) {
  const id = useId();

  // Tanpa daftar ketergantungan dengan sengaja: setiap render pemiliknya harus
  // meneruskan isi terbarunya, mis. nilai kolom isian yang sedang diketik.
  useLayoutEffect(() => {
    setEntry(id, children);
  });

  useLayoutEffect(() => () => removeEntry(id), [id]);

  return null;
}

/** Tempat isi `Portal` dirender. Dipasang sekali, di atas navigator. */
export function PortalHost() {
  const current = useSyncExternalStore(subscribe, () => entries, () => entries);

  return (
    <>
      {current.map(([id, node]) => (
        <Fragment key={id}>{node}</Fragment>
      ))}
    </>
  );
}
