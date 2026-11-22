// Motion for EMBERFALL: card tweens, floating damage numbers, screen shake,
// and a small scheduler the live game uses to space the Warden's plays out.
// Everything here is time-based and freezes cleanly for screenshots.
export function createMotion() {
  return { tweens: [], floaters: [], shake: 0, scheduled: [], time: 0 };
}

// Ease-out cubic: fast start, soft landing — cards snap into place.
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutBack(t) {
  const c = 1.70158;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

// Animate a plain object's numeric fields from `from` to `to` over `durMs`.
export function addTween(motion, target, from, to, durMs, ease, onDone) {
  for (const key of Object.keys(from)) target[key] = from[key];
  motion.tweens.push({ target, from, to, durMs, elapsed: 0, ease: ease || easeOutCubic, onDone: onDone || null });
}

export function updateTweens(motion, dtMs) {
  for (let i = motion.tweens.length - 1; i >= 0; i -= 1) {
    const tween = motion.tweens[i];
    tween.elapsed += dtMs;
    const t = Math.min(1, tween.elapsed / tween.durMs);
    const e = tween.ease(t);
    for (const key of Object.keys(tween.from)) {
      tween.target[key] = tween.from[key] + (tween.to[key] - tween.from[key]) * e;
    }
    if (t >= 1) {
      motion.tweens.splice(i, 1);
      if (tween.onDone) tween.onDone();
    }
  }
}

// A number that floats up and fades: damage, healing, "SURGE +3", "EDGE +2".
export function addFloater(motion, x, y, text, color, big) {
  motion.floaters.push({ x, y, text, color, big: !!big, life: 0, maxLife: 1100 });
}

export function updateFloaters(motion, dtMs) {
  for (let i = motion.floaters.length - 1; i >= 0; i -= 1) {
    const floater = motion.floaters[i];
    floater.life += dtMs;
    floater.y -= dtMs * 0.045;
    if (floater.life >= floater.maxLife) motion.floaters.splice(i, 1);
  }
}

// A short shake, strongest on big hits. render.js offsets the whole table by it.
export function addShake(motion, strength) {
  motion.shake = Math.max(motion.shake, strength);
}

export function updateShake(motion, dtMs) {
  if (motion.shake > 0) motion.shake = Math.max(0, motion.shake - dtMs * 0.02);
}

// Run `fn` after `delayMs` of game time. The live loop drains these; the
// screenshot stager runs them all instantly instead.
export function schedule(motion, delayMs, fn) {
  motion.scheduled.push({ at: motion.time + delayMs, fn });
}

export function updateScheduled(motion) {
  for (let i = motion.scheduled.length - 1; i >= 0; i -= 1) {
    if (motion.scheduled[i].at <= motion.time) {
      const item = motion.scheduled.splice(i, 1)[0];
      item.fn();
    }
  }
}

// Finish everything at once: all tweens land, floaters clear, scheduled work runs.
export function freezeMotion(motion) {
  for (const tween of motion.tweens) {
    for (const key of Object.keys(tween.to)) tween.target[key] = tween.to[key];
    if (tween.onDone) tween.onDone();
  }
  motion.tweens = [];
  motion.floaters = [];
  motion.shake = 0;
  const pending = motion.scheduled.slice();
  motion.scheduled = [];
  for (const item of pending) item.fn();
}
