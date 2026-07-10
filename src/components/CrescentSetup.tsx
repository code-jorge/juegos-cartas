import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CrescentSettings, ReshufflesOption } from '../types/crescent';
import { UNDO_LIMIT } from '../types/crescent';
import { BackButton } from './BackButton';
import styles from './CrescentSetup.module.css';

interface Props {
  onStartGame: (settings: CrescentSettings) => void;
}

const RESHUFFLE_OPTIONS: { value: ReshufflesOption; label: string }[] = [
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: Infinity, label: '∞' },
];

export const CrescentSetup = ({ onStartGame }: Props) => {
  const navigate = useNavigate();
  const [reshuffles, setReshuffles] = useState<ReshufflesOption>(3);
  const [showRules, setShowRules] = useState(false);

  return (
    <div className={styles.container}>
      <BackButton label="Otros juegos" onClick={() => navigate('/')} />

      <div className={styles.header}>
        <h1 className={styles.title}>Crescent</h1>
        <p className={styles.subtitle}>Solitario en media luna a dos barajas</p>
      </div>

      <div className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Barajeos disponibles:</label>
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

        <button onClick={() => onStartGame({ reshuffles })} className={styles.startButton}>
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
      <h2 className={styles.modalTitle}>¿Cómo jugar a Crescent?</h2>
      <div className={styles.rulesContent}>
        <section className={styles.rulesSection}>
          <h3>Objetivo</h3>
          <p>
            Lleva las <strong>104 cartas</strong> (dos barajas) a las <strong>8 bases</strong> del
            centro: las bases de <strong>As suben</strong> hasta el Rey y las bases de{' '}
            <strong>Rey bajan</strong> hasta el As, siempre por palo.
          </p>
        </section>
        <section className={styles.rulesSection}>
          <h3>Tablero</h3>
          <p>
            Alrededor de las bases hay <strong>16 montones de 6 cartas</strong> formando una media
            luna: 8 arriba y 8 abajo. Solo la <strong>carta superior</strong> de cada montón está en
            juego; los bordes de las cartas tapadas te dicen cuántas quedan debajo, pero no cuáles
            son.
          </p>
        </section>
        <section className={styles.rulesSection}>
          <h3>Movimientos</h3>
          <ul>
            <li>
              <strong>Arrastra y suelta</strong> la carta superior de un montón sobre otra carta del{' '}
              <strong>mismo palo</strong> que sea una más alta o una más baja (el Rey y el As son
              consecutivos).
            </li>
            <li>Un toque rápido envía la carta a su base automáticamente si es posible.</li>
            <li>Los montones vacíos quedan fuera de juego: no se pueden rellenar.</li>
            <li>
              La carta superior de una base puede pasar a la <strong>otra base del mismo palo</strong>{' '}
              si sigue la secuencia (los Ases y Reyes iniciales no se mueven).
            </li>
          </ul>
        </section>
        <section className={styles.rulesSection}>
          <h3>Barajear</h3>
          <p>
            Si te atascas, el <strong>mazo central</strong> pasa la carta inferior de cada montón a
            la parte superior. El número del botón indica cuántos barajeos te quedan.
          </p>
        </section>
        <section className={styles.rulesSection}>
          <h3>Deshacer</h3>
          <p>
            El botón <strong>Deshacer</strong> revierte hasta las <strong>{UNDO_LIMIT} últimas
            jugadas</strong> (incluidos los barajeos).
          </p>
        </section>
      </div>
      <button onClick={onClose} className={styles.closeModalButton}>
        ¡Entendido!
      </button>
    </div>
  </div>
);
