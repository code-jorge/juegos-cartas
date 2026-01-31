import type { Card, Difficulty, Player } from '../types';
import { findCaptureCombinations } from './gameLogic';

export interface AIMove {
  cardToPlay: Card;
  cardsToCapture: Card[];
}


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

// Hard: Capture when possible, random selection among available captures
const getHardMove = (hand: Card[], tableCards: Card[]): AIMove => {
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

export const getAIMove = (
  player: Player,
  tableCards: Card[],
  difficulty: Difficulty
): AIMove => {
  const hand = player.hand;

  switch (difficulty) {
    case 'easy':
      return getEasyMove(hand, tableCards);
    case 'hard':
      return getHardMove(hand, tableCards);
    default:
      return getHardMove(hand, tableCards);
  }
};
