export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type Pile = Card[];

/** A foundation pile is built up by suit from Ace (1) to King (13). */
export type Foundation = Card[];

export type BlockadeStatus = 'playing' | 'won' | 'lost';

export interface BlockadeGameState {
  tableau: Pile[];
  foundations: Foundation[];
  stock: Card[];
  status: BlockadeStatus;
  moves: number;
  deals: number;
}

export const NUM_COLUMNS = 12;
export const NUM_FOUNDATIONS = 8;
export const TOTAL_CARDS = 104;

export interface BlockadeSettings {
  /** Automatically send Aces that reach the top of a column to the foundations. */
  autoPlayAces: boolean;
}
