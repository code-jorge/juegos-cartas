import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AddictionSettings, ReshufflesOption } from '../types/addiction';
import { COLS, ROWS } from '../types/addiction';
import styles from './AddictionSetup.module.css';

interface Props {
  onStartGame: (settings: AddictionSettings) => void;
}

const RESHUFFLE_OPTIONS: { value: ReshufflesOption; label: string }[] = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: Infinity, label: '∞' },
];

export const AddictionSetup = ({ onStartGame }: Props) => {
  const [reshuffles, setReshuffles] = useState<ReshufflesOption>(3);
  const [showRules, setShowRules] = useState(false);

  const handleStart = () => {
    onStartGame({ initialReshuffles: reshuffles });
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>
        ← Otros juegos
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Addiction</h1>
        <p className={styles.subtitle}>Ordena las cartas por palo y valor</p>
      </div>

      <div className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Repartos disponibles:</label>
          <div className={styles.buttonGroup}>
            {RESHUFFLE_OPTIONS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setReshuffles(value)}
                className={`${styles.optionButton} ${reshuffles === value ? styles.active : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleStart} className={styles.startButton}>
          ¡Empezar partida!
        </button>
      </div>

      <button onClick={() => setShowRules(true)} className={styles.rulesLink}>
        ¿Cómo jugar?
      </button>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
};

const RulesModal = ({ onClose }: { onClose: () => void }) => (
  <div className={styles.modalOverlay} onClick={onClose}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <button onClick={onClose} className={styles.closeButton} aria-label="cerrar">
        ×
      </button>
      <h2 className={styles.modalTitle}>¿Cómo jugar a Addiction?</h2>
      <div className={styles.rulesContent}>
        <section className={styles.rulesSection}>
          <h3>Objetivo</h3>
          <p>
            Ordena las {ROWS} filas, cada una con un palo, del <strong>2 al K</strong> empezando
            por la izquierda.
          </p>
        </section>
        <section className={styles.rulesSection}>
          <h3>Tablero</h3>
          <p>
            {ROWS}×{COLS}, 52 cartas sin los ases. Los 4 ases se retiran y dejan{' '}
            <strong>4 huecos</strong>.
          </p>
        </section>
        <section className={styles.rulesSection}>
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
        <section className={styles.rulesSection}>
          <h3>Repartir</h3>
          <p>
            Si te atascas, puedes <strong>repartir</strong>. Las cartas correctamente colocadas
            desde el 2 inicial se quedan fijas; el resto se baraja y se reparte de nuevo, con un
            hueco justo después de cada prefijo correcto.
          </p>
        </section>
        <section className={styles.rulesSection}>
          <h3>Cómo seleccionar</h3>
          <p>
            Toca una carta o un hueco. Si hay una sola jugada posible se realiza al instante; si hay
            varias opciones, las verás resaltadas en verde para que elijas.
          </p>
        </section>
      </div>
      <button onClick={onClose} className={styles.closeModalButton}>
        ¡Entendido!
      </button>
    </div>
  </div>
);
