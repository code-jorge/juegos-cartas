import { useState } from 'react';
import { useAddictionGame } from '../hooks/useAddictionGame';
import { getGapRequirement } from '../utils/addictionLogic';
import { COLS, ROWS } from '../types/addiction';
import type { AddictionSettings } from '../types/addiction';
import { AddictionCard } from './AddictionCard';
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
    handleClick,
    newGame,
    redeal,
  } = useAddictionGame(settings);

  const [showRules, setShowRules] = useState(false);
  const [showHints, setShowHints] = useState(false);
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
      <button onClick={handleBackClick} className={styles.backLink}>
        ← Otros juegos
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Addiction</h1>
        <div className={styles.stats}>
          <span>
            Movimientos: <strong>{state.moves}</strong>
          </span>
          <span>
            Repartos: <strong>{formatRedeals(state.redealsLeft)}/{formatRedeals(state.redealsTotal)}</strong>
          </span>
          <button onClick={() => setShowRules(true)} className={styles.rulesLink}>
            ¿Cómo jugar?
          </button>
        </div>
      </div>

      <div className={styles.boardWrap}>
        <div className={styles.board}>
          {state.grid.map((row, r) => (
            <div key={r} className={styles.row}>
              {row.map((cell, c) => {
                const isDeadGap = cell === null && getGapRequirement(state.grid, r, c) === null;
                return (
                  <AddictionCard
                    key={`${r}-${c}`}
                    card={cell}
                    onClick={() => handleClick({ row: r, col: c })}
                    isSelected={isSelectedAt(r, c)}
                    isDestination={isHighlightedAt(highlightedDestinations, r, c)}
                    isSource={isHighlightedAt(highlightedSources, r, c)}
                    isMovableHint={showHints && movableSet.has(`${r}-${c}`)}
                    isDeadGap={isDeadGap}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          onClick={redeal}
          disabled={state.redealsLeft <= 0 || state.status !== 'playing'}
          className={styles.primaryButton}
        >
          Repartir ({formatRedeals(state.redealsLeft)})
        </button>
        <button
          onClick={() => setShowHints((v) => !v)}
          className={showHints ? styles.hintButtonActive : styles.hintButton}
          aria-pressed={showHints}
        >
          {showHints ? 'Ocultar pistas' : 'Pistas'}
        </button>
      </div>

      {state.status === 'won' && (
        <EndModal
          title="¡Ganaste!"
          message={`Completaste el juego en ${state.moves} movimientos.`}
          onNewGame={newGame}
        />
      )}

      {state.status === 'lost' && (
        <EndModal
          title="Sin movimientos"
          message="No quedan jugadas válidas y has agotado los repartos."
          onNewGame={newGame}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

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

const EndModal = ({
  title,
  message,
  onNewGame,
}: {
  title: string;
  message: string;
  onNewGame: () => void;
}) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2 className={styles.modalTitle}>{title}</h2>
      <p className={styles.modalText}>{message}</p>
      <button onClick={onNewGame} className={styles.primaryButton}>
        Nueva partida
      </button>
    </div>
  </div>
);

const RulesModal = ({ onClose }: { onClose: () => void }) => (
  <div className={styles.modalOverlay} onClick={onClose}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <button onClick={onClose} className={styles.closeButton} aria-label="cerrar">
        ×
      </button>
      <h2 className={styles.modalTitle}>¿Cómo jugar?</h2>
      <div className={styles.rulesContent}>
        <section>
          <h3>Objetivo</h3>
          <p>
            Ordena las {ROWS} filas, cada una con un palo, del <strong>2 al K</strong> empezando
            por la izquierda.
          </p>
        </section>
        <section>
          <h3>Tablero</h3>
          <p>
            {ROWS}×{COLS}, 52 cartas sin los ases. Los 4 ases se retiran y dejan{' '}
            <strong>4 huecos</strong>.
          </p>
        </section>
        <section>
          <h3>Movimientos</h3>
          <ul>
            <li>
              Un hueco se llena con la carta del <strong>mismo palo</strong> y{' '}
              <strong>rango +1</strong> respecto a la carta de su izquierda.
            </li>
            <li>
              Un hueco en la <strong>primera columna</strong> acepta cualquier <strong>2</strong>.
            </li>
            <li>
              Un hueco a la derecha de un <strong>Rey</strong> queda muerto: nada lo puede llenar.
            </li>
          </ul>
        </section>
        <section>
          <h3>Repartir</h3>
          <p>
            Si te atascas, puedes <strong>repartir</strong>. Las cartas correctamente colocadas
            desde el 2 inicial se quedan fijas; el resto se baraja y se reparte de nuevo, con un
            hueco justo después de cada prefijo correcto.
          </p>
        </section>
        <section>
          <h3>Pistas</h3>
          <p>
            Si te quedas atascado, pulsa <strong>Pistas</strong> para resaltar las cartas que se
            pueden mover.
          </p>
        </section>
      </div>
      <button onClick={onClose} className={styles.primaryButton}>
        ¡Entendido!
      </button>
    </div>
  </div>
);
