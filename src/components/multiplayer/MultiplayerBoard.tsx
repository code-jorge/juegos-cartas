import { useState, useMemo } from 'react';
import type { Card as CardType } from '../../types';
import type { ClientGameState } from '../../types/multiplayer';
import { Card } from '../Card';
import { SessionTimer } from './SessionTimer';
import { calculateMultiplayerCategoryWinners, getMultiplayerGameWinners } from '../../utils/scoring';
import styles from '../GameBoard.module.css';
import mpStyles from './MultiplayerBoard.module.css';

interface MultiplayerBoardProps {
  gameState: ClientGameState;
  playerId: string;
  onPlayCard: (cardId: string, captureCardIds: string[]) => Promise<void>;
  onStartNewRound: () => Promise<void>;
  onNewGame: () => Promise<void>;
  onLeave: () => void;
}

const TARGET_SUM = 15;

export const MultiplayerBoard = ({
  gameState,
  playerId,
  onPlayCard,
  onStartNewRound,
  onNewGame,
  onLeave,
}: MultiplayerBoardProps) => {
  const [selectedTableCards, setSelectedTableCards] = useState<CardType[]>([]);
  const [selectedHandCard, setSelectedHandCard] = useState<CardType | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const myPlayerIndex = gameState.players.findIndex((p) => p.id === playerId);
  const isMyTurn = currentPlayer?.id === playerId && !gameState.isSpectator;
  const otherPlayers = gameState.players.filter((p) => p.id !== playerId);

  // Calculate if current selection is a valid capture
  const canCapture = useMemo(() => {
    if (!selectedHandCard || selectedTableCards.length === 0) return false;
    const sum =
      selectedHandCard.value +
      selectedTableCards.reduce((acc, c) => acc + c.value, 0);
    return sum === TARGET_SUM;
  }, [selectedHandCard, selectedTableCards]);

  const handleToggleTableCard = (card: CardType) => {
    if (!isMyTurn || isPlaying) return;
    setSelectedTableCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      if (exists) {
        return prev.filter((c) => c.id !== card.id);
      }
      return [...prev, card];
    });
  };

  const handleSelectHandCard = (card: CardType) => {
    if (!isMyTurn || isPlaying) return;
    setSelectedHandCard((prev) => (prev?.id === card.id ? null : card));
    setSelectedTableCards([]);
  };

  const handlePlayCard = async () => {
    if (!selectedHandCard || isPlaying) return;

    setIsPlaying(true);
    try {
      await onPlayCard(
        selectedHandCard.id,
        canCapture ? selectedTableCards.map((c) => c.id) : []
      );
      setSelectedHandCard(null);
      setSelectedTableCards([]);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleExitConfirm = () => {
    onLeave();
  };

  return (
    <div className={styles.container}>
      <button onClick={() => setShowExitConfirm(true)} className={styles.menuButton}>
        ← Salir
      </button>

      <div className={mpStyles.sessionTimerWrapper}>
        <SessionTimer expiresAt={gameState.expiresAt} />
      </div>

      {gameState.isSpectator && (
        <div className={mpStyles.spectatorBanner}>Modo Espectador</div>
      )}

      <div className={styles.content}>
        {/* Other players */}
        <div className={styles.opponentsArea}>
          {otherPlayers.map((player) => {
            const playerIdx = gameState.players.findIndex((p) => p.id === player.id);
            const isActive = gameState.currentPlayerIndex === playerIdx;
            return (
              <div key={player.id} className={styles.opponentSection}>
                <div className={`${styles.playerName} ${isActive ? styles.playerNameActive : ''}`}>
                  {player.name}
                  {!player.isConnected && (
                    <span className={mpStyles.disconnectedBadge}>(desconectado)</span>
                  )}
                  {' '}({gameState.scores[player.id]} puntos)
                  {player.escobas > 0 && (
                    <span className={styles.escobaIcons}>
                      {Array.from({ length: player.escobas }).map((_, i) => (
                        <img key={i} src="/escoba.png" alt="escoba" title="¡Escoba!" className={styles.escobaIcon} />
                      ))}
                    </span>
                  )}
                </div>
                <div className={styles.cardRow}>
                  {Array.from({ length: player.handSize }).map((_, i) => (
                    <Card
                      key={i}
                      card={{ id: `hidden-${player.id}-${i}`, suit: 'oros', value: 1 }}
                      faceDown
                      small
                    />
                  ))}
                  {player.handSize === 0 && (
                    <span className={mpStyles.noCards}>Sin cartas</span>
                  )}
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
              <span className={mpStyles.turnIndicator}>
                {isMyTurn ? 'Tu turno' : `Turno de ${currentPlayer?.name || '...'}`}
              </span>
            </div>
            <div className={styles.tableContent}>
              <div
                className={styles.deckArea}
                title={gameState.deckSize > 0 ? `${gameState.deckSize} cartas en el mazo` : 'Mazo vacío'}
              >
                <div className={styles.deckStack}>
                  {gameState.deckSize > 0 ? (
                    <>
                      <Card card={{ id: 'deck-1', suit: 'oros', value: 1 }} faceDown />
                      {gameState.deckSize > 5 && (
                        <div className={styles.deckCardOffset}>
                          <Card card={{ id: 'deck-2', suit: 'oros', value: 1 }} faceDown />
                        </div>
                      )}
                      {gameState.deckSize > 15 && (
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
                    onClick={() => handleToggleTableCard(card)}
                    disabled={!isMyTurn || isPlaying}
                  />
                ))}
                {gameState.table.length === 0 && (
                  <div className={styles.emptyTable}>Mesa vacía</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* My hand */}
        {!gameState.isSpectator && (
          <div className={styles.playerHandSection}>
            <div className={`${styles.playerName} ${isMyTurn ? styles.playerNameActive : ''}`}>
              {gameState.players[myPlayerIndex]?.name || 'Tu'}
              {' '}({gameState.scores[playerId]} puntos)
              {gameState.players[myPlayerIndex]?.escobas > 0 && (
                <span className={styles.escobaIcons}>
                  {Array.from({ length: gameState.players[myPlayerIndex].escobas }).map((_, i) => (
                    <img key={i} src="/escoba.png" alt="escoba" title="¡Escoba!" className={styles.escobaIcon} />
                  ))}
                </span>
              )}
            </div>
            <div className={styles.handCards}>
              {gameState.myHand.map((card) => {
                const isSelected = selectedHandCard?.id === card.id;
                return (
                  <Card
                    key={card.id}
                    card={card}
                    selected={isSelected}
                    selectedValid={isSelected && canCapture}
                    onClick={() => handleSelectHandCard(card)}
                    disabled={!isMyTurn || isPlaying}
                  />
                );
              })}
            </div>

            {isMyTurn && selectedHandCard && !isPlaying && (
              <div className={styles.playerActions}>
                <button
                  onClick={handlePlayCard}
                  className={canCapture ? styles.captureButton : styles.dropButton}
                >
                  {canCapture ? 'Capturar' : 'Soltar carta'}
                </button>
              </div>
            )}

            {isMyTurn && isPlaying && (
              <div className={styles.thinkingMessage}>Enviando jugada...</div>
            )}

            {!isMyTurn && gameState.phase === 'playing' && (
              <div className={styles.thinkingMessage}>
                Esperando a {currentPlayer?.name || '...'}...
              </div>
            )}
          </div>
        )}

        {/* Spectator view of current player info */}
        {gameState.isSpectator && (
          <div className={mpStyles.spectatorInfo}>
            <p>Cartas en el mazo: {gameState.deckSize}</p>
            <p>Turno actual: {currentPlayer?.name || '...'}</p>
          </div>
        )}
      </div>

      {gameState.phase === 'roundEnd' && (
        <RoundEndModal
          gameState={gameState}
          playerId={playerId}
          onNewRound={onStartNewRound}
        />
      )}

      {gameState.phase === 'gameEnd' && (
        <GameEndModal
          gameState={gameState}
          playerId={playerId}
          onNewGame={onNewGame}
          onLeave={onLeave}
        />
      )}

      {showExitConfirm && (
        <ExitConfirmModal
          onConfirm={handleExitConfirm}
          onCancel={() => setShowExitConfirm(false)}
          inProgress={gameState.phase === 'playing'}
        />
      )}
    </div>
  );
};

const ExitConfirmModal = ({
  onConfirm,
  onCancel,
  inProgress,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  inProgress: boolean;
}) => {
  return (
    <div className={styles.modalOverlay} onClick={onCancel} role="presentation">
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="mp-exit-confirm-title">
        <h2 id="mp-exit-confirm-title" className={styles.confirmTitle}>¿Salir de la partida?</h2>
        <p className={styles.confirmText}>
          {inProgress
            ? 'La partida está en curso. Si sales, no podrás volver a unirte.'
            : '¿Seguro que quieres salir?'}
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
  playerId,
  onNewRound,
}: {
  gameState: ClientGameState;
  playerId: string;
  onNewRound: () => void;
}) => {
  const { winners, maxScore, iWon } = getMultiplayerGameWinners(
    gameState.players,
    gameState.scores,
    playerId
  );
  const hasWinner = maxScore >= gameState.targetScore;
  const categoryWinners = calculateMultiplayerCategoryWinners(gameState.players);

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={`${styles.modalContent} ${styles.modalContentWide}`} role="dialog" aria-modal="true" aria-labelledby="mp-round-end-title">
        <h2 id="mp-round-end-title" className={styles.modalTitle}>Fin de la ronda {gameState.roundNumber}</h2>

        {/* Cards section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Cartas capturadas</h3>
          <div className={styles.playersGrid}>
            {gameState.players.map((player) => {
              const isMe = player.id === playerId;
              return (
                <div key={player.id} className={styles.playerRow}>
                  <div className={`${styles.playerRowName} ${isMe ? styles.playerRowNameHuman : ''}`}>
                    {player.name} {isMe && '(tú)'}
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
              );
            })}
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
              const isMe = player.id === playerId;
              const score = gameState.scores[player.id] || 0;
              const isWinner = hasWinner && winners.some((w) => w.id === player.id);
              return (
                <div
                  key={player.id}
                  className={`${styles.totalScoreCard} ${isWinner ? styles.winner : ''}`}
                >
                  <div className={styles.totalScoreName}>
                    {player.name} {isMe && '(tú)'}
                  </div>
                  <div className={styles.totalScoreValue}>
                    {score} puntos
                  </div>
                  {isWinner && <div className={styles.winnerBadge}>Ganador</div>}
                </div>
              );
            })}
          </div>
        </div>

        {hasWinner && (
          <div className={styles.winnerAnnouncement}>
            {iWon ? '¡Has ganado la partida!' : `${winners[0].name} gana la partida`}
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
};

const GameEndModal = ({
  gameState,
  playerId,
  onNewGame,
  onLeave,
}: {
  gameState: ClientGameState;
  playerId: string;
  onNewGame: () => void;
  onLeave: () => void;
}) => {
  const { winners, maxScore, iWon } = getMultiplayerGameWinners(
    gameState.players,
    gameState.scores,
    playerId
  );
  const categoryWinners = calculateMultiplayerCategoryWinners(gameState.players);

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={`${styles.modalContent} ${styles.modalContentWide}`} role="dialog" aria-modal="true" aria-labelledby="mp-game-end-title">
        <h2 id="mp-game-end-title" className={`${styles.modalTitle} ${styles.modalTitleLarge} ${iWon ? '' : styles.scoreCardInactive}`}>
          {iWon ? '¡Has ganado!' : 'Fin de la partida'}
        </h2>
        <p className={styles.modalSubtitle}>
          {winners.map((w) => w.name).join(', ')} - {maxScore} puntos
        </p>

        {/* Cards section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Cartas capturadas</h3>
          <div className={styles.playersGrid}>
            {gameState.players.map((player) => {
              const isMe = player.id === playerId;
              return (
                <div key={player.id} className={styles.playerRow}>
                  <div className={`${styles.playerRowName} ${isMe ? styles.playerRowNameHuman : ''}`}>
                    {player.name} {isMe && '(tú)'}
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
              );
            })}
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

        {/* Final scores */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Puntuación final</h3>
          <div className={styles.totalScores}>
            {gameState.players.map((player) => {
              const isMe = player.id === playerId;
              const score = gameState.scores[player.id] || 0;
              const isWinner = winners.some((w) => w.id === player.id);
              return (
                <div
                  key={player.id}
                  className={`${styles.totalScoreCard} ${isWinner ? styles.winner : ''}`}
                >
                  <div className={styles.totalScoreName}>
                    {player.name} {isMe && '(tú)'}
                  </div>
                  <div className={styles.totalScoreValue}>
                    {score} puntos
                  </div>
                  {isWinner && <div className={styles.winnerBadge}>Ganador</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button onClick={onNewGame} className={`${styles.primaryButton} ${styles.primaryButtonSmall}`}>
            Nueva partida
          </button>
          <button
            onClick={onLeave}
            className={mpStyles.secondaryButton}
            style={{ marginLeft: '1rem' }}
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
};
