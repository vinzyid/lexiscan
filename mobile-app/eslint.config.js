// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    /*
     * Aturan React Compiler menganggap `sharedValue.value = x` sebagai mutasi
     * terlarang saat render. Untuk Reanimated itu justru API resminya — shared
     * value memang sengaja hidup di luar siklus render React supaya animasi
     * berjalan di UI thread, dan tidak ada cara lain menulisnya. Karena itu
     * kedua aturan dimatikan khusus di berkas yang memakai Reanimated.
     */
    files: [
      "src/components/pressable-scale.tsx",
      "src/components/text-skeleton.tsx",
      "app/(tabs)/reader.tsx",
      "app/(tabs)/index.tsx",
    ],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
]);
