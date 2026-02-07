import type { JoinGameRequest, JoinGameResponse, MAX_SPECTATORS } from '../../src/types/multiplayer';
import { loadGame, saveGame } from '../utils/blob-store';
import { addPlayerToGame, updatePlayerConnections } from '../utils/game-state';
import { sanitizePlayerName, validatePlayerName, validateGameId, validatePlayerId } from '../utils/validation';
import { nanoid } from 'nanoid';
import {
  withErrorHandler,
  withPostMethod,
  jsonResponse,
  errorResponse,
  gameNotFound,
  gameExpired,
  serverError,
} from '../utils/response';

const handler = withErrorHandler(
  withPostMethod(async (request: Request) => {
    const body: JoinGameRequest = await request.json();
    const gameIdCheck = validateGameId(body.gameId);
    if (!gameIdCheck.valid) return errorResponse(gameIdCheck.error!);
    const nameCheck = validatePlayerName(body.playerName);
    if (!nameCheck.valid) return errorResponse(nameCheck.error!);
    if (body.playerId) {
      const playerIdCheck = validatePlayerId(body.playerId);
      if (!playerIdCheck.valid) return errorResponse(playerIdCheck.error!);
    }
    const playerName = sanitizePlayerName(body.playerName);
    const game = await loadGame(body.gameId);
    if (!game) return gameNotFound();
    if (game.phase === 'expired') return gameExpired();
    if (body.joinToken) {
      const existingPlayer = game.players.find((p) => p.id === body.playerId && p.joinToken === body.joinToken);
      if (existingPlayer) {
        existingPlayer.lastSeen = Date.now();
        existingPlayer.isConnected = true;
        await saveGame(game);
        return jsonResponse<JoinGameResponse>({
          success: true,
          playerId: existingPlayer.id,
          joinToken: existingPlayer.joinToken,
          isSpectator: false,
        });
      }
      const existingSpectator = game.spectators.find((s) => s.id === body.playerId && s.joinToken === body.joinToken);
      if (existingSpectator) {
        existingSpectator.lastSeen = Date.now();
        await saveGame(game);
        return jsonResponse<JoinGameResponse>({
          success: true,
          playerId: existingSpectator.id,
          joinToken: existingSpectator.joinToken,
          isSpectator: true,
        });
      }
    }
    updatePlayerConnections(game);
    // Allow reconnection for existing players who lost their token
    const existingPlayer = game.players.find((p) => p.id === body.playerId);
    if (existingPlayer) {
      existingPlayer.name = playerName;
      existingPlayer.lastSeen = Date.now();
      existingPlayer.isConnected = true;
      await saveGame(game);
      return jsonResponse<JoinGameResponse>({
        success: true,
        playerId: existingPlayer.id,
        joinToken: existingPlayer.joinToken,
        isSpectator: false,
      });
    }
    if (body.asSpectator) {
      const existingSpec = game.spectators.find((s) => s.id === body.playerId);
      if (existingSpec) {
        existingSpec.name = playerName;
        existingSpec.lastSeen = Date.now();
        await saveGame(game);
        return jsonResponse<JoinGameResponse>({
          success: true,
          playerId: existingSpec.id,
          joinToken: existingSpec.joinToken,
          isSpectator: true,
        });
      }
      if (game.spectators.length >= 10) return errorResponse('Partida llena (maximo de espectadores)');
      const playerId = body.playerId || nanoid(12);
      const joinToken = nanoid(24);
      game.spectators.push({ id: playerId, name: playerName, joinToken, lastSeen: Date.now() });
      await saveGame(game);
      return jsonResponse<JoinGameResponse>({ success: true, playerId, joinToken, isSpectator: true });
    }
    if (game.phase !== 'lobby') return errorResponse('La partida ya ha comenzado');
    if (game.players.length >= game.maxPlayers) return errorResponse('La partida esta llena');
    const playerId = body.playerId || nanoid(12);
    const result = addPlayerToGame(game, playerId, playerName);
    if (!result) return serverError('Error al unirse a la partida');
    await saveGame(game);
    return jsonResponse<JoinGameResponse>({
      success: true,
      playerId: result.player.id,
      joinToken: result.joinToken,
      isSpectator: false,
    });
  }),
  'join game'
);

export default handler;
