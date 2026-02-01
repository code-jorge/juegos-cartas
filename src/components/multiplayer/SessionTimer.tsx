import { useState, useEffect } from 'react';
import styles from './SessionTimer.module.css';

interface SessionTimerProps {
  expiresAt: number;
}

const FIVE_MIN_MS = 5 * 60 * 1000;

export const SessionTimer = ({ expiresAt }: SessionTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(expiresAt - Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = expiresAt - Date.now();
      setTimeRemaining(remaining);

      if (remaining <= FIVE_MIN_MS && remaining > 0 && !dismissed) {
        setShowWarning(true);
      }

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, dismissed]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLow = timeRemaining <= FIVE_MIN_MS;

  return (
    <>
      <div className={`${styles.timer} ${isLow ? styles.timerLow : ''}`}>
        Sesion: {formatTime(timeRemaining)}
      </div>

      {showWarning && (
        <div className={styles.warningOverlay} role="presentation">
          <div className={styles.warningModal} role="alertdialog" aria-modal="true" aria-labelledby="session-warning-title">
            <h2 id="session-warning-title" className={styles.warningTitle}>Sesion Expirando</h2>
            <p className={styles.warningText}>
              La partida expirara en {Math.ceil(timeRemaining / 60000)} minutos.
            </p>
            <p className={styles.warningText}>
              Si terminais la partida y quereis jugar otra, el tiempo se reiniciara.
            </p>
            <button
              className={styles.warningButton}
              onClick={() => {
                setShowWarning(false);
                setDismissed(true);
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
