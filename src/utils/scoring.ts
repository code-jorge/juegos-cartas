import type { Player } from '../types';
import type { ClientPlayer } from '../types/multiplayer';

export interface CategoryWinner {
  winner: Player | null;
  count: number;
}

export interface MultiplayerCategoryWinner {
  winner: ClientPlayer | null;
  count: number;
}

export interface PlayerScoreDetails {
  totalCards: number;
  orosCount: number;
  sevensCount: number;
  hasSieteDeVelo: boolean;
  hasMostCards: boolean;
  hasMostOros: boolean;
  hasMostSevens: boolean;
  escobas: number;
}

export const getCategoryWinner = (
  counts: { player: Player; count: number }[]
): CategoryWinner => {
  const maxCount = Math.max(...counts.map((c) => c.count));
  const withMax = counts.filter((c) => c.count === maxCount);
  if (withMax.length > 1) return { winner: null, count: maxCount };
  return { winner: withMax[0].player, count: maxCount };
}

export const calculateCategoryWinners = (players: Player[]) => {
  const cardCounts = players.map((p) => ({ player: p, count: p.captured.length }));
  const orosCounts = players.map((p) => ({
    player: p,
    count: p.captured.filter((c) => c.suit === 'oros').length,
  }));
  const sevenCounts = players.map((p) => ({
    player: p,
    count: p.captured.filter((c) => c.value === 7).length,
  }));
  const sieteDeVelo = players.find((p) =>
    p.captured.some((c) => c.suit === 'oros' && c.value === 7)
  );

  return {
    cards: getCategoryWinner(cardCounts),
    oros: getCategoryWinner(orosCounts),
    sevens: getCategoryWinner(sevenCounts),
    sieteDeVelo,
  };
}

export const calculatePlayerScoreDetails = (
  player: Player,
  allPlayers: Player[]
): PlayerScoreDetails => {
  const oros = player.captured.filter((c) => c.suit === 'oros');
  const sevens = player.captured.filter((c) => c.value === 7);
  const hasSieteDeVelo = player.captured.some(
    (c) => c.suit === 'oros' && c.value === 7
  );

  const cardCounts = allPlayers.map((p) => p.captured.length);
  const orosCounts = allPlayers.map(
    (p) => p.captured.filter((c) => c.suit === 'oros').length
  );
  const sevenCounts = allPlayers.map(
    (p) => p.captured.filter((c) => c.value === 7).length
  );

  const maxCards = Math.max(...cardCounts);
  const maxOros = Math.max(...orosCounts);
  const maxSevens = Math.max(...sevenCounts);

  const hasMostCards =
    player.captured.length === maxCards &&
    cardCounts.filter((c) => c === maxCards).length === 1;
  const hasMostOros =
    oros.length === maxOros &&
    orosCounts.filter((c) => c === maxOros).length === 1;
  const hasMostSevens =
    sevens.length === maxSevens &&
    sevenCounts.filter((c) => c === maxSevens).length === 1;

  return {
    totalCards: player.captured.length,
    orosCount: oros.length,
    sevensCount: sevens.length,
    hasSieteDeVelo,
    hasMostCards,
    hasMostOros,
    hasMostSevens,
    escobas: player.escobas,
  };
}

export const getGameWinners = (
  players: Player[],
  scores: Record<string, number>
): { winners: Player[]; maxScore: number; humanWon: boolean } => {
  const maxScore = Math.max(...Object.values(scores));
  const winners = players.filter((p) => scores[p.id] === maxScore);
  const humanWon = winners.some((w) => w.isHuman);
  return { winners, maxScore, humanWon };
}

// Multiplayer versions that work with ClientPlayer

const getMultiplayerCategoryWinner = (
  counts: { player: ClientPlayer; count: number }[]
): MultiplayerCategoryWinner => {
  const maxCount = Math.max(...counts.map((c) => c.count));
  const withMax = counts.filter((c) => c.count === maxCount);
  if (withMax.length > 1) return { winner: null, count: maxCount };
  return { winner: withMax[0].player, count: maxCount };
}

export const calculateMultiplayerCategoryWinners = (players: ClientPlayer[]) => {
  const cardCounts = players.map((p) => ({ player: p, count: p.captured.length }));
  const orosCounts = players.map((p) => ({
    player: p,
    count: p.captured.filter((c) => c.suit === 'oros').length,
  }));
  const sevenCounts = players.map((p) => ({
    player: p,
    count: p.captured.filter((c) => c.value === 7).length,
  }));
  const sieteDeVelo = players.find((p) =>
    p.captured.some((c) => c.suit === 'oros' && c.value === 7)
  );

  return {
    cards: getMultiplayerCategoryWinner(cardCounts),
    oros: getMultiplayerCategoryWinner(orosCounts),
    sevens: getMultiplayerCategoryWinner(sevenCounts),
    sieteDeVelo,
  };
}

export const getMultiplayerGameWinners = (
  players: ClientPlayer[],
  scores: Record<string, number>,
  myPlayerId: string
): { winners: ClientPlayer[]; maxScore: number; iWon: boolean } => {
  const maxScore = Math.max(...Object.values(scores));
  const winners = players.filter((p) => scores[p.id] === maxScore);
  const iWon = winners.some((w) => w.id === myPlayerId);
  return { winners, maxScore, iWon };
}
