import styles from './BackButton.module.css';

interface Props {
  label: string;
  onClick: () => void;
}

export const BackButton = ({ label, onClick }: Props) => (
  <button onClick={onClick} className={styles.backButton}>
    ← {label}
  </button>
);
