import type {
  CreateGameRequest,
  CreateGameResponse,
  JoinGameRequest,
  JoinGameResponse,
  GetGameRequest,
  SetReadyRequest,
  PlayCardRequest,
  LeaveGameRequest,
  StartNewRoundRequest,
  NewGameRequest,
  KickPlayerRequest,
  GameActionResponse,
} from '../types/multiplayer';

const API_BASE = '/api';

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export const api = {
  createGame: (data: CreateGameRequest): Promise<CreateGameResponse> =>
    apiCall('/create-game', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  joinGame: (data: JoinGameRequest): Promise<JoinGameResponse> =>
    apiCall('/join-game', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getGame: (data: GetGameRequest): Promise<GameActionResponse> =>
    apiCall(
      `/get-game?gameId=${encodeURIComponent(data.gameId)}&playerId=${encodeURIComponent(data.playerId)}&joinToken=${encodeURIComponent(data.joinToken)}`,
      { method: 'GET' }
    ),

  setReady: (data: SetReadyRequest): Promise<GameActionResponse> =>
    apiCall('/set-ready', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  playCard: (data: PlayCardRequest): Promise<GameActionResponse> =>
    apiCall('/play-card', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  leaveGame: (data: LeaveGameRequest): Promise<{ success: boolean }> =>
    apiCall('/leave-game', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  startNewRound: (data: StartNewRoundRequest): Promise<GameActionResponse> =>
    apiCall('/start-new-round', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  newGame: (data: NewGameRequest): Promise<GameActionResponse> =>
    apiCall('/new-game', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  kickPlayer: (data: KickPlayerRequest): Promise<GameActionResponse> =>
    apiCall('/kick-player', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
