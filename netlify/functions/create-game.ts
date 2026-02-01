import type { CreateGameRequest, CreateGameResponse } from '../../src/types/multiplayer';
import { saveGame } from '../utils/blob-store';
import { createNewGame } from '../utils/game-state';
import { withErrorHandler, withPostMethod, jsonResponse, errorResponse } from '../utils/response';

const handler = withErrorHandler(
  withPostMethod(async (request: Request) => {
    const body: CreateGameRequest = await request.json();
    if (!body.playerName || body.playerName.trim().length === 0) return errorResponse('Player name is required');
    if (![2, 3, 4].includes(body.maxPlayers)) return errorResponse('Max players must be 2, 3, or 4');
    if (!body.playerId) return errorResponse('Player ID is required');
    const { game, joinToken } = createNewGame(body.playerName.trim(), body.playerId, body.maxPlayers as 2 | 3 | 4);
    await saveGame(game);
    const response: CreateGameResponse = { gameId: game.gameId, playerId: body.playerId, joinToken };
    return jsonResponse(response);
  }),
  'create game'
);

export default handler;
