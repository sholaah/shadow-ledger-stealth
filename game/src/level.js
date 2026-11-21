// Shadow Ledger — the level: walls, cover, intel, exit and patrols.
// The Meridian Archive after dark: one big reading hall ringed by
// shelves, crates and potted ferns, three ledger pages to recover and a
// back door to slip out of. Everything is plain data; collision and
// sight code in vision.js reads these rectangles.
//
// Coordinates are pixels in the 960x640 hall. Walls block movement and
// sight. Crates block movement and sight. Bushes (ferns) block sight
// only — the player can crouch inside one and vanish from a cone.

export const LEVEL = {
  name: 'The Meridian Archive — Night Wing',
  spawn: { x: 70, y: 576 },
  exit: { x: 872, y: 40, w: 56, h: 40 },
  intel: [
    { id: 'ledger-a', x: 132, y: 92, label: 'LEDGER I' },
    { id: 'ledger-b', x: 820, y: 330, label: 'LEDGER II' },
    { id: 'ledger-c', x: 480, y: 556, label: 'LEDGER III' },
  ],
  // Outer shell plus interior shelf walls. Each is {x, y, w, h}.
  walls: [
    { x: 0, y: 0, w: 960, h: 24 }, // north
    { x: 0, y: 616, w: 960, h: 24 }, // south
    { x: 0, y: 0, w: 24, h: 640 }, // west
    { x: 936, y: 0, w: 24, h: 640 }, // east
    { x: 200, y: 120, w: 150, h: 26 }, // shelf row A
    { x: 420, y: 120, w: 150, h: 26 },
    { x: 640, y: 120, w: 150, h: 26 },
    { x: 200, y: 300, w: 26, h: 150 }, // shelf column B
    { x: 560, y: 300, w: 26, h: 150 },
    { x: 760, y: 300, w: 26, h: 150 },
    { x: 330, y: 480, w: 300, h: 26 }, // long shelf, south hall
    { x: 120, y: 420, w: 26, h: 120 }, // west alcove wall
  ],
  // Crates: solid cover. Stack them to break long sightlines.
  crates: [
    { x: 120, y: 200, w: 48, h: 48 },
    { x: 176, y: 200, w: 48, h: 48 },
    { x: 700, y: 210, w: 48, h: 48 },
    { x: 700, y: 266, w: 48, h: 48 },
    { x: 440, y: 210, w: 48, h: 48 },
    { x: 880, y: 480, w: 40, h: 40 },
    { x: 60, y: 300, w: 40, h: 40 },
    { x: 300, y: 540, w: 48, h: 48 },
  ],
  // Ferns: soft cover. Sight cannot pass; the player can hide inside.
  bushes: [
    { x: 250, y: 180, w: 56, h: 56 },
    { x: 620, y: 380, w: 56, h: 56 },
    { x: 830, y: 140, w: 48, h: 48 },
    { x: 90, y: 480, w: 56, h: 56 },
    { x: 500, y: 540, w: 56, h: 56 },
    { x: 380, y: 330, w: 48, h: 48 },
  ],
  // Warm lamp pools: light the floor so safe and lit ground read apart.
  lamps: [
    { x: 280, y: 90, r: 130 },
    { x: 700, y: 90, r: 130 },
    { x: 480, y: 280, r: 150 },
    { x: 180, y: 520, r: 120 },
    { x: 800, y: 500, r: 120 },
  ],
  // Patrol routes: each guard walks its waypoints in order and loops.
  // Routes cross the hall so every approach has a timing to learn.
  guards: [
    {
      id: 'warden-north',
      x: 300, y: 90,
      waypoints: [
        { x: 300, y: 90 }, { x: 660, y: 90 }, { x: 660, y: 180 }, { x: 300, y: 180 },
      ],
    },
    {
      id: 'warden-east',
      x: 880, y: 220,
      waypoints: [
        { x: 880, y: 220 }, { x: 880, y: 560 }, { x: 820, y: 560 }, { x: 820, y: 220 },
      ],
    },
    {
      id: 'warden-south',
      x: 200, y: 560,
      waypoints: [
        { x: 200, y: 560 }, { x: 640, y: 560 }, { x: 640, y: 430 }, { x: 200, y: 430 },
      ],
    },
    {
      id: 'warden-mid',
      x: 480, y: 260,
      waypoints: [
        { x: 480, y: 260 }, { x: 480, y: 420 }, { x: 640, y: 420 }, { x: 640, y: 260 },
      ],
    },
  ],
};

// Rectangles that block a guard's line of sight: walls, crates, bushes.
export function sightBlockers() {
  return [...LEVEL.walls, ...LEVEL.crates, ...LEVEL.bushes];
}

// Rectangles that block movement: walls and crates only (bushes are soft).
export function solidBlockers() {
  return [...LEVEL.walls, ...LEVEL.crates];
}

// True when point (x, y) lies inside any of the given rectangles.
export function pointInRects(x, y, rects) {
  for (const r of rects) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  return false;
}

// True when the point is inside a fern: the player is hidden there.
export function pointInBush(x, y) {
  return pointInRects(x, y, LEVEL.bushes);
}
