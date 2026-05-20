import type { FrenchCard, FrenchSuit } from '../types/addiction';
import styles from './AddictionCard.module.css';

const SUIT_SYMBOL: Record<FrenchSuit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RANK_LABEL: Record<number, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

interface Props {
  card: FrenchCard | null;
  onClick: () => void;
  isSelected: boolean;
  isDestination: boolean;
  isSource: boolean;
  isMovableHint: boolean;
  isDeadGap: boolean;
}

export const AddictionCard = ({
  card,
  onClick,
  isSelected,
  isDestination,
  isSource,
  isMovableHint,
  isDeadGap,
}: Props) => {
  if (card === null) {
    const classes = [styles.cell, styles.gap];
    if (isDeadGap) classes.push(styles.deadGap);
    if (isDestination) classes.push(styles.destinationHighlight);
    if (isSelected) classes.push(styles.selectedGap);
    return <div className={classes.join(' ')} onClick={onClick} role="button" aria-label="gap" />;
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const classes = [styles.cell, styles.card];
  classes.push(isRed ? styles.red : styles.black);
  if (isSelected) classes.push(styles.selectedCard);
  if (isSource) classes.push(styles.sourceHighlight);
  if (isMovableHint) classes.push(styles.movableHint);

  return (
    <div
      className={classes.join(' ')}
      onClick={onClick}
      role="button"
      aria-label={`${RANK_LABEL[card.rank]} of ${card.suit}`}
    >
      <span className={styles.corner}>
        <span className={styles.rank}>{RANK_LABEL[card.rank]}</span>
        <span className={styles.cornerSuit}>{SUIT_SYMBOL[card.suit]}</span>
      </span>
      <span className={styles.suit}>{SUIT_SYMBOL[card.suit]}</span>
    </div>
  );
};
