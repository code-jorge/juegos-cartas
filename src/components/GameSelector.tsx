import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import styles from './GameSelector.module.css';

interface GameOption {
  path: string;
  title: string;
  subtitle: string;
  icon?: string;
  disabled?: boolean;
  badge?: string;
}

const GAMES: GameOption[] = [
  {
    path: '/escoba',
    title: 'Escoba',
    subtitle: 'El clásico juego de cartas español',
    icon: '/escoba.png',
  },
  {
    path: '/addiction-solitaire',
    title: 'Addiction',
    subtitle: 'Reordena las cartas por palo y valor',
  },
];

export const GameSelector = () => {
  usePageTitle();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Juegos de cartas</h1>
        <p className={styles.subtitle}>Elige un juego para empezar</p>
      </div>

      <div className={styles.grid}>
        {GAMES.map((game) => {
          const content = (
            <>
              <div className={styles.cardIcon}>
                {game.icon ? (
                  <img src={game.icon} alt={game.title} className={styles.iconImage} />
                ) : (
                  <div className={styles.iconPlaceholder}>♠</div>
                )}
              </div>
              <h2 className={styles.cardTitle}>{game.title}</h2>
              <p className={styles.cardSubtitle}>{game.subtitle}</p>
              {game.badge && <span className={styles.badge}>{game.badge}</span>}
            </>
          );

          if (game.disabled) {
            return (
              <div
                key={game.path}
                className={`${styles.card} ${styles.disabled}`}
                aria-disabled="true"
              >
                {content}
              </div>
            );
          }

          return (
            <Link key={game.path} to={game.path} className={styles.card}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
