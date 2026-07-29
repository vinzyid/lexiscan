/**
 * Berkas .svg di-resolve jadi komponen React oleh react-native-svg-transformer
 * (lihat metro.config.js).
 */
declare module '*.svg' {
  import type { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}
