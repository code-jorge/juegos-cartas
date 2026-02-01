import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';

const PLAYER_ID_KEY = 'escoba_player_id';
const PLAYER_NAME_KEY = 'escoba_player_name';

export const usePlayerId = () => {
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = nanoid(12);
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    setPlayerId(id);

    const name = localStorage.getItem(PLAYER_NAME_KEY) || '';
    setPlayerName(name);
  }, []);

  const updatePlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem(PLAYER_NAME_KEY, name);
  };

  return {
    playerId,
    playerName,
    setPlayerName: updatePlayerName,
  };
};

export const getStoredJoinToken = (gameId: string): string | null => {
  return localStorage.getItem(`escoba_game_${gameId}_token`);
};

export const storeJoinToken = (gameId: string, token: string): void => {
  localStorage.setItem(`escoba_game_${gameId}_token`, token);
};

export const clearJoinToken = (gameId: string): void => {
  localStorage.removeItem(`escoba_game_${gameId}_token`);
};
