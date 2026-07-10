import type { Card, Suit } from '../types/crescent';
import styles from './CrescentCard.module.css';

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
  isStacked?: boolean;
  isDropHint?: boolean;
  /** Draggable card: grab cursor and no touch scrolling so the drag can start. */
  isLiftable?: boolean;
  /** Fill the parent instead of using the fixed cell size (for the drag ghost). */
  fill?: boolean;
  placeholder?: string;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const CrescentCard = ({
  card,
  isStacked = false,
  isDropHint = false,
  isLiftable = false,
  fill = false,
  placeholder,
  onPointerDown,
}: Props) => {
  if (card === null) {
    const classes = [styles.cell, styles.slot];
    if (isDropHint) classes.push(styles.dropHint);
    return (
      <div className={classes.join(' ')} aria-label="empty pile">
        {placeholder && <span className={styles.placeholder}>{placeholder}</span>}
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const classes = [styles.cell, styles.card];
  classes.push(isRed ? styles.red : styles.black);
  if (isStacked) classes.push(styles.stacked);
  if (isDropHint) classes.push(styles.dropHint);
  if (isLiftable) classes.push(styles.liftable);
  if (fill) classes.push(styles.fill);

  return (
    <div
      className={classes.join(' ')}
      onPointerDown={onPointerDown}
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
