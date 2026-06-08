import { useMemo, useState } from 'react';
import type { BlockadeGameState, BlockadeSettings } from '../types/blockade';
import {
  applyMove,
  cardsOnFoundations,
  dealInitialState,
  dealRow,
  getDestinations,
  getMovableColumns,
  getScorePercent,
  progress,
  type Dest,
} from '../utils/blockadeLogic';

const createInitialState = (settings: BlockadeSettings): BlockadeGameState =>
  progress(dealInitialState(), settings);

export const useBlockadeGame = (settings: BlockadeSettings) => {
  const [state, setState] = useState<BlockadeGameState>(() => createInitialState(settings));
  const [selected, setSelected] = useState<number | null>(null);

  const newGame = () => {
    setState(createInitialState(settings));
    setSelected(null);
  };

  const performMove = (col: number, dest: Dest) => {
    setState((prev) => {
      const moved = applyMove(prev, col, dest);
      moved.moves += 1;
      return progress(moved, settings);
    });
    setSelected(null);
  };

  const startSelection = (col: number) => {
    const destinations = getDestinations(state, col);
    if (destinations.length === 1) {
      performMove(col, destinations[0]);
    } else if (destinations.length > 1) {
      setSelected(col);
    }
  };

  const handleColumnClick = (col: number) => {
    if (state.status !== 'playing') return;

    if (selected === null) {
      startSelection(col);
      return;
    }

    if (selected === col) {
      setSelected(null);
      return;
    }

    const destinations = getDestinations(state, selected);
    if (destinations.some((d) => d.type === 'tableau' && d.col === col)) {
      performMove(selected, { type: 'tableau', col });
      return;
    }

    setSelected(null);
    startSelection(col);
  };

  const handleFoundationClick = (index: number) => {
    if (state.status !== 'playing' || selected === null) return;
    const destinations = getDestinations(state, selected);
    if (destinations.some((d) => d.type === 'foundation' && d.index === index)) {
      performMove(selected, { type: 'foundation', index });
      return;
    }
    setSelected(null);
  };

  const deal = () => {
    if (state.status !== 'playing' || state.stock.length === 0) return;
    setState((prev) => progress(dealRow(prev), settings));
    setSelected(null);
  };

  const giveUp = () => {
    if (state.status !== 'playing') return;
    setState((prev) => ({ ...prev, status: 'lost' }));
    setSelected(null);
  };

  const { destinationTableau, destinationFoundations, movableColumns } = useMemo(() => {
    const tableauDests = new Set<number>();
    const foundationDests = new Set<number>();
    if (selected !== null) {
      for (const dest of getDestinations(state, selected)) {
        if (dest.type === 'tableau') tableauDests.add(dest.col);
        else foundationDests.add(dest.index);
      }
    }
    const movable = selected === null ? new Set(getMovableColumns(state)) : new Set<number>();
    return {
      destinationTableau: tableauDests,
      destinationFoundations: foundationDests,
      movableColumns: movable,
    };
  }, [state, selected]);

  return {
    state,
    selected,
    destinationTableau,
    destinationFoundations,
    movableColumns,
    placedCount: cardsOnFoundations(state),
    scorePercent: getScorePercent(state),
    handleColumnClick,
    handleFoundationClick,
    deal,
    newGame,
    giveUp,
  };
};
