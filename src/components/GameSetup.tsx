import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty, GameSettings } from '../types';
import { BackButton } from './BackButton';
import styles from './GameSetup.module.css';

interface GameSetupProps {
  onStartGame: (settings: GameSettings) => void;
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'hard', label: 'Difícil' },
];

export const GameSetup = ({ onStartGame }: GameSetupProps) => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [numOpponents, setNumOpponents] = useState<1 | 2 | 3>(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [userHints, setUserHints] = useState(true);
  const [showRules, setShowRules] = useState(false);

  const handleStart = () => {
    onStartGame({ playerName: playerName.trim() || 'Jugador', numOpponents, difficulty, userHints });
  };

  return (
    <div className={styles.container}>
      <BackButton label="Otros juegos" onClick={() => navigate('/')} />
      <div className={styles.header}>
        <img src="/escoba.png" alt="Escoba" className={styles.logo} />
        <div>
          <h1 className={styles.title}>Escoba</h1>
          <p className={styles.subtitle}>El clásico juego de cartas español</p>
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Tu nombre:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Jugador"
            className={styles.nameInput}
            maxLength={12}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Número de oponentes:</label>
          <div className={styles.buttonGroup}>
            {([1, 2, 3] as const).map((num) => (
              <button
                key={num}
                onClick={() => setNumOpponents(num)}
                className={`${styles.optionButton} ${numOpponents === num ? styles.active : ''}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Dificultad:</label>
          <div className={styles.buttonGroup}>
            {DIFFICULTY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDifficulty(value)}
                className={`${styles.optionButton} ${difficulty === value ? styles.active : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={userHints}
              onChange={(e) => setUserHints(e.target.checked)}
              className={styles.checkbox}
            />
            Mostrar pistas
          </label>
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
}

const RulesModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
        <h2 className={styles.modalTitle}>¿Cómo jugar a la Escoba?</h2>

        <div className={styles.rulesContent}>
          <section className={styles.rulesSection}>
            <h3>Objetivo</h3>
            <p>
              Capturar cartas de la mesa cuyo valor sume <strong>15</strong> junto con la carta que juegas.
              El primer jugador en alcanzar <strong>15 puntos</strong> gana la partida.
            </p>
          </section>

          <section className={styles.rulesSection}>
            <h3>La baraja</h3>
            <p>
              Se juega con la baraja española de 40 cartas (4 palos: oros, copas, espadas y bastos).
              Los valores van del 1 al 10, donde 8 es la Sota, 9 el Caballo y 10 el Rey.
            </p>
          </section>

          <section className={styles.rulesSection}>
            <h3>Desarrollo del juego</h3>
            <ul>
              <li>Cada jugador recibe 3 cartas y se colocan 4 cartas en la mesa.</li>
              <li>En tu turno, debes jugar una carta de tu mano.</li>
              <li>Si puedes formar 15 con tu carta y cartas de la mesa, las capturas.</li>
              <li>Si no puedes capturar, dejas tu carta en la mesa.</li>
              <li>Cuando todos se quedan sin cartas, se reparten 3 más hasta agotar el mazo.</li>
            </ul>
          </section>

          <section className={styles.rulesSection}>
            <h3>Escoba</h3>
            <p>
              Si al capturar te llevas <strong>todas</strong> las cartas de la mesa,
              consigues una <strong>Escoba</strong>, que vale 1 punto extra.
            </p>
          </section>

          <section className={styles.rulesSection}>
            <h3>Puntuación (al final de cada ronda)</h3>
            <ul>
              <li><strong>Cartas:</strong> 1 punto para quien tenga más cartas capturadas.</li>
              <li><strong>Oros:</strong> 1 punto para quien tenga más cartas de oros.</li>
              <li><strong>Sietes:</strong> 1 punto para quien tenga más sietes.</li>
              <li><strong>7 de Oros:</strong> 1 punto para quien lo tenga.</li>
              <li><strong>Escobas:</strong> 1 punto por cada escoba conseguida.</li>
            </ul>
            <p className={styles.note}>
              En caso de empate en una categoría, nadie recibe el punto.
            </p>
          </section>
        </div>

        <button onClick={onClose} className={styles.closeModalButton}>
          ¡Entendido!
        </button>
      </div>
    </div>
  );
}
