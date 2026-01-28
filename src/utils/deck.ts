import type { Card, CardValue, Suit } from '../types';

const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        id: `${suit}-${value}`,
        suit,
        value,
      });
    }
  }
  return deck;
}

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get the point value for escoba calculation (face cards = 10)
export const getCardPoints = (card: Card): number => {
  return card.value;
}

export const getCardDisplayName = (card: Card): string => {
  const valueNames: Record<CardValue, string> = {
    1: 'As',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: 'Sota',
    9: 'Caballo',
    10: 'Rey',
  };

  const suitNames: Record<Suit, string> = {
    oros: 'Oros',
    copas: 'Copas',
    espadas: 'Espadas',
    bastos: 'Bastos',
  };

  return `${valueNames[card.value]} de ${suitNames[card.suit]}`;
}
