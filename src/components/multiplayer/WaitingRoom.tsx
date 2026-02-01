import { useState, useEffect, useRef } from 'react';
import type { ClientGameState } from '../../types/multiplayer';
import { SessionTimer } from './SessionTimer';
import styles from './WaitingRoom.module.css';

interface WaitingRoomProps {
  gameState: ClientGameState;
  playerId: string;
  isReady: boolean;
  onSetReady: (ready: boolean) => void;
  onLeave: () => void;
  onKickPlayer: (targetPlayerId: string) => Promise<void>;
  isSpectator: boolean;
}

export const WaitingRoom = ({
  gameState,
  playerId,
  isReady,
  onSetReady,
  onLeave,
  onKickPlayer,
  isSpectator,
}: WaitingRoomProps) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimeoutRef = useRef<number | null>(null);

  const gameUrl = `${window.location.origin}/multiplayer/${gameState.gameId}`;
  const COPY_FEEDBACK_MS = 2000;

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyLink = async () => {
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
    copyTimeoutRef.current = window.setTimeout(() => setCopyStatus('idle'), COPY_FEEDBACK_MS);
  };

  const allReady = gameState.players.every((p) => p.isReady);
  const canStart = gameState.players.length >= 2 && allReady;
  const isHost = gameState.creatorId === playerId;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <SessionTimer expiresAt={gameState.expiresAt} />

        <h1 className={styles.title}>Sala de Espera</h1>
        <p className={styles.gameId}>Codigo: {gameState.gameId}</p>

        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>Comparte este enlace:</p>
          <div className={styles.shareLink}>
            <input
              type="text"
              value={gameUrl}
              readOnly
              className={styles.linkInput}
            />
            <button className={styles.copyButton} onClick={handleCopyLink}>
              {copyStatus === 'copied' ? 'Copiado!' : copyStatus === 'error' ? 'Error - copia manual' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className={styles.playersSection}>
          <h2 className={styles.playersTitle}>
            Jugadores ({gameState.players.length}/{gameState.maxPlayers})
          </h2>
          <ul className={styles.playerList}>
            {gameState.players.map((player) => (
              <li key={player.id} className={styles.playerItem}>
                <span className={styles.playerName}>
                  {player.name}
                  {player.id === gameState.creatorId && (
                    <span className={styles.creatorBadge}>Host</span>
                  )}
                  {player.id === playerId && (
                    <span className={styles.youBadge}>Tu</span>
                  )}
                </span>
                <div className={styles.playerActions}>
                  <span
                    className={`${styles.readyStatus} ${
                      player.isReady ? styles.ready : styles.notReady
                    }`}
                  >
                    {player.isReady ? 'Listo' : 'Esperando...'}
                  </span>
                  {isHost && player.id !== playerId && (
                    <button
                      className={styles.kickButton}
                      onClick={() => onKickPlayer(player.id)}
                      title="Expulsar jugador"
                      aria-label={`Expulsar a ${player.name}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {gameState.spectatorCount > 0 && (
            <p className={styles.spectatorCount}>
              {gameState.spectatorCount} espectador{gameState.spectatorCount > 1 ? 'es' : ''}
            </p>
          )}
        </div>

        {!isSpectator ? (
          <div className={styles.actions}>
            <label className={styles.readyToggle}>
              <input
                type="checkbox"
                checked={isReady}
                onChange={(e) => onSetReady(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.readyLabel}>Estoy listo</span>
            </label>

            {canStart && (
              <p className={styles.startingMessage}>
                Todos listos - la partida comenzara automaticamente...
              </p>
            )}

            <button className={styles.leaveButton} onClick={onLeave}>
              Salir de la sala
            </button>
          </div>
        ) : (
          <div className={styles.actions}>
            <p className={styles.spectatorMessage}>
              Estas viendo como espectador
            </p>
            <button className={styles.leaveButton} onClick={onLeave}>
              Salir
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
