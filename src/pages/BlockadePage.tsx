import { useState } from 'react';
import { BlockadeBoard } from '../components/BlockadeBoard';
import { BlockadeSetup } from '../components/BlockadeSetup';
import { usePageTitle } from '../hooks/usePageTitle';
import type { BlockadeSettings } from '../types/blockade';

export const BlockadePage = () => {
  usePageTitle('Blockade');

  const [settings, setSettings] = useState<BlockadeSettings | null>(null);

  if (!settings) {
    return <BlockadeSetup onStartGame={setSettings} />;
  }

  return <BlockadeBoard settings={settings} onExit={() => setSettings(null)} />;
};
