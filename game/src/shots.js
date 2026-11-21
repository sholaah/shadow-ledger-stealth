// Shadow Ledger — staged states for screenshots.
// `?shot=start|play|alert|win` puts the game into a fixed, deterministic
// scene so a screenshot taken on any machine shows the same moment.
// Times are fixed; guards are placed at fixed patrol points; nothing
// here reads Math.random or the clock.

import { LEVEL } from './level.js';
import { createGuard } from './guards.js';
import { createPlayer } from './player.js';

function baseState() {
  return {
    phase: 'playing',
    player: createPlayer(LEVEL.spawn),
    guards: LEVEL.guards.map(createGuard),
    intel: LEVEL.intel.map((item) => ({ ...item, collected: false })),
    collected: 0,
    total: LEVEL.intel.length,
    timeSec: 0,
    detections: 0,
    time: 0, // scene clock, fixed per shot
    hud: { collected: 0, total: LEVEL.intel.length, timeSec: 0, timeText: '00:00', alert: 0, detections: 0 },
  };
}

function syncHud(state) {
  state.hud.collected = state.collected;
  state.hud.total = state.total;
  state.hud.timeSec = state.timeSec;
  const mm = String(Math.floor(state.timeSec / 60)).padStart(2, '0');
  const ss = String(Math.floor(state.timeSec % 60)).padStart(2, '0');
  state.hud.timeText = `${mm}:${ss}`;
  state.hud.alert = Math.max(0, ...state.guards.map((g) => g.suspicion));
  state.hud.detections = state.detections;
}

// Place a guard at a patrol point with a chosen facing and state.
function poseGuard(state, index, x, y, facing, guardState, suspicion) {
  const guard = state.guards[index];
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.state = guardState;
  guard.suspicion = suspicion;
  if (guardState === 'alerted' || guardState === 'suspicious') {
    guard.lastSeen = { x: state.player.x, y: state.player.y };
  }
  return guard;
}

export function applyShot(state, shot) {
  switch (shot) {
    case 'start': {
      // Title screen over the full hall: guards on patrol, cones lit.
      state.phase = 'title';
      state.time = 4.0;
      state.timeSec = 0;
      poseGuard(state, 0, 480, 135, 0, 'patrol', 0);
      poseGuard(state, 1, 880, 380, Math.PI / 2, 'patrol', 0);
      poseGuard(state, 2, 420, 560, Math.PI, 'patrol', 0);
      poseGuard(state, 3, 560, 340, -Math.PI / 2, 'patrol', 0);
      break;
    }
    case 'play': {
      // Mid-run near miss: the courier crouches by a fern at the edge of
      // a cone, two pages already recovered, one guard growing curious.
      state.phase = 'playing';
      state.time = 84.0;
      state.timeSec = 84;
      state.player.x = 292;
      state.player.y = 232;
      state.player.facing = Math.PI / 4;
      state.player.sneaking = true;
      state.player.hidden = true;
      state.intel[0].collected = true;
      state.intel[2].collected = true;
      state.collected = 2;
      poseGuard(state, 0, 420, 180, Math.PI / 2, 'suspicious', 0.62);
      poseGuard(state, 1, 880, 300, Math.PI, 'patrol', 0);
      poseGuard(state, 2, 300, 480, 0, 'patrol', 0);
      poseGuard(state, 3, 560, 380, Math.PI, 'patrol', 0.1);
      break;
    }
    case 'alert': {
      // The chase: all three pages in hand, the courier sprinting for
      // the exit with a guard in full pursuit, alarm meter maxed.
      state.phase = 'playing';
      state.time = 152.0;
      state.timeSec = 152;
      state.player.x = 780;
      state.player.y = 130;
      state.player.facing = Math.PI / 4;
      state.player.running = true;
      state.player.moving = true;
      for (const item of state.intel) item.collected = true;
      state.collected = 3;
      state.detections = 1;
      poseGuard(state, 0, 660, 200, Math.PI / 4, 'alerted', 1);
      poseGuard(state, 1, 880, 260, -Math.PI / 2, 'suspicious', 0.7);
      poseGuard(state, 2, 500, 500, -Math.PI / 2, 'patrol', 0);
      poseGuard(state, 3, 620, 300, -Math.PI / 4, 'patrol', 0.2);
      break;
    }
    case 'win': {
      // The escape: courier at the open exit door, ledger complete.
      state.phase = 'won';
      state.time = 168.0;
      state.timeSec = 168;
      state.player.x = 890;
      state.player.y = 62;
      state.player.facing = -Math.PI / 2;
      for (const item of state.intel) item.collected = true;
      state.collected = 3;
      state.detections = 0;
      poseGuard(state, 0, 500, 135, Math.PI, 'patrol', 0);
      poseGuard(state, 1, 880, 420, Math.PI / 2, 'patrol', 0);
      poseGuard(state, 2, 300, 560, 0, 'patrol', 0);
      poseGuard(state, 3, 480, 340, Math.PI / 2, 'patrol', 0);
      break;
    }
    default:
      break;
  }
  syncHud(state);
  return state;
}

export function newState() {
  const state = baseState();
  syncHud(state);
  return state;
}
