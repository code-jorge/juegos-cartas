import { useMemo, useState } from 'react';
import type { BlockadeGameState, BlockadeSettings } from '../types/blockade';
import {
  applyFoundationMove,
  applyMove,
  cardsOnFoundations,
  dealInitialState,
  dealRow,
  getFoundationCardDestinations,
  getGroupDestinations,
  getMovableCardKeys,
  getScorePercent,
  isMovableRun,
  progress,
  type Dest,
} from '../utils/blockadeLogic';

type Selection =
  | { kind: 'tableau'; col: number; index: number }
  | { kind: 'foundation'; index: number };

/** Legal destinations for whatever is currently picked up. */
const destinationsFor = (
  state: BlockadeGameState,
  sel: Selection,
): { tableau: number[]; foundations: number[] } => {
  if (sel.kind === 'tableau') {
    const dests = getGroupDestinations(state, sel.col, sel.index);
    return {
      tableau: dests.filter((d) => d.type === 'tableau').map((d) => (d as { col: number }).col),
      foundations: dests
        .filter((d) => d.type === 'foundation')
        .map((d) => (d as { index: number }).index),
    };
  }
  return { tableau: getFoundationCardDestinations(state, sel.index), foundations: [] };
};

export const useBlockadeGame = (settings: BlockadeSettings) => {
  const [state, setState] = useState<BlockadeGameState>(() => progress(dealInitialState()));
  const [selected, setSelected] = useState<Selection | null>(null);

  const newGame = () => {
    setState(progress(dealInitialState()));
    setSelected(null);
  };

  const performMove = (sel: Selection, dest: Dest) => {
    setState((prev) => {
      const moved =
        sel.kind === 'tableau'
          ? applyMove(prev, sel.col, sel.index, dest)
          : applyFoundationMove(prev, sel.index, (dest as { col: number }).col);
      moved.moves += 1;
      return progress(moved);
    });
    setSelected(null);
  };

  const startTableauSelection = (col: number, index: number) => {
    if (!isMovableRun(state.tableau[col], index)) return;
    const dests = getGroupDestinations(state, col, index);
    // A foundation ("solution stack") is always the right home for a card, so
    // send it there automatically — using the first available stack.
    const foundationDest = dests.find((d) => d.type === 'foundation');
    if (foundationDest) {
      performMove({ kind: 'tableau', col, index }, foundationDest);
    } else if (dests.length === 1) {
      performMove({ kind: 'tableau', col, index }, dests[0]);
    } else if (dests.length > 1) {
      setSelected({ kind: 'tableau', col, index });
    }
  };

  const startFoundationSelection = (index: number) => {
    const cols = getFoundationCardDestinations(state, index);
    if (cols.length === 1) {
      performMove({ kind: 'foundation', index }, { type: 'tableau', col: cols[0] });
    } else if (cols.length > 1) {
      setSelected({ kind: 'foundation', index });
    }
  };

  const handleCardClick = (col: number, index: number) => {
    if (state.status !== 'playing') return;

    if (selected === null) {
      startTableauSelection(col, index);
      return;
    }

    if (selected.kind === 'tableau' && selected.col === col && selected.index === index) {
      setSelected(null);
      return;
    }

    if (destinationsFor(state, selected).tableau.includes(col)) {
      performMove(selected, { type: 'tableau', col });
      return;
    }

    setSelected(null);
    startTableauSelection(col, index);
  };

  const handleFoundationClick = (index: number) => {
    if (state.status !== 'playing') return;

    if (selected === null) {
      startFoundationSelection(index);
      return;
    }

    if (selected.kind === 'foundation' && selected.index === index) {
      setSelected(null);
      return;
    }

    if (destinationsFor(state, selected).foundations.includes(index)) {
      performMove(selected, { type: 'foundation', index });
      return;
    }

    setSelected(null);
    startFoundationSelection(index);
  };

  const handleEmptyColumnClick = (col: number) => {
    if (state.status !== 'playing' || selected === null) return;
    if (destinationsFor(state, selected).tableau.includes(col)) {
      performMove(selected, { type: 'tableau', col });
      return;
    }
    setSelected(null);
  };

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

  const { destinationTableau, destinationFoundations, selectedKeys, selectedFoundation, movableKeys } =
    useMemo(() => {
      const tableauDests = new Set<number>();
      const foundationDests = new Set<number>();
      const selectedSet = new Set<string>();
      let selFoundation: number | null = null;

      if (selected !== null) {
        const { tableau, foundations } = destinationsFor(state, selected);
        tableau.forEach((c) => tableauDests.add(c));
        foundations.forEach((i) => foundationDests.add(i));
        if (selected.kind === 'tableau') {
          const pile = state.tableau[selected.col];
          for (let i = selected.index; i < pile.length; i++) {
            selectedSet.add(`${selected.col}-${i}`);
          }
        } else {
          selFoundation = selected.index;
        }
      }

      const movable =
        settings.highlightMovable && selected === null
          ? getMovableCardKeys(state)
          : new Set<string>();

      return {
        destinationTableau: tableauDests,
        destinationFoundations: foundationDests,
        selectedKeys: selectedSet,
        selectedFoundation: selFoundation,
        movableKeys: movable,
      };
    }, [state, selected, settings.highlightMovable]);

  return {
    state,
    destinationTableau,
    destinationFoundations,
    selectedKeys,
    selectedFoundation,
    movableKeys,
    placedCount: cardsOnFoundations(state),
    scorePercent: getScorePercent(state),
    handleCardClick,
    handleFoundationClick,
    handleEmptyColumnClick,
    deal,
    newGame,
    giveUp,
  };
};
