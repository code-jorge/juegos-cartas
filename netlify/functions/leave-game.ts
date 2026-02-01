import type { LeaveGameRequest } from '../../src/types/multiplayer';
import { loadGame, saveGame, deleteGame } from '../utils/blob-store';
import { updatePlayerConnections } from '../utils/game-state';
import {
  withErrorHandler,
  withPostMethod,
  successResponse,
  missingParams,
  gameNotFound,
  notAuthorized,
  errorResponse,
} from '../utils/response';

const handler = withErrorHandler(
  withPostMethod(async (request: Request) => {
    const body: LeaveGameRequest = await request.json();
    if (!body.gameId || !body.playerId || !body.joinToken) return missingParams();
    const game = await loadGame(body.gameId);
    if (!game) return gameNotFound();
    const playerIndex = game.players.findIndex((p) => p.id === body.playerId && p.joinToken === body.joinToken);
    const spectatorIndex = game.spectators.findIndex((s) => s.id === body.playerId);
    if (playerIndex === -1 && spectatorIndex === -1) return notAuthorized('Not a participant in this game');
    if (spectatorIndex !== -1) {
      game.spectators.splice(spectatorIndex, 1);
      await saveGame(game);
      return successResponse();
    }
    if (game.phase !== 'lobby') return errorResponse('Cannot leave game in progress');
    const leavingPlayer = game.players[playerIndex];
    game.players.splice(playerIndex, 1);
    delete game.scores[leavingPlayer.id];
    if (game.players.length === 0) {
      await deleteGame(body.gameId);
      return successResponse();
    }
    if (leavingPlayer.id === game.creatorId) game.creatorId = game.players[0].id;
    updatePlayerConnections(game);
    await saveGame(game);
    return successResponse();
  }),
  'leave game'
);

export default handler;
