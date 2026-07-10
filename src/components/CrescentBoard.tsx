import { useEffect, useRef, useState } from 'react';
import { useCrescentGame } from '../hooks/useCrescentGame';
import { canPickUp, topCard, type Spot } from '../utils/crescentLogic';
import {
  PILES_PER_ARC,
  TOTAL_CARDS,
  UNDO_LIMIT,
  type Card,
  type CrescentSettings,
  type Foundation,
  type Pile,
} from '../types/crescent';
import { CrescentCard } from './CrescentCard';
import { BackButton } from './BackButton';
import { ConfirmModal } from './ConfirmModal';
import styles from './CrescentBoard.module.css';

interface Props {
  settings: CrescentSettings;
  onExit: () => void;
}

interface DragState {
  source: Spot;
  card: Card;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  grabX: number;
  grabY: number;
  width: number;
  height: number;
  /** True once the pointer travels past the click threshold. */
  active: boolean;
}

const DRAG_THRESHOLD = 6;

/** Vertical dip and tilt that bend each arc of 8 piles around the center. */
const ARC_LIFT = 5;
const ARC_TILT = 3.5;
const arcStyle = (pos: number, arc: 'top' | 'bottom') => {
  const d = Math.abs(pos - 3.5) - 0.5;
  const lift = Math.round(d * d * ARC_LIFT);
  const tilt = (pos - 3.5) * ARC_TILT;
  const sign = arc === 'top' ? 1 : -1;
  return {
    transform: `translateY(calc(${sign * lift} * var(--arc-unit, 1px))) rotate(${sign * tilt}deg)`,
  };
};

const parseDropToken = (token: string): Spot | null => {
  const [type, indexStr] = token.split('-');
  const index = Number(indexStr);
  if (!Number.isInteger(index)) return null;
  if (type === 'pile' || type === 'foundation') return { type, index };
  return null;
};

