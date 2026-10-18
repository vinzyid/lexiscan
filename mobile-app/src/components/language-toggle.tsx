import { Text, View } from 'react-native';

import { LANGUAGES } from '../i18n';
import { useOCRStore } from '../store/useStore';
import { PressableScale } from './pressable-scale';

/**
 * Pemilih bahasa ringkas "ID | EN" untuk latar gradien gelap.
 *
 * Ditaruh di layar masuk supaya pengguna yang tidak bisa berbahasa Indonesia
 * bisa berganti bahasa sebelum mengisi apa pun. Tanpa ini pilihan bahasa hanya
 * ada di tab Atur, yang baru bisa dicapai sesudah melewati layar masuk yang
 * seluruhnya berbahasa Indonesia.
 */
export function LanguageToggle() {
  const language = useOCRStore((s) => s.language);
  const setLanguage = useOCRStore((s) => s.setLanguage);

  return (
    <View
      className="flex-row rounded-full bg-white/15 p-1"
      style={{ gap: 2 }}
      accessibilityRole="radiogroup">
      {LANGUAGES.map((item) => {
        const selected = item.id === language;

        return (
          <PressableScale
            key={item.id}
            onPress={() => setLanguage(item.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            // Nama bahasa ditulis dalam bahasanya sendiri, supaya pembaca layar
            // menyebut "English" kepada orang yang mencari bahasa Inggris.
            accessibilityLabel={item.name}
            scaleTo={0.94}
            className={`h-8 min-w-[44px] items-center justify-center rounded-full px-3 ${
              selected ? 'bg-white' : ''
            }`}>
            <Text
              className={`font-ui-bold text-[13px] ${selected ? 'text-primary' : 'text-white/70'}`}
              style={{ letterSpacing: 0.6 }}>
              {item.id.toUpperCase()}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
