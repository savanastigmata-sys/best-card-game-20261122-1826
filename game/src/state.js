// The duel state machine: title → table → win/loss, plus the turn flow that
// both the live game and the deterministic screenshot shots drive.
// Screens: 'title' | 'table' | 'win' | 'loss'. Phases: 'player' | 'ai' | 'over'.
import {
  START_LIFE, START_EMBER, MAX_EMBER, START_HAND, DRAW_PER_TURN, MAX_HAND, MAX_TURNS,
} from './config.js';
import { cardById } from './cards.js';
import { buildDeck, drawCards } from './deck.js';
import { canAfford, applyCardEffect } from './rules.js';
import { chooseWardenPlays, wardenTelegraph } from './ai.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_TABLE = 'table';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

function makeSide(deck) {
  return {
    life: START_LIFE, shield: 0, ember: START_EMBER, emberBonus: 0,
    deck, hand: [], discard: [], lastCard: null, lastElement: null, chain: 0,
  };
}

// A fresh duel object. Nothing is dealt until beginDuel runs.
export function createDuel(seed) {
  return {
    seed, screen: SCREEN_TITLE, phase: 'player', turn: 0,
    player: makeSide([]), warden: makeSide([]),
    log: [], telegraph: '', lastReport: null, lastPlaySide: null,
    stats: { damageDealt: 0, damageTaken: 0, bestCombo: 0, cardsPlayed: 0, edges: 0, surges: 0 },
    endStats: null, frozen: false, shotName: null, over: false,
  };
}

export function addLog(game, line) {
  game.log.push(line);
  if (game.log.length > 5) game.log.shift();
}

// Deal a fresh duel from the seed: both sides draw their opening hands.
export function beginDuel(game) {
  game.player = makeSide(buildDeck(game.seed));
  game.warden = makeSide(buildDeck(game.seed + 101));
  game.turn = 1;
  game.phase = 'player';
  game.screen = SCREEN_TABLE;
  game.over = false;
  game.log = [];
  game.telegraph = 'The Warden watches the flame…';
  game.lastReport = null;
  game.lastPlaySide = null;
  game.stats = { damageDealt: 0, damageTaken: 0, bestCombo: 0, cardsPlayed: 0, edges: 0, surges: 0 };
  game.endStats = null;
  drawCards(game.player.deck, game.player.hand, game.player.discard, START_HAND, MAX_HAND);
  drawCards(game.warden.deck, game.warden.hand, game.warden.discard, START_HAND, MAX_HAND);
  addLog(game, 'Turn 1 — The duel begins. Keeper, play a card.');
  return game;
}

// Start the Keeper's turn: Ember grows, the Ember bonus lands, two cards drawn.
export function startPlayerTurn(game) {
  const p = game.player;
  p.ember = Math.min(MAX_EMBER, p.ember + 1 + p.emberBonus);
  p.emberBonus = 0;
  // Note: the Surge chain is NOT reset here — a chain is consecutive same-
  // element plays by the Keeper, and it survives the Warden's turn.
  const drawn = drawCards(p.deck, p.hand, p.discard, DRAW_PER_TURN, MAX_HAND);
  game.phase = 'player';
  addLog(game, 'Turn ' + game.turn + ' — Keeper draws ' + drawn.length + ' (Ember ' + p.ember + ').');
}

