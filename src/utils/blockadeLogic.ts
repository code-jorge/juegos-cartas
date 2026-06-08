import type {
  BlockadeGameState,
  BlockadeSettings,
  Card,
  Foundation,
  Pile,
} from '../types/blockade';
import { NUM_COLUMNS, NUM_FOUNDATIONS, TOTAL_CARDS } from '../types/blockade';
import { createDoubleDeck, shuffle } from './blockadeDeck';

export type Dest =
  | { type: 'tableau'; col: number }
  | { type: 'foundation'; index: number };

export const topCard = (pile: Card[]): Card | null =>
  pile.length > 0 ? pile[pile.length - 1] : null;

const cloneState = (s: BlockadeGameState): BlockadeGameState => ({
  tableau: s.tableau.map((p) => [...p]),
  foundations: s.foundations.map((f) => [...f]),
  stock: [...s.stock],
  status: s.status,
  moves: s.moves,
  deals: s.deals,
});

/** Deal one card to each of the 12 columns; the rest forms the stock. */
export const dealInitialState = (): BlockadeGameState => {
  const deck = shuffle(createDoubleDeck());
  const tableau: Pile[] = Array.from({ length: NUM_COLUMNS }, (_, i) => [deck[i]]);
  const stock = deck.slice(NUM_COLUMNS);
  const foundations: Foundation[] = Array.from({ length: NUM_FOUNDATIONS }, () => []);
  return { tableau, foundations, stock, status: 'playing', moves: 0, deals: 0 };
};

const canPlaceOnFoundation = (card: Card, foundation: Foundation): boolean => {
  const top = topCard(foundation);
  if (!top) return card.rank === 1; // only an Ace starts a foundation
  return top.suit === card.suit && card.rank === top.rank + 1;
};

/** Tableau builds DOWN by suit. Empty columns can't be filled by the player. */
const canPlaceOnTableau = (card: Card, pile: Pile): boolean => {
  const top = topCard(pile);
  if (!top) return false;
  return top.suit === card.suit && card.rank === top.rank - 1;
};

/** Legal destinations for the top card of the given column. */
export const getDestinations = (state: BlockadeGameState, col: number): Dest[] => {
  const card = topCard(state.tableau[col]);
  if (!card) return [];

  const dests: Dest[] = [];

  // Foundations. For an Ace only surface a single empty slot (they're interchangeable).
  let emptyFoundationOffered = false;
  for (let i = 0; i < state.foundations.length; i++) {
    const foundation = state.foundations[i];
    if (!canPlaceOnFoundation(card, foundation)) continue;
    if (foundation.length === 0) {
      if (emptyFoundationOffered) continue;
      emptyFoundationOffered = true;
    }
    dests.push({ type: 'foundation', index: i });
  }

  // Tableau columns (build down by suit).
  for (let c = 0; c < state.tableau.length; c++) {
    if (c === col) continue;
    if (canPlaceOnTableau(card, state.tableau[c])) dests.push({ type: 'tableau', col: c });
  }

  return dests;
};

export const applyMove = (
  state: BlockadeGameState,
  col: number,
  dest: Dest,
): BlockadeGameState => {
  const next = cloneState(state);
  const card = next.tableau[col].pop();
  if (!card) return next;
  if (dest.type === 'foundation') next.foundations[dest.index].push(card);
  else next.tableau[dest.col].push(card);
  return next;
};

/** Deal one stock card on top of each column, left to right, while cards remain. */
export const dealRow = (state: BlockadeGameState): BlockadeGameState => {
  const next = cloneState(state);
  if (next.stock.length === 0) return next;
  for (let c = 0; c < NUM_COLUMNS && next.stock.length > 0; c++) {
    next.tableau[c].push(next.stock.shift() as Card);
  }
  next.deals += 1;
  return next;
};

const fillEmptyColumns = (state: BlockadeGameState): boolean => {
  let changed = false;
  for (let c = 0; c < NUM_COLUMNS; c++) {
    if (state.tableau[c].length === 0 && state.stock.length > 0) {
      state.tableau[c].push(state.stock.shift() as Card);
      changed = true;
    }
  }
  return changed;
};

const autoPlayAces = (state: BlockadeGameState): boolean => {
  let changed = false;
  for (let c = 0; c < NUM_COLUMNS; c++) {
    const top = topCard(state.tableau[c]);
    if (!top || top.rank !== 1) continue;
    const slot = state.foundations.findIndex((f) => f.length === 0);
    if (slot === -1) continue;
    state.foundations[slot].push(state.tableau[c].pop() as Card);
    changed = true;
  }
  return changed;
};

/**
 * Enforce the "blockade" rule: empty columns are filled immediately from the
 * stock. Optionally cascade Aces to the foundations (which can re-open columns).
 */
export const settle = (
  state: BlockadeGameState,
  settings: BlockadeSettings,
): BlockadeGameState => {
  const next = cloneState(state);
  let changed = true;
  while (changed) {
    changed = false;
    if (fillEmptyColumns(next)) changed = true;
    if (settings.autoPlayAces && autoPlayAces(next)) changed = true;
  }
  return next;
};

export const cardsOnFoundations = (state: BlockadeGameState): number =>
  state.foundations.reduce((sum, f) => sum + f.length, 0);

export const isWon = (state: BlockadeGameState): boolean =>
  cardsOnFoundations(state) === TOTAL_CARDS;

export const hasAnyMove = (state: BlockadeGameState): boolean => {
  for (let c = 0; c < NUM_COLUMNS; c++) {
    if (getDestinations(state, c).length > 0) return true;
  }
  return false;
};

/** Stuck = nothing to move and no cards left to deal. */
export const isStuck = (state: BlockadeGameState): boolean =>
  state.stock.length === 0 && !hasAnyMove(state);

export const getMovableColumns = (state: BlockadeGameState): number[] => {
  const cols: number[] = [];
  for (let c = 0; c < NUM_COLUMNS; c++) {
    if (getDestinations(state, c).length > 0) cols.push(c);
  }
  return cols;
};

/** Settle the board, then resolve win/loss status. */
export const progress = (
  state: BlockadeGameState,
  settings: BlockadeSettings,
): BlockadeGameState => {
  const settled = settle(state, settings);
  if (isWon(settled)) return { ...settled, status: 'won' };
  if (isStuck(settled)) return { ...settled, status: 'lost' };
  return settled;
};

export const getScorePercent = (state: BlockadeGameState): number =>
  Math.round((cardsOnFoundations(state) / TOTAL_CARDS) * 100);
