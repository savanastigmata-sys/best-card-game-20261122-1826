// The combat rules of EMBERFALL: elemental advantage, the Surge combo, and
// what a played card actually does to life, shield, hand and Ember.
// Pure functions over plain data — no canvas, no DOM, no randomness here.
import { ELEMENTS, EDGE_BONUS, SURGE_BONUS, SURGE_KIND_BONUS, MAX_LIFE } from './config.js';

// True when element `a` beats element `b` on the ring Flame > Thorn > Tide > Stone > Flame.
export function elementBeats(a, b) {
  if (!a || !b) return false;
  return ELEMENTS[a].beats === b;
}

// Work out the damage (and the reasons for it) of playing `card` now.
// `ownLast` is the element of your last played card (Surge chain), `foeLast`
// the element of the opponent's last played card (elemental edge).
export function computeCardDamage(card, ownLast, foeLast) {
  let damage = card.damage;
  let edge = false;
  let surge = false;
  if (card.damage > 0 && foeLast && elementBeats(card.element, foeLast)) {
    damage += EDGE_BONUS;
    edge = true;
  }
  if (card.damage > 0 && ownLast && card.element === ownLast) {
    damage += SURGE_BONUS;
    surge = true;
    if (card.kind === 'Surge') damage += SURGE_KIND_BONUS;
  }
  return { damage, edge, surge };
}

// Deal `amount` damage to a side: shield soaks first, the rest hits life.
export function dealDamage(side, amount) {
  let left = amount;
  if (side.shield > 0) {
    const soaked = Math.min(side.shield, left);
    side.shield -= soaked;
    left -= soaked;
  }
  side.life = Math.max(0, side.life - left);
  return left;
}

// Apply a played card. `side` is the one playing, `foe` the one receiving.
// Returns a report the renderer and log use: { damage, edge, surge, healed,
// shielded, drawn, emberGain }. Drawing is done by the caller (it owns decks).
export function applyCardEffect(card, side, foe) {
  const report = computeCardDamage(card, side.lastElement, foe.lastElement);
  if (report.damage > 0) {
    report.dealt = dealDamage(foe, report.damage);
  } else {
    report.dealt = 0;
  }
  if (card.shield > 0) {
    side.shield += card.shield;
    report.shielded = card.shield;
  } else {
    report.shielded = 0;
  }
  if (card.heal > 0) {
    const before = side.life;
    side.life = Math.min(MAX_LIFE, side.life + card.heal);
    report.healed = side.life - before;
  } else {
    report.healed = 0;
  }
  if (card.ember > 0) {
    side.emberBonus += card.ember;
    report.emberGain = card.ember;
  } else {
    report.emberGain = 0;
  }
  report.drawn = card.draw;
  side.lastCard = card.id;
  side.lastElement = card.element;
  return report;
}

// Can this side afford to play this card right now?
export function canAfford(side, card) {
  return side.ember >= card.cost;
}

// Score a card for the AI / autopilot: damage and utility, plus edge and
// Surge bonuses, so the best-looking play floats to the top of the hand.
// Damage is king: a wall is only worth much when life is low.
export function scoreCardForPlay(card, side, foe) {
  const report = computeCardDamage(card, side.lastElement, foe.lastElement);
  let value = report.damage * 1.2;
  value += card.shield * (side.life <= 10 ? 0.9 : 0.45);
  value += card.heal * 0.6;
  value += card.draw * 1.2;
  value += card.ember * 0.8;
  if (report.edge) value += 1.5;
  if (report.surge) value += 1.5;
  if (foe.life - report.damage <= 0) value += 100;
  if (side.life <= 10 && card.shield > 0) value += 4;
  if (side.life <= 10 && card.heal > 0) value += 3;
  return value - card.cost * 0.35;
}
