import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BlockadeSettings } from '../types/blockade';
import { BackButton } from './BackButton';
import styles from './BlockadeSetup.module.css';

interface Props {
  onStartGame: (settings: BlockadeSettings) => void;
}

const ACE_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

export const BlockadeSetup = ({ onStartGame }: Props) => {
  const navigate = useNavigate();
  const [autoPlayAces, setAutoPlayAces] = useState(true);
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
          <label className={styles.label}>Mover los ases a las bases automáticamente:</label>
          <div className={styles.buttonGroup}>
            {ACE_OPTIONS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setAutoPlayAces(value)}
                className={`${styles.optionButton} ${autoPlayAces === value ? styles.active : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => onStartGame({ autoPlayAces })} className={styles.startButton}>
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
            <li>Solo se mueve <strong>una carta cada vez</strong>.</li>
            <li>
              Los <strong>ases</strong> abren cada base; sobre ellos se sube 2, 3, 4… del mismo palo.
            </li>
          </ul>
        </section>
        <section className={styles.rulesSection}>
          <h3>El bloqueo</h3>
          <p>
            Cuando una columna queda vacía se <strong>rellena al instante con una carta del mazo</strong>:
            no puedes usarla como espacio libre. Cuando el mazo se agota, los huecos quedan muertos.
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
            Toca una columna. Si solo hay una jugada posible se hace al instante; si hay varias, los
            destinos válidos se resaltan en verde para que elijas.
          </p>
        </section>
      </div>
      <button onClick={onClose} className={styles.closeModalButton}>
        ¡Entendido!
      </button>
    </div>
  </div>
);
