import type { Card, Suit } from '../types/blockade';
import styles from './BlockadeCard.module.css';

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RANK_LABEL: Record<number, string> = {
  1: 'A',
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
  card: Card | null;
  onClick?: () => void;
  isSelected?: boolean;
  isDestination?: boolean;
  isMovableHint?: boolean;
  isStacked?: boolean;
  placeholder?: string;
}

export const BlockadeCard = ({
  card,
  onClick,
  isSelected = false,
  isDestination = false,
  isMovableHint = false,
  isStacked = false,
  placeholder,
}: Props) => {
  if (card === null) {
    const classes = [styles.cell, styles.slot];
    if (isDestination) classes.push(styles.destinationHighlight);
    return (
      <div className={classes.join(' ')} onClick={onClick} role="button" aria-label="empty slot">
        {placeholder && <span className={styles.placeholder}>{placeholder}</span>}
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const classes = [styles.cell, styles.card];
  classes.push(isRed ? styles.red : styles.black);
  if (isStacked) classes.push(styles.stacked);
  if (isSelected) classes.push(styles.selectedCard);
  if (isDestination) classes.push(styles.destinationHighlight);
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
