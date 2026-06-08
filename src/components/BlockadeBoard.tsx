import { useState } from 'react';
import { useBlockadeGame } from '../hooks/useBlockadeGame';
import { topCard } from '../utils/blockadeLogic';
import { TOTAL_CARDS, type BlockadeSettings } from '../types/blockade';
import { BlockadeCard } from './BlockadeCard';
import { BackButton } from './BackButton';
import { ConfirmModal } from './ConfirmModal';
import styles from './BlockadeBoard.module.css';

interface Props {
  settings: BlockadeSettings;
  onExit: () => void;
}

export const BlockadeBoard = ({ settings, onExit }: Props) => {
  const {
    state,
    selected,
    destinationTableau,
    destinationFoundations,
    movableColumns,
    placedCount,
    scorePercent,
    handleColumnClick,
    handleFoundationClick,
    deal,
    newGame,
    giveUp,
  } = useBlockadeGame(settings);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);

  const handleBackClick = () => {
    if (state.status === 'playing') setShowExitConfirm(true);
    else onExit();
  };

  return (
    <div className={styles.container}>
      <BackButton label="Blockade" onClick={handleBackClick} />

      <div className={styles.header}>
        <h1 className={styles.title}>Blockade</h1>
        <div className={styles.stats}>
          <span>
            Bases: <strong>{placedCount}/{TOTAL_CARDS}</strong>
          </span>
          <span>
            Movimientos: <strong>{state.moves}</strong>
          </span>
          <span>
            Repartos: <strong>{state.deals}</strong>
          </span>
        </div>
      </div>

      <div className={styles.topRow}>
        <div className={styles.foundations}>
          {state.foundations.map((foundation, i) => (
            <BlockadeCard
              key={i}
              card={topCard(foundation)}
              placeholder="A"
              isDestination={destinationFoundations.has(i)}
              onClick={() => handleFoundationClick(i)}
            />
          ))}
        </div>

        <button
          className={styles.stock}
          onClick={deal}
          disabled={state.status !== 'playing' || state.stock.length === 0}
          aria-label="repartir fila"
        >
          {state.stock.length > 0 ? (
            <>
              <span className={styles.stockCount}>{state.stock.length}</span>
              <span className={styles.stockLabel}>en mazo</span>
            </>
          ) : (
            <span className={styles.stockEmpty}>vacío</span>
          )}
        </button>
      </div>

      <div className={styles.boardWrap}>
        <div className={styles.board}>
          {state.tableau.map((pile, col) => {
            const isDest = destinationTableau.has(col);
            const isMovable = movableColumns.has(col);
            return (
              <div
                key={col}
                className={styles.column}
                onClick={() => handleColumnClick(col)}
                role="button"
                aria-label={`columna ${col + 1}`}
              >
                {pile.length === 0 ? (
                  <BlockadeCard card={null} isDestination={isDest} />
                ) : (
                  pile.map((card, idx) => {
                    const isTop = idx === pile.length - 1;
                    return (
                      <BlockadeCard
                        key={card.id}
                        card={card}
                        isStacked
                        isSelected={isTop && selected === col}
                        isDestination={isTop && isDest}
                        isMovableHint={isTop && isMovable}
                      />
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          onClick={deal}
          disabled={state.status !== 'playing' || state.stock.length === 0}
          className={styles.primaryButton}
        >
          Repartir fila ({state.stock.length})
        </button>
        {state.status === 'playing' && (
          <button onClick={() => setShowGiveUpConfirm(true)} className={styles.secondaryButton}>
            Rendirse
          </button>
        )}
      </div>

      {state.status !== 'playing' && (
        <FinishedModal
          won={state.status === 'won'}
          score={scorePercent}
          placed={placedCount}
          moves={state.moves}
          deals={state.deals}
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

      {showGiveUpConfirm && (
        <ConfirmModal
          title="¿Rendirse?"
          message="Se terminará la partida actual."
          confirmLabel="Rendirse"
          onConfirm={() => {
            setShowGiveUpConfirm(false);
            giveUp();
          }}
          onCancel={() => setShowGiveUpConfirm(false)}
        />
      )}
    </div>
  );
};

const FinishedModal = ({
  won,
  score,
  placed,
  moves,
  deals,
  onNewGame,
  onBack,
}: {
  won: boolean;
  score: number;
  placed: number;
  moves: number;
  deals: number;
  onNewGame: () => void;
  onBack: () => void;
}) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2 className={styles.modalTitle}>{won ? '¡Ganaste!' : 'Partida terminada'}</h2>
      <div className={styles.scoreDisplay}>
        <span className={styles.scoreValue}>{score}%</span>
      </div>
      {won ? (
        <p className={styles.modalText}>¡Enhorabuena! Completaste las ocho bases.</p>
      ) : (
        <p className={styles.modalText}>No quedan más jugadas posibles.</p>
      )}
      <ul className={styles.statsList}>
        <li>
          Cartas en las bases: <strong>{placed} de {TOTAL_CARDS}</strong>
        </li>
        <li>
          Movimientos: <strong>{moves}</strong>
        </li>
        <li>
          Repartos: <strong>{deals}</strong>
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
