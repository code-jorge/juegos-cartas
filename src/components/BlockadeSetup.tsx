import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BlockadeSettings } from '../types/blockade';
import { BackButton } from './BackButton';
import styles from './BlockadeSetup.module.css';

interface Props {
  onStartGame: (settings: BlockadeSettings) => void;
}

const HIGHLIGHT_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

export const BlockadeSetup = ({ onStartGame }: Props) => {
  const navigate = useNavigate();
  const [highlightMovable, setHighlightMovable] = useState(true);
  const [showRules, setShowRules] = useState(false);

  return (
    <div className={styles.container}>
      <BackButton label="Otros juegos" onClick={() => navigate('/')} />

      <div className={styles.header}>
        <h1 className={styles.title}>Blockade</h1>
        <p className={styles.subtitle}>Solitario a dos barajas: del As al Rey</p>
      </div>

      <div className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Resaltar las cartas que se pueden mover:</label>
          <div className={styles.buttonGroup}>
            {HIGHLIGHT_OPTIONS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setHighlightMovable(value)}
                className={`${styles.optionButton} ${highlightMovable === value ? styles.active : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => onStartGame({ highlightMovable })} className={styles.startButton}>
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
      <h2 className={styles.modalTitle}>¿Cómo jugar a Blockade?</h2>
      <div className={styles.rulesContent}>
        <section className={styles.rulesSection}>
          <h3>Objetivo</h3>
          <p>
            Lleva las <strong>104 cartas</strong> (dos barajas) a las <strong>8 bases</strong>,
            construyéndolas por palo del <strong>As al Rey</strong>.
          </p>
        </section>
        <section className={styles.rulesSection}>
          <h3>Tablero</h3>
          <p>
            Hay <strong>12 columnas</strong> con una carta cada una al empezar. El resto forma el{' '}
            <strong>mazo</strong>.
          </p>
        </section>
        <section className={styles.rulesSection}>
          <h3>Movimientos</h3>
          <ul>
            <li>
              En las columnas se construye <strong>hacia abajo y por palo</strong> (un 7♥ sobre un
              8♥).
            </li>
            <li>
              Puedes mover <strong>varias cartas a la vez</strong> siempre que formen una secuencia
              del mismo palo y consecutiva (p. ej. 9♥ 8♥ 7♥).
            </li>
            <li>
              Los <strong>ases</strong> abren cada base; sobre ellos se sube 2, 3, 4… del mismo palo.
            </li>
          </ul>
        </section>
        <section className={styles.rulesSection}>
          <h3>El bloqueo</h3>
          <p>
            Mientras quedan cartas en el mazo, cualquier columna vacía se{' '}
            <strong>rellena al instante con una carta del mazo</strong>: no puedes usarla como
            espacio libre. Cuando el mazo se agota, en una columna vacía puedes colocar{' '}
            <strong>cualquier carta o secuencia</strong>.
          </p>
        </section>
        <section className={styles.rulesSection}>
          <h3>Repartir</h3>
          <p>
            Si te atascas, pulsa <strong>Repartir fila</strong> para colocar una carta del mazo
            encima de cada columna. La partida termina cuando ganas o cuando no quedan jugadas ni
            cartas en el mazo.
          </p>
        </section>
        <section className={styles.rulesSection}>
          <h3>Cómo seleccionar</h3>
          <p>
            Toca la carta a partir de la cual quieres mover (arrastra consigo las de encima). Si solo
            hay una jugada posible se hace al instante; si hay varias, los destinos válidos se
            resaltan en verde para que elijas.
          </p>
        </section>
      </div>
      <button onClick={onClose} className={styles.closeModalButton}>
        ¡Entendido!
      </button>
    </div>
  </div>
);
