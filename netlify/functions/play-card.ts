import type { PlayCardRequest } from '../../src/types/multiplayer';
import { saveGame } from '../utils/blob-store';
import { dealNewHands, checkRoundEnd, endRound, updatePlayerConnections } from '../utils/game-state';
import { validatePlayCard, executePlayCard } from '../utils/validation';
import {
  withErrorHandler,
  withPostMethod,
  loadGameOrError,
  buildGameResponse,
  missingParams,
  errorResponse,
} from '../utils/response';

const handler = withErrorHandler(
  withPostMethod(async (request: Request) => {
    const body: PlayCardRequest = await request.json();
    if (!body.gameId || !body.playerId || !body.joinToken || !body.cardId) return missingParams();
    const result = await loadGameOrError(body.gameId);
    if (result.error) return result.error;
    const { game } = result;
    const validation = validatePlayCard(game, body.playerId, body.joinToken, body.cardId, body.captureCardIds || []);
    if (!validation.valid) return errorResponse(validation.error || 'Invalid move');
    executePlayCard(game, body.playerId, body.cardId, body.captureCardIds || []);
    const player = game.players.find((p) => p.id === body.playerId);
    if (player) player.lastSeen = Date.now();
    updatePlayerConnections(game);
    const allHandsEmpty = game.players.every((p) => p.hand.length === 0);
    if (allHandsEmpty) {
      if (game.deck.length > 0) dealNewHands(game);
      else if (checkRoundEnd(game)) endRound(game);
    }
    await saveGame(game);
    return buildGameResponse({ game, playerId: body.playerId, joinToken: body.joinToken });
  }),
  'play card'
);

export default handler;
