// Everything the player sees: the ember-lit table, both hands, the play zone,
// the HUD, the title screen and the win/loss panels. All art is drawn on the
// canvas — no images, no fonts from the network, colour AND shape per element.
import { TABLE_WIDTH, TABLE_HEIGHT, ELEMENTS, ELEMENT_ORDER, ZONES, CARD_W, CARD_H, MINI_W, MINI_H } from './config.js';
import { cardById, cardHeadline } from './cards.js';
import { elementBeats } from './rules.js';

const SCREEN_TITLE = 'title';
const SCREEN_WIN = 'win';
const SCREEN_LOSS = 'loss';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = (weight || '600') + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function wrapText(ctx, str, x, y, maxWidth, size, color, lineHeight) {
  ctx.fillStyle = color;
  ctx.font = '600 ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  const words = str.split(' ');
  let line = '';
  let cy = y;
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = words[i];
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

// ---- Element glyphs, drawn as shapes (never text alone) ----
export function drawGlyph(ctx, glyph, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.16);
  ctx.lineJoin = 'round';
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.9, -r * 0.25, r * 0.75, r * 0.55, 0, r);
    ctx.bezierCurveTo(-r * 0.75, r * 0.55, -r * 0.9, -r * 0.25, 0, -r);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.35);
    ctx.bezierCurveTo(r * 0.42, r * 0.05, r * 0.36, r * 0.5, 0, r * 0.62);
    ctx.bezierCurveTo(-r * 0.36, r * 0.5, -r * 0.42, r * 0.05, 0, -r * 0.35);
    ctx.fill();
  } else if (glyph === 'drop') {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.85, -r * 0.1, r * 0.8, r * 0.55, 0, r);
    ctx.bezierCurveTo(-r * 0.8, r * 0.55, -r * 0.85, -r * 0.1, 0, -r);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(-r * 0.28, r * 0.1, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (glyph === 'thorn') {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.1, 0, r);
    ctx.quadraticCurveTo(-r * 0.9, -r * 0.1, 0, -r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(0, r * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.2);
    ctx.lineTo(r * 0.55, -r * 0.55);
    ctx.moveTo(0, r * 0.15);
    ctx.lineTo(-r * 0.55, -r * 0.2);
    ctx.stroke();
  } else {
    // rock: a faceted polygon
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.35);
    ctx.lineTo(-r * 0.15, -r);
    ctx.lineTo(r * 0.75, -r * 0.55);
    ctx.lineTo(r * 0.9, r * 0.35);
    ctx.lineTo(r * 0.25, r * 0.9);
    ctx.lineTo(-r * 0.6, r * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(-r * 0.15, -r);
    ctx.lineTo(-r * 0.1, r * 0.3);
    ctx.lineTo(r * 0.9, r * 0.35);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShieldIcon(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.85, -r * 0.55);
  ctx.lineTo(r * 0.85, r * 0.15);
  ctx.quadraticCurveTo(r * 0.85, r * 0.8, 0, r);
  ctx.quadraticCurveTo(-r * 0.85, r * 0.8, -r * 0.85, r * 0.15);
  ctx.lineTo(-r * 0.85, -r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Ember pips: filled flames for current Ember, dim outlines for the rest.
function drawEmberPips(ctx, x, y, current, max) {
  for (let i = 0; i < max; i += 1) {
    const px = x + i * 15;
    if (i < current) drawGlyph(ctx, 'flame', px + 6, y + 6, 6.5, '#ff9a3c');
    else {
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px + 6, y + 6, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawLifeBar(ctx, x, y, w, life, maxLife) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, x, y, w, 16, 8);
  ctx.fill();
  const frac = Math.max(0, life / maxLife);
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#ff5a3c');
  grad.addColorStop(1, '#ffb03c');
  ctx.fillStyle = grad;
  if (frac > 0) {
    roundRect(ctx, x + 2, y + 2, Math.max(8, (w - 4) * frac), 12, 6);
    ctx.fill();
  }
}

// ---- Cards ----
export function drawCardFace(ctx, card, x, y, w, h, opts) {
  const s = w / CARD_W;
  const el = ELEMENTS[card.element];
  const playable = !opts || opts.playable !== false;
  const dim = opts && opts.dim;
  ctx.save();
  if (dim) ctx.globalAlpha = 0.45;
  // Body
  ctx.fillStyle = '#f7f1de';
  roundRect(ctx, x, y, w, h, 10 * s);
  ctx.fill();
  ctx.strokeStyle = opts && opts.glow ? '#ffd76a' : el.color;
  ctx.lineWidth = opts && opts.glow ? 4 : 2.5;
  roundRect(ctx, x, y, w, h, 10 * s);
  ctx.stroke();
  // Element band
  ctx.fillStyle = el.color;
  roundRect(ctx, x + 3, y + 3, w - 6, 34 * s, 8 * s);
  ctx.fill();
  ctx.fillRect(x + 3, y + 20 * s, w - 6, 17 * s);
  // Cost circle
  ctx.fillStyle = '#1d1420';
  ctx.beginPath();
  ctx.arc(x + 20 * s, y + 20 * s, 15 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2 * s;
  ctx.stroke();
  text(ctx, String(card.cost), x + 20 * s, y + 27 * s, Math.round(17 * s), '#ffd76a', '800', 'center');
  // Element glyph + name in the band
  drawGlyph(ctx, el.glyph, x + w - 20 * s, y + 20 * s, 11 * s, '#ffffff');
  text(ctx, el.name.toUpperCase(), x + 40 * s, y + 26 * s, Math.round(12 * s), '#ffffff', '800');
  // Headline value
  text(ctx, cardHeadline(card), x + w / 2, y + 92 * s, Math.round(44 * s), el.dark, '900', 'center');
  const label = card.damage > 0 ? 'DAMAGE' : card.shield > 0 ? 'SHIELD' : card.ember > 0 ? 'EMBER' : 'DRAW';
  text(ctx, label, x + w / 2, y + 112 * s, Math.round(10 * s), '#8a7a5a', '800', 'center');
  // Name
  text(ctx, card.name, x + w / 2, y + 138 * s, Math.round(14 * s), '#241a12', '800', 'center');
  // Kind pill
  const kindW = 62 * s;
  ctx.fillStyle = el.dark;
  roundRect(ctx, x + (w - kindW) / 2, y + 146 * s, kindW, 16 * s, 8 * s);
  ctx.fill();
  text(ctx, card.kind.toUpperCase(), x + w / 2, y + 158 * s, Math.round(9 * s), '#ffffff', '800', 'center');
  // Rules text
  ctx.fillStyle = '#4a3f30';
  ctx.font = '600 ' + Math.round(10.5 * s) + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  const words = card.text.split(' ');
  let line = '';
  let cy = y + 180 * s;
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > w - 16 * s && line) {
      ctx.fillText(line, x + w / 2, cy);
      line = words[i];
      cy += 12 * s;
    } else line = test;
  }
  if (line) ctx.fillText(line, x + w / 2, cy);
  if (!playable) {
    ctx.fillStyle = 'rgba(20,10,5,0.35)';
    roundRect(ctx, x, y, w, h, 10 * s);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCardBack(ctx, x, y, w, h) {
  ctx.fillStyle = '#2a1210';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#ff7a2f';
  ctx.lineWidth = 2.5;
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 8);
  ctx.stroke();
  drawGlyph(ctx, 'flame', x + w / 2, y + h / 2 - 6, Math.min(w, h) * 0.26, '#ff7a2f');
  text(ctx, 'EMBERFALL', x + w / 2, y + h - 14, 9, '#ffb37a', '800', 'center');
}

// ---- Layout: where every clickable thing sits this frame ----
export function computeLayout(game) {
  const layout = { playerCards: [], wardenBacks: [], endTurn: null, begin: null, restart: null };
  const hand = game.player.hand;
  const n = hand.length;
  // Hand cards stay big but never hide each other: at 6-7 cards they shrink
  // a little and overlap by at most ~19px, so names and values stay readable.
  const handW = n <= 5 ? CARD_W : n === 6 ? 105 : 90;
  const handH = Math.round(handW * CARD_H / CARD_W);
  const gap = n > 1 ? (ZONES.playerHand.w - handW) / (n - 1) : 0;
  const totalW = n > 0 ? handW + gap * (n - 1) : 0;
  const startX = ZONES.playerHand.x + (ZONES.playerHand.w - totalW) / 2;
  const startY = ZONES.playerHand.y + 36 + Math.round((CARD_H - handH) / 2);
  for (let i = 0; i < n; i += 1) {
    layout.playerCards.push({
      index: i, id: hand[i],
      x: startX + i * gap, y: startY, w: handW, h: handH,
    });
  }
  // Warden backs share their row with the Warden's last played card, face up
  // at the far right — the backs never slide under it.
  const wn = game.warden.hand.length;
  const backsArea = ZONES.wardenHand.w - MINI_W - 16;
  const wGap = wn > 1 ? Math.min(76, (backsArea - MINI_W) / (wn - 1)) : 0;
  const wTotal = wn > 0 ? MINI_W + wGap * (wn - 1) : 0;
  const wStart = ZONES.wardenHand.x + (backsArea - wTotal) / 2;
  for (let i = 0; i < wn; i += 1) {
    layout.wardenBacks.push({ x: wStart + i * wGap, y: ZONES.wardenHand.y + 28, w: MINI_W, h: MINI_H });
  }
  layout.endTurn = { x: ZONES.sidePanel.x + 24, y: ZONES.sidePanel.y + 20, w: ZONES.sidePanel.w - 48, h: 58 };
  layout.begin = { x: TABLE_WIDTH / 2 - 170, y: 636, w: 340, h: 64 };
  layout.restart = { x: TABLE_WIDTH / 2 - 170, y: 636, w: 340, h: 64 };
  return layout;
}

// ---- Panels ----
function drawSidePanel(ctx, x, y, w, h, title, side, isWarden) {
  ctx.fillStyle = 'rgba(12,8,14,0.72)';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = isWarden ? 'rgba(255,122,47,0.5)' : 'rgba(56,182,255,0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.stroke();
  text(ctx, title, x + 18, y + 30, 15, isWarden ? '#ffb37a' : '#9ad9ff', '800');
  // Big life number + bar
  text(ctx, String(side.life), x + 18, y + 92, 52, '#ffffff', '900');
  text(ctx, '/ 30 LIFE', x + 84, y + 92, 15, '#c9b8a3', '700');
  drawLifeBar(ctx, x + 18, y + 102, w - 36, side.life, 30);
  // Shield
  drawShieldIcon(ctx, x + 30, y + 140, 12, '#7fb7ff');
  text(ctx, 'SHIELD ' + side.shield, x + 48, y + 145, 15, '#cfe4ff', '800');
  // Ember
  text(ctx, 'EMBER', x + 18, y + 172, 12, '#ffb37a', '800');
  drawEmberPips(ctx, x + 72, y + 160, side.ember, 10);
  // Deck
  text(ctx, 'DECK ' + side.deck.length + '  ·  HAND ' + side.hand.length, x + 18, y + 196, 13, '#c9b8a3', '700');
}

function drawWardenPortrait(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#1a0f1e';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  // Hooded figure: cloak, hood, glowing eyes, ember glow
  const cx = x + w / 2;
  ctx.fillStyle = '#3a2438';
  ctx.beginPath();
  ctx.moveTo(cx - 34, y + h - 8);
  ctx.quadraticCurveTo(cx - 40, y + 44, cx, y + 26);
  ctx.quadraticCurveTo(cx + 40, y + 44, cx + 34, y + h - 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#241428';
  ctx.beginPath();
  ctx.arc(cx, y + 34, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7a2f';
  ctx.beginPath();
  ctx.arc(cx - 8, y + 32, 3.5, 0, Math.PI * 2);
  ctx.arc(cx + 8, y + 32, 3.5, 0, Math.PI * 2);
  ctx.fill();
  drawGlyph(ctx, 'flame', cx, y + h - 26, 12, '#ff9a3c');
  ctx.restore();
}

function drawHud(ctx, game) {
  const z = ZONES.hud;
  ctx.fillStyle = 'rgba(12,8,14,0.9)';
  roundRect(ctx, z.x, z.y, z.w, z.h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,106,0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, z.x, z.y, z.w, z.h, 14);
  ctx.stroke();
  text(ctx, 'DUEL RECORD', z.x + 18, z.y + 28, 13, '#ffd76a', '800');
  const rows = [
    ['Turn', String(game.turn)],
    ['Damage dealt', String(game.stats.damageDealt)],
    ['Damage taken', String(game.stats.damageTaken)],
    ['Best combo', game.stats.bestCombo > 0 ? game.stats.bestCombo + ' in a row' : '—'],
    ['Cards played', String(game.stats.cardsPlayed)],
    ['Elemental edges', String(game.stats.edges)],
    ['Surge combos', String(game.stats.surges)],
  ];
  let cy = z.y + 48;
  for (let i = 0; i < rows.length; i += 1) {
    text(ctx, rows[i][0], z.x + 18, cy, 14, '#c9b8a3', '700');
    text(ctx, rows[i][1], z.x + z.w - 18, cy, 14, '#ffffff', '800', 'right');
    cy += 23;
  }
  // Last actions — one line each, truncated with an ellipsis so they can
  // never spill past the panel's bottom edge.
  text(ctx, 'LAST ACTIONS', z.x + 18, cy + 10, 12, '#ffd76a', '800');
  cy += 34;
  const recent = game.log.slice(-2);
  for (let i = 0; i < recent.length; i += 1) {
    let line = recent[i];
    ctx.font = '600 12px "Trebuchet MS", Verdana, sans-serif';
    while (line.length > 4 && ctx.measureText(line).width > z.w - 36) {
      line = line.slice(0, -4) + '…';
    }
    text(ctx, line, z.x + 18, cy, 12, '#e8ddc9', '700');
    cy += 22;
  }
}

function drawLegend(ctx, x, y) {
  text(ctx, 'ELEMENTS — Flame>Thorn>Tide>Stone>Flame', x, y, 11, '#c9b8a3', '700');
  let lx = x;
  const ly = y + 26;
  for (let i = 0; i < ELEMENT_ORDER.length; i += 1) {
    const el = ELEMENTS[ELEMENT_ORDER[i]];
    drawGlyph(ctx, el.glyph, lx + 10, ly + 8, 10, el.color);
    text(ctx, el.name, lx + 26, ly + 13, 13, el.light, '800');
    lx += 84;
  }
}

function drawEndTurnButton(ctx, layout, game) {
  const b = layout.endTurn;
  const active = game.phase === 'player' && !game.over;
  ctx.fillStyle = active ? '#ff7a2f' : '#4a3a30';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = active ? '#ffd76a' : 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2.5;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  text(ctx, active ? 'END TURN' : 'WARDEN PLAYING…', b.x + b.w / 2, b.y + 26, 22, '#ffffff', '900', 'center');
  text(ctx, active ? 'Space — hand the turn to the Warden' : 'Watch the Warden’s move', b.x + b.w / 2, b.y + 46, 11, 'rgba(255,255,255,0.8)', '700', 'center');
}

// ---- Screens ----
function drawTable(ctx, game, motion, layout, timeMs) {
  // Ember-lit backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
  bg.addColorStop(0, '#241019');
  bg.addColorStop(0.55, '#1a0f1e');
  bg.addColorStop(1, '#0e0a12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  // Drifting ember motes (seeded positions, gentle rise)
  for (let i = 0; i < 42; i += 1) {
    const px = (i * 173 + 41) % TABLE_WIDTH;
    const speed = 12 + (i % 5) * 6;
    const py = TABLE_HEIGHT - ((timeMs * speed / 1000 + i * 97) % (TABLE_HEIGHT + 40)) + 20;
    ctx.globalAlpha = 0.25 + (i % 3) * 0.12;
    drawGlyph(ctx, 'flame', px, py, 3 + (i % 3), '#ff9a3c');
  }
  ctx.globalAlpha = 1;
  // Table felt
  ctx.fillStyle = 'rgba(46,26,20,0.55)';
  roundRect(ctx, 8, 64, TABLE_WIDTH - 16, TABLE_HEIGHT - 72, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,150,60,0.25)';
  ctx.lineWidth = 2;
  roundRect(ctx, 8, 64, TABLE_WIDTH - 16, TABLE_HEIGHT - 72, 18);
  ctx.stroke();

  // Top bar
  text(ctx, 'EMBERFALL', 20, 36, 24, '#ffd76a', '900');
  text(ctx, 'OBJECTIVE — Reduce the Ash Warden to 0 life', TABLE_WIDTH / 2, 36, 15, '#ffe9c9', '800', 'center');
  const phaseLabel = game.over ? 'DUEL OVER' : game.phase === 'player' ? 'YOUR TURN' : 'WARDEN’S TURN';
  ctx.fillStyle = game.phase === 'player' && !game.over ? '#2e7d32' : '#7a3a00';
  roundRect(ctx, TABLE_WIDTH - 268, 12, 248, 34, 17);
  ctx.fill();
  text(ctx, 'TURN ' + game.turn + '  ·  ' + phaseLabel, TABLE_WIDTH - 144, 35, 14, '#ffffff', '800', 'center');

  // Warden portrait + status
  const wp = ZONES.wardenPanel;
  ctx.fillStyle = 'rgba(12,8,14,0.72)';
  roundRect(ctx, wp.x, wp.y, wp.w, wp.h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,122,47,0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, wp.x, wp.y, wp.w, wp.h, 14);
  ctx.stroke();
  drawWardenPortrait(ctx, wp.x + 12, wp.y + 12, 76, wp.h - 24);
  text(ctx, 'ASH WARDEN', wp.x + 100, wp.y + 34, 17, '#ffb37a', '900');
  const status = game.phase === 'ai' ? game.telegraph : 'The Warden watches the flame…';
  wrapText(ctx, status, wp.x + 100, wp.y + 58, wp.w - 112, 12.5, '#e8ddc9', 16);
  // Combo badge when a Surge just landed
  if (game.lastReport && game.lastReport.surge && game.lastPlaySide === 'player') {
    ctx.fillStyle = '#ffd76a';
    roundRect(ctx, wp.x + 100, wp.y + 128, 150, 26, 13);
    ctx.fill();
    text(ctx, 'SURGE CHAIN ×' + Math.max(2, game.player.chain), wp.x + 175, wp.y + 146, 13, '#4a2400', '900', 'center');
  }

  // Warden hand (card backs) + label
  text(ctx, 'WARDEN’S HAND — ' + game.warden.hand.length + ' CARDS', ZONES.wardenHand.x, ZONES.wardenHand.y + 16, 12, '#c9b8a3', '800');
  for (let i = 0; i < layout.wardenBacks.length; i += 1) {
    const b = layout.wardenBacks[i];
    drawCardBack(ctx, b.x, b.y, b.w, b.h);
  }
  // Warden's last played card, face up at the end of its hand row
  if (game.warden.lastCard) {
    const card = cardById(game.warden.lastCard);
    drawCardFace(ctx, card, ZONES.wardenHand.x + ZONES.wardenHand.w - MINI_W - 4, ZONES.wardenHand.y + 28, MINI_W, MINI_H, {});
  }

  // Warden info panel (life / shield / ember / deck)
  drawSidePanel(ctx, ZONES.wardenInfo.x, ZONES.wardenInfo.y, ZONES.wardenInfo.w, ZONES.wardenInfo.h,
    'ASH WARDEN — LIFE', game.warden, true);

  // Play zone: the two last-played cards face each other
  const pz = ZONES.playZone;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, pz.x, pz.y, pz.w, pz.h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,106,0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, pz.x, pz.y, pz.w, pz.h, 14);
  ctx.stroke();
  text(ctx, 'PLAY ZONE', pz.x + 16, pz.y + 22, 12, '#ffd76a', '800');
  const pCard = game.player.lastCard ? cardById(game.player.lastCard) : null;
  const wCard = game.warden.lastCard ? cardById(game.warden.lastCard) : null;
  const cy0 = pz.y + 30;
  if (pCard) drawCardFace(ctx, pCard, pz.x + 60, cy0, MINI_W, MINI_H, {});
  else text(ctx, 'Your last card', pz.x + 102, cy0 + 60, 12, '#8a7a6a', '700', 'center');
  if (wCard) drawCardFace(ctx, wCard, pz.x + pz.w - 60 - MINI_W, cy0, MINI_W, MINI_H, {});
  else text(ctx, 'Warden’s last card', pz.x + pz.w - 102, cy0 + 60, 12, '#8a7a6a', '700', 'center');
  // Versus + last result
  text(ctx, 'VS', pz.x + pz.w / 2, cy0 + 62, 20, '#ffd76a', '900', 'center');
  if (game.lastReport) {
    const who = game.lastPlaySide === 'player' ? 'Keeper' : 'Warden';
    let line = '';
    if (game.lastReport.dealt > 0) {
      line = who + ' dealt ' + game.lastReport.dealt;
      if (game.lastReport.edge) line += ' · EDGE +2';
      if (game.lastReport.surge) line += ' · SURGE +3';
    } else if (game.lastReport.shielded > 0) line = who + ' raised +' + game.lastReport.shielded + ' shield';
    else if (game.lastReport.healed > 0) line = who + ' healed ' + game.lastReport.healed;
    else if (game.lastReport.emberGain > 0) line = who + ' kindled +' + game.lastReport.emberGain + ' Ember';
    else if (game.lastReport.drawn > 0) line = who + ' drew ' + game.lastReport.drawn + ' cards';
    if (line) text(ctx, line, pz.x + pz.w / 2, cy0 + 92, 13, '#ffe9c9', '800', 'center');
  }
  if (game.lastReport && game.lastReport.edge) {
    text(ctx, 'ELEMENTAL EDGE — beats the foe’s last element!', pz.x + pz.w / 2, cy0 + 114, 12, '#9ad9ff', '800', 'center');
  }
  // Telegraph line under the play zone
  if (game.phase === 'ai' && game.telegraph) {
    text(ctx, game.telegraph, pz.x + pz.w / 2, pz.y + pz.h - 10, 13, '#ffb37a', '800', 'center');
  }

  // HUD record panel
  drawHud(ctx, game);

  // Player panel
  drawSidePanel(ctx, ZONES.playerPanel.x, ZONES.playerPanel.y, ZONES.playerPanel.w, ZONES.playerPanel.h,
    'KEEPER — YOU', game.player, false);

  // Player hand
  text(ctx, 'YOUR HAND — click a card to play it (1–7)', ZONES.playerHand.x, ZONES.playerHand.y + 16, 12, '#c9b8a3', '800');
  const hoverIndex = game.hoverCard;
  for (let i = 0; i < layout.playerCards.length; i += 1) {
    const slot = layout.playerCards[i];
    const card = cardById(slot.id);
    if (!card) continue;
    const affordable = game.player.ember >= card.cost;
    const hovered = hoverIndex === i;
    const lift = hovered ? 20 : 0;
    drawCardFace(ctx, card, slot.x, slot.y - lift, slot.w, slot.h,
      { playable: affordable, dim: !affordable && game.phase === 'player', glow: hovered });
    if (hovered) {
      text(ctx, 'Click to play — ' + card.cost + ' Ember', slot.x + slot.w / 2, slot.y - lift - 8, 11, '#ffd76a', '800', 'center');
    }
  }

  // Side panel: End Turn + legend + controls
  const sp = ZONES.sidePanel;
  ctx.fillStyle = 'rgba(12,8,14,0.72)';
  roundRect(ctx, sp.x, sp.y, sp.w, sp.h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,182,255,0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, sp.x, sp.y, sp.w, sp.h, 14);
  ctx.stroke();
  drawEndTurnButton(ctx, layout, game);
  drawLegend(ctx, sp.x + 24, sp.y + 108);
  text(ctx, 'Click a card or press 1–7 · Space = End Turn · R = Restart', sp.x + 24, sp.y + 196, 11, '#c9b8a3', '700');

  // Floating damage numbers
  for (let i = 0; i < motion.floaters.length; i += 1) {
    const f = motion.floaters[i];
    const alpha = Math.max(0, 1 - f.life / f.maxLife);
    ctx.globalAlpha = alpha;
    text(ctx, f.text, f.x, f.y, f.big ? 30 : 20, f.color, '900', 'center');
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, game) {
  // Dimmed table behind the title
  const bg = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
  bg.addColorStop(0, '#2a1016');
  bg.addColorStop(0.6, '#1a0f1e');
  bg.addColorStop(1, '#0e0a12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  for (let i = 0; i < 60; i += 1) {
    const px = (i * 211 + 53) % TABLE_WIDTH;
    const py = (i * 137 + 29) % TABLE_HEIGHT;
    ctx.globalAlpha = 0.3 + (i % 3) * 0.15;
    drawGlyph(ctx, 'flame', px, py, 4 + (i % 4), '#ff9a3c');
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(10,6,12,0.55)';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

  // Big title
  const grad = ctx.createLinearGradient(0, 110, 0, 210);
  grad.addColorStop(0, '#ffd76a');
  grad.addColorStop(1, '#ff7a2f');
  ctx.fillStyle = grad;
  ctx.font = '900 96px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBERFALL', TABLE_WIDTH / 2, 196);
  text(ctx, '— DUEL OF THE LAST FLAME —', TABLE_WIDTH / 2, 232, 20, '#ffe9c9', '800', 'center');
  text(ctx, 'Two keepers. One flame. Burn the Ash Warden to 0 life before yours goes out.',
    TABLE_WIDTH / 2, 264, 16, '#c9b8a3', '700', 'center');

  // Scope panel: what the game holds
  ctx.fillStyle = 'rgba(12,8,14,0.78)';
  roundRect(ctx, 190, 292, 900, 218, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,106,0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, 190, 292, 900, 218, 16);
  ctx.stroke();
  text(ctx, 'WHAT’S IN THE DUEL', 640, 326, 15, '#ffd76a', '800', 'center');
  const left = [
    '24 unique cards — 6 kinds in each of 4 elements',
    '30 life each · Ember grows 1 per turn, max 10',
    'Draw 2 every turn · 5-card opening hand, max 7',
  ];
  const right = [
    'Elemental edge: beat the foe’s last element, +2',
    'Surge combo: two same-element cards in a row, +3',
    'The Warden telegraphs its plan — read it, counter it',
  ];
  let cy = 356;
  for (let i = 0; i < 3; i += 1) {
    text(ctx, '◆  ' + left[i], 220, cy, 14, '#e8ddc9', '700');
    text(ctx, '◆  ' + right[i], 690, cy, 14, '#e8ddc9', '700');
    cy += 30;
  }
  text(ctx, 'First to 0 life loses. Guard blocks damage. Drain heals. Ember cards feed next turn.',
    640, cy + 12, 14, '#ffb37a', '800', 'center');

  // Element legend
  text(ctx, 'THE FOUR ELEMENTS', 640, 552, 13, '#ffd76a', '800', 'center');
  let lx = 640 - 3 * 92;
  for (let i = 0; i < ELEMENT_ORDER.length; i += 1) {
    const el = ELEMENTS[ELEMENT_ORDER[i]];
    drawGlyph(ctx, el.glyph, lx, 588, 18, el.color);
    text(ctx, el.name, lx, 622, 15, el.light, '800', 'center');
    text(ctx, 'beats ' + ELEMENTS[el.beats].name, lx, 640, 11, '#c9b8a3', '700', 'center');
    lx += 184;
  }
  // Begin button
  const b = { x: TABLE_WIDTH / 2 - 170, y: 668, w: 340, h: 60 };
  ctx.fillStyle = '#ff7a2f';
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 3;
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.stroke();
  text(ctx, 'CLICK TO BEGIN', TABLE_WIDTH / 2, b.y + 38, 22, '#ffffff', '900', 'center');
  text(ctx, 'Mouse + keyboard: click cards · 1–7 play · Space end turn · R restart',
    TABLE_WIDTH / 2, 758, 13, '#c9b8a3', '700', 'center');
  if (game.bestTurns) {
    text(ctx, 'Best victory: ' + game.bestTurns + ' turns', TABLE_WIDTH / 2, 782, 13, '#ffd76a', '800', 'center');
  }
}

function drawEndScreen(ctx, game, won) {
  // Dimmed table behind
  ctx.fillStyle = won ? 'rgba(20,14,4,0.82)' : 'rgba(12,6,8,0.85)';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  if (won) {
    // Golden ember burst
    for (let i = 0; i < 90; i += 1) {
      const angle = (i * 137.5 * Math.PI) / 180;
      const dist = 60 + (i % 9) * 34;
      const px = TABLE_WIDTH / 2 + Math.cos(angle) * dist;
      const py = 240 + Math.sin(angle) * dist * 0.7;
      ctx.globalAlpha = 0.35 + (i % 3) * 0.2;
      drawGlyph(ctx, 'flame', px, py, 4 + (i % 4) * 2, i % 2 ? '#ffd76a' : '#ff7a2f');
    }
    ctx.globalAlpha = 1;
  } else {
    for (let i = 0; i < 50; i += 1) {
      const px = (i * 251 + 97) % TABLE_WIDTH;
      const py = (i * 173 + 61) % TABLE_HEIGHT;
      ctx.globalAlpha = 0.25;
      drawGlyph(ctx, 'flame', px, py, 3 + (i % 3), '#5a4a3a');
    }
    ctx.globalAlpha = 1;
  }
  const stats = game.endStats || game.stats;
  ctx.fillStyle = 'rgba(12,8,14,0.9)';
  roundRect(ctx, 290, 120, 700, 470, 20);
  ctx.fill();
  ctx.strokeStyle = won ? '#ffd76a' : '#8a4a3a';
  ctx.lineWidth = 3;
  roundRect(ctx, 290, 120, 700, 470, 20);
  ctx.stroke();
  text(ctx, won ? 'VICTORY' : 'DEFEAT', 640, 196, 64, won ? '#ffd76a' : '#c98a7a', '900', 'center');
  text(ctx, won ? 'The Warden falls — the Last Flame is yours.' : 'The flame dies — the Warden keeps the ember.',
    640, 230, 17, '#ffe9c9', '800', 'center');
  // Stats grid
  const rows = [
    ['Turns played', String(stats.turns)],
    ['Damage dealt', String(stats.damageDealt)],
    ['Damage taken', String(stats.damageTaken)],
    ['Best combo', stats.bestCombo > 0 ? stats.bestCombo + ' cards in a row' : '—'],
    ['Cards played', String(stats.cardsPlayed)],
    ['Elemental edges', String(stats.edges)],
    ['Surge combos', String(stats.surges)],
  ];
  let cy = 282;
  for (let i = 0; i < rows.length; i += 1) {
    text(ctx, rows[i][0], 360, cy, 16, '#c9b8a3', '700');
    text(ctx, rows[i][1], 920, cy, 16, '#ffffff', '800', 'right');
    cy += 34;
  }
  if (won && game.bestTurns) {
    text(ctx, 'Best victory: ' + game.bestTurns + ' turns', 640, cy + 8, 14, '#ffd76a', '800', 'center');
  }
  const b = { x: TABLE_WIDTH / 2 - 170, y: 636, w: 340, h: 60 };
  ctx.fillStyle = won ? '#ff7a2f' : '#5a3a30';
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2.5;
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.stroke();
  text(ctx, 'PLAY AGAIN — press R', TABLE_WIDTH / 2, b.y + 38, 20, '#ffffff', '900', 'center');
}

// ---- Entry point: draw one frame ----
export function drawGame(ctx, game, motion, layout, timeMs) {
  ctx.save();
  if (motion.shake > 0.5) {
    const s = motion.shake;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  if (game.screen === SCREEN_TITLE) drawTitle(ctx, game);
  else if (game.screen === SCREEN_WIN) { drawTable(ctx, game, motion, layout, timeMs); drawEndScreen(ctx, game, true); }
  else if (game.screen === SCREEN_LOSS) { drawTable(ctx, game, motion, layout, timeMs); drawEndScreen(ctx, game, false); }
  else drawTable(ctx, game, motion, layout, timeMs);
  ctx.restore();
}

export { SCREEN_TITLE, SCREEN_WIN, SCREEN_LOSS };
