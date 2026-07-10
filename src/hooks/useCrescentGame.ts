import { useState } from 'react';
import type { CrescentGameState, CrescentSettings } from '../types/crescent';
import { UNDO_LIMIT } from '../types/crescent';
import {
  applyMove,
  applyReshuffle,
  cardsOnFoundations,
  dealInitialState,
  getScorePercent,
  getTargets,
  isLegalMove,
  reshufflesLeft,
  resolveStatus,
  type Spot,
} from '../utils/crescentLogic';

export const useCrescentGame = (settings: CrescentSettings) => {
  const [state, setState] = useState<CrescentGameState>(() =>
    resolveStatus(dealInitialState(settings.reshuffles)),
  );
  const [history, setHistory] = useState<CrescentGameState[]>([]);

  const newGame = () => {
    setState(resolveStatus(dealInitialState(settings.reshuffles)));
    setHistory([]);
  };

  /** Snapshot the current state (keeping the last UNDO_LIMIT), then apply `next`. */
  const commit = (next: CrescentGameState) => {
    setHistory((h) => [...h, state].slice(-UNDO_LIMIT));
    setState(resolveStatus(next));
  };

  const tryMove = (source: Spot, target: Spot): boolean => {
    if (state.status !== 'playing' || !isLegalMove(state, source, target)) return false;
    commit(applyMove(state, source, target));
    return true;
  };

  /** Tap shortcut: send to a foundation if possible, else take a unique pile move. */
  const autoMove = (source: Spot) => {
    if (state.status !== 'playing') return;
    const targets = getTargets(state, source);
    const foundation = targets.find((t) => t.type === 'foundation');
    if (foundation) tryMove(source, foundation);
    else if (targets.length === 1) tryMove(source, targets[0]);
  };

  const reshuffle = () => {
    if (state.status !== 'playing' || reshufflesLeft(state) <= 0) return;
    commit(applyReshuffle(state));
  };

  const undo = () => {
    if (state.status !== 'playing' || history.length === 0) return;
    setState(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };

  const giveUp = () => {
    if (state.status !== 'playing') return;
    setState((prev) => ({ ...prev, status: 'lost' }));
  };

  return {
    state,
    undosAvailable: history.length,
    canUndo: state.status === 'playing' && history.length > 0,
    reshufflesLeft: reshufflesLeft(state),
    targetsFor: (source: Spot) => getTargets(state, source),
    tryMove,
    autoMove,
    reshuffle,
    undo,
    giveUp,
    newGame,
    placedCount: cardsOnFoundations(state),
    scorePercent: getScorePercent(state),
  };
};
