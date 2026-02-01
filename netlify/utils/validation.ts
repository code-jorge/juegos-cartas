import type { MultiplayerGameState } from '../../src/types/multiplayer';
import { getCardPoints } from './game-state';

const TARGET_SUM = 15;
const MAX_PLAYER_NAME_LENGTH = 30;
const MAX_GAME_ID_LENGTH = 20;
const MAX_PLAYER_ID_LENGTH = 20;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const sanitizePlayerName = (name: string): string => {
  return name.trim().slice(0, MAX_PLAYER_NAME_LENGTH).replace(/[<>]/g, '');
};

export const validatePlayerName = (name: string | undefined | null): ValidationResult => {
  if (!name || name.trim().length === 0) return { valid: false, error: 'El nombre es obligatorio' };
  if (name.trim().length > MAX_PLAYER_NAME_LENGTH) return { valid: false, error: 'El nombre es demasiado largo' };
  return { valid: true };
};

export const validateGameId = (gameId: string | undefined | null): ValidationResult => {
  if (!gameId) return { valid: false, error: 'El codigo de partida es obligatorio' };
  if (gameId.length > MAX_GAME_ID_LENGTH) return { valid: false, error: 'Codigo de partida invalido' };
  return { valid: true };
};

export const validatePlayerId = (playerId: string | undefined | null): ValidationResult => {
  if (!playerId) return { valid: false, error: 'ID de jugador es obligatorio' };
  if (playerId.length > MAX_PLAYER_ID_LENGTH) return { valid: false, error: 'ID de jugador invalido' };
  return { valid: true };
};

export const validateIsPlayer = (
  game: MultiplayerGameState,
  playerId: string,
  joinToken: string
): ValidationResult => {
  const player = game.players.find((p) => p.id === playerId && p.joinToken === joinToken);
  if (!player) return { valid: false, error: 'No eres un jugador en esta partida' };
  return { valid: true };
};

export const validatePlayCard = (
  game: MultiplayerGameState,
  playerId: string,
  joinToken: string,
  cardId: string,
  captureCardIds: string[]
): ValidationResult => {
  const credCheck = validateIsPlayer(game, playerId, joinToken);
  if (!credCheck.valid) return credCheck;
  if (game.phase !== 'playing') return { valid: false, error: 'La partida no esta en fase de juego' };
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return { valid: false, error: 'No es tu turno' };
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { valid: false, error: 'Jugador no encontrado' };
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return { valid: false, error: 'Carta no esta en tu mano' };
  if (captureCardIds.length > 0) {
    const uniqueIds = new Set(captureCardIds);
    if (uniqueIds.size !== captureCardIds.length) return { valid: false, error: 'Cartas duplicadas' };
    const tableCardIds = new Set(game.table.map((c) => c.id));
    for (const id of captureCardIds) {
      if (!tableCardIds.has(id)) return { valid: false, error: 'Carta no esta en la mesa' };
    }
    const captureCards = game.table.filter((c) => captureCardIds.includes(c.id));
    const sum = getCardPoints(card) + captureCards.reduce((acc, c) => acc + getCardPoints(c), 0);
    if (sum !== TARGET_SUM) return { valid: false, error: 'La suma debe ser 15' };
  }
  return { valid: true };
};

export const executePlayCard = (
  game: MultiplayerGameState,
  playerId: string,
  cardId: string,
  captureCardIds: string[]
): { isEscoba: boolean } => {
  const playerIndex = game.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { isEscoba: false };
  const player = game.players[playerIndex];
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return { isEscoba: false };
  const card = player.hand.splice(cardIndex, 1)[0];
  let isEscoba = false;
  if (captureCardIds.length > 0) {
    const captureCards = game.table.filter((c) => captureCardIds.includes(c.id));
    player.captured.push(card, ...captureCards);
    game.table = game.table.filter((c) => !captureCardIds.includes(c.id));
    isEscoba = game.table.length === 0;
    if (isEscoba) player.escobas += 1;
    game.lastCapturingPlayerIndex = playerIndex;
  } else {
    game.table.push(card);
  }
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  return { isEscoba };
};
