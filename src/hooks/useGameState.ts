import { useCallback, useState } from 'react';
import type { AIAnimationPhase, AIPlayAnimation, Card, GameSettings, GameState, Player } from '../types';
import { createDeck, shuffleDeck } from '../utils/deck';
import {
  assignRemainingCards,
  calculateRoundScores,
  dealCards,
  executeCapture,
  findCaptureCombinations,
  isGameOver,
  isRoundOver,
  isValidCapture,
} from '../utils/gameLogic';
import { getAIMove } from '../utils/ai';

const INITIAL_TABLE_CARDS = 4;
const TARGET_SCORE = 15;

const OPPONENT_NAMES = [
  'Jaime Enlace', 'Enrique El Alfarero', 'Lucas Paseacielos', 'Pedro Aparcador',
  'Juan Nieves', 'Mario Hermanos', 'Jacobo Gorrión'
];

const getRandomOpponentNames = (count: number): string[] => {
  const shuffled = [...OPPONENT_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const createInitialState = (settings: GameSettings): GameState => {
  const deck = shuffleDeck(createDeck());
  const opponentNames = getRandomOpponentNames(settings.numOpponents);

  // Create players
  const players: Player[] = [
    {
      id: 'human',
      name: settings.playerName,
      isHuman: true,
      hand: [],
      captured: [],
      escobas: 0,
    },
  ];

  for (let i = 0; i < settings.numOpponents; i++) {
    players.push({
      id: `cpu-${i + 1}`,
      name: opponentNames[i],
      isHuman: false,
      hand: [],
      captured: [],
      escobas: 0,
    });
  }

  // Initialize scores
  const scores: Record<string, number> = {};
  for (const player of players) {
    scores[player.id] = 0;
  }

  // Deal initial table cards
  const tableCards = deck.splice(0, INITIAL_TABLE_CARDS);

  let state: GameState = {
    phase: 'playing',
    settings,
    players,
    deck,
    table: tableCards,
    currentPlayerIndex: 0,
    lastCapturingPlayerIndex: null,
    scores,
    roundNumber: 1,
    targetScore: TARGET_SCORE,
    roundStarterIndex: 0,
  };

  // Deal cards to players
  state = dealCards(state);

  return state;
}

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTableCards, setSelectedTableCards] = useState<Card[]>([]);
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);
  const [aiAnimation, setAIAnimation] = useState<AIPlayAnimation | null>(null);

  const startGame = useCallback((settings: GameSettings) => {
    const initialState = createInitialState(settings);
    setGameState(initialState);
    setSelectedTableCards([]);
    setSelectedHandCard(null);
    setAIAnimation(null);
  }, []);

  const resetGame = useCallback(() => {
    setGameState(null);
    setSelectedTableCards([]);
    setSelectedHandCard(null);
    setAIAnimation(null);
  }, []);

  const advanceAIAnimation = useCallback(() => {
    if (!aiAnimation || !gameState) return;

    const nextPhase = (current: AIAnimationPhase): AIAnimationPhase => {
      if (current === 'cardPlayed') {
        return aiAnimation.capturedCards.length > 0 ? 'capturing' : 'settling';
      }
      if (current === 'capturing' || current === 'settling') {
        return 'done';
      }
      return 'done';
    };

    const newPhase = nextPhase(aiAnimation.phase);

    if (newPhase === 'done') {
      // Apply the remaining game state changes (card already removed from hand in startAITurn)
      setGameState((prev) => {
        if (!prev) return null;

        let newState = { ...prev };
        const newPlayers = prev.players.map((p) => ({
          ...p,
          hand: [...p.hand],
          captured: [...p.captured],
        }));
        let newTable = [...prev.table];

        const playerIndex = prev.currentPlayerIndex;
        const player = newPlayers[playerIndex];

        if (aiAnimation.capturedCards.length > 0) {
          // Capture
          const allCaptured = [aiAnimation.cardPlayed, ...aiAnimation.capturedCards];
          player.captured.push(...allCaptured);
          newTable = newTable.filter(
            (c) => !aiAnimation.capturedCards.some((cc) => cc.id === c.id)
          );
          if (aiAnimation.isEscoba) {
            player.escobas += 1;
          }
          newState.lastCapturingPlayerIndex = playerIndex;
        } else {
          // Place on table
          newTable.push(aiAnimation.cardPlayed);
        }

        newState = {
          ...newState,
          players: newPlayers,
          table: newTable,
          currentPlayerIndex: (playerIndex + 1) % prev.players.length,
        };

        return newState;
      });

      setAIAnimation(null);
    } else {
      setAIAnimation({ ...aiAnimation, phase: newPhase });
    }
  }, [aiAnimation, gameState]);

  const toggleTableCardSelection = useCallback((card: Card) => {
    setSelectedTableCards((prev) => {
      const isSelected = prev.some((c) => c.id === card.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== card.id);
      }
      return [...prev, card];
    });
  }, []);

  const selectHandCard = useCallback((card: Card) => {
    setSelectedHandCard((prev) => (prev?.id === card.id ? null : card));
  }, []);

  const canCapture = useCallback(() => {
    if (!gameState || !selectedHandCard) return false;
    if (selectedTableCards.length === 0) {
      return false;
    }
    return isValidCapture(selectedHandCard, selectedTableCards, gameState.table);
  }, [gameState, selectedHandCard, selectedTableCards]);

  const getAvailableCaptures = useCallback(() => {
    if (!gameState || !selectedHandCard) return [];
    return findCaptureCombinations(selectedHandCard, gameState.table);
  }, [gameState, selectedHandCard]);

  const playCard = useCallback(
    (capture: boolean) => {
      if (!gameState || !selectedHandCard) return;

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer.isHuman) return;

      setGameState((prev) => {
        if (!prev) return null;

        let newState = { ...prev };
        const newPlayers = prev.players.map((p) => ({
          ...p,
          hand: [...p.hand],
          captured: [...p.captured],
        }));
        let newTable = [...prev.table];

        const playerIndex = prev.currentPlayerIndex;
        const player = newPlayers[playerIndex];

        // Remove card from hand
        player.hand = player.hand.filter((c) => c.id !== selectedHandCard.id);

        if (capture && selectedTableCards.length >= 0) {
          if (
            isValidCapture(selectedHandCard, selectedTableCards, prev.table)
          ) {
            const result = executeCapture(
              selectedHandCard,
              selectedTableCards,
              prev.table
            );
            player.captured.push(...result.capturedCards);
            newTable = newTable.filter(
              (c) => !selectedTableCards.some((sc) => sc.id === c.id)
            );
            if (result.isEscoba) {
              player.escobas += 1;
            }
            newState.lastCapturingPlayerIndex = playerIndex;
          }
        } else {
          newTable.push(selectedHandCard);
        }

        newState = {
          ...newState,
          players: newPlayers,
          table: newTable,
          currentPlayerIndex: (playerIndex + 1) % prev.players.length,
        };

        return newState;
      });

      setSelectedHandCard(null);
      setSelectedTableCards([]);
    },
    [gameState, selectedHandCard, selectedTableCards]
  );

  const startAITurn = useCallback(() => {
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isHuman || currentPlayer.hand.length === 0) return;

    const move = getAIMove(
      currentPlayer,
      gameState.table,
      gameState.settings.difficulty
    );

    // Calculate if it's an escoba
    const remainingTable = gameState.table.filter(
      (c) => !move.cardsToCapture.some((cc) => cc.id === c.id)
    );
    const isEscoba = move.cardsToCapture.length > 0 && remainingTable.length === 0;

    // Remove card from AI's hand immediately for UI consistency
    setGameState((prev) => {
      if (!prev) return null;
      const newPlayers = prev.players.map((p, idx) => {
        if (idx === prev.currentPlayerIndex) {
          return {
            ...p,
            hand: p.hand.filter((c) => c.id !== move.cardToPlay.id),
          };
        }
        return p;
      });
      return { ...prev, players: newPlayers };
    });

    // Start animation
    const animation: AIPlayAnimation = {
      playerName: currentPlayer.name,
      cardPlayed: move.cardToPlay,
      capturedCards: move.cardsToCapture,
      isEscoba,
      phase: 'cardPlayed',
    };
    setAIAnimation(animation);
  }, [gameState]);

  const checkAndHandleRoundEnd = useCallback(() => {
    if (!gameState) return false;

    const allHandsEmpty = gameState.players.every((p) => p.hand.length === 0);

    if (allHandsEmpty && gameState.deck.length > 0) {
      setGameState((prev) => (prev ? dealCards(prev) : null));
      return false;
    }

    if (isRoundOver(gameState)) {
      let finalState = assignRemainingCards(gameState);
      const roundScores = calculateRoundScores(finalState.players);
      const newScores = { ...finalState.scores };
      for (const playerId of Object.keys(roundScores)) {
        newScores[playerId] += roundScores[playerId];
      }

      finalState = {
        ...finalState,
        scores: newScores,
        phase: isGameOver({ ...finalState, scores: newScores })
          ? 'gameEnd'
          : 'roundEnd',
      };

      setGameState(finalState);
      return true;
    }

    return false;
  }, [gameState]);

  const startNewRound = useCallback(() => {
    if (!gameState) return;

    const deck = shuffleDeck(createDeck());
    const tableCards = deck.splice(0, INITIAL_TABLE_CARDS);

    const newPlayers = gameState.players.map((p) => ({
      ...p,
      hand: [],
      captured: [],
      escobas: 0,
    }));

    // Rotate which player goes first
    const newStarterIndex = (gameState.roundStarterIndex + 1) % gameState.players.length;

    let newState: GameState = {
      ...gameState,
      phase: 'playing',
      players: newPlayers,
      deck,
      table: tableCards,
      currentPlayerIndex: newStarterIndex,
      lastCapturingPlayerIndex: null,
      roundNumber: gameState.roundNumber + 1,
      roundStarterIndex: newStarterIndex,
    };

    newState = dealCards(newState);
    setGameState(newState);
  }, [gameState]);

  return {
    gameState,
    selectedTableCards,
    selectedHandCard,
    aiAnimation,
    startGame,
    resetGame,
    toggleTableCardSelection,
    selectHandCard,
    canCapture,
    getAvailableCaptures,
    playCard,
    startAITurn,
    advanceAIAnimation,
    checkAndHandleRoundEnd,
    startNewRound,
  };
}