export const CrescentBoard = ({ settings, onExit }: Props) => {
  const {
    state,
    undosAvailable,
    canUndo,
    reshufflesLeft,
    targetsFor,
    tryMove,
    autoMove,
    reshuffle,
    undo,
    giveUp,
    newGame,
    placedCount,
    scorePercent,
  } = useCrescentGame(settings);

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const apiRef = useRef({ tryMove, autoMove });
  useEffect(() => {
    apiRef.current = { tryMove, autoMove };
  });

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);

  const beginDrag = (e: React.PointerEvent<HTMLDivElement>, source: Spot, card: Card) => {
    if (state.status !== 'playing' || dragRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const info: DragState = {
      source,
      card,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      active: false,
    };
    dragRef.current = info;
    setDrag(info);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const active =
        d.active || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD;
      const next = { ...d, x: e.clientX, y: e.clientY, active };
      dragRef.current = next;
      setDrag(next);
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      setDrag(null);
      const moved =
        d.active || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD;
      if (!moved) {
        apiRef.current.autoMove(d.source);
        return;
      }
      // The ghost has pointer-events: none, so this finds the drop spot beneath it.
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const token = el?.closest('[data-drop]')?.getAttribute('data-drop');
      const target = token ? parseDropToken(token) : null;
      if (target) apiRef.current.tryMove(d.source, target);
    };
    const onCancel = (e: PointerEvent) => {
      if (dragRef.current && e.pointerId === dragRef.current.pointerId) {
        dragRef.current = null;
        setDrag(null);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, []);

  const dropPiles = new Set<number>();
  const dropFoundations = new Set<number>();
  if (drag?.active) {
    for (const t of targetsFor(drag.source)) {
      if (t.type === 'pile') dropPiles.add(t.index);
      else dropFoundations.add(t.index);
    }
  }

  const isDragSource = (spot: Spot): boolean =>
    (drag?.active ?? false) &&
    drag!.source.type === spot.type &&
    drag!.source.index === spot.index;

  const renderPile = (pile: Pile, index: number, arc: 'top' | 'bottom') => {
    const visible = isDragSource({ type: 'pile', index }) ? pile.slice(0, -1) : pile;
    return (
      <div
        key={index}
        className={styles.pile}
        style={arcStyle(index % PILES_PER_ARC, arc)}
        data-drop={`pile-${index}`}
      >
        {visible.length === 0 ? (
          <CrescentCard card={null} />
        ) : (
          visible.map((card, idx) => {
            const isTop = idx === visible.length - 1;
            return (
              <CrescentCard
                key={card.id}
                card={card}
                isStacked={idx > 0}
                isDropHint={isTop && dropPiles.has(index)}
                isLiftable={isTop && state.status === 'playing'}
                onPointerDown={
                  isTop ? (e) => beginDrag(e, { type: 'pile', index }, card) : undefined
                }
              />
            );
          })
        )}
      </div>
    );
  };

  const renderFoundation = (foundation: Foundation, index: number) => {
    const spot: Spot = { type: 'foundation', index };
    const cards = isDragSource(spot) ? foundation.cards.slice(0, -1) : foundation.cards;
    const top = topCard(cards) as Card; // the base card never leaves
    const liftable = state.status === 'playing' && !drag && canPickUp(state, spot);
    return (
      <div key={index} className={styles.foundationSlot} data-drop={`foundation-${index}`}>
        <CrescentCard
          card={top}
          isDropHint={dropFoundations.has(index)}
          isLiftable={liftable}
          onPointerDown={liftable ? (e) => beginDrag(e, spot, top) : undefined}
        />
        <span className={styles.kindBadge} aria-hidden="true">
          {foundation.kind === 'ace' ? '▲' : '▼'}
        </span>
      </div>
    );
  };

  const reshufflesLabel = reshufflesLeft === Infinity ? '∞' : String(reshufflesLeft);

  return (
    <div className={styles.container}>
      <BackButton
        label="Crescent"
        onClick={() => (state.status === 'playing' ? setShowExitConfirm(true) : onExit())}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>Crescent</h1>
        <div className={styles.stats}>
          <span>
            Bases: <strong>{placedCount}/{TOTAL_CARDS}</strong>
          </span>
          <span>
            Movimientos: <strong>{state.moves}</strong>
          </span>
          <span>
            Barajeos restantes: <strong>{reshufflesLabel}</strong>
          </span>
        </div>
      </div>

      <div className={styles.boardWrap}>
        <div className={styles.board}>
          <div className={styles.arc}>
            {state.piles.slice(0, PILES_PER_ARC).map((pile, i) => renderPile(pile, i, 'top'))}
          </div>

          <div className={styles.center}>
            <div className={styles.sideControl}>
              <button
                className={reshufflesLeft > 0 ? styles.stock : styles.stockEmpty}
                onClick={reshuffle}
                disabled={state.status !== 'playing' || reshufflesLeft <= 0}
                aria-label={`barajear (${reshufflesLabel} restantes)`}
              >
                <span className={styles.stockEmblem}>{reshufflesLeft > 0 ? '⟳' : '∅'}</span>
                <span className={styles.countBadge}>{reshufflesLabel}</span>
              </button>
              <span className={styles.controlLabel}>Barajear</span>
            </div>

            <div className={styles.foundationsGrid}>
              {state.foundations.map(renderFoundation)}
            </div>

            <div className={styles.sideControl}>
              <button
                className={styles.undoButton}
                onClick={undo}
                disabled={!canUndo}
                aria-label={`deshacer (${undosAvailable} de ${UNDO_LIMIT})`}
              >
                <span className={styles.undoEmblem}>↩</span>
                <span className={styles.countBadge}>{undosAvailable}</span>
              </button>
              <span className={styles.controlLabel}>Deshacer</span>
            </div>
          </div>

          <div className={styles.arc}>
            {state.piles
              .slice(PILES_PER_ARC)
              .map((pile, i) => renderPile(pile, i + PILES_PER_ARC, 'bottom'))}
          </div>
        </div>
      </div>

      {state.status === 'playing' && (
        <div className={styles.controls}>
          <button onClick={() => setShowGiveUpConfirm(true)} className={styles.secondaryButton}>
            Rendirse
          </button>
        </div>
      )}

      {drag?.active && (
        <div
          className={styles.ghost}
          style={{
            left: drag.x - drag.grabX,
            top: drag.y - drag.grabY,
            width: drag.width,
            height: drag.height,
          }}
        >
          <CrescentCard card={drag.card} fill />
        </div>
      )}

      {state.status !== 'playing' && (
        <FinishedModal
          won={state.status === 'won'}
          score={scorePercent}
          placed={placedCount}
          moves={state.moves}
          reshufflesUsed={state.reshufflesUsed}
          onNewGame={newGame}
          onBack={onExit}
        />
      )}

      {showExitConfirm && (
        <ConfirmModal
          title="¿Salir de la partida?"
          message="Perderás todo el progreso de la partida actual."
          confirmLabel="Salir"
          onConfirm={onExit}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}

      {showGiveUpConfirm && (
        <ConfirmModal
          title="¿Rendirse?"
          message="Se terminará la partida actual."
          confirmLabel="Rendirse"
          onConfirm={() => {
            setShowGiveUpConfirm(false);
            giveUp();
          }}
          onCancel={() => setShowGiveUpConfirm(false)}
        />
      )}
    </div>
  );
};

const FinishedModal = ({
  won,
  score,
  placed,
  moves,
  reshufflesUsed,
  onNewGame,
  onBack,
}: {
  won: boolean;
  score: number;
  placed: number;
  moves: number;
  reshufflesUsed: number;
  onNewGame: () => void;
  onBack: () => void;
}) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2 className={styles.modalTitle}>{won ? '¡Ganaste!' : 'Partida terminada'}</h2>
      <div className={styles.scoreDisplay}>
        <span className={styles.scoreValue}>{score}%</span>
      </div>
      {won ? (
        <p className={styles.modalText}>¡Enhorabuena! Completaste las ocho bases.</p>
      ) : (
        <p className={styles.modalText}>No quedan más jugadas posibles.</p>
      )}
      <ul className={styles.statsList}>
        <li>
          Cartas en las bases: <strong>{placed} de {TOTAL_CARDS}</strong>
        </li>
        <li>
          Movimientos: <strong>{moves}</strong>
        </li>
        <li>
          Barajeos usados: <strong>{reshufflesUsed}</strong>
        </li>
      </ul>
      <div className={styles.modalButtons}>
        <button onClick={onBack} className={styles.secondaryButton}>
          Volver
        </button>
        <button onClick={onNewGame} className={styles.primaryButton}>
          Nueva partida
        </button>
      </div>
    </div>
  </div>
);
