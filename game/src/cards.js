// The 24 unique cards of EMBERFALL: six kinds in each of the four elements.
// Fields: id, name, element, kind, cost, damage, shield, heal, draw, ember.
// damage = life damage dealt, shield = guard gained, heal = life restored,
// draw = cards drawn, ember = Ember added next turn. A value of 0 means unused.
export const CARD_DEFS = [
  // ---- Flame ----
  { id: 'flame-strike', name: 'Ember Lash', element: 'flame', kind: 'Strike', cost: 1, damage: 3, shield: 0, heal: 0, draw: 0, ember: 0, text: 'Deal 3 damage.' },
  { id: 'flame-guard', name: 'Cinder Guard', element: 'flame', kind: 'Guard', cost: 2, damage: 0, shield: 5, heal: 0, draw: 0, ember: 0, text: 'Gain 5 shield.' },
  { id: 'flame-drain', name: 'Pyre Drain', element: 'flame', kind: 'Drain', cost: 3, damage: 4, shield: 0, heal: 3, draw: 0, ember: 0, text: 'Deal 4 damage. Heal 3.' },
  { id: 'flame-surge', name: 'Flame Surge', element: 'flame', kind: 'Surge', cost: 2, damage: 3, shield: 0, heal: 0, draw: 0, ember: 0, text: '+3 if same element as your last card.' },
  { id: 'flame-draw', name: 'Flash Draw', element: 'flame', kind: 'Draw', cost: 2, damage: 2, shield: 0, heal: 0, draw: 2, ember: 0, text: 'Draw 2. Deal 2 damage.' },
  { id: 'flame-ember', name: 'Kindle', element: 'flame', kind: 'Ember', cost: 1, damage: 0, shield: 0, heal: 0, draw: 0, ember: 2, text: '+2 Ember next turn.' },
  // ---- Thorn ----
  { id: 'thorn-strike', name: 'Briar Storm', element: 'thorn', kind: 'Strike', cost: 3, damage: 6, shield: 0, heal: 0, draw: 0, ember: 0, text: 'Deal 6 damage.' },
  { id: 'thorn-guard', name: 'Barkwall', element: 'thorn', kind: 'Guard', cost: 2, damage: 0, shield: 5, heal: 0, draw: 0, ember: 0, text: 'Gain 5 shield.' },
  { id: 'thorn-drain', name: 'Sap Leech', element: 'thorn', kind: 'Drain', cost: 3, damage: 4, shield: 0, heal: 3, draw: 0, ember: 0, text: 'Deal 4 damage. Heal 3.' },
  { id: 'thorn-surge', name: 'Vine Surge', element: 'thorn', kind: 'Surge', cost: 2, damage: 3, shield: 0, heal: 0, draw: 0, ember: 0, text: '+3 if same element as your last card.' },
  { id: 'thorn-draw', name: 'Pollen Rush', element: 'thorn', kind: 'Draw', cost: 2, damage: 2, shield: 0, heal: 0, draw: 2, ember: 0, text: 'Draw 2. Deal 2 damage.' },
  { id: 'thorn-ember', name: 'Bloom', element: 'thorn', kind: 'Ember', cost: 1, damage: 0, shield: 0, heal: 0, draw: 0, ember: 2, text: '+2 Ember next turn.' },
  // ---- Tide ----
  { id: 'tide-strike', name: 'Crashing Wave', element: 'tide', kind: 'Strike', cost: 3, damage: 6, shield: 0, heal: 0, draw: 0, ember: 0, text: 'Deal 6 damage.' },
  { id: 'tide-guard', name: 'Stillwater', element: 'tide', kind: 'Guard', cost: 2, damage: 0, shield: 6, heal: 0, draw: 0, ember: 0, text: 'Gain 6 shield.' },
  { id: 'tide-drain', name: 'Deep Drink', element: 'tide', kind: 'Drain', cost: 3, damage: 4, shield: 0, heal: 3, draw: 0, ember: 0, text: 'Deal 4 damage. Heal 3.' },
  { id: 'tide-surge', name: 'Riptide Surge', element: 'tide', kind: 'Surge', cost: 2, damage: 3, shield: 0, heal: 0, draw: 0, ember: 0, text: '+3 if same element as your last card.' },
  { id: 'tide-draw', name: 'Undertow', element: 'tide', kind: 'Draw', cost: 2, damage: 2, shield: 0, heal: 0, draw: 2, ember: 0, text: 'Draw 2. Deal 2 damage.' },
  { id: 'tide-ember', name: 'Springwell', element: 'tide', kind: 'Ember', cost: 1, damage: 0, shield: 0, heal: 0, draw: 0, ember: 2, text: '+2 Ember next turn.' },
  // ---- Stone ----
  { id: 'stone-strike', name: 'Pebble Shot', element: 'stone', kind: 'Strike', cost: 1, damage: 3, shield: 0, heal: 0, draw: 0, ember: 0, text: 'Deal 3 damage.' },
  { id: 'stone-guard', name: 'Granite Wall', element: 'stone', kind: 'Guard', cost: 3, damage: 0, shield: 8, heal: 0, draw: 0, ember: 0, text: 'Gain 8 shield.' },
  { id: 'stone-drain', name: 'Quarry Drain', element: 'stone', kind: 'Drain', cost: 3, damage: 4, shield: 0, heal: 3, draw: 0, ember: 0, text: 'Deal 4 damage. Heal 3.' },
  { id: 'stone-surge', name: 'Quake Surge', element: 'stone', kind: 'Surge', cost: 2, damage: 3, shield: 0, heal: 0, draw: 0, ember: 0, text: '+3 if same element as your last card.' },
  { id: 'stone-draw', name: 'Dust Devil', element: 'stone', kind: 'Draw', cost: 2, damage: 2, shield: 0, heal: 0, draw: 2, ember: 0, text: 'Draw 2. Deal 2 damage.' },
  { id: 'stone-ember', name: 'Leyline', element: 'stone', kind: 'Ember', cost: 1, damage: 0, shield: 0, heal: 0, draw: 0, ember: 2, text: '+2 Ember next turn.' },
];

// The 30-card deck: all 24 unique cards plus six extra copies of the cheap
// workhorses (one Strike and one Ember per element, minus two to land on 30).
export const DECK_EXTRA_IDS = [
  'flame-strike', 'thorn-strike', 'tide-strike', 'stone-strike',
  'flame-ember', 'tide-ember',
];

export function cardById(id) {
  for (let i = 0; i < CARD_DEFS.length; i += 1) {
    if (CARD_DEFS[i].id === id) return CARD_DEFS[i];
  }
  return null;
}

// The headline number printed big in the middle of a card face.
export function cardHeadline(card) {
  if (card.damage > 0) return String(card.damage);
  if (card.shield > 0) return String(card.shield);
  if (card.ember > 0) return '+' + card.ember;
  return String(card.cost);
}
