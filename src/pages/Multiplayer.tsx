import { useParams } from 'react-router-dom';
import { MultiplayerLobby } from '../components/multiplayer/MultiplayerLobby';
import { MultiplayerGame } from '../components/multiplayer/MultiplayerGame';
import { usePlayerId } from '../hooks/usePlayerId';

export const Multiplayer = () => {
  const { gameId } = useParams<{ gameId?: string }>();
  const { playerId, playerName, setPlayerName } = usePlayerId();

  if (!gameId) {
    return (
      <MultiplayerLobby
        playerId={playerId}
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
      />
    );
  }

  return (
    <MultiplayerGame
      gameId={gameId}
      playerId={playerId}
      playerName={playerName}
      onPlayerNameChange={setPlayerName}
    />
  );
};
