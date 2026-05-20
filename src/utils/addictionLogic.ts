import type { Cell, FrenchCard, FrenchRank, Grid, Position } from '../types/addiction';
import { COLS, ROWS } from '../types/addiction';
import { shuffle } from './addictionDeck';

type GapRequirement =
  | { kind: 'any-2' }
  | { kind: 'specific'; card: FrenchCard }
  | null;

export const getGapRequirement = (grid: Grid, row: number, col: number): GapRequirement => {
  if (grid[row][col] !== null) return null;
  if (col === 0) return { kind: 'any-2' };
  const left = grid[row][col - 1];
  if (left === null) return null;
  if (left.rank === 13) return null;
  return {
    kind: 'specific',
    card: { suit: left.suit, rank: (left.rank + 1) as FrenchRank },
  };
};

const findAll = (grid: Grid, predicate: (card: FrenchCard) => boolean): Position[] => {
  const positions: Position[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (cell && predicate(cell)) positions.push({ row: r, col: c });
    }
  }
  return positions;
};

export const getSourcesForGap = (grid: Grid, gapRow: number, gapCol: number): Position[] => {
  const req = getGapRequirement(grid, gapRow, gapCol);
  if (!req) return [];
  if (req.kind === 'any-2') {
    return findAll(grid, (card) => card.rank === 2);
  }
  return findAll(grid, (card) => card.suit === req.card.suit && card.rank === req.card.rank);
};

export const getDestinationsForCard = (grid: Grid, row: number, col: number): Position[] => {
  const card = grid[row][col];
  if (!card) return [];
  const destinations: Position[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== null) continue;
      const req = getGapRequirement(grid, r, c);
      if (!req) continue;
      if (req.kind === 'any-2' && card.rank === 2) {
        destinations.push({ row: r, col: c });
      } else if (
        req.kind === 'specific' &&
        req.card.suit === card.suit &&
        req.card.rank === card.rank
      ) {
        destinations.push({ row: r, col: c });
      }
    }
  }
  return destinations;
};

export const getMovableCards = (grid: Grid): Position[] => {
  const positions: Position[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === null) continue;
      if (getDestinationsForCard(grid, r, c).length > 0) {
        positions.push({ row: r, col: c });
      }
    }
  }
  return positions;
};

export const applyMove = (grid: Grid, from: Position, to: Position): Grid => {
  const next = grid.map((row) => [...row]);
  next[to.row][to.col] = next[from.row][from.col];
  next[from.row][from.col] = null;
  return next;
};

const getFrozenPrefixLength = (grid: Grid, row: number): number => {
  const first = grid[row][0];
  if (!first || first.rank !== 2) return 0;
  const suit = first.suit;
  let len = 1;
  for (let c = 1; c < COLS; c++) {
    const card = grid[row][c];
    if (!card || card.suit !== suit || card.rank !== c + 2) break;
    len++;
  }
  return len;
};

export const isWon = (grid: Grid): boolean => {
  for (let r = 0; r < ROWS; r++) {
    if (getFrozenPrefixLength(grid, r) !== 12) return false;
    if (grid[r][COLS - 1] !== null) return false;
  }
  return true;
};

export const hasValidMoves = (grid: Grid): boolean => getMovableCards(grid).length > 0;

export const redeal = (grid: Grid): Grid => {
  const frozenLengths: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    frozenLengths.push(getFrozenPrefixLength(grid, r));
  }

  const loose: FrenchCard[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = frozenLengths[r]; c < COLS; c++) {
      const cell = grid[r][c];
      if (cell) loose.push(cell);
    }
  }

  const shuffled = shuffle(loose);
  const next: Grid = [];
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    const newRow: Cell[] = [];
    for (let c = 0; c < frozenLengths[r]; c++) {
      newRow.push(grid[r][c]);
    }
    newRow.push(null);
    while (newRow.length < COLS) {
      newRow.push(shuffled[idx++]);
    }
    next.push(newRow);
  }
  return next;
};
