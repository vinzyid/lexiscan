import { Tabs } from 'expo-router/js-tabs';

import { PillTabBar } from '../../src/components/pill-tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="scanner" options={{ title: 'Pindai' }} />
      <Tabs.Screen name="reader" options={{ title: 'Baca' }} />
      <Tabs.Screen name="settings" options={{ title: 'Atur' }} />
    </Tabs>
  );
}
