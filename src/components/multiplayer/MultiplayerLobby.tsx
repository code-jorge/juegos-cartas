import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { storeJoinToken } from '../../hooks/usePlayerId';
import styles from './MultiplayerLobby.module.css';

interface MultiplayerLobbyProps {
  playerId: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
}

export const MultiplayerLobby = ({
  playerId,
  playerName,
  onPlayerNameChange,
}: MultiplayerLobbyProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState(playerName);
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const handleCreateGame = async () => {
    if (!name.trim()) {
      setError('Por favor, introduce tu nombre');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await api.createGame({
        playerId,
        playerName: name.trim(),
        maxPlayers,
      });

      onPlayerNameChange(name.trim());
      storeJoinToken(response.gameId, response.joinToken);
      navigate(`/multiplayer/${response.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la partida');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!name.trim()) {
      setError('Por favor, introduce tu nombre');
      return;
    }

    if (!joinCode.trim()) {
      setError('Por favor, introduce el codigo de la partida');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const gameId = joinCode.trim();
      const response = await api.joinGame({
        gameId,
        playerId,
        playerName: name.trim(),
      });

      onPlayerNameChange(name.trim());
      storeJoinToken(gameId, response.joinToken);
      navigate(`/multiplayer/${gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al unirse a la partida');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ← Volver
        </button>

        <h1 className={styles.title}>Multijugador</h1>

        <div className={styles.tabs} role="tablist">
          <button
            className={`${styles.tab} ${mode === 'create' ? styles.tabActive : ''}`}
            onClick={() => setMode('create')}
            role="tab"
            aria-selected={mode === 'create'}
          >
            Crear Partida
          </button>
          <button
            className={`${styles.tab} ${mode === 'join' ? styles.tabActive : ''}`}
            onClick={() => setMode('join')}
            role="tab"
            aria-selected={mode === 'join'}
          >
            Unirse
          </button>
        </div>

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
            />
          </label>

          {mode === 'create' ? (
            <>
              <label className={styles.label}>
                Numero de jugadores
                <div className={styles.playerButtons}>
                  {([2, 3, 4] as const).map((num) => (
                    <button
                      key={num}
                      className={`${styles.playerButton} ${
                        maxPlayers === num ? styles.playerButtonActive : ''
                      }`}
                      onClick={() => setMaxPlayers(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </label>

              {error && <div className={styles.error} role="alert">{error}</div>}

              <button
                className={styles.primaryButton}
                onClick={handleCreateGame}
                disabled={isCreating}
              >
                {isCreating ? 'Creando...' : 'Crear Partida'}
              </button>
            </>
          ) : (
            <>
              <label className={styles.label}>
                Codigo de partida
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className={styles.input}
                  placeholder="Introduce el codigo"
                  maxLength={20}
                />
              </label>

              {error && <div className={styles.error} role="alert">{error}</div>}

              <button
                className={styles.primaryButton}
                onClick={handleJoinGame}
                disabled={isJoining}
              >
                {isJoining ? 'Uniendo...' : 'Unirse a Partida'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
