// Deterministic screenshot staging for ?shot=title|table|win|loss&seed=N.
// Each scene plays the real rules forward from a seeded shuffle with a simple
// autopilot, then freezes on the final frame: no running animation, so the
// same seed always gives the same screenshot.
import { createDuel, beginDuel, playCard, endPlayerTurn, playWardenCard, finishWardenTurn } from './state.js';
import { cardById } from './cards.js';
import { scoreCardForPlay } from './rules.js';
import { freezeMotion } from './animate.js';

const TABLE_TURNS = 3;
const TABLE_PLAYER_CARDS = 2;
const TABLE_WARDEN_CARDS = 1;

// Play the best affordable card from a side's hand. Returns true if one was played.
function playBest(game, sideName) {
  const side = sideName === 'player' ? game.player : game.warden;
  const foe = sideName === 'player' ? game.warden : game.player;
  let bestIndex = -1;
  let bestValue = -Infinity;
  for (let i = 0; i < side.hand.length; i += 1) {
    const card = cardById(side.hand[i]);
    if (!card || side.ember < card.cost) continue;
    const value = scoreCardForPlay(card, side, foe);
    if (value > bestValue) {
      bestValue = value;
      bestIndex = i;
    }
  }
  if (bestIndex === -1) return false;
  playCard(game, sideName, bestIndex);
  return !game.over;
}

// Play up to `limit` cards for a side, best value first.
function playUpTo(game, sideName, limit) {
  for (let i = 0; i < limit; i += 1) {
    if (game.over) return;
    if (!playBest(game, sideName)) return;
  }
}

// Play the WORST affordable card — the loss scene's timid Keeper, who keeps
// the wrong card and lets the Warden run the table.
function playWorst(game, sideName) {
  const side = sideName === 'player' ? game.player : game.warden;
  const foe = sideName === 'player' ? game.warden : game.player;
  let worstIndex = -1;
  let worstValue = Infinity;
  for (let i = 0; i < side.hand.length; i += 1) {
    const card = cardById(side.hand[i]);
    if (!card || side.ember < card.cost) continue;
    const value = scoreCardForPlay(card, side, foe);
    if (value < worstValue) {
      worstValue = value;
      worstIndex = i;
    }
  }
  if (worstIndex === -1) return false;
  playCard(game, sideName, worstIndex);
  return !game.over;
}

// One full round: the Keeper plays, then the Warden plays, then the turn rolls.
// When `playerWorst` is set the Keeper plays its worst card (loss scene).
function playRound(game, playerLimit, wardenLimit, playerWorst) {
  if (playerWorst) {
    for (let i = 0; i < playerLimit; i += 1) {
      if (game.over) return;
      if (!playWorst(game, 'player')) return;
    }
  } else {
    playUpTo(game, 'player', playerLimit);
  }
  if (game.over) return;
  const plays = endPlayerTurn(game);
  for (let i = 0; i < plays.length && i < wardenLimit; i += 1) {
    if (game.over) return;
    playWardenCard(game, plays[i]);
  }
  if (!game.over) finishWardenTurn(game);
}

// After the staged rounds, try to land one more same-element card so the
// cover frame shows a fresh Surge in the play zone. Damage cards first —
// a Guard landing last would hide the Surge behind a shield line.
function landSurgeFlourish(game) {
  if (game.over || game.phase !== 'player') return;
  const player = game.player;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < player.hand.length; i += 1) {
      const card = cardById(player.hand[i]);
      if (!card || card.element !== player.lastElement || player.ember < card.cost) continue;
      if (pass === 0 && card.damage === 0) continue;
      playCard(game, 'player', i);
      return;
    }
  }
}

// Stage the named scene on a fresh duel and freeze it. Returns the duel.
export function stageShot(name, seed, motion) {
  const game = createDuel(seed);
  if (name === 'title') {
    game.screen = 'title';
    game.frozen = true;
    game.shotName = 'title';
    freezeMotion(motion);
    return game;
  }
  beginDuel(game);
  if (name === 'table') {
    for (let t = 0; t < TABLE_TURNS; t += 1) {
      if (game.over) break;
      playRound(game, TABLE_PLAYER_CARDS, TABLE_WARDEN_CARDS, false);
    }
    landSurgeFlourish(game);
  } else if (name === 'win') {
    for (let t = 0; t < 60; t += 1) {
      if (game.over) break;
      playRound(game, 99, 1, false);
    }
  } else if (name === 'loss') {
    for (let t = 0; t < 60; t += 1) {
      if (game.over) break;
      playRound(game, 1, 99, true);
    }
  }
  game.frozen = true;
  game.shotName = name;
  freezeMotion(motion);
  return game;
}
