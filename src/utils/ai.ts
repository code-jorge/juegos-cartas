import type { Card, Difficulty, Player } from '../types';
import { findCaptureCombinations } from './gameLogic';
import { getCardPoints } from './deck';

export interface AIMove {
  cardToPlay: Card;
  cardsToCapture: Card[];
}

const isSieteDeOros = (card: Card): boolean =>
  card.suit === 'oros' && card.value === 7;

const isSeven = (card: Card): boolean => card.value === 7;

const isOros = (card: Card): boolean => card.suit === 'oros';

const getTableSum = (tableCards: Card[]): number =>
  tableCards.reduce((sum, card) => sum + getCardPoints(card), 0);

// Easy: Play a random card, but capture if possible with that card
const getEasyMove = (hand: Card[], tableCards: Card[]): AIMove => {
  const randomIndex = Math.floor(Math.random() * hand.length);
  const selectedCard = hand[randomIndex];

  // Check if this random card can capture anything
  const combinations = findCaptureCombinations(selectedCard, tableCards);

  if (combinations.length > 0) {
    // Pick a random capture combination
    const randomCombo = combinations[Math.floor(Math.random() * combinations.length)];
    return {
      cardToPlay: selectedCard,
      cardsToCapture: randomCombo,
    };
  }

  // No captures possible with this card, just drop it
  return {
    cardToPlay: selectedCard,
    cardsToCapture: [],
  };
};

// Medium: Capture when possible, random selection
const getMediumMove = (hand: Card[], tableCards: Card[]): AIMove => {
  const possibleMoves: AIMove[] = [];

  for (const card of hand) {
    const combinations = findCaptureCombinations(card, tableCards);
    for (const combo of combinations) {
      possibleMoves.push({
        cardToPlay: card,
        cardsToCapture: combo,
      });
    }
  }

  if (possibleMoves.length > 0) {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }

  const randomCardIndex = Math.floor(Math.random() * hand.length);
  return {
    cardToPlay: hand[randomCardIndex],
    cardsToCapture: [],
  };
};

// Score a capture move for hard difficulty
const scoreCaptureMove = (
  cardPlayed: Card,
  capturedCards: Card[],
  tableCards: Card[]
): number => {
  const allCaptured = [cardPlayed, ...capturedCards];
  let score = 0;

  // Highest priority: capturing 7 de oros (1000 points)
  if (allCaptured.some(isSieteDeOros)) {
    score += 1000;
  }

  // Second priority: escoba (500 points)
  const isEscoba = capturedCards.length === tableCards.length;
  if (isEscoba) {
    score += 500;
  }

  // Third priority: capturing 7s (50 points each)
  const sevensCount = allCaptured.filter(isSeven).length;
  score += sevensCount * 50;

  // Fourth priority: capturing oros (20 points each)
  const orosCount = allCaptured.filter(isOros).length;
  score += orosCount * 20;

  // Fifth priority: capturing more cards (1 point each)
  score += allCaptured.length;

  return score;
};

// Score a drop move for hard difficulty (higher score = better card to drop)
const scoreDropMove = (
  card: Card,
  tableCards: Card[]
): number => {
  let score = 0;
  const tableSum = getTableSum(tableCards);
  const newTableSum = tableSum + getCardPoints(card);

  // Prefer leaving table in "safe" state (sum < 4 or sum > 15)
  // This prevents opponent from making escoba with a single card
  if (newTableSum < 4 || newTableSum > 15) {
    score += 100;
  }

  // Heavily penalize dropping valuable cards
  // 7 de oros is most valuable to keep (-1000)
  if (isSieteDeOros(card)) {
    score -= 1000;
  }
  // 7s are valuable (-100)
  else if (isSeven(card)) {
    score -= 100;
  }
  // Oros are valuable (-50)
  else if (isOros(card)) {
    score -= 50;
  }

  return score;
};

// Hard: Strategic play with prioritization
const getHardMove = (hand: Card[], tableCards: Card[]): AIMove => {
  // Find all possible capture moves
  const captureMoves: { move: AIMove; score: number }[] = [];

  for (const card of hand) {
    const combinations = findCaptureCombinations(card, tableCards);
    for (const combo of combinations) {
      const move: AIMove = {
        cardToPlay: card,
        cardsToCapture: combo,
      };
      const score = scoreCaptureMove(card, combo, tableCards);
      captureMoves.push({ move, score });
    }
  }

  // If captures are available, pick the best one
  if (captureMoves.length > 0) {
    captureMoves.sort((a, b) => b.score - a.score);
    return captureMoves[0].move;
  }

  // No captures possible - choose the best card to drop
  const dropMoves = hand.map((card) => ({
    card,
    score: scoreDropMove(card, tableCards),
  }));

  dropMoves.sort((a, b) => b.score - a.score);

  return {
    cardToPlay: dropMoves[0].card,
    cardsToCapture: [],
  };
};

export const getAIMove = (
  player: Player,
  tableCards: Card[],
  difficulty: Difficulty
): AIMove => {
  const hand = player.hand;

  switch (difficulty) {
    case 'easy':
      return getEasyMove(hand, tableCards);
    case 'medium':
      return getMediumMove(hand, tableCards);
    case 'hard':
      return getHardMove(hand, tableCards);
    default:
      return getMediumMove(hand, tableCards);
  }
};
