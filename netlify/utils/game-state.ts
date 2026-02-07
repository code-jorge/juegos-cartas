import { nanoid } from 'nanoid';
import type { Card, CardValue, Suit } from '../../src/types';
import type { MultiplayerGameState, MultiplayerPlayer, ClientGameState, ClientPlayer } from '../../src/types/multiplayer';

const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TARGET_SCORE = 15;
const DISCONNECT_THRESHOLD_MS = 30 * 1000;
const DISCONNECT_TIMEOUT_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const getCardPoints = (card: Card): number => card.value;

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ id: `${suit}-${value}`, suit, value });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const dealCards = (game: MultiplayerGameState, deck: Card[]): Card[] => {
  for (const player of game.players) {
    for (let i = 0; i < 3 && deck.length > 0; i++) {
      player.hand.push(deck.pop()!);
    }
  }
  const table: Card[] = [];
  for (let i = 0; i < 4 && deck.length > 0; i++) {
    table.push(deck.pop()!);
  }
  return table;
};

const awardPointForMax = (
  scores: Record<string, number>,
  counts: { id: string; count: number }[]
): void => {
  const max = Math.max(...counts.map((c) => c.count));
  const withMax = counts.filter((c) => c.count === max);
  if (withMax.length === 1) scores[withMax[0].id] += 1;
};

export const createNewGame = (
  creatorName: string,
  creatorPlayerId: string,
  maxPlayers: 2 | 3 | 4
): { game: MultiplayerGameState; joinToken: string } => {
  const gameId = nanoid(8);
  const joinToken = nanoid(24);
  const now = Date.now();
  const creator: MultiplayerPlayer = {
    id: creatorPlayerId, name: creatorName, joinToken, isReady: false,
    isConnected: true, lastSeen: now, hand: [], captured: [], escobas: 0,
  };
  const game: MultiplayerGameState = {
    gameId, phase: 'lobby', players: [creator], spectators: [], maxPlayers,
    creatorId: creatorPlayerId, deck: [], table: [], currentPlayerIndex: 0,
    lastCapturingPlayerIndex: null, scores: { [creatorPlayerId]: 0 },
    roundNumber: 1, targetScore: TARGET_SCORE, roundStarterIndex: 0,
    createdAt: now, expiresAt: now + HOUR_MS, lastActivity: now, version: 0,
  };
  return { game, joinToken };
};

export const addPlayerToGame = (
  game: MultiplayerGameState,
  playerId: string,
  playerName: string
): { player: MultiplayerPlayer; joinToken: string } | null => {
  if (game.phase !== 'lobby') return null;
  const existingPlayer = game.players.find((p) => p.id === playerId);
  if (existingPlayer) {
    existingPlayer.name = playerName;
    existingPlayer.lastSeen = Date.now();
    existingPlayer.isConnected = true;
    return { player: existingPlayer, joinToken: existingPlayer.joinToken };
  }
  if (game.players.length >= game.maxPlayers) return null;
  const joinToken = nanoid(24);
  const now = Date.now();
  const player: MultiplayerPlayer = {
    id: playerId, name: playerName, joinToken, isReady: false,
    isConnected: true, lastSeen: now, hand: [], captured: [], escobas: 0,
  };
  game.players.push(player);
  game.scores[playerId] = 0;
  return { player, joinToken };
};

export const startGame = (game: MultiplayerGameState): boolean => {
  if (game.phase !== 'lobby') return false;
  if (game.players.length < 2) return false;
  if (!game.players.every((p) => p.isReady)) return false;
  const deck = shuffleDeck(createDeck());
  game.table = dealCards(game, deck);
  game.deck = deck;
  game.phase = 'playing';
  game.currentPlayerIndex = 0;
  game.roundStarterIndex = 0;
  return true;
};

export const dealNewHands = (game: MultiplayerGameState): boolean => {
  if (game.deck.length === 0) return false;
  for (const player of game.players) {
    for (let i = 0; i < 3 && game.deck.length > 0; i++) {
      player.hand.push(game.deck.pop()!);
    }
  }
  return true;
};

export const calculateRoundScores = (players: MultiplayerPlayer[]): Record<string, number> => {
  const scores: Record<string, number> = {};
  for (const player of players) scores[player.id] = player.escobas;
  awardPointForMax(scores, players.map((p) => ({ id: p.id, count: p.captured.length })));
  awardPointForMax(scores, players.map((p) => ({ id: p.id, count: p.captured.filter((c) => c.suit === 'oros').length })));
  awardPointForMax(scores, players.map((p) => ({ id: p.id, count: p.captured.filter((c) => c.value === 7).length })));
  const sieteDeVelo = players.find((p) => p.captured.some((c) => c.suit === 'oros' && c.value === 7));
  if (sieteDeVelo) scores[sieteDeVelo.id] += 1;
  return scores;
};

export const assignRemainingCards = (game: MultiplayerGameState): void => {
  if (game.lastCapturingPlayerIndex === null || game.table.length === 0) return;
  const player = game.players[game.lastCapturingPlayerIndex];
  player.captured.push(...game.table);
  game.table = [];
};

