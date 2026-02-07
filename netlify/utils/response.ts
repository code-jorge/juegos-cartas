import type { GameActionResponse, ClientGameState, MultiplayerGameState } from '../../src/types/multiplayer';
import { loadGame } from './blob-store';
import { sanitizeGameForClient, updatePlayerConnections } from './game-state';
import { validateIsPlayer } from './validation';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const jsonResponse = <T>(data: T, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
export const errorResponse = (error: string, status = 400): Response =>
  jsonResponse({ error }, status);
export const successResponse = (data: object = {}): Response =>
  jsonResponse({ success: true, ...data });
export const methodNotAllowed = (): Response => errorResponse('Metodo no permitido', 405);
export const missingParams = (): Response => errorResponse('Faltan parametros requeridos', 400);
export const gameNotFound = (): Response => errorResponse('Partida no encontrada', 404);
export const gameExpired = (): Response => errorResponse('La partida ha expirado', 410);
export const notAuthorized = (message = 'No autorizado'): Response => errorResponse(message, 403);
export const serverError = (message = 'Error interno del servidor'): Response => errorResponse(message, 500);

export interface GameContext {
  game: MultiplayerGameState;
  playerId: string;
  joinToken: string;
}

type LoadResult = { game: MultiplayerGameState; error?: never } | { game?: never; error: Response };
type ValidatedResult = { ctx: GameContext; error?: never } | { ctx?: never; error: Response };

export const loadGameOrError = async (gameId: string): Promise<LoadResult> => {
  const game = await loadGame(gameId);
  if (!game) return { error: gameNotFound() };
  if (game.phase === 'expired') return { error: gameExpired() };
  return { game };
};

export const loadAndValidatePlayer = async (
  gameId: string,
  playerId: string,
  joinToken: string
): Promise<ValidatedResult> => {
  const result = await loadGameOrError(gameId);
  if (result.error) return { error: result.error };
  const validation = validateIsPlayer(result.game, playerId, joinToken);
  if (!validation.valid) return { error: notAuthorized(validation.error) };
  const player = result.game.players.find((p) => p.id === playerId);
  if (player) player.lastSeen = Date.now();
  updatePlayerConnections(result.game);
  return { ctx: { game: result.game, playerId, joinToken } };
};

export const buildGameResponse = (ctx: GameContext): Response => {
  const clientState = sanitizeGameForClient(ctx.game, ctx.playerId, ctx.joinToken);
  return jsonResponse<GameActionResponse>({ success: true, state: clientState });
};

export type HandlerFn = (request: Request) => Promise<Response>;

export const withErrorHandler = (handler: HandlerFn, errorMessage: string): HandlerFn => {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error(`Error: ${errorMessage}`, error);
      return serverError(`Failed to ${errorMessage.toLowerCase()}`);
    }
  };
};

export const withPostMethod = (handler: HandlerFn): HandlerFn => {
  return async (request: Request) => {
    if (request.method !== 'POST') return methodNotAllowed();
    return handler(request);
  };
};

export const withGetMethod = (handler: HandlerFn): HandlerFn => {
  return async (request: Request) => {
    if (request.method !== 'GET') return methodNotAllowed();
    return handler(request);
  };
};