// Play one card from a side's hand. Returns the effect report, or null when
// the play is illegal (wrong phase, unaffordable, out of range).
export function playCard(game, sideName, handIndex) {
  const side = sideName === 'player' ? game.player : game.warden;
  const foe = sideName === 'player' ? game.warden : game.player;
  if (handIndex < 0 || handIndex >= side.hand.length) return null;
  const card = cardById(side.hand[handIndex]);
  if (!card || !canAfford(side, card)) return null;
  side.hand.splice(handIndex, 1);
  side.ember -= card.cost;
  side.discard.push(card.id);
  const ownLast = side.lastElement;
  const report = applyCardEffect(card, side, foe);
  if (report.drawn > 0) {
    drawCards(side.deck, side.hand, side.discard, report.drawn, MAX_HAND);
  }
  game.lastReport = report;
  game.lastPlaySide = sideName;
  if (sideName === 'player') {
    game.stats.cardsPlayed += 1;
    if (report.dealt > 0) game.stats.damageDealt += report.dealt;
    if (report.edge) game.stats.edges += 1;
    if (report.surge) game.stats.surges += 1;
    // Combo chain: consecutive cards of the same element, within the turn.
    if (card.element === ownLast) side.chain += 1;
    else side.chain = 1;
    if (side.chain >= 2 && side.chain > game.stats.bestCombo) game.stats.bestCombo = side.chain;
  } else if (report.dealt > 0) {
    game.stats.damageTaken += report.dealt;
  }
  const who = sideName === 'player' ? 'Keeper' : 'Warden';
  let line = who + ' plays ' + card.name + ' (' + card.element + ')';
  if (report.dealt > 0) line += ' — ' + report.dealt + ' damage';
  if (report.edge) line += ' · Elemental edge +2';
  if (report.surge) line += ' · SURGE +3';
  if (report.shielded > 0) line += ' · +' + report.shielded + ' shield';
  if (report.healed > 0) line += ' · heals ' + report.healed;
  if (report.drawn > 0) line += ' · draws ' + report.drawn;
  if (report.emberGain > 0) line += ' · +' + report.emberGain + ' Ember next turn';
  addLog(game, line);
  finishIfOver(game);
  return report;
}

// The Keeper ends the turn: the Warden draws, telegraphs, and its plays are
// returned for the caller to execute (animated in live play, instant in shots).
export function endPlayerTurn(game) {
  if (game.phase !== 'player' || game.over) return [];
  game.phase = 'ai';
  const w = game.warden;
  w.ember = Math.min(MAX_EMBER, w.ember + 1 + w.emberBonus);
  w.emberBonus = 0;
  drawCards(w.deck, w.hand, w.discard, DRAW_PER_TURN, MAX_HAND);
  const plays = chooseWardenPlays(w, game.player);
  game.telegraph = wardenTelegraph(plays, w, game.player);
  addLog(game, game.telegraph);
  return plays;
}

// Play one Warden card by id (the live loop schedules these one by one).
export function playWardenCard(game, cardId) {
  const index = game.warden.hand.indexOf(cardId);
  if (index === -1) return null;
  return playCard(game, 'warden', index);
}

// After the Warden's plays, hand the turn back to the Keeper.
export function finishWardenTurn(game) {
  if (game.over) return;
  game.turn += 1;
  if (game.turn > MAX_TURNS) {
    game.over = true;
    game.screen = game.player.life >= game.warden.life ? SCREEN_WIN : SCREEN_LOSS;
    game.endStats = snapshotStats(game);
    return;
  }
  startPlayerTurn(game);
}

// Decide the ending and freeze the duel when a life total hits zero.
export function finishIfOver(game) {
  if (game.over) return;
  if (game.warden.life <= 0) {
    game.over = true;
    game.phase = 'over';
    game.screen = SCREEN_WIN;
    game.endStats = snapshotStats(game);
    addLog(game, 'VICTORY — The Warden falls. The Last Flame is yours.');
  } else if (game.player.life <= 0) {
    game.over = true;
    game.phase = 'over';
    game.screen = SCREEN_LOSS;
    game.endStats = snapshotStats(game);
    addLog(game, 'DEFEAT — The flame dies. The Warden keeps the ember.');
  }
}

export function snapshotStats(game) {
  return {
    turns: game.turn,
    damageDealt: game.stats.damageDealt,
    damageTaken: game.stats.damageTaken,
    bestCombo: game.stats.bestCombo,
    cardsPlayed: game.stats.cardsPlayed,
    edges: game.stats.edges,
    surges: game.stats.surges,
  };
}
