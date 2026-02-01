import { useNavigate } from 'react-router-dom';
import { useMultiplayerState } from '../../hooks/useMultiplayerState';
import { WaitingRoom } from './WaitingRoom';
import { MultiplayerBoard } from './MultiplayerBoard';
import { JoinGameForm } from './JoinGameForm';
import { DisconnectedModal } from './DisconnectedModal';
import styles from './MultiplayerGame.module.css';

interface MultiplayerGameProps {
  gameId: string;
  playerId: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
}

export const MultiplayerGame = ({
  gameId,
  playerId,
  playerName,
  onPlayerNameChange,
}: MultiplayerGameProps) => {
  const navigate = useNavigate();
  const {
    state,
    error,
    isLoading,
    needsToJoin,
    join,
    setReady,
    playCard,
    startNewRound,
    newGame,
    leave,
    kickPlayer,
  } = useMultiplayerState(gameId, playerId);

  const handleJoin = async (name: string, asSpectator: boolean) => {
    const success = await join(name, asSpectator);
    if (success) onPlayerNameChange(name);
  };

  const handleLeave = async () => {
    await leave();
    navigate('/multiplayer');
  };

  if (isLoading && !state) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando partida...</p>
        </div>
      </div>
    );
  }

  if (needsToJoin) {
    return (
      <JoinGameForm
        gameId={gameId}
        playerName={playerName}
        onJoin={handleJoin}
        error={error}
        isLoading={isLoading}
      />
    );
  }

  if (error && !state) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/multiplayer')}>
            Volver al lobby
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Partida no encontrada</h2>
          <button onClick={() => navigate('/multiplayer')}>
            Volver al lobby
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === 'expired') {
    return (
      <div className={styles.container}>
        <div className={styles.expired}>
          <h2>Sesion Expirada</h2>
          <p>Esta partida ha expirado.</p>
          <button onClick={() => navigate('/multiplayer')}>
            Crear nueva partida
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === 'disconnected') {
    return (
      <DisconnectedModal
        disconnectedPlayerName={state.disconnectedPlayerName}
        onLeave={handleLeave}
      />
    );
  }

  if (state.phase === 'lobby') {
    const myPlayer = state.players.find((p) => p.id === playerId);
    return (
      <WaitingRoom
        gameState={state}
        playerId={playerId}
        isReady={myPlayer?.isReady ?? false}
        onSetReady={setReady}
        onLeave={handleLeave}
        onKickPlayer={kickPlayer}
        isSpectator={state.isSpectator}
      />
    );
  }

  return (
    <MultiplayerBoard
      gameState={state}
      playerId={playerId}
      onPlayCard={playCard}
      onStartNewRound={startNewRound}
      onNewGame={newGame}
      onLeave={handleLeave}
    />
  );
};
