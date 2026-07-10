import type { Card, Rank, Suit } from '../types/crescent';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Crescent is played with two full 52-card decks (104 cards). */
export const createDoubleDeck = (): Card[] => {
  const deck: Card[] = [];
  for (let copy = 0; copy < 2; copy++) {
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({ id: `${suit}-${rank}-${copy}`, suit, rank: rank as Rank });
      }
    }
  }
  return deck;
};
