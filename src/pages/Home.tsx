import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <img src="/escoba.png" alt="Escoba" className={styles.logo} />
        <h1 className={styles.title}>Escoba</h1>
        <p className={styles.subtitle}>El clasico juego de cartas espanol</p>

        <div className={styles.buttons}>
          <Link to="/single-player" className={styles.button}>
            Jugar Solo
          </Link>
          <Link to="/multiplayer" className={styles.buttonSecondary}>
            Multijugador
          </Link>
        </div>
      </div>
    </div>
  );
};
