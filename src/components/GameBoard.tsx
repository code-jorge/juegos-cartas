import { useEffect, useState } from 'react';
import type { AIPlayAnimation, Card as CardType, GameState } from '../types';
import { calculateCategoryWinners, getGameWinners } from '../utils/scoring';
import { Card } from './Card';
import styles from './GameBoard.module.css';

interface GameBoardProps {
  gameState: GameState;
  selectedTableCards: CardType[];
  selectedHandCard: CardType | null;
  aiAnimation: AIPlayAnimation | null;
  onToggleTableCard: (card: CardType) => void;
  onSelectHandCard: (card: CardType) => void;
  onPlayCard: (capture: boolean) => void;
  onStartAITurn: () => void;
  onAdvanceAIAnimation: () => void;
  onCheckRoundEnd: () => boolean;
  onNewRound: () => void;
  onResetGame: () => void;
  canCapture: () => boolean;
  getAvailableCaptures: () => CardType[][];
}

const ANIMATION_DELAYS: Record<string, number> = {
  cardPlayed: 800,
  capturing: 800,
  settling: 500,
};

export const GameBoard = ({
  gameState,
  selectedTableCards,
  selectedHandCard,
  aiAnimation,
  onToggleTableCard,
  onSelectHandCard,
  onPlayCard,
  onStartAITurn,
  onAdvanceAIAnimation,
  onCheckRoundEnd,
  onNewRound,
  onResetGame,
  canCapture,
  getAvailableCaptures,
}: GameBoardProps) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const humanPlayer = gameState.players.find((p) => p.isHuman);
  const isHumanTurn = currentPlayer.isHuman;

  useEffect(() => {
    if (!aiAnimation) return;
    const delay = ANIMATION_DELAYS[aiAnimation.phase] || 500;
    const timer = setTimeout(onAdvanceAIAnimation, delay);
    return () => clearTimeout(timer);
  }, [aiAnimation, onAdvanceAIAnimation]);

  useEffect(() => {
    if (gameState.phase !== 'playing' || aiAnimation) return;
    if (onCheckRoundEnd()) return;
    if (!isHumanTurn && currentPlayer.hand.length > 0) {
      const timer = setTimeout(onStartAITurn, 400);
      return () => clearTimeout(timer);
    }
  }, [gameState, isHumanTurn, currentPlayer, onStartAITurn, onCheckRoundEnd, aiAnimation]);

  // Guard against missing human player (should never happen in single-player mode)
  if (!humanPlayer) return null;

  const opponents = gameState.players.filter((p) => !p.isHuman);
  const captures = selectedHandCard ? getAvailableCaptures() : [];
  const canMakeCapture = canCapture() && selectedTableCards.length > 0;

  // Check if selected hand card has capture possibilities (for hint glow)
  const handCardCanCapture = gameState.settings.userHints && !!selectedHandCard && captures.length > 0;

  const phase = aiAnimation?.phase;
  const capturedCardIds = aiAnimation?.capturedCards.map((c) => c.id) || [];
  const showPlayedCard = aiAnimation && phase !== 'done';
  const playedCardInTable = gameState.table.some((c) => c.id === aiAnimation?.cardPlayed.id);

  return (
    <div className={styles.container}>
      <button onClick={() => setShowExitConfirm(true)} className={styles.menuButton}>
        ← Menú
      </button>

      <div className={styles.content}>
        {/* Opponents */}
        <div className={styles.opponentsArea}>
          {opponents.map((opponent, idx) => {
            const isActive = gameState.currentPlayerIndex === idx + 1;
            return (
              <div key={opponent.id} className={styles.opponentSection}>
                <div className={`${styles.playerName} ${isActive ? styles.playerNameActive : ''}`}>
                  {opponent.name} ({gameState.scores[opponent.id]} puntos)
                  {opponent.escobas > 0 && (
                    <span className={styles.escobaIcons}>
                      {Array.from({ length: opponent.escobas }).map((_, i) => (
                        <img key={i} src="/escoba.png" alt="escoba" title="¡Escoba!" className={styles.escobaIcon} />
                      ))}
                    </span>
                  )}
                </div>
                <div className={styles.cardRow}>
                  {opponent.hand.map((_, i) => (
                    <Card
                      key={i}
                      card={{ id: `hidden-${i}`, suit: 'oros', value: 1 }}
                      faceDown
                      small
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className={styles.tableArea}>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.roundIndicator}>Ronda {gameState.roundNumber}</span>
              {aiAnimation && (
                <span className={styles.tableStatus}>
                  {aiAnimation.playerName}
                  {phase === 'cardPlayed' && ' juega...'}
                  {phase === 'capturing' && ' captura...'}
                </span>
              )}
            </div>
            <div className={styles.tableContent}>
              <div
                className={styles.deckArea}
                title={gameState.deck.length > 0 ? `${gameState.deck.length} cartas en el mazo` : 'Mazo vacío'}
              >
                <div className={styles.deckStack}>
                  {gameState.deck.length > 0 ? (
                    <>
                      <Card card={{ id: 'deck-1', suit: 'oros', value: 1 }} faceDown />
                      {gameState.deck.length > 5 && (
                        <div className={styles.deckCardOffset}>
                          <Card card={{ id: 'deck-2', suit: 'oros', value: 1 }} faceDown />
                        </div>
                      )}
                      {gameState.deck.length > 15 && (
                        <div className={styles.deckCardOffset2}>
                          <Card card={{ id: 'deck-3', suit: 'oros', value: 1 }} faceDown />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.emptyDeck} />
                  )}
                </div>
              </div>
              <div className={styles.tableCards}>
              {gameState.table.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  selected={selectedTableCards.some((c) => c.id === card.id)}
                  highlighted={capturedCardIds.includes(card.id) && phase === 'capturing'}
                  onClick={() => isHumanTurn && !aiAnimation && onToggleTableCard(card)}
                  disabled={!isHumanTurn || !!aiAnimation}
                />
              ))}
              {showPlayedCard && !playedCardInTable && (
                <Card
                  key={aiAnimation.cardPlayed.id}
                  card={aiAnimation.cardPlayed}
                  justPlayed={phase === 'cardPlayed' || (phase === 'capturing' && aiAnimation.capturedCards.length > 0)}
                  settling={phase === 'settling'}
                  highlighted={phase === 'capturing' && aiAnimation.capturedCards.length > 0}
                />
              )}
              {gameState.table.length === 0 && !showPlayedCard && (
                <div className={styles.emptyTable}>Mesa vacía</div>
              )}
              </div>
            </div>
            {aiAnimation?.isEscoba && phase === 'capturing' && (
              <div className={styles.escobaAnnouncement}>¡ESCOBA!</div>
            )}
          </div>
        </div>

        {/* Player hand */}
        <div className={styles.playerHandSection}>
          <div className={`${styles.playerName} ${isHumanTurn ? styles.playerNameActive : ''}`}>
            {humanPlayer.name} ({gameState.scores[humanPlayer.id]} puntos)
            {humanPlayer.escobas > 0 && (
              <span className={styles.escobaIcons}>
                {Array.from({ length: humanPlayer.escobas }).map((_, i) => (
                  <img key={i} src="/escoba.png" alt="escoba" title="¡Escoba!" className={styles.escobaIcon} />
                ))}
              </span>
            )}
          </div>
          <div className={styles.handCards}>
            {humanPlayer.hand.map((card) => {
              const isSelected = selectedHandCard?.id === card.id;
              return (
                <Card
                  key={card.id}
                  card={card}
                  selected={isSelected && !handCardCanCapture}
                  selectedValid={isSelected && handCardCanCapture}
                  onClick={() => isHumanTurn && !aiAnimation && onSelectHandCard(card)}
                  disabled={!isHumanTurn || !!aiAnimation}
                />
              );
            })}
          </div>

          {isHumanTurn && selectedHandCard && !aiAnimation && (
            <div className={styles.playerActions}>
              <button
                onClick={() => onPlayCard(canMakeCapture)}
                className={canMakeCapture ? styles.captureButton : styles.dropButton}
              >
                {canMakeCapture ? 'Capturar' : 'Soltar carta'}
              </button>
            </div>
          )}

          {!isHumanTurn && gameState.phase === 'playing' && !aiAnimation && (
            <div className={styles.thinkingMessage}>
              {currentPlayer.name} está pensando...
            </div>
          )}
        </div>
      </div>

      {gameState.phase === 'roundEnd' && (
        <RoundEndModal gameState={gameState} onNewRound={onNewRound} />
      )}

      {gameState.phase === 'gameEnd' && (
        <GameEndModal gameState={gameState} onResetGame={onResetGame} />
      )}

      {showExitConfirm && (
        <ExitConfirmModal
          onConfirm={onResetGame}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  );
}

const ExitConfirmModal = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  return (
    <div className={styles.modalOverlay} onClick={onCancel} role="presentation">
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="exit-confirm-title">
        <h2 id="exit-confirm-title" className={styles.confirmTitle}>¿Salir de la partida?</h2>
        <p className={styles.confirmText}>
          Perderás todo el progreso de la partida actual.
        </p>
        <div className={styles.confirmButtons}>
          <button onClick={onCancel} className={styles.cancelButton}>
            Cancelar
          </button>
          <button onClick={onConfirm} className={styles.exitButton}>
            Salir
          </button>
        </div>
      </div>
    </div>
  );
};

const RoundEndModal = ({
  gameState,
  onNewRound,
}: {
  gameState: GameState;
  onNewRound: () => void;
}) => {
  const { winners, maxScore, humanWon } = getGameWinners(
    gameState.players,
    gameState.scores
  );
  const hasWinner = maxScore >= gameState.targetScore;
  const categoryWinners = calculateCategoryWinners(gameState.players);

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={`${styles.modalContent} ${styles.modalContentWide}`} role="dialog" aria-modal="true" aria-labelledby="round-end-title">
        <h2 id="round-end-title" className={styles.modalTitle}>Fin de la ronda {gameState.roundNumber}</h2>

        {/* Cards section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Cartas capturadas</h3>
          <div className={styles.playersGrid}>
            {gameState.players.map((player) => (
              <div key={player.id} className={styles.playerRow}>
                <div className={`${styles.playerRowName} ${player.isHuman ? styles.playerRowNameHuman : ''}`}>
                  {player.name}
                  {player.escobas > 0 && (
                    <span className={styles.escobasInline}>
                      {' '}- {player.escobas} escoba{player.escobas !== 1 && 's'}
                    </span>
                  )}
                </div>
                <div className={styles.playerCards}>
                  {player.captured.map((card) => (
                    <Card key={card.id} card={card} small />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Categorías</h3>
          <div className={styles.categoryWinners}>
            <div className={styles.categoryCard}>
              <div className={styles.categoryLabel}>Cartas ({categoryWinners.cards.count})</div>
              <div className={`${styles.categoryWinner} ${categoryWinners.cards.winner ? styles.categoryWinnerActive : styles.categoryWinnerTie}`}>
                {categoryWinners.cards.winner?.name || 'Empate'}
              </div>
            </div>
            <div className={styles.categoryCard}>
              <div className={styles.categoryLabel}>Oros ({categoryWinners.oros.count})</div>
              <div className={`${styles.categoryWinner} ${categoryWinners.oros.winner ? styles.categoryWinnerActive : styles.categoryWinnerTie}`}>
                {categoryWinners.oros.winner?.name || 'Empate'}
              </div>
            </div>
            <div className={styles.categoryCard}>
              <div className={styles.categoryLabel}>Sietes ({categoryWinners.sevens.count})</div>
              <div className={`${styles.categoryWinner} ${categoryWinners.sevens.winner ? styles.categoryWinnerActive : styles.categoryWinnerTie}`}>
                {categoryWinners.sevens.winner?.name || 'Empate'}
              </div>
            </div>
            <div className={styles.categoryCard}>
              <div className={styles.categoryLabel}>7 de Oros</div>
              <div className={`${styles.categoryWinner} ${categoryWinners.sieteDeVelo ? styles.categoryWinnerActive : styles.categoryWinnerNone}`}>
                {categoryWinners.sieteDeVelo?.name || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Total scores */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Puntuación</h3>
          <div className={styles.totalScores}>
            {gameState.players.map((player) => {
              const isWinner = hasWinner && winners.some((w) => w.id === player.id);
              return (
                <div
                  key={player.id}
                  className={`${styles.totalScoreCard} ${isWinner ? styles.winner : ''}`}
                >
                  <div className={styles.totalScoreName}>{player.name}</div>
                  <div className={styles.totalScoreValue}>
                    {gameState.scores[player.id]} puntos
                  </div>
                  {isWinner && <div className={styles.winnerBadge}>Ganador</div>}
                </div>
              );
            })}
          </div>
        </div>

        {hasWinner && (
          <div className={styles.winnerAnnouncement}>
            {humanWon ? '¡Has ganado la partida!' : `${winners[0].name} gana la partida`}
          </div>
        )}

        <div className={styles.modalActions}>
          <button onClick={onNewRound} className={styles.primaryButton}>
            {hasWinner ? 'Ver resultados' : 'Siguiente ronda'}
          </button>
        </div>
      </div>
    </div>
  );
}

const GameEndModal = ({
  gameState,
  onResetGame,
}: {
  gameState: GameState;
  onResetGame: () => void;
}) => {
  const { winners, maxScore, humanWon } = getGameWinners(
    gameState.players,
    gameState.scores
  );
  const categoryWinners = calculateCategoryWinners(gameState.players);

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={`${styles.modalContent} ${styles.modalContentWide}`} role="dialog" aria-modal="true" aria-labelledby="game-end-title">
        <h2 id="game-end-title" className={`${styles.modalTitle} ${styles.modalTitleLarge} ${humanWon ? '' : styles.scoreCardInactive}`}>
          {humanWon ? '¡Has ganado!' : 'Has perdido'}
        </h2>
        <p className={styles.modalSubtitle}>
          {winners.map((w) => w.name).join(', ')} - {maxScore} puntos
        </p>

        {/* Cards section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Cartas capturadas</h3>
          <div className={styles.playersGrid}>
            {gameState.players.map((player) => (
              <div key={player.id} className={styles.playerRow}>
                <div className={`${styles.playerRowName} ${player.isHuman ? styles.playerRowNameHuman : ''}`}>
                  {player.name}
                  {player.escobas > 0 && (
                    <span className={styles.escobasInline}>
                      {' '}- {player.escobas} escoba{player.escobas !== 1 && 's'}
                    </span>
                  )}
                </div>
                <div className={styles.playerCards}>
                  {player.captured.map((card) => (
                    <Card key={card.id} card={card} small />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Categorías</h3>
          <div className={styles.categoryWinners}>
            <div className={styles.categoryCard}>
              <div className={styles.categoryLabel}>Cartas ({categoryWinners.cards.count})</div>
              <div className={`${styles.categoryWinner} ${categoryWinners.cards.winner ? styles.categoryWinnerActive : styles.categoryWinnerTie}`}>
                {categoryWinners.cards.winner?.name || 'Empate'}
              </div>
            </div>
            <div className={styles.categoryCard}>
              <div className={styles.categoryLabel}>Oros ({categoryWinners.oros.count})</div>
              <div className={`${styles.categoryWinner} ${categoryWinners.oros.winner ? styles.categoryWinnerActive : styles.categoryWinnerTie}`}>
                {categoryWinners.oros.winner?.name || 'Empate'}
              </div>
            </div>
            <div className={styles.categoryCard}>
              <div className={styles.categoryLabel}>Sietes ({categoryWinners.sevens.count})</div>
              <div className={`${styles.categoryWinner} ${categoryWinners.sevens.winner ? styles.categoryWinnerActive : styles.categoryWinnerTie}`}>
                {categoryWinners.sevens.winner?.name || 'Empate'}
              </div>
            </div>
            <div className={styles.categoryCard}>
              <div className={styles.categoryLabel}>7 de Oros</div>
              <div className={`${styles.categoryWinner} ${categoryWinners.sieteDeVelo ? styles.categoryWinnerActive : styles.categoryWinnerNone}`}>
                {categoryWinners.sieteDeVelo?.name || '-'}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button onClick={onResetGame} className={`${styles.primaryButton} ${styles.primaryButtonSmall}`}>
            Nueva partida
          </button>
        </div>
      </div>
    </div>
  );
}
