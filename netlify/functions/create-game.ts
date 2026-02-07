import type { CreateGameRequest, CreateGameResponse } from '../../src/types/multiplayer';
import { saveGame } from '../utils/blob-store';
import { createNewGame } from '../utils/game-state';
import { withErrorHandler, withPostMethod, jsonResponse, errorResponse } from '../utils/response';
import { validatePlayerId } from '../utils/validation';

const handler = withErrorHandler(
  withPostMethod(async (request: Request) => {
    const body: CreateGameRequest = await request.json();
    if (!body.playerName || body.playerName.trim().length === 0) return errorResponse('El nombre es obligatorio');
    if (![2, 3, 4].includes(body.maxPlayers)) return errorResponse('El numero de jugadores debe ser 2, 3 o 4');
    const playerIdCheck = validatePlayerId(body.playerId);
    if (!playerIdCheck.valid) return errorResponse(playerIdCheck.error!);
    const { game, joinToken } = createNewGame(body.playerName.trim(), body.playerId, body.maxPlayers as 2 | 3 | 4);
    await saveGame(game);
    const response: CreateGameResponse = { gameId: game.gameId, playerId: body.playerId, joinToken };
    return jsonResponse(response);
  }),
  'create game'
);

export default handler;
