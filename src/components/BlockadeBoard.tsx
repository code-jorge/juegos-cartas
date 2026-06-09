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
    destinationTableau,
    destinationFoundations,
    selectedKeys,
    movableKeys,
    placedCount,
    scorePercent,
    handleCardClick,
    handleFoundationClick,
    handleEmptyColumnClick,
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

  const stockEmpty = state.stock.length === 0;

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
        <div className={styles.topRowInner}>
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
            className={stockEmpty ? styles.stockEmpty : styles.stock}
            onClick={deal}
            disabled={state.status !== 'playing' || stockEmpty}
            aria-label="repartir fila"
          >
            <span className={styles.stockEmblem}>{stockEmpty ? '∅' : '♠'}</span>
          </button>
        </div>
      </div>

      <div className={styles.boardWrap}>
        <div className={styles.board}>
          {state.tableau.map((pile, col) => (
            <div key={col} className={styles.column}>
              {pile.length === 0 ? (
                <BlockadeCard
                  card={null}
                  onClick={() => handleEmptyColumnClick(col)}
                  isDestination={destinationTableau.has(col)}
                />
              ) : (
                pile.map((card, idx) => {
                  const key = `${col}-${idx}`;
                  const isTop = idx === pile.length - 1;
                  return (
                    <BlockadeCard
                      key={card.id}
                      card={card}
                      isStacked
                      onClick={() => handleCardClick(col, idx)}
                      isSelected={selectedKeys.has(key)}
                      isDestination={isTop && destinationTableau.has(col)}
                      isMovableHint={movableKeys.has(key)}
                    />
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          onClick={deal}
          disabled={state.status !== 'playing' || stockEmpty}
          className={styles.primaryButton}
        >
          Repartir fila
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
