import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '../theme/theme-provider';
import { getTypeLevel } from '../theme/palettes';
import { useOCRStore } from '../store/useStore';
import { useT } from '../i18n';

const LINE_WIDTHS = [
  ['96%', '88%', '72%'],
  ['92%', '97%', '84%', '60%'],
  ['89%', '78%'],
];

/**
 * Kerangka paragraf selama AI bekerja. Tingginya mengikuti tipografi aktif
 * supaya teks aslinya muncul di posisi yang sama, tanpa lompatan tata letak.
 */
export function TextSkeleton() {
  const colors = useThemeColors();
  const t = useT();
  const typeLevelId = useOCRStore((s) => s.typeLevelId);
  const level = getTypeLevel(typeLevelId);

  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.75, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const lineHeight = level.fontSize * level.lineHeightRatio;
  const barHeight = Math.round(level.fontSize * 0.62);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t.reader.simplifying(t.simplifyLevels.L3.name)}>
      {LINE_WIDTHS.map((lines, blockIndex) => (
        <View key={blockIndex} style={{ marginTop: blockIndex === 0 ? 16 : 26 }}>
          {lines.map((width, lineIndex) => (
            <Animated.View
              key={lineIndex}
              style={[
                {
                  width: width as `${number}%`,
                  height: barHeight,
                  borderRadius: barHeight / 2,
                  marginBottom: lineHeight - barHeight,
                  backgroundColor: colors.primary,
                },
                animatedStyle,
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
