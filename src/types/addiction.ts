export type FrenchSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type FrenchRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface FrenchCard {
  suit: FrenchSuit;
  rank: FrenchRank;
}

export type Cell = FrenchCard | null;

export type Grid = Cell[][];

export interface Position {
  row: number;
  col: number;
}

export type AddictionStatus = 'playing' | 'won' | 'lost';

export interface AddictionGameState {
  grid: Grid;
  redealsLeft: number;
  redealsTotal: number;
  status: AddictionStatus;
  moves: number;
}

export const ROWS = 4;
export const COLS = 13;

export type ReshufflesOption = 2 | 3 | typeof Infinity;

export interface AddictionSettings {
  initialReshuffles: ReshufflesOption;
}
