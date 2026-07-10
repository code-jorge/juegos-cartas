import type { Card, CrescentGameState, Foundation, Pile, Suit } from '../types/crescent';
import { CARDS_PER_PILE, NUM_PILES, TOTAL_CARDS } from '../types/crescent';
import { createDoubleDeck, shuffle } from './crescentDeck';

/** A spot a card can be lifted from or dropped onto. */
export type Spot =
  | { type: 'pile'; index: number }
  | { type: 'foundation'; index: number };

export const sameSpot = (a: Spot, b: Spot): boolean => a.type === b.type && a.index === b.index;

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const topCard = (cards: Card[]): Card | null =>
  cards.length > 0 ? cards[cards.length - 1] : null;

const cloneState = (s: CrescentGameState): CrescentGameState => ({
  piles: s.piles.map((p) => [...p]),
  foundations: s.foundations.map((f) => ({ ...f, cards: [...f.cards] })),
  reshufflesTotal: s.reshufflesTotal,
  reshufflesUsed: s.reshufflesUsed,
  status: s.status,
  moves: s.moves,
});

export const reshufflesLeft = (s: CrescentGameState): number =>
  s.reshufflesTotal - s.reshufflesUsed; // Infinity - n stays Infinity

/**
 * Pull one Ace and one King of each suit out of the double deck as foundation
 * bases; the remaining 96 cards form 16 crescent piles of 6.
 */
export const dealInitialState = (reshuffles: number): CrescentGameState => {
  const deck = shuffle(createDoubleDeck());
  const foundations: Foundation[] = [];
  for (const kind of ['ace', 'king'] as const) {
    const baseRank = kind === 'ace' ? 1 : 13;
    for (const suit of SUITS) {
      const i = deck.findIndex((c) => c.suit === suit && c.rank === baseRank);
      foundations.push({ kind, suit, cards: deck.splice(i, 1) });
    }
  }
  const piles: Pile[] = Array.from({ length: NUM_PILES }, (_, i) =>
    deck.slice(i * CARDS_PER_PILE, (i + 1) * CARDS_PER_PILE),
  );
  return {
    piles,
    foundations,
    reshufflesTotal: reshuffles,
    reshufflesUsed: 0,
    status: 'playing',
    moves: 0,
  };
};

/**
 * Crescent piles build up OR down by suit, and the sequence wraps around:
 * a King and an Ace of the same suit are consecutive. Empty piles are dead —
 * they cannot be refilled.
 */
export const canDropOnPile = (card: Card, pile: Pile): boolean => {
  const top = topCard(pile);
  if (!top || top.suit !== card.suit) return false;
  const diff = (card.rank - top.rank + 13) % 13;
  return diff === 1 || diff === 12;
};

export const canDropOnFoundation = (card: Card, foundation: Foundation): boolean => {
  const top = topCard(foundation.cards) as Card; // the base card is always there
  if (card.suit !== foundation.suit) return false;
  return foundation.kind === 'ace' ? card.rank === top.rank + 1 : card.rank === top.rank - 1;
};

export const getCardAt = (state: CrescentGameState, spot: Spot): Card | null =>
  spot.type === 'pile'
    ? topCard(state.piles[spot.index])
    : topCard(state.foundations[spot.index].cards);

/** Pile tops can always be lifted; foundation base cards never leave. */
export const canPickUp = (state: CrescentGameState, spot: Spot): boolean =>
  spot.type === 'pile'
    ? state.piles[spot.index].length > 0
    : state.foundations[spot.index].cards.length > 1;

/**
 * Legal destinations for the card at `source`. Pile cards can go to piles or
 * foundations; a foundation's top card may only hop to the other foundation of
 * its suit (never back to the crescent).
 */
export const getTargets = (state: CrescentGameState, source: Spot): Spot[] => {
  if (!canPickUp(state, source)) return [];
  const card = getCardAt(state, source) as Card;
  const targets: Spot[] = [];
  for (let i = 0; i < state.foundations.length; i++) {
    if (source.type === 'foundation' && source.index === i) continue;
    if (canDropOnFoundation(card, state.foundations[i])) {
      targets.push({ type: 'foundation', index: i });
    }
  }
  if (source.type === 'pile') {
    for (let i = 0; i < state.piles.length; i++) {
      if (i === source.index) continue;
      if (canDropOnPile(card, state.piles[i])) targets.push({ type: 'pile', index: i });
    }
  }
  return targets;
};

export const isLegalMove = (state: CrescentGameState, source: Spot, target: Spot): boolean => {
  if (!canPickUp(state, source) || sameSpot(source, target)) return false;
  const card = getCardAt(state, source) as Card;
  if (target.type === 'foundation') return canDropOnFoundation(card, state.foundations[target.index]);
  if (source.type === 'foundation') return false;
  return canDropOnPile(card, state.piles[target.index]);
};

export const applyMove = (
  state: CrescentGameState,
  source: Spot,
  target: Spot,
): CrescentGameState => {
  const next = cloneState(state);
  const from = source.type === 'pile' ? next.piles[source.index] : next.foundations[source.index].cards;
  const card = from.pop();
  if (!card) return next;
  const to = target.type === 'pile' ? next.piles[target.index] : next.foundations[target.index].cards;
  to.push(card);
  next.moves += 1;
  return next;
};

/** A reshuffle sends the bottom card of every crescent pile to the top of that pile. */
export const applyReshuffle = (state: CrescentGameState): CrescentGameState => {
  const next = cloneState(state);
  for (const pile of next.piles) {
    if (pile.length >= 2) pile.push(pile.shift() as Card);
  }
  next.reshufflesUsed += 1;
  return next;
};

export const cardsOnFoundations = (state: CrescentGameState): number =>
  state.foundations.reduce((sum, f) => sum + f.cards.length, 0);

export const isWon = (state: CrescentGameState): boolean =>
  cardsOnFoundations(state) === TOTAL_CARDS;

export const hasAnyMove = (state: CrescentGameState): boolean => {
  for (let i = 0; i < state.piles.length; i++) {
    if (getTargets(state, { type: 'pile', index: i }).length > 0) return true;
  }
  for (let i = 0; i < state.foundations.length; i++) {
    if (getTargets(state, { type: 'foundation', index: i }).length > 0) return true;
  }
  return false;
};

/** Stuck = nothing to move and no reshuffles left to change that. */
export const isStuck = (state: CrescentGameState): boolean =>
  reshufflesLeft(state) <= 0 && !hasAnyMove(state);

export const resolveStatus = (state: CrescentGameState): CrescentGameState => {
  if (isWon(state)) return { ...state, status: 'won' };
  if (isStuck(state)) return { ...state, status: 'lost' };
  return state;
};

export const getScorePercent = (state: CrescentGameState): number =>
  Math.round((cardsOnFoundations(state) / TOTAL_CARDS) * 100);
