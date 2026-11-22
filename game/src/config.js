// EMBERFALL tuning constants: life, Ember curve, element cycle, table geometry.
// One file, one job: every number the rules and the renderer share lives here.
export const TABLE_WIDTH = 1280;
export const TABLE_HEIGHT = 800;

export const START_LIFE = 30;
export const MAX_LIFE = 30;
export const MAX_EMBER = 10;
export const START_EMBER = 1;
export const START_HAND = 5;
export const DRAW_PER_TURN = 2;
export const MAX_HAND = 7;
export const DECK_SIZE = 30;
export const MAX_TURNS = 60;

// The element cycle. Each element beats the next one in the ring:
// Flame > Thorn > Tide > Stone > Flame. Colour AND shape tell them apart.
export const ELEMENTS = {
  flame: { name: 'Flame', color: '#ff7a2f', dark: '#a83c00', light: '#ffb37a', beats: 'thorn', glyph: 'flame' },
  thorn: { name: 'Thorn', color: '#7ed957', dark: '#2e7d32', light: '#b9f29a', beats: 'tide', glyph: 'thorn' },
  tide: { name: 'Tide', color: '#38b6ff', dark: '#0d47a1', light: '#9ad9ff', beats: 'stone', glyph: 'drop' },
  stone: { name: 'Stone', color: '#c9b18c', dark: '#6d5c3f', light: '#e8dcc3', beats: 'flame', glyph: 'rock' },
};
export const ELEMENT_ORDER = ['flame', 'thorn', 'tide', 'stone'];

// Combo and edge bonuses, in damage points.
export const EDGE_BONUS = 2;
export const SURGE_BONUS = 3;
export const SURGE_KIND_BONUS = 2;

// Card geometry on the table.
export const CARD_W = 140;
export const CARD_H = 196;
export const CARD_GAP = 112;
export const MINI_W = 84;
export const MINI_H = 118;

// Table zones (logical 1280x800 canvas).
export const ZONES = {
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  wardenPanel: { x: 16, y: 68, w: 268, h: 168 },
  wardenHand: { x: 300, y: 72, w: 560, h: 132 },
  wardenInfo: { x: 876, y: 68, w: 388, h: 200 },
  playZone: { x: 300, y: 216, w: 560, h: 190 },
  hud: { x: 876, y: 276, w: 388, h: 272 },
  playerPanel: { x: 16, y: 560, w: 240, h: 224 },
  playerHand: { x: 272, y: 560, w: 588, h: 224 },
  sidePanel: { x: 876, y: 560, w: 388, h: 224 },
};
