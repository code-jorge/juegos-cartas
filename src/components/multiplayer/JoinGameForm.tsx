import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './JoinGameForm.module.css';

interface JoinGameFormProps {
  gameId: string;
  playerName: string;
  onJoin: (name: string, asSpectator: boolean) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

export const JoinGameForm = ({
  gameId,
  playerName,
  onJoin,
  error,
  isLoading,
}: JoinGameFormProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState(playerName);

  const handleJoinAsPlayer = () => {
    if (name.trim()) {
      onJoin(name.trim(), false);
    }
  };

  const handleJoinAsSpectator = () => {
    onJoin(name.trim() || 'Espectador', true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <button className={styles.backButton} onClick={() => navigate('/multiplayer')}>
          ← Volver
        </button>

        <h1 className={styles.title}>Unirse a Partida</h1>
        <p className={styles.gameId}>Codigo: {gameId}</p>

        <div className={styles.form}>
          <label className={styles.label}>
            Tu nombre
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Introduce tu nombre"
              maxLength={20}
              aria-describedby={error ? 'join-error' : undefined}
            />
          </label>

          {error && <div id="join-error" className={styles.error} role="alert">{error}</div>}

          <button
            className={styles.primaryButton}
            onClick={handleJoinAsPlayer}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? 'Uniendo...' : 'Unirme como Jugador'}
          </button>

          <button
            className={styles.secondaryButton}
            onClick={handleJoinAsSpectator}
            disabled={isLoading}
          >
            Ver como Espectador
          </button>
        </div>
      </div>
    </div>
  );
};
