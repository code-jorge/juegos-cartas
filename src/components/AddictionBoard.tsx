import { useState } from 'react';
import { useAddictionGame } from '../hooks/useAddictionGame';
import { getGapRequirement, isLocked } from '../utils/addictionLogic';
import type { AddictionSettings } from '../types/addiction';
import { AddictionCard } from './AddictionCard';
import { BackButton } from './BackButton';
import { ConfirmModal } from './ConfirmModal';
import styles from './AddictionBoard.module.css';

interface Props {
  settings: AddictionSettings;
  onExit: () => void;
}

const formatRedeals = (n: number) => (n === Infinity ? '∞' : `${n}`);

export const AddictionBoard = ({ settings, onExit }: Props) => {
  const {
    state,
    selected,
    highlightedDestinations,
    highlightedSources,
    movableSet,
    boardWon,
    canFinish,
    scorePercent,
    placedCount,
    maxPlaceable,
    handleClick,
    newGame,
    redeal,
    finishGame,
  } = useAddictionGame(settings);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isHighlightedAt = (positions: typeof highlightedDestinations, row: number, col: number) =>
    positions.some((p) => p.row === row && p.col === col);

  const isSelectedAt = (row: number, col: number) =>
    selected !== null && selected.row === row && selected.col === col;

  const handleBackClick = () => {
    if (state.status === 'playing') {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  return (
    <div className={styles.container}>
      <BackButton label="Addiction" onClick={handleBackClick} />

      <div className={styles.header}>
        <h1 className={styles.title}>Addiction</h1>
        <div className={styles.stats}>
          <span>
            Movimientos: <strong>{state.moves}</strong>
          </span>
        </div>
      </div>

      <div className={styles.boardWrap}>
        <div className={styles.board}>
          {state.grid.map((row, r) => (
            <div key={r} className={styles.row}>
              {row.map((cell, c) => {
                const isDeadGap = cell === null && getGapRequirement(state.grid, r, c) === null;
                const locked = cell !== null && isLocked(state.grid, r, c);
                return (
                  <AddictionCard
                    key={`${r}-${c}`}
                    card={cell}
                    onClick={() => handleClick({ row: r, col: c })}
                    isSelected={isSelectedAt(r, c)}
                    isDestination={isHighlightedAt(highlightedDestinations, r, c)}
                    isSource={isHighlightedAt(highlightedSources, r, c)}
                    isMovableHint={movableSet.has(`${r}-${c}`)}
                    isDeadGap={isDeadGap}
                    isLocked={locked}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {boardWon && state.status === 'playing' && (
        <div className={styles.congrats}>
          🎉 ¡Felicidades! Has resuelto el tablero.
        </div>
      )}

      <div className={styles.controls}>
        {canFinish ? (
          <button onClick={finishGame} className={styles.primaryButton}>
            Terminar partida
          </button>
        ) : (
          <button
            onClick={redeal}
            disabled={state.status !== 'playing'}
            className={styles.primaryButton}
          >
            Repartir ({formatRedeals(state.redealsLeft)})
          </button>
        )}
      </div>

      {state.status === 'finished' && (
        <FinishedModal
          score={scorePercent}
          placed={placedCount}
          total={maxPlaceable}
          won={boardWon}
          moves={state.moves}
          onNewGame={newGame}
          onBack={onExit}
        />
      )}

      {showExitConfirm && (
        <ConfirmModal
          title="¿Salir de la partida?"
          message="Perderás todo el progreso de la partida actual."
          confirmLabel="Salir"
          onConfirm={onExit}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  );
};

const FinishedModal = ({
  score,
  placed,
  total,
  won,
  moves,
  onNewGame,
  onBack,
}: {
  score: number;
  placed: number;
  total: number;
  won: boolean;
  moves: number;
  onNewGame: () => void;
  onBack: () => void;
}) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2 className={styles.modalTitle}>{won ? '¡Ganaste!' : 'Partida terminada'}</h2>
      <div className={styles.scoreDisplay}>
        <span className={styles.scoreValue}>{score}%</span>
      </div>
      {won && (
        <p className={styles.modalText}>¡Enhorabuena! Resolviste todo el tablero.</p>
      )}
      <ul className={styles.statsList}>
        <li>
          Cartas colocadas: <strong>{placed} de {total}</strong>
        </li>
        <li>
          Movimientos: <strong>{moves}</strong>
        </li>
      </ul>
      <div className={styles.modalButtons}>
        <button onClick={onBack} className={styles.secondaryButton}>
          Volver
        </button>
        <button onClick={onNewGame} className={styles.primaryButton}>
          Nueva partida
        </button>
      </div>
    </div>
  </div>
);
