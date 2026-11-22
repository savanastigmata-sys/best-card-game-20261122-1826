// Mouse and keyboard for EMBERFALL: click a card to play it, click End Turn,
// click to begin / play again, hover to lift a card. Keys: 1–7 play a card,
// Space ends the turn, R restarts. All hit-testing runs against the layout
// the renderer computed this frame, in logical 1280x800 coordinates.
import { TABLE_WIDTH, TABLE_HEIGHT } from './config.js';

export function createInput() {
  return { mouseX: 0, mouseY: 0, hoverCard: -1, clicked: null };
}

// Convert a pointer event on the canvas into logical table coordinates.
export function pointerToTable(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = TABLE_WIDTH / rect.width;
  const scaleY = TABLE_HEIGHT / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function inside(point, box) {
  return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;
}

// Which player card (by hand index) sits under this point, topmost first?
export function cardAtPoint(layout, point) {
  for (let i = layout.playerCards.length - 1; i >= 0; i -= 1) {
    const slot = layout.playerCards[i];
    const lifted = slot.y - 20;
    if (point.x >= slot.x && point.x <= slot.x + slot.w && point.y >= lifted && point.y <= slot.y + slot.h) {
      return i;
    }
  }
  return -1;
}

// Interpret one click. Returns an action object the main loop executes:
// { type: 'begin' } | { type: 'play', index } | { type: 'endTurn' } |
// { type: 'restart' } | null.
export function interpretClick(game, layout, point) {
  if (game.screen === 'title') {
    if (inside(point, layout.begin)) return { type: 'begin' };
    return null;
  }
  if (game.screen === 'win' || game.screen === 'loss') {
    if (inside(point, layout.restart)) return { type: 'restart' };
    return null;
  }
  if (game.phase === 'player' && !game.over) {
    const index = cardAtPoint(layout, point);
    if (index !== -1) return { type: 'play', index };
    if (inside(point, layout.endTurn)) return { type: 'endTurn' };
  }
  return null;
}

// Interpret one key press. Same action shape as interpretClick.
export function interpretKey(game, key) {
  if (key === 'r' || key === 'R') {
    if (game.screen === 'win' || game.screen === 'loss' || game.screen === 'table') return { type: 'restart' };
    return null;
  }
  if (game.screen === 'title') {
    if (key === ' ' || key === 'Enter') return { type: 'begin' };
    return null;
  }
  if (game.screen === 'win' || game.screen === 'loss') {
    if (key === ' ' || key === 'Enter') return { type: 'restart' };
    return null;
  }
  if (game.phase !== 'player' || game.over) return null;
  if (key === ' ') return { type: 'endTurn' };
  const digit = parseInt(key, 10);
  if (digit >= 1 && digit <= 7) return { type: 'play', index: digit - 1 };
  return null;
}
