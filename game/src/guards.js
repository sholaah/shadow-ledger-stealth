// Shadow Ledger — the guards: patrols and the detection state machine.
// States: patrol -> suspicious -> alerted -> search -> patrol.
// Suspicion is a slow meter, not a tripwire: being glimpsed at the edge
// of a cone buys the player time to break line of sight and recover.

import { GUARD } from './config.js';
import { guardCanSee, visibilityFactor, angleDifference } from './vision.js';
import { solidBlockers } from './level.js';

export function createGuard(def) {
  return {
    id: def.id,
    x: def.x,
    y: def.y,
    waypoints: def.waypoints,
    waypointIndex: 1,
    facing: Math.atan2(
      def.waypoints[1].y - def.y,
      def.waypoints[1].x - def.x,
    ),
    state: 'patrol', // patrol | suspicious | alerted | search
    suspicion: 0,
    pauseTimer: 0,
    lastSeen: null, // {x, y} where the player was last spotted
    unseenTimer: 0, // seconds without sight while alerted
    searchTimer: 0,
    scanAngle: 0,
  };
}

// Walk toward a point at `speed`; returns true on arrival.
function stepToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  // Guards respect walls too: slide along one axis if blocked.
  if (!hitsSolid(nx, ny)) {
    guard.x = nx;
    guard.y = ny;
  } else if (!hitsSolid(nx, guard.y)) {
    guard.x = nx;
  } else if (!hitsSolid(guard.x, ny)) {
    guard.y = ny;
  }
  guard.facing = Math.atan2(dy, dx);
  return dist <= step + 1;
}

function hitsSolid(x, y) {
  for (const r of solidBlockers()) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    if ((x - cx) ** 2 + (y - cy) ** 2 < GUARD.radius * GUARD.radius) return true;
  }
  return false;
}

// One guard, one frame. Returns 'spotted' the moment suspicion crosses
// into alerted, so the game can sting and count a detection.
export function updateGuard(guard, player, dt) {
  const sees = guardCanSee(guard, player.x, player.y, player.hidden);
  const heard =
    player.moving &&
    !player.sneaking &&
    Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD.hearRadius &&
    player.running;

  if (sees) {
    guard.lastSeen = { x: player.x, y: player.y };
    guard.unseenTimer = 0;
    guard.suspicion += visibilityFactor(guard, player.x, player.y, player.hidden, player.sneaking) * dt;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecay * dt);
    if (guard.state === 'alerted') guard.unseenTimer += dt;
  }

  // A loud runner nearby is worth investigating even if unseen.
  if (heard && guard.state === 'patrol') {
    guard.suspicion = Math.max(guard.suspicion, GUARD.suspiciousAt + 0.05);
    guard.lastSeen = { x: player.x, y: player.y };
  }

  let event = null;
  const wasAlerted = guard.state === 'alerted';
  if (guard.suspicion >= GUARD.alertedAt) guard.state = 'alerted';
  else if (guard.suspicion >= GUARD.suspiciousAt && guard.state === 'patrol') guard.state = 'suspicious';
  if (guard.state === 'alerted' && !wasAlerted) event = 'spotted';

  switch (guard.state) {
    case 'patrol': {
      if (guard.pauseTimer > 0) {
        guard.pauseTimer -= dt;
        // Look slowly around while paused at a waypoint.
        guard.facing += Math.sin(guard.pauseTimer * 2.2) * 0.012;
        break;
      }
      const target = guard.waypoints[guard.waypointIndex];
      if (stepToward(guard, target.x, target.y, GUARD.patrolSpeed, dt)) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pauseTimer = GUARD.waypointPause;
      }
      break;
    }
    case 'suspicious': {
      // Walk to where the player was seen; give up if nothing is there.
      if (guard.lastSeen && stepToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD.investigateSpeed, dt)) {
        guard.state = 'search';
        guard.searchTimer = GUARD.searchTime;
        guard.scanAngle = guard.facing;
      }
      if (guard.suspicion < GUARD.suspiciousAt * 0.5) guard.state = 'patrol';
      break;
    }
    case 'alerted': {
      // Chase the last seen spot; while the player is visible that spot
      // updates every frame, so the chase tracks them.
      if (guard.lastSeen) stepToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD.chaseSpeed, dt);
      if (guard.unseenTimer > GUARD.loseSightAlert) {
        guard.state = 'search';
        guard.searchTimer = GUARD.searchTime;
        guard.scanAngle = guard.facing;
      }
      break;
    }
    case 'search': {
      // Sweep the view back and forth, then return to the patrol.
      guard.searchTimer -= dt;
      guard.scanAngle += Math.sin(guard.searchTimer * 3) * 0.02;
      guard.facing = guard.scanAngle + Math.sin(guard.searchTimer * 2.4) * 0.9;
      if (guard.searchTimer <= 0) {
        guard.state = 'patrol';
        guard.suspicion = 0;
      }
      break;
    }
  }
  return event;
}

// Distance from guard to player: close enough while alerted is caught.
export function guardCaughtPlayer(guard, player) {
  return guard.state === 'alerted' && Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD.catchDistance;
}
