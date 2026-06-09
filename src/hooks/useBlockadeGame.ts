import { useMemo, useState } from 'react';
import type { BlockadeGameState, BlockadeSettings } from '../types/blockade';
import {
  applyMove,
  cardsOnFoundations,
  dealInitialState,
  dealRow,
  getGroupDestinations,
  getMovableCardKeys,
  getScorePercent,
  isMovableRun,
  progress,
  type Dest,
} from '../utils/blockadeLogic';

interface Selection {
  col: number;
  index: number;
}

export const useBlockadeGame = (settings: BlockadeSettings) => {
  const [state, setState] = useState<BlockadeGameState>(() => progress(dealInitialState()));
  const [selected, setSelected] = useState<Selection | null>(null);

  const newGame = () => {
    setState(progress(dealInitialState()));
    setSelected(null);
  };

  const performMove = (col: number, index: number, dest: Dest) => {
    setState((prev) => {
      const moved = applyMove(prev, col, index, dest);
      moved.moves += 1;
      return progress(moved);
    });
    setSelected(null);
  };

  const startSelection = (col: number, index: number) => {
    if (!isMovableRun(state.tableau[col], index)) return;
    const destinations = getGroupDestinations(state, col, index);
    if (destinations.length === 1) {
      performMove(col, index, destinations[0]);
    } else if (destinations.length > 1) {
      setSelected({ col, index });
    }
  };

  const handleCardClick = (col: number, index: number) => {
    if (state.status !== 'playing') return;

    if (selected === null) {
      startSelection(col, index);
      return;
    }

    if (selected.col === col && selected.index === index) {
      setSelected(null);
      return;
    }

    const destinations = getGroupDestinations(state, selected.col, selected.index);
    if (destinations.some((d) => d.type === 'tableau' && d.col === col)) {
      performMove(selected.col, selected.index, { type: 'tableau', col });
      return;
    }

    setSelected(null);
    startSelection(col, index);
  };

  const handleFoundationClick = (index: number) => {
    if (state.status !== 'playing' || selected === null) return;
    const destinations = getGroupDestinations(state, selected.col, selected.index);
    if (destinations.some((d) => d.type === 'foundation' && d.index === index)) {
      performMove(selected.col, selected.index, { type: 'foundation', index });
      return;
    }
    setSelected(null);
  };

  const clearSelection = () => setSelected(null);

  const deal = () => {
    if (state.status !== 'playing' || state.stock.length === 0) return;
    setState((prev) => progress(dealRow(prev)));
    setSelected(null);
  };

  const giveUp = () => {
    if (state.status !== 'playing') return;
    setState((prev) => ({ ...prev, status: 'lost' }));
    setSelected(null);
  };

  const { destinationTableau, destinationFoundations, selectedKeys, movableKeys } = useMemo(() => {
    const tableauDests = new Set<number>();
    const foundationDests = new Set<number>();
    const selectedSet = new Set<string>();

    if (selected !== null) {
      for (const dest of getGroupDestinations(state, selected.col, selected.index)) {
        if (dest.type === 'tableau') tableauDests.add(dest.col);
        else foundationDests.add(dest.index);
      }
      const pile = state.tableau[selected.col];
      for (let i = selected.index; i < pile.length; i++) selectedSet.add(`${selected.col}-${i}`);
    }

    const movable =
      settings.highlightMovable && selected === null
        ? getMovableCardKeys(state)
        : new Set<string>();

    return {
      destinationTableau: tableauDests,
      destinationFoundations: foundationDests,
      selectedKeys: selectedSet,
      movableKeys: movable,
    };
  }, [state, selected, settings.highlightMovable]);

  return {
    state,
    destinationTableau,
    destinationFoundations,
    selectedKeys,
    movableKeys,
    placedCount: cardsOnFoundations(state),
    scorePercent: getScorePercent(state),
    handleCardClick,
    handleFoundationClick,
    clearSelection,
    deal,
    newGame,
    giveUp,
  };
};
