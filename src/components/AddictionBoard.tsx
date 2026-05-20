import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAddictionGame } from '../hooks/useAddictionGame';
import { getGapRequirement } from '../utils/addictionLogic';
import { COLS, ROWS } from '../types/addiction';
import { AddictionCard } from './AddictionCard';
import styles from './AddictionBoard.module.css';

export const AddictionBoard = () => {
  const {
    state,
    selected,
    highlightedDestinations,
    highlightedSources,
    movableSet,
    handleClick,
    newGame,
    redeal,
  } = useAddictionGame();

  const [showRules, setShowRules] = useState(false);

  const isHighlightedAt = (positions: typeof highlightedDestinations, row: number, col: number) =>
    positions.some((p) => p.row === row && p.col === col);

  const isSelectedAt = (row: number, col: number) =>
    selected !== null && selected.row === row && selected.col === col;

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>
        ← Otros juegos
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Addiction Solitaire</h1>
        <div className={styles.stats}>
          <span>
            Movimientos: <strong>{state.moves}</strong>
          </span>
          <span>
            Repartos: <strong>{state.redealsLeft}/{state.redealsTotal}</strong>
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
                    isMovableHint={movableSet.has(`${r}-${c}`)}
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
          Repartir ({state.redealsLeft})
        </button>
        <button onClick={newGame} className={styles.secondaryButton}>
          Nueva partida
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
            Si te atascas, puedes <strong>repartir</strong> (2 veces). Las cartas correctamente
            colocadas desde el 2 inicial se quedan fijas; el resto se baraja y se reparte de nuevo,
            con un hueco justo después de cada prefijo correcto.
          </p>
        </section>
        <section>
          <h3>Cómo seleccionar</h3>
          <p>
            Toca una carta o un hueco. Si hay una sola jugada posible se realiza al instante; si hay
            varias opciones, las verás resaltadas en verde para que elijas.
          </p>
        </section>
      </div>
      <button onClick={onClose} className={styles.primaryButton}>
        ¡Entendido!
      </button>
    </div>
  </div>
);
