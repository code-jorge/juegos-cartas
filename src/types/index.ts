// Spanish deck suits
export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos';

// Card values: 1-10 (8=sota, 9=caballo, 10=rey)
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Card {
  id: string;
  suit: Suit;
  value: CardValue;
}

export type Difficulty = 'easy' | 'hard';

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  hand: Card[];
  captured: Card[];
  escobas: number;
}

export interface GameSettings {
  playerName: string;
  numOpponents: 1 | 2 | 3;
  difficulty: Difficulty;
  userHints: boolean;
}

export type GamePhase = 'setup' | 'playing' | 'roundEnd' | 'gameEnd';

export interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  players: Player[];
  deck: Card[];
  table: Card[];
  currentPlayerIndex: number;
  lastCapturingPlayerIndex: number | null;
  scores: Record<string, number>;
  roundNumber: number;
  targetScore: number;
  roundStarterIndex: number;
}

export interface CaptureResult {
  capturedCards: Card[];
  isEscoba: boolean;
}

export type AIAnimationPhase = 'cardPlayed' | 'capturing' | 'settling' | 'done';

export interface AIPlayAnimation {
  playerName: string;
  cardPlayed: Card;
  capturedCards: Card[];
  isEscoba: boolean;
  phase: AIAnimationPhase;
}
