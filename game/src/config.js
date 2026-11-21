// Shadow Ledger — shared tuning constants for the whole game.
// One place for every number a designer would tweak: sizes, speeds,
// detection rates and colours. Nothing here draws or moves anything.
export const GAME = {
  width: 960,
  height: 640,
  tile: 32,
};

// The player: a night courier in a dark coat. Sneaking is slower and
// quieter; running is fast but loud and easy to spot.
export const PLAYER = {
  radius: 11,
  walkSpeed: 132, // pixels per second
  sneakSpeed: 72,
  runSpeed: 178,
  noiseRadiusWalk: 46,
  noiseRadiusRun: 128,
  noiseRadiusSneak: 16,
};

// Guards: patrol slowly, investigate faster, chase fastest of all.
export const GUARD = {
  radius: 12,
  patrolSpeed: 52,
  investigateSpeed: 88,
  chaseSpeed: 128,
  searchSpeed: 66,
  waypointPause: 1.4, // seconds spent looking around at each waypoint
  viewDistance: 215,
  viewHalfAngle: 0.62, // radians either side of facing (~71 degree cone)
  hearRadius: 150,
  catchDistance: 22,
  // Suspicion 0..1. It climbs while the player is seen, falls otherwise.
  // Sneaking, distance and bushes all slow the climb.
  suspicionGainBase: 0.85, // per second, point blank, standing, lit
  suspicionGainFar: 0.34, // per second at the far edge of the cone
  suspicionDecay: 0.22, // per second while unseen
  suspiciousAt: 0.35, // guard turns and investigates
  alertedAt: 1.0, // guard gives chase
  loseSightAlert: 3.5, // seconds unseen while alerted before searching
  searchTime: 3.2, // seconds spent scanning the last-seen spot
  bushHideDistance: 42, // a guard must be this close to spot a hidden player
};

// Colours: night archive. Warm lamplight pools, cold shadow everywhere
// else; danger is always the same red so it reads at a glance.
export const COLORS = {
  floorDark: '#1c1a24',
  floorLight: '#232030',
  floorLine: '#2c2940',
  wall: '#4a4560',
  wallTop: '#5d5878',
  crate: '#6b5232',
  crateTop: '#8a6a42',
  bush: '#2e5230',
  bushTop: '#3f7044',
  lampGlow: 'rgba(255, 196, 110, 0.10)',
  coneCalm: 'rgba(255, 214, 120, 0.20)',
  coneEdge: 'rgba(255, 214, 120, 0.55)',
  coneSuspicious: 'rgba(255, 166, 66, 0.30)',
  coneAlert: 'rgba(255, 64, 64, 0.32)',
  guardBody: '#c94f4f',
  guardDark: '#7e2f2f',
  playerBody: '#e8d27a',
  playerDark: '#a8892f',
  intel: '#7de3ff',
  exit: '#58d68d',
  text: '#f2ead8',
  dimText: '#a99f88',
};

// A tiny deterministic generator so ambient details (floor speckles,
// dust motes) are identical on every load. Seeded, never Math.random.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
