import { useState } from 'react';
import { CrescentBoard } from '../components/CrescentBoard';
import { CrescentSetup } from '../components/CrescentSetup';
import { usePageTitle } from '../hooks/usePageTitle';
import type { CrescentSettings } from '../types/crescent';

export const CrescentPage = () => {
  usePageTitle('Crescent');

  const [settings, setSettings] = useState<CrescentSettings | null>(null);

  if (!settings) {
    return <CrescentSetup onStartGame={setSettings} />;
  }

  return <CrescentBoard settings={settings} onExit={() => setSettings(null)} />;
};
