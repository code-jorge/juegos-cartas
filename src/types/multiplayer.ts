import type { Card } from './index';

export type MultiplayerPhase = 'lobby' | 'playing' | 'roundEnd' | 'gameEnd' | 'expired' | 'disconnected';

export interface MultiplayerPlayer {
  id: string;
  name: string;
  joinToken: string;
  isReady: boolean;
  isConnected: boolean;
  lastSeen: number;
  hand: Card[];
  captured: Card[];
  escobas: number;
}

export interface MultiplayerGameState {
  gameId: string;
  phase: MultiplayerPhase;
  players: MultiplayerPlayer[];
  spectators: SpectatorInfo[];
  maxPlayers: 2 | 3 | 4;
  creatorId: string;
  deck: Card[];
  table: Card[];
  currentPlayerIndex: number;
  lastCapturingPlayerIndex: number | null;
  scores: Record<string, number>;
  roundNumber: number;
  targetScore: number;
  roundStarterIndex: number;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  version: number;
  disconnectedPlayerId?: string;
  disconnectedAt?: number;
}

export interface SpectatorInfo {
  id: string;
  name: string;
  joinToken: string;
  lastSeen: number;
}

export interface ClientPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isConnected: boolean;
  handSize: number;
  captured: Card[];
  escobas: number;
}

export interface ClientGameState {
  gameId: string;
  phase: MultiplayerPhase;
  players: ClientPlayer[];
  spectatorCount: number;
  maxPlayers: 2 | 3 | 4;
  creatorId: string;
  myHand: Card[];
  deckSize: number;
  table: Card[];
  currentPlayerIndex: number;
  lastCapturingPlayerIndex: number | null;
  scores: Record<string, number>;
  roundNumber: number;
  targetScore: number;
  roundStarterIndex: number;
  createdAt: number;
  expiresAt: number;
  version: number;
  isSpectator: boolean;
  disconnectedPlayerName?: string;
}

export interface CreateGameRequest {
  playerId: string;
  playerName: string;
  maxPlayers: 2 | 3 | 4;
}

export interface CreateGameResponse {
  gameId: string;
  playerId: string;
  joinToken: string;
}

export interface JoinGameRequest {
  gameId: string;
  playerId: string;
  playerName: string;
  asSpectator?: boolean;
  joinToken?: string;
}

export interface JoinGameResponse {
  success: boolean;
  playerId: string;
  joinToken: string;
  isSpectator: boolean;
  error?: string;
}

export interface GetGameRequest {
  gameId: string;
  playerId: string;
  joinToken: string;
}

export interface SetReadyRequest {
  gameId: string;
  playerId: string;
  joinToken: string;
  ready: boolean;
}

export interface PlayCardRequest {
  gameId: string;
  playerId: string;
  joinToken: string;
  cardId: string;
  captureCardIds: string[];
}

export interface LeaveGameRequest {
  gameId: string;
  playerId: string;
  joinToken: string;
}

export interface StartNewRoundRequest {
  gameId: string;
  playerId: string;
  joinToken: string;
}

export interface NewGameRequest {
  gameId: string;
  playerId: string;
  joinToken: string;
}

export interface KickPlayerRequest {
  gameId: string;
  playerId: string;
  joinToken: string;
  targetPlayerId: string;
}

export interface GameActionResponse {
  success: boolean;
  error?: string;
  state?: ClientGameState;
}

export const MAX_SPECTATORS = 10;
export const HOUR_MS = 60 * 60 * 1000;
export const FIVE_MIN_MS = 5 * 60 * 1000;
export const DISCONNECT_THRESHOLD_MS = 30 * 1000;
export const DISCONNECT_TIMEOUT_MS = 60 * 1000;
export const TURN_TIMEOUT_MS = 60 * 1000;
