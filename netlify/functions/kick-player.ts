import type { KickPlayerRequest } from '../../src/types/multiplayer';
import { saveGame } from '../utils/blob-store';
import { kickPlayer } from '../utils/game-state';
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
    const body: KickPlayerRequest = await request.json();
    if (!body.gameId || !body.playerId || !body.joinToken || !body.targetPlayerId) return missingParams();
    const result = await loadAndValidatePlayer(body.gameId, body.playerId, body.joinToken);
    if (result.error) return result.error;
    const { ctx } = result;
    const kickResult = kickPlayer(ctx.game, body.playerId, body.targetPlayerId);
    if (!kickResult.success) return errorResponse(kickResult.error || 'Error al expulsar jugador');
    await saveGame(ctx.game);
    return buildGameResponse(ctx);
  }),
  'kick player'
);

export default handler;
