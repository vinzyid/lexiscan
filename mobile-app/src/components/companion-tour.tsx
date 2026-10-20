import { useRouter } from 'expo-router';

import { useT } from '../i18n';
import { SpotlightTour, useTourStore, type TourStep } from './spotlight-tour';

/**
 * Tur pendamping, dipasang sekali di tata letak tab.
 *
 * Dua tahap: bilah tab dulu (terlihat di layar mana pun), lalu layar Baca,
 * tempat hampir semua alat bantu membaca berada. Perpindahan ke layar Baca
 * dilakukan tur ini sendiri, supaya pendamping tidak perlu tahu harus ke mana.
 */
export function CompanionTour() {
  const t = useT();
  const router = useRouter();
  const stage = useTourStore((s) => s.stage);
  const setStage = useTourStore((s) => s.setStage);
  const steps = t.tour.steps;

  const tabsSteps: TourStep[] = [
    { target: null, ...steps.welcome },
    { target: 'tab.scanner', ...steps.scanner },
    { target: 'tab.documents', ...steps.documents },
    { target: 'tab.settings', ...steps.settings },
    { target: 'tab.reader', ...steps.reader },
  ];

  const readerSteps: TourStep[] = [
    { target: 'reader.typography', ...steps.typography },
    { target: 'reader.simplify', ...steps.simplify },
    { target: 'reader.focus', ...steps.focus },
    { target: 'reader.ruler', ...steps.ruler },
    { target: 'reader.bicolor', ...steps.bicolor },
    { target: 'reader.syllables', ...steps.syllables },
    { target: 'reader.readAloud', ...steps.readAloud },
    { target: 'reader.explain', ...steps.explain },
    { target: 'reader.spell', ...steps.spell },
    { target: 'reader.slow', ...steps.slow },
    { target: 'reader.hint', ...steps.hint },
    { target: null, ...steps.finish },
  ];

  const total = tabsSteps.length + readerSteps.length;

  if (stage === 'tabs') {
    return (
      <SpotlightTour
        key="tabs"
        steps={tabsSteps}
        counterTotal={total}
        onFinish={(completed) => {
          if (!completed) {
            setStage(null);

            return;
          }

          setStage('reader');
          router.navigate('/(tabs)/reader');
        }}
      />
    );
  }

  if (stage === 'reader') {
    return (
      <SpotlightTour
        key="reader"
        steps={readerSteps}
        counterOffset={tabsSteps.length}
        counterTotal={total}
        onFinish={() => setStage(null)}
      />
    );
  }

  return null;
}
