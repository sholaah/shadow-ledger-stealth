// Shadow Ledger — the player: a night courier.
// Moves with WASD / arrow keys, or click-to-move with the mouse.
// Shift (or holding the right mouse button) sneaks: slow, quiet, hard
// to spot. Running is fast and loud; guards hear it and turn.

import { PLAYER, GAME } from './config.js';
import { solidBlockers } from './level.js';

// Circle-vs-rectangle collision: move one axis at a time so the player
// slides along walls instead of sticking to them.
function moveAxis(state, dx, dy) {
  const nextX = state.x + dx;
  const nextY = state.y + dy;
  for (const r of solidBlockers()) {
    const cx = Math.max(r.x, Math.min(nextX, r.x + r.w));
    const cy = Math.max(r.y, Math.min(nextY, r.y + r.h));
    const ddx = nextX - cx;
    const ddy = nextY - cy;
    if (ddx * ddx + ddy * ddy < PLAYER.radius * PLAYER.radius) return false;
  }
  state.x = nextX;
  state.y = nextY;
  return true;
}

export function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    facing: -Math.PI / 2, // looking up the hall at the start
    sneaking: false,
    running: false,
    moving: false,
    moveTarget: null, // {x, y} while click-to-move is active
    stepPhase: 0, // drives the footstep sound timing
    hidden: false, // inside a fern this frame
  };
}

// Read the keys, move the player, report how loud the move was.
// Returns the noise radius of this step (0 while standing still).
export function updatePlayer(player, input, dt) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;

  // A click sets a destination; any key cancels it.
  if (mx !== 0 || my !== 0) player.moveTarget = null;
  if (player.moveTarget) {
    const dx = player.moveTarget.x - player.x;
    const dy = player.moveTarget.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      player.moveTarget = null;
    } else {
      mx = dx / dist;
      my = dy / dist;
    }
  }

  const len = Math.hypot(mx, my);
  player.moving = len > 0;
  if (!player.moving) return 0;

  mx /= len;
  my /= len;
  player.sneaking = input.sneak;
  player.running = !input.sneak && input.run;
  const speed = player.sneaking
    ? PLAYER.sneakSpeed
    : player.running
      ? PLAYER.runSpeed
      : PLAYER.walkSpeed;
  player.facing = Math.atan2(my, mx);

  // Try the full step; if a wall blocks it, slide along each axis.
  const stepX = mx * speed * dt;
  const stepY = my * speed * dt;
  if (!moveAxis(player, stepX, stepY)) {
    moveAxis(player, stepX, 0) || moveAxis(player, 0, stepY);
  }
  // Stay inside the hall.
  player.x = Math.max(PLAYER.radius + 24, Math.min(GAME.width - 24 - PLAYER.radius, player.x));
  player.y = Math.max(PLAYER.radius + 24, Math.min(GAME.height - 24 - PLAYER.radius, player.y));

  player.stepPhase += (speed * dt) / 26;
  return player.sneaking
    ? PLAYER.noiseRadiusSneak
    : player.running
      ? PLAYER.noiseRadiusRun
      : PLAYER.noiseRadiusWalk;
}
