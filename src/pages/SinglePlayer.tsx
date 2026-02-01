import { useNavigate } from 'react-router-dom';
import { GameSetup } from '../components/GameSetup';
import { GameBoard } from '../components/GameBoard';
import { useGameState } from '../hooks/useGameState';

export const SinglePlayer = () => {
  const navigate = useNavigate();
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

  const handleResetGame = () => {
    resetGame();
    navigate('/');
  };

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
      onResetGame={handleResetGame}
      canCapture={canCapture}
      getAvailableCaptures={getAvailableCaptures}
    />
  );
};
