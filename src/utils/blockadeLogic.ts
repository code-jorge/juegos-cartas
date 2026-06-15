import type { BlockadeGameState, Card, Foundation, Pile } from '../types/blockade';
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

/**
 * A movable chunk: cards from `index` to the top of the column form a run of the
 * same suit, descending by one (e.g. 9♥ 8♥ 7♥). A single card is a run of one.
 */
export const isMovableRun = (pile: Pile, index: number): boolean => {
  if (index < 0 || index >= pile.length) return false;
  for (let k = index; k < pile.length - 1; k++) {
    if (pile[k].suit !== pile[k + 1].suit || pile[k + 1].rank !== pile[k].rank - 1) {
      return false;
    }
  }
  return true;
};

const canStartFoundation = (card: Card, foundation: Foundation): boolean => {
  const top = topCard(foundation);
  if (!top) return card.rank === 1; // only an Ace starts a foundation
  return top.suit === card.suit && card.rank === top.rank + 1;
};

/**
 * Legal destinations for the chunk that starts at `index` in column `col`.
 * Foundations only accept a single card; runs longer than one go to the tableau.
 */
export const getGroupDestinations = (
  state: BlockadeGameState,
  col: number,
  index: number,
): Dest[] => {
  const pile = state.tableau[col];
  if (!isMovableRun(pile, index)) return [];

  const head = pile[index];
  const size = pile.length - index;
  const dests: Dest[] = [];

  // Foundations only take one card at a time. For an Ace, surface a single
  // empty slot (the empty foundations are interchangeable).
  if (size === 1) {
    let emptyFoundationOffered = false;
    for (let i = 0; i < state.foundations.length; i++) {
      const foundation = state.foundations[i];
      if (!canStartFoundation(head, foundation)) continue;
      if (foundation.length === 0) {
        if (emptyFoundationOffered) continue;
        emptyFoundationOffered = true;
      }
      dests.push({ type: 'foundation', index: i });
    }
  }

  // Tableau builds DOWN by suit; the head card lands on a card one rank higher.
  // An empty column (only possible once the stock is gone) takes any card or run;
  // surface a single one to avoid cluttering the board with identical options.
  let emptyColumnOffered = false;
  for (let c = 0; c < state.tableau.length; c++) {
    if (c === col) continue;
    const dst = state.tableau[c];
    if (dst.length === 0) {
      if (emptyColumnOffered) continue;
      emptyColumnOffered = true;
      dests.push({ type: 'tableau', col: c });
      continue;
    }
    const top = topCard(dst) as Card;
    if (top.suit === head.suit && top.rank === head.rank + 1) {
      dests.push({ type: 'tableau', col: c });
    }
  }

  return dests;
};

export const applyMove = (
  state: BlockadeGameState,
  col: number,
  index: number,
  dest: Dest,
): BlockadeGameState => {
  const next = cloneState(state);
  const group = next.tableau[col].splice(index);
  if (group.length === 0) return next;
  if (dest.type === 'foundation') next.foundations[dest.index].push(group[0]);
  else next.tableau[dest.col].push(...group);
  return next;
};

/**
 * Tableau columns that can receive the top card of a foundation, so a card can
 * be peeled back into the game. Builds DOWN by suit; an empty column takes any
 * card (only possible once the stock is gone). A single empty column is offered.
 */
export const getFoundationCardDestinations = (
  state: BlockadeGameState,
  fIndex: number,
): number[] => {
  const card = topCard(state.foundations[fIndex]);
  if (!card) return [];
  const cols: number[] = [];
  let emptyColumnOffered = false;
  for (let c = 0; c < state.tableau.length; c++) {
    const dst = state.tableau[c];
    if (dst.length === 0) {
      if (emptyColumnOffered) continue;
      emptyColumnOffered = true;
      cols.push(c);
      continue;
    }
    const top = topCard(dst) as Card;
    if (top.suit === card.suit && top.rank === card.rank + 1) cols.push(c);
  }
  return cols;
};

/** Move the top card of a foundation back onto a tableau column. */
export const applyFoundationMove = (
  state: BlockadeGameState,
  fIndex: number,
  destCol: number,
): BlockadeGameState => {
  const next = cloneState(state);
  const card = next.foundations[fIndex].pop();
  if (!card) return next;
  next.tableau[destCol].push(card);
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

/** Enforce the "blockade" rule: empty columns are refilled at once from the stock. */
export const settle = (state: BlockadeGameState): BlockadeGameState => {
  const next = cloneState(state);
  for (let c = 0; c < NUM_COLUMNS; c++) {
    if (next.tableau[c].length === 0 && next.stock.length > 0) {
      next.tableau[c].push(next.stock.shift() as Card);
    }
  }
  return next;
};

export const cardsOnFoundations = (state: BlockadeGameState): number =>
  state.foundations.reduce((sum, f) => sum + f.length, 0);

export const isWon = (state: BlockadeGameState): boolean =>
  cardsOnFoundations(state) === TOTAL_CARDS;

/**
 * Keys ("col-index") of every card that can currently move. For each column we
 * find the deepest run-head that has a legal move and highlight the whole chunk
 * from there to the top, so a movable group lights up as a single unit.
 */
export const getMovableCardKeys = (state: BlockadeGameState): Set<string> => {
  const keys = new Set<string>();
  for (let c = 0; c < NUM_COLUMNS; c++) {
    const pile = state.tableau[c];
    let groupStart = -1;
    for (let i = pile.length - 1; i >= 0; i--) {
      if (!isMovableRun(pile, i)) break; // deeper cards can't form a run either
      if (getGroupDestinations(state, c, i).length > 0) groupStart = i;
    }
    if (groupStart >= 0) {
      for (let i = groupStart; i < pile.length; i++) keys.add(`${c}-${i}`);
    }
  }
  return keys;
};

export const hasAnyMove = (state: BlockadeGameState): boolean =>
  getMovableCardKeys(state).size > 0;

/** Stuck = nothing to move and no cards left to deal. */
export const isStuck = (state: BlockadeGameState): boolean =>
  state.stock.length === 0 && !hasAnyMove(state);

/** Settle the board, then resolve win/loss status. */
export const progress = (state: BlockadeGameState): BlockadeGameState => {
  const settled = settle(state);
  if (isWon(settled)) return { ...settled, status: 'won' };
  if (isStuck(settled)) return { ...settled, status: 'lost' };
  return settled;
};

export const getScorePercent = (state: BlockadeGameState): number =>
  Math.round((cardsOnFoundations(state) / TOTAL_CARDS) * 100);
