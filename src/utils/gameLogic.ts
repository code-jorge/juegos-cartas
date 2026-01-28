import type { Card, CaptureResult, GameState, Player } from '../types';
import { getCardPoints } from './deck';

const TARGET_SUM = 15;

// Find all possible combinations of table cards that sum to target with the played card
export const findCaptureCombinations = (
  playedCard: Card,
  tableCards: Card[]
): Card[][] => {
  const playedValue = getCardPoints(playedCard);
  const targetRemaining = TARGET_SUM - playedValue;

  if (targetRemaining < 0) return [];
  if (targetRemaining === 0) return [[]]; // Card alone makes 15

  const combinations: Card[][] = [];

  // Generate all subsets of table cards
  const n = tableCards.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const subset: Card[] = [];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(tableCards[i]);
        sum += getCardPoints(tableCards[i]);
      }
    }
    if (sum === targetRemaining) {
      combinations.push(subset);
    }
  }

  return combinations;
}

// Check if a capture is valid
export const isValidCapture = (
  playedCard: Card,
  selectedTableCards: Card[],
  tableCards: Card[]
): boolean => {
  // Verify all selected cards are on the table
  const tableCardIds = new Set(tableCards.map((c) => c.id));
  for (const card of selectedTableCards) {
    if (!tableCardIds.has(card.id)) return false;
  }

  // Check if sum equals 15
  const sum =
    getCardPoints(playedCard) +
    selectedTableCards.reduce((acc, c) => acc + getCardPoints(c), 0);

  return sum === TARGET_SUM;
}

// Execute a capture
export const executeCapture = (
  playedCard: Card,
  selectedTableCards: Card[],
  tableCards: Card[]
): CaptureResult => {
  const capturedCards = [playedCard, ...selectedTableCards];
  const remainingTable = tableCards.filter(
    (c) => !selectedTableCards.some((sc) => sc.id === c.id)
  );
  const isEscoba = remainingTable.length === 0;

  return { capturedCards, isEscoba };
}

// Calculate round scores
export const calculateRoundScores = (players: Player[]): Record<string, number> => {
  const scores: Record<string, number> = {};

  // Initialize scores
  for (const player of players) {
    scores[player.id] = 0;
  }

  // 1. Escobas (1 point each)
  for (const player of players) {
    scores[player.id] += player.escobas;
  }

  // 2. Most cards (1 point) - tie = no points
  const cardCounts = players.map((p) => ({
    id: p.id,
    count: p.captured.length,
  }));
  const maxCards = Math.max(...cardCounts.map((c) => c.count));
  const playersWithMax = cardCounts.filter((c) => c.count === maxCards);
  if (playersWithMax.length === 1) {
    scores[playersWithMax[0].id] += 1;
  }

  // 3. Most oros (1 point) - tie = no points
  const orosCounts = players.map((p) => ({
    id: p.id,
    count: p.captured.filter((c) => c.suit === 'oros').length,
  }));
  const maxOros = Math.max(...orosCounts.map((c) => c.count));
  const playersWithMaxOros = orosCounts.filter((c) => c.count === maxOros);
  if (playersWithMaxOros.length === 1) {
    scores[playersWithMaxOros[0].id] += 1;
  }

  // 4. Siete de velo (7 de oros) - 1 point
  for (const player of players) {
    if (player.captured.some((c) => c.suit === 'oros' && c.value === 7)) {
      scores[player.id] += 1;
      break;
    }
  }

  // 5. Most 7s (la setenta) - 1 point - tie = no points
  const sevenCounts = players.map((p) => ({
    id: p.id,
    count: p.captured.filter((c) => c.value === 7).length,
  }));
  const maxSevens = Math.max(...sevenCounts.map((c) => c.count));
  const playersWithMaxSevens = sevenCounts.filter((c) => c.count === maxSevens);
  if (playersWithMaxSevens.length === 1) {
    scores[playersWithMaxSevens[0].id] += 1;
  }

  return scores;
}

// Check if game is over
export const isGameOver = (state: GameState): boolean => {
  return Object.values(state.scores).some((s) => s >= state.targetScore);
}

// Check if round is over (all hands empty and deck empty)
export const isRoundOver = (state: GameState): boolean => {
  const allHandsEmpty = state.players.every((p) => p.hand.length === 0);
  const deckEmpty = state.deck.length === 0;
  return allHandsEmpty && deckEmpty;
}

// Deal cards to players
export const dealCards = (state: GameState): GameState => {
  const newState = { ...state };
  const newDeck = [...state.deck];
  const newPlayers = state.players.map((p) => ({ ...p, hand: [...p.hand] }));

  // Deal 3 cards to each player
  for (const player of newPlayers) {
    for (let i = 0; i < 3 && newDeck.length > 0; i++) {
      player.hand.push(newDeck.pop()!);
    }
  }

  return {
    ...newState,
    deck: newDeck,
    players: newPlayers,
  };
}

// At end of round, remaining table cards go to last capturing player
export const assignRemainingCards = (state: GameState): GameState => {
  if (state.lastCapturingPlayerIndex === null || state.table.length === 0) {
    return state;
  }

  const newPlayers = state.players.map((p, i) => {
    if (i === state.lastCapturingPlayerIndex) {
      return {
        ...p,
        captured: [...p.captured, ...state.table],
      };
    }
    return p;
  });

  return {
    ...state,
    players: newPlayers,
    table: [],
  };
}
