import type { SetReadyRequest } from '../../src/types/multiplayer';
import { saveGame } from '../utils/blob-store';
import { startGame } from '../utils/game-state';
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
    const body: SetReadyRequest = await request.json();
    if (!body.gameId || !body.playerId || !body.joinToken) return missingParams();
    const result = await loadAndValidatePlayer(body.gameId, body.playerId, body.joinToken);
    if (result.error) return result.error;
    const { ctx } = result;
    if (ctx.game.phase !== 'lobby') return errorResponse('Game has already started');
    const player = ctx.game.players.find((p) => p.id === body.playerId)!;
    player.isReady = body.ready;
    if (ctx.game.players.length >= 2 && ctx.game.players.every((p) => p.isReady)) {
      startGame(ctx.game);
    }
    await saveGame(ctx.game);
    return buildGameResponse(ctx);
  }),
  'set ready status'
);

export default handler;
