import type { NewGameRequest } from '../../src/types/multiplayer';
import { saveGame } from '../utils/blob-store';
import { resetGameForNewGame } from '../utils/game-state';
import {
  withErrorHandler,
  withPostMethod,
  loadAndValidatePlayer,
  buildGameResponse,
  missingParams,
  errorResponse,
} from '../utils/response';

const handler = withErrorHandler(
  withPostMethod(async (request: Request) => {
    const body: NewGameRequest = await request.json();
    if (!body.gameId || !body.playerId || !body.joinToken) return missingParams();
    const result = await loadAndValidatePlayer(body.gameId, body.playerId, body.joinToken);
    if (result.error) return result.error;
    const { ctx } = result;
    if (ctx.game.phase !== 'gameEnd') return errorResponse('Game has not ended');
    resetGameForNewGame(ctx.game);
    await saveGame(ctx.game);
    return buildGameResponse(ctx);
  }),
  'start new game'
);

export default handler;
