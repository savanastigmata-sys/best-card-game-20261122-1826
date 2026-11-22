// Seeded deck building, shuffling and drawing. The whole duel is reproducible
// from one integer seed, which is what makes the screenshot shots deterministic.
import { CARD_DEFS, DECK_EXTRA_IDS, cardById } from './cards.js';

// A small deterministic PRNG (mulberry32). No Math.random anywhere in the game.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a fresh 30-card deck (card id strings) and shuffle it with the seed.
export function buildDeck(seed) {
  const ids = CARD_DEFS.map((card) => card.id).concat(DECK_EXTRA_IDS);
  const rand = seededRandom(seed);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = ids[i];
    ids[i] = ids[j];
    ids[j] = tmp;
  }
  return ids;
}

// Move up to `count` cards from the top of `deck` into `hand` (max hand size
// enforced by the caller through MAX_HAND). Burned draws (full hand) go to
// the discard pile and are reported in the log.
export function drawCards(deck, hand, discard, count, maxHand) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (deck.length === 0) break;
    const id = deck.shift();
    if (hand.length < maxHand) {
      hand.push(id);
      drawn.push(id);
    } else {
      discard.push(id);
    }
  }
  return drawn;
}

// Resolve a card id to its definition; handy for the renderer and the AI.
export function resolveHand(hand) {
  return hand.map((id) => cardById(id));
}
