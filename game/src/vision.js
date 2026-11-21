// Shadow Ledger — vision: line of sight, vision cones and raycasts.
// Guards see in a cone, and only when no wall, crate or fern stands
// between them and the player. The same geometry drives the cone the
// player sees on screen, so what is drawn is exactly what is checked.

import { GUARD } from './config.js';
import { sightBlockers } from './level.js';

// Segment (x1,y1)-(x2,y2) against one axis-aligned rectangle.
// Returns the entry distance t in [0,1] along the segment, or null.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  // Slab test, one axis at a time.
  for (const [origin, delta, lo, hi] of [
    [x1, dx, rect.x, rect.x + rect.w],
    [y1, dy, rect.y, rect.y + rect.h],
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (origin < lo || origin > hi) return null;
    } else {
      let t0 = (lo - origin) / delta;
      let t1 = (hi - origin) / delta;
      if (t0 > t1) [t0, t1] = [t1, t0];
      tMin = Math.max(tMin, t0);
      tMax = Math.min(tMax, t1);
      if (tMin > tMax) return null;
    }
  }
  return tMin;
}

// True when nothing blocks the straight line between two points.
export function lineOfSight(x1, y1, x2, y2, blockers = sightBlockers()) {
  for (const rect of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, rect) !== null) return false;
  }
  return true;
}

// Shortest angle between two headings, in (-PI, PI].
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

// True when (px, py) sits inside the guard's cone and sight is clear.
// `hidden` is true while the player crouches in a fern: only a guard
// almost on top of them can pick them out.
export function guardCanSee(guard, px, py, hidden) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.viewDistance) return false;
  if (hidden && dist > GUARD.bushHideDistance) return false;
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(toPlayer, guard.facing)) > GUARD.viewHalfAngle) return false;
  return lineOfSight(guard.x, guard.y, px, py);
}

// How visible the player is right now, 0 (unseen) to 1 (point blank).
// Used to scale how fast suspicion climbs.
export function visibilityFactor(guard, px, py, hidden, sneaking) {
  const dist = Math.hypot(px - guard.x, py - guard.y);
  const near = 1 - Math.min(dist / GUARD.viewDistance, 1);
  let factor = GUARD.suspicionGainFar + (GUARD.suspicionGainBase - GUARD.suspicionGainFar) * near;
  if (sneaking) factor *= 0.55;
  if (hidden) factor *= 0.35;
  return factor;
}

// Cast one ray from (x, y) along `angle`; return the distance to the
// nearest sight blocker, capped at maxDist.
export function rayDistance(x, y, angle, maxDist, blockers = sightBlockers()) {
  const x2 = x + Math.cos(angle) * maxDist;
  const y2 = y + Math.sin(angle) * maxDist;
  let best = maxDist;
  for (const rect of blockers) {
    const t = segmentHitsRect(x, y, x2, y2, rect);
    if (t !== null) best = Math.min(best, t * maxDist);
  }
  return best;
}

// The guard's cone clipped by walls: sample rays across the cone and
// return the polygon points, so the drawn cone hugs the furniture.
export function conePolygon(guard, rays = 26) {
  const points = [{ x: guard.x, y: guard.y }];
  const start = guard.facing - GUARD.viewHalfAngle;
  const end = guard.facing + GUARD.viewHalfAngle;
  for (let i = 0; i <= rays; i++) {
    const angle = start + ((end - start) * i) / rays;
    const d = rayDistance(guard.x, guard.y, angle, GUARD.viewDistance);
    points.push({ x: guard.x + Math.cos(angle) * d, y: guard.y + Math.sin(angle) * d });
  }
  return points;
}
