export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type Pile = Card[];

export type FoundationKind = 'ace' | 'king';

/**
 * Each foundation is seeded with its base card (an Ace or a King): ace
 * foundations build UP to the King, king foundations build DOWN to the Ace,
 * always by suit. The base card never leaves the foundation.
 */
export interface Foundation {
  kind: FoundationKind;
  suit: Suit;
  cards: Card[];
}

export type CrescentStatus = 'playing' | 'won' | 'lost';

export interface CrescentGameState {
  /** 16 crescent piles: 0–7 form the top arc, 8–15 the bottom arc. */
  piles: Pile[];
  /** 8 foundations: 0–3 are the ace foundations, 4–7 the king foundations. */
  foundations: Foundation[];
  reshufflesTotal: number;
  reshufflesUsed: number;
  status: CrescentStatus;
  moves: number;
}

export const NUM_PILES = 16;
export const PILES_PER_ARC = 8;
export const CARDS_PER_PILE = 6;
export const TOTAL_CARDS = 104;
export const UNDO_LIMIT = 5;

export type ReshufflesOption = 3 | 5 | typeof Infinity;

export interface CrescentSettings {
  reshuffles: ReshufflesOption;
}
