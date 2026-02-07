import type { StartNewRoundRequest } from '../../src/types/multiplayer';
import { saveGame } from '../utils/blob-store';
import { startNewRound } from '../utils/game-state';
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
    const body: StartNewRoundRequest = await request.json();
    if (!body.gameId || !body.playerId || !body.joinToken) return missingParams();
    const result = await loadAndValidatePlayer(body.gameId, body.playerId, body.joinToken);
    if (result.error) return result.error;
    const { ctx } = result;
    if (ctx.game.phase !== 'roundEnd') return errorResponse('La ronda no ha terminado');
    startNewRound(ctx.game);
    await saveGame(ctx.game);
    return buildGameResponse(ctx);
  }),
  'start new round'
);

export default handler;
