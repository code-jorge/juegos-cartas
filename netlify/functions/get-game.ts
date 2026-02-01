import type { GameActionResponse } from '../../src/types/multiplayer';
import { loadGame, saveGame } from '../utils/blob-store';
import {
  sanitizeGameForClient,
  updatePlayerConnections,
  dealNewHands,
  checkRoundEnd,
  endRound,
  checkAllPlayersReconnected,
} from '../utils/game-state';
import {
  withErrorHandler,
  withGetMethod,
  jsonResponse,
  missingParams,
  gameNotFound,
  notAuthorized,
} from '../utils/response';

const handler = withErrorHandler(
  withGetMethod(async (request: Request) => {
    const url = new URL(request.url);
    const gameId = url.searchParams.get('gameId');
    const playerId = url.searchParams.get('playerId');
    const joinToken = url.searchParams.get('joinToken');
    if (!gameId || !playerId || !joinToken) return missingParams();
    const game = await loadGame(gameId);
    if (!game) return gameNotFound();
    const player = game.players.find((p) => p.id === playerId);
    const spectator = game.spectators.find((s) => s.id === playerId);
    if (player) {
      if (player.joinToken !== joinToken) return notAuthorized('Invalid join token');
      player.lastSeen = Date.now();
      player.isConnected = true;
    } else if (spectator) {
      if (spectator.joinToken !== joinToken) return notAuthorized('Invalid join token');
      spectator.lastSeen = Date.now();
    } else {
      return notAuthorized('Not a participant in this game');
    }
    updatePlayerConnections(game);
    checkAllPlayersReconnected(game);
    if (game.phase === 'playing') {
      const allHandsEmpty = game.players.every((p) => p.hand.length === 0);
      if (allHandsEmpty && game.deck.length > 0) dealNewHands(game);
      if (checkRoundEnd(game)) endRound(game);
    }
    await saveGame(game);
    const clientState = sanitizeGameForClient(game, playerId, joinToken);
    const response: GameActionResponse = { success: true, state: clientState };
    return jsonResponse(response);
  }),
  'get game'
);

export default handler;
