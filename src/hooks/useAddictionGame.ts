import { useMemo, useState } from 'react';
import type {
  AddictionGameState,
  AddictionSettings,
  Position,
} from '../types/addiction';
import { dealInitial } from '../utils/addictionDeck';
import {
  applyMove,
  getDestinationsForCard,
  getMovableCards,
  getScorePercent,
  getSourcesForGap,
  isWon,
  redeal as redealGrid,
} from '../utils/addictionLogic';

const createInitialState = (settings: AddictionSettings): AddictionGameState => {
  const grid = dealInitial();
  const reshuffles = settings.initialReshuffles;
  return {
    grid,
    redealsLeft: reshuffles,
    redealsTotal: reshuffles,
    status: 'playing',
    moves: 0,
  };
};

const samePos = (a: Position, b: Position) => a.row === b.row && a.col === b.col;

export const useAddictionGame = (settings: AddictionSettings) => {
  const [state, setState] = useState<AddictionGameState>(() => createInitialState(settings));
  const [selected, setSelected] = useState<Position | null>(null);

  const newGame = () => {
    setState(createInitialState(settings));
    setSelected(null);
  };

  const performMove = (from: Position, to: Position) => {
    setState((prev) => ({
      ...prev,
      grid: applyMove(prev.grid, from, to),
      moves: prev.moves + 1,
    }));
    setSelected(null);
  };

  const startSelection = (pos: Position) => {
    const cell = state.grid[pos.row][pos.col];
    if (cell !== null) {
      const destinations = getDestinationsForCard(state.grid, pos.row, pos.col);
      if (destinations.length === 1) {
        performMove(pos, destinations[0]);
      } else if (destinations.length > 1) {
        setSelected(pos);
      }
    } else {
      const sources = getSourcesForGap(state.grid, pos.row, pos.col);
      if (sources.length === 1) {
        performMove(sources[0], pos);
      } else if (sources.length > 1) {
        setSelected(pos);
      }
    }
  };

  const handleClick = (pos: Position) => {
    if (state.status !== 'playing') return;

    if (selected === null) {
      startSelection(pos);
      return;
    }

    if (samePos(selected, pos)) {
      setSelected(null);
      return;
    }

    const selectedCell = state.grid[selected.row][selected.col];
    const clickedCell = state.grid[pos.row][pos.col];

    if (selectedCell !== null && clickedCell === null) {
      const destinations = getDestinationsForCard(state.grid, selected.row, selected.col);
      if (destinations.some((d) => samePos(d, pos))) {
        performMove(selected, pos);
        return;
      }
      setSelected(null);
      startSelection(pos);
      return;
    }

    if (selectedCell === null && clickedCell !== null) {
      const sources = getSourcesForGap(state.grid, selected.row, selected.col);
      if (sources.some((s) => samePos(s, pos))) {
        performMove(pos, selected);
        return;
      }
      setSelected(null);
      startSelection(pos);
      return;
    }

    setSelected(null);
    startSelection(pos);
  };

  const redeal = () => {
    if (state.redealsLeft <= 0 || state.status !== 'playing') return;
    setState((prev) => ({
      ...prev,
      grid: redealGrid(prev.grid),
      redealsLeft: prev.redealsLeft - 1,
    }));
    setSelected(null);
  };

  const finishGame = () => {
    if (state.status !== 'playing') return;
    setState((prev) => ({ ...prev, status: 'finished' }));
    setSelected(null);
  };

  const boardWon = isWon(state.grid);
  const canFinish = state.status === 'playing' && (boardWon || state.redealsLeft <= 0);
  const scorePercent = getScorePercent(state.grid);

  const { highlightedDestinations, highlightedSources, movableSet } = useMemo(() => {
    let destinations: Position[] = [];
    let sources: Position[] = [];
    if (selected !== null) {
      const cell = state.grid[selected.row][selected.col];
      if (cell !== null) {
        destinations = getDestinationsForCard(state.grid, selected.row, selected.col);
      } else {
        sources = getSourcesForGap(state.grid, selected.row, selected.col);
      }
    }
    const movable = new Set<string>();
    if (selected === null) {
      for (const p of getMovableCards(state.grid)) {
        movable.add(`${p.row}-${p.col}`);
      }
    }
    return {
      highlightedDestinations: destinations,
      highlightedSources: sources,
      movableSet: movable,
    };
  }, [state.grid, selected]);

  return {
    state,
    selected,
    highlightedDestinations,
    highlightedSources,
    movableSet,
    boardWon,
    canFinish,
    scorePercent,
    handleClick,
    newGame,
    redeal,
    finishGame,
  };
};
