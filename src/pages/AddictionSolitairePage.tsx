import { useState } from 'react';
import { AddictionBoard } from '../components/AddictionBoard';
import { AddictionSetup } from '../components/AddictionSetup';
import { usePageTitle } from '../hooks/usePageTitle';
import type { AddictionSettings } from '../types/addiction';

export const AddictionSolitairePage = () => {
  usePageTitle('Addiction');

  const [settings, setSettings] = useState<AddictionSettings | null>(null);

  if (!settings) {
    return <AddictionSetup onStartGame={setSettings} />;
  }

  return <AddictionBoard settings={settings} onExit={() => setSettings(null)} />;
};
