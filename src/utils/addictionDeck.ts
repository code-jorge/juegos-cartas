import type { Cell, FrenchCard, FrenchRank, FrenchSuit, Grid } from '../types/addiction';
import { COLS, ROWS } from '../types/addiction';

const SUITS: FrenchSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const createDeck = (): FrenchCard[] => {
  const deck: FrenchCard[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 13; rank++) {
      deck.push({ suit, rank: rank as FrenchRank });
    }
  }
  return deck;
};

export const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const dealInitial = (): Grid => {
  const cells: Cell[] = [...createDeck(), null, null, null, null];
  const shuffled = shuffle(cells);
  const grid: Grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push(shuffled.slice(r * COLS, (r + 1) * COLS));
  }
  return grid;
};
