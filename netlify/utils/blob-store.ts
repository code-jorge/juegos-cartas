import { getStore } from '@netlify/blobs';
import type { MultiplayerGameState } from '../../src/types/multiplayer';

const STORE_NAME = 'escoba-games';

export const getGameStore = () => getStore(STORE_NAME);

export const loadGame = async (gameId: string): Promise<MultiplayerGameState | null> => {
  const store = getGameStore();
  const data = await store.get(gameId);
  if (!data) return null;
  const game: MultiplayerGameState = JSON.parse(data);
  if (Date.now() > game.expiresAt && game.phase !== 'expired') {
    game.phase = 'expired';
    await saveGame(game);
  }
  return game;
};

export const saveGame = async (game: MultiplayerGameState): Promise<void> => {
  const store = getGameStore();
  game.version += 1;
  game.lastActivity = Date.now();
  await store.set(game.gameId, JSON.stringify(game));
};

export const deleteGame = async (gameId: string): Promise<void> => {
  const store = getGameStore();
  await store.delete(gameId);
};
