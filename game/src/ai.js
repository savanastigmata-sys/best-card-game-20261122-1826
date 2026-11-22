// The Ash Warden's brain: a readable opponent. Every turn it picks its plays
// by plain value (lethal first, guard when hurt, elemental edge when it can),
// then telegraphs its intent in one line BEFORE it acts, so the player can
// read the plan and counter it next turn.
import { ELEMENTS } from './config.js';
import { cardById } from './cards.js';
import { canAfford, scoreCardForPlay } from './rules.js';

// Pick the Warden's plays for this turn, best value first, while Ember lasts.
// Returns an array of card ids in the order they will be played.
export function chooseWardenPlays(warden, player) {
  const scored = [];
  for (let i = 0; i < warden.hand.length; i += 1) {
    const card = cardById(warden.hand[i]);
    if (!card || !canAfford(warden, card)) continue;
    scored.push({ id: card.id, value: scoreCardForPlay(card, warden, player) });
  }
  scored.sort((a, b) => b.value - a.value);
  const plays = [];
  let ember = warden.ember;
  for (let i = 0; i < scored.length; i += 1) {
    const card = cardById(scored[i].id);
    if (card.cost <= ember) {
      plays.push(card.id);
      ember -= card.cost;
    }
  }
  return plays;
}

// One telegraph line naming what the Warden is about to do, shown before it
// acts. Names the element of its first play and the shape of its plan.
export function wardenTelegraph(plays, warden, player) {
  if (plays.length === 0) return 'The Warden holds its flame — nothing to spend.';
  const first = cardById(plays[0]);
  const elementName = ELEMENTS[first.element].name;
  let intent = 'strikes';
  let guard = 0;
  let damage = 0;
  for (let i = 0; i < plays.length; i += 1) {
    const card = cardById(plays[i]);
    guard += card.shield;
    damage += card.damage;
  }
  if (guard >= 5 && damage === 0) intent = 'raises a wall of ' + elementName;
  else if (damage >= 10) intent = 'unleashes a ' + elementName + ' storm';
  else if (first.kind === 'Drain') intent = 'drinks from your flame';
  else if (first.kind === 'Surge') intent = 'chains a ' + elementName + ' surge';
  else if (first.kind === 'Ember') intent = 'kindles more Ember';
  else if (first.kind === 'Draw') intent = 'draws deep and strikes';
  else intent = 'gathers ' + elementName + ' and strikes';
  const lethal = player.life - damage <= 0;
  return 'Ash Warden — ' + intent + (lethal ? ' — LETHAL!' : '.') + ' (' + plays.length + (plays.length === 1 ? ' card' : ' cards') + ')';
}

// The Warden's mood line for the table header: what it is doing right now.
export function wardenStatus(phase, telegraph) {
  if (phase === 'ai') return telegraph || 'The Warden is thinking…';
  if (phase === 'over') return 'The duel is decided.';
  return 'Waiting for the Keeper…';
}