export const checkRoundEnd = (game: MultiplayerGameState): boolean =>
  game.players.every((p) => p.hand.length === 0) && game.deck.length === 0;

export const endRound = (game: MultiplayerGameState): void => {
  assignRemainingCards(game);
  const roundScores = calculateRoundScores(game.players);
  for (const [playerId, score] of Object.entries(roundScores)) {
    game.scores[playerId] = (game.scores[playerId] || 0) + score;
  }
  const gameOver = Object.values(game.scores).some((s) => s >= game.targetScore);
  game.phase = gameOver ? 'gameEnd' : 'roundEnd';
};

export const startNewRound = (game: MultiplayerGameState): void => {
  for (const player of game.players) {
    player.hand = [];
    player.captured = [];
    player.escobas = 0;
  }
  const deck = shuffleDeck(createDeck());
  game.table = dealCards(game, deck);
  game.deck = deck;
  game.roundNumber += 1;
  game.roundStarterIndex = (game.roundStarterIndex + 1) % game.players.length;
  game.currentPlayerIndex = game.roundStarterIndex;
  game.lastCapturingPlayerIndex = null;
  game.phase = 'playing';
};

export const resetGameForNewGame = (game: MultiplayerGameState): void => {
  for (const playerId of Object.keys(game.scores)) game.scores[playerId] = 0;
  for (const player of game.players) {
    player.hand = [];
    player.captured = [];
    player.escobas = 0;
    player.isReady = false;
  }
  game.deck = [];
  game.table = [];
  game.roundNumber = 1;
  game.currentPlayerIndex = 0;
  game.roundStarterIndex = 0;
  game.lastCapturingPlayerIndex = null;
  game.phase = 'lobby';
  game.expiresAt = Date.now() + HOUR_MS;
};

export const updatePlayerConnections = (game: MultiplayerGameState): void => {
  const now = Date.now();
  for (const player of game.players) {
    player.isConnected = now - player.lastSeen < DISCONNECT_THRESHOLD_MS;
  }
  if (game.phase === 'playing' || game.phase === 'roundEnd') {
    for (const player of game.players) {
      if (now - player.lastSeen > DISCONNECT_TIMEOUT_MS) {
        game.phase = 'disconnected';
        game.disconnectedPlayerId = player.id;
        game.disconnectedAt = now;
        break;
      }
    }
  }
  game.spectators = game.spectators.filter((s) => now - s.lastSeen < DISCONNECT_THRESHOLD_MS);
};

export const checkAllPlayersReconnected = (game: MultiplayerGameState): boolean => {
  if (game.phase !== 'disconnected') return false;
  if (!game.players.every((p) => p.isConnected)) return false;
  game.phase = 'playing';
  game.disconnectedPlayerId = undefined;
  game.disconnectedAt = undefined;
  return true;
};

export const kickPlayer = (
  game: MultiplayerGameState,
  kickerId: string,
  targetPlayerId: string
): { success: boolean; error?: string } => {
  if (game.creatorId !== kickerId) return { success: false, error: 'Solo el anfitrion puede expulsar jugadores' };
  if (game.phase !== 'lobby') return { success: false, error: 'No se puede expulsar jugadores durante la partida' };
  if (kickerId === targetPlayerId) return { success: false, error: 'No puedes expulsarte a ti mismo' };
  const playerIndex = game.players.findIndex((p) => p.id === targetPlayerId);
  if (playerIndex === -1) return { success: false, error: 'Jugador no encontrado' };
  const kickedPlayer = game.players[playerIndex];
  game.players.splice(playerIndex, 1);
  delete game.scores[kickedPlayer.id];
  return { success: true };
};

export const sanitizeGameForClient = (
  game: MultiplayerGameState,
  playerId: string,
  joinToken: string
): ClientGameState => {
  const player = game.players.find((p) => p.id === playerId && p.joinToken === joinToken);
  const spectator = game.spectators.find((s) => s.id === playerId && s.joinToken === joinToken);
  const clientPlayers: ClientPlayer[] = game.players.map((p) => ({
    id: p.id, name: p.name, isReady: p.isReady, isConnected: p.isConnected,
    handSize: p.hand.length, captured: p.captured, escobas: p.escobas,
  }));
  return {
    gameId: game.gameId, phase: game.phase, players: clientPlayers,
    spectatorCount: game.spectators.length, maxPlayers: game.maxPlayers,
    creatorId: game.creatorId, myHand: player ? player.hand : [],
    deckSize: game.deck.length, table: game.table,
    currentPlayerIndex: game.currentPlayerIndex,
    lastCapturingPlayerIndex: game.lastCapturingPlayerIndex,
    scores: game.scores, roundNumber: game.roundNumber,
    targetScore: game.targetScore, roundStarterIndex: game.roundStarterIndex,
    createdAt: game.createdAt, expiresAt: game.expiresAt, version: game.version,
    isSpectator: !player && !!spectator,
    disconnectedPlayerName: game.disconnectedPlayerId
      ? game.players.find((p) => p.id === game.disconnectedPlayerId)?.name
      : undefined,
  };
};
