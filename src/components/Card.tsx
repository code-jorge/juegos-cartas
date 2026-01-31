import type { Card as CardType, Suit, CardValue } from '../types';
import { getCardDisplayName } from '../utils/deck';
import styles from './Card.module.css';

interface CardProps {
  card: CardType;
  faceDown?: boolean;
  selected?: boolean;
  selectedValid?: boolean;
  highlighted?: boolean;
  justPlayed?: boolean;
  settling?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
}

const SPRITE_CARD_WIDTH = 52;
const SPRITE_CARD_HEIGHT = 86;

const SUIT_ROW: Record<Suit, number> = {
  oros: 0,
  copas: 1,
  espadas: 2,
  bastos: 3,
};

const getCardColumn = (value: CardValue): number => {
  if (value <= 7) {
    return value - 1;
  }
  return value + 1;
};

const getSpriteStyle = (
  col: number,
  row: number,
  scale: number
): React.CSSProperties => {
  const spriteX = col * SPRITE_CARD_WIDTH;
  const spriteY = row * SPRITE_CARD_HEIGHT;
  return {
    backgroundPosition: `-${spriteX * scale}px -${spriteY * scale}px`,
    backgroundSize: `${12 * SPRITE_CARD_WIDTH * scale}px ${5 * SPRITE_CARD_HEIGHT * scale}px`,
  };
};

export const Card = ({
  card,
  faceDown = false,
  selected = false,
  selectedValid = false,
  highlighted = false,
  justPlayed = false,
  settling = false,
  onClick,
  disabled = false,
  small = false,
}: CardProps) => {
  const scale = small ? 1 : 104 / SPRITE_CARD_WIDTH;

  const getStateClass = () => {
    if (justPlayed) return styles.justPlayed;
    if (highlighted) return styles.highlighted;
    if (settling) return styles.settling;
    if (selectedValid) return styles.selectedValid;
    if (selected) return styles.selected;
    return styles.default;
  };

  const classNames = [
    styles.card,
    small ? styles.small : styles.normal,
    faceDown ? styles.faceDown : getStateClass(),
    disabled && styles.disabled,
    onClick && !disabled && styles.clickable,
  ]
    .filter(Boolean)
    .join(' ');

  if (faceDown) {
    const spriteStyle = getSpriteStyle(1, 4, scale);
    return <div className={classNames} style={spriteStyle} />;
  }

  const col = getCardColumn(card.value);
  const row = SUIT_ROW[card.suit];
  const spriteStyle = getSpriteStyle(col, row, scale);

  return (
    <div
      className={classNames}
      style={spriteStyle}
      onClick={onClick && !disabled ? onClick : undefined}
      title={getCardDisplayName(card)}
    />
  );
}
