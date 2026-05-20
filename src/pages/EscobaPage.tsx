import { GameSetup } from '../components/GameSetup';
import { GameBoard } from '../components/GameBoard';
import { useGameState } from '../hooks/useGameState';

export const EscobaPage = () => {
  const {
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
  } = useGameState();

  if (!gameState) {
    return <GameSetup onStartGame={startGame} />;
  }

  return (
    <GameBoard
      gameState={gameState}
      selectedTableCards={selectedTableCards}
      selectedHandCard={selectedHandCard}
      aiAnimation={aiAnimation}
      onToggleTableCard={toggleTableCardSelection}
      onSelectHandCard={selectHandCard}
      onPlayCard={playCard}
      onStartAITurn={startAITurn}
      onAdvanceAIAnimation={advanceAIAnimation}
      onCheckRoundEnd={checkAndHandleRoundEnd}
      onNewRound={startNewRound}
      onResetGame={resetGame}
      canCapture={canCapture}
      getAvailableCaptures={getAvailableCaptures}
    />
  );
};
