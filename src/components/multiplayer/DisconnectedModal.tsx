import styles from './DisconnectedModal.module.css';

interface DisconnectedModalProps {
  disconnectedPlayerName?: string;
  onLeave: () => void;
}

export const DisconnectedModal = ({
  disconnectedPlayerName,
  onLeave,
}: DisconnectedModalProps) => {
  return (
    <div className={styles.container} role="presentation">
      <div className={styles.modal} role="alertdialog" aria-modal="true" aria-labelledby="disconnected-title">
        <div className={styles.icon} aria-hidden="true">⚠️</div>
        <h2 id="disconnected-title" className={styles.title}>Conexion Perdida</h2>
        <p className={styles.message}>
          {disconnectedPlayerName ? (
            <>
              <span className={styles.playerName}>{disconnectedPlayerName}</span> se ha
              desconectado.
            </>
          ) : (
            'Un jugador se ha desconectado.'
          )}
        </p>
        <p className={styles.waitingText}>
          Esperando reconexion<span className={styles.dots}></span>
        </p>
        <button className={styles.leaveButton} onClick={onLeave}>
          Salir de la partida
        </button>
      </div>
    </div>
  );
};
