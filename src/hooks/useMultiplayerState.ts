import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ClientGameState } from '../types/multiplayer';
import { api } from '../utils/api';
import { getStoredJoinToken, storeJoinToken, clearJoinToken } from './usePlayerId';

interface UseMultiplayerStateResult {
  state: ClientGameState | null;
  error: string | null;
  isLoading: boolean;
  joinToken: string | null;
  needsToJoin: boolean;
  join: (playerName: string, asSpectator?: boolean) => Promise<boolean>;
  setReady: (ready: boolean) => Promise<void>;
  playCard: (cardId: string, captureCardIds: string[]) => Promise<void>;
  startNewRound: () => Promise<void>;
  newGame: () => Promise<void>;
  leave: () => Promise<void>;
  kickPlayer: (targetPlayerId: string) => Promise<void>;
}

export const useMultiplayerState = (
  gameId: string,
  playerId: string
): UseMultiplayerStateResult => {
  const [state, setState] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [needsToJoin, setNeedsToJoin] = useState(false);
  const pollTimeoutRef = useRef<number | null>(null);

  // Get poll interval based on game phase
  const pollInterval = useMemo(() => {
    if (!state) return 5000;
    if (state.phase === 'lobby') return 3000;
    if (state.phase === 'playing') return 2000;
    if (state.phase === 'expired') return 0; // Stop polling
    return 5000;
  }, [state?.phase]);

  // Initial check for stored join token
  useEffect(() => {
    const storedToken = getStoredJoinToken(gameId);
    if (storedToken) {
      setJoinToken(storedToken);
    } else {
      setNeedsToJoin(true);
      setIsLoading(false);
    }
  }, [gameId]);

  // Polling effect
  useEffect(() => {
    if (!joinToken || pollInterval === 0) return;

    const poll = async () => {
      try {
        const response = await api.getGame({
          gameId,
          playerId,
          joinToken,
        });

        if (response.success && response.state) {
          setState(response.state);
          setError(null);
          setNeedsToJoin(false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error de conexion';

        // If invalid token, need to rejoin
        if (message.includes('Invalid join token') || message.includes('Not a participant')) {
          clearJoinToken(gameId);
          setJoinToken(null);
          setNeedsToJoin(true);
        } else {
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    poll(); // Initial fetch

    if (pollInterval > 0) {
      pollTimeoutRef.current = window.setInterval(poll, pollInterval);
    }

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
    };
  }, [gameId, playerId, joinToken, pollInterval]);

  const join = useCallback(async (playerName: string, asSpectator = false): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.joinGame({
        gameId,
        playerId,
        playerName,
        asSpectator,
        joinToken: joinToken || undefined,
      });

      if (response.success) {
        storeJoinToken(gameId, response.joinToken);
        setJoinToken(response.joinToken);
        setNeedsToJoin(false);
        return true;
      }

      setError(response.error || 'Error al unirse');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al unirse');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [gameId, playerId, joinToken]);

  const setReady = useCallback(async (ready: boolean) => {
    if (!joinToken) return;

    try {
      const response = await api.setReady({
        gameId,
        playerId,
        joinToken,
        ready,
      });

      if (response.success && response.state) {
        setState(response.state);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, [gameId, playerId, joinToken]);

  const playCard = useCallback(async (cardId: string, captureCardIds: string[]) => {
    if (!joinToken) return;

    try {
      const response = await api.playCard({
        gameId,
        playerId,
        joinToken,
        cardId,
        captureCardIds,
      });

      if (response.success && response.state) {
        setState(response.state);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, [gameId, playerId, joinToken]);

  const startNewRound = useCallback(async () => {
    if (!joinToken) return;

    try {
      const response = await api.startNewRound({
        gameId,
        playerId,
        joinToken,
      });

      if (response.success && response.state) {
        setState(response.state);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, [gameId, playerId, joinToken]);

  const newGame = useCallback(async () => {
    if (!joinToken) return;

    try {
      const response = await api.newGame({
        gameId,
        playerId,
        joinToken,
      });

      if (response.success && response.state) {
        setState(response.state);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, [gameId, playerId, joinToken]);

  const leave = useCallback(async () => {
    if (!joinToken) return;

    try {
      await api.leaveGame({
        gameId,
        playerId,
        joinToken,
      });

      clearJoinToken(gameId);
      setJoinToken(null);
      setState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, [gameId, playerId, joinToken]);

  const kickPlayer = useCallback(async (targetPlayerId: string) => {
    if (!joinToken) return;

    try {
      const response = await api.kickPlayer({
        gameId,
        playerId,
        joinToken,
        targetPlayerId,
      });

      if (response.success && response.state) {
        setState(response.state);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, [gameId, playerId, joinToken]);

  return {
    state,
    error,
    isLoading,
    joinToken,
    needsToJoin,
    join,
    setReady,
    playCard,
    startNewRound,
    newGame,
    leave,
    kickPlayer,
  };
};
