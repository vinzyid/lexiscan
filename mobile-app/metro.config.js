const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

/*
 * Ilustrasi di assets/figma di-export langsung dari file Figma "Final Desain".
 * Transformer ini membuat `import Lexi from '.../lexi.svg'` menghasilkan
 * komponen React, sehingga menyegarkan aset cukup dengan menimpa file .svg-nya
 * tanpa menyentuh kode.
 */
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer/expo");
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

module.exports = withNativeWind(config, {
  input: "./global.css"
});
