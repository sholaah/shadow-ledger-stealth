// Shadow Ledger — the game loop and rules.
// Owns the game state (title / playing / won / caught), steps the
// player and the guards, collects ledger pages, opens the exit, and
// counts detections. A `?shot=` query stages a fixed scene for
// screenshots instead of starting a live game.

import { GAME } from './config.js';
import { LEVEL, pointInBush } from './level.js';
import { createPlayer, updatePlayer } from './player.js';
import { createGuard, updateGuard, guardCaughtPlayer } from './guards.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { applyShot, newState } from './shots.js';
import { audio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = GAME.width;
canvas.height = GAME.height;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const frozen = shot !== null; // staged scenes never advance

let state = newState();
if (frozen) {
  applyShot(state, shot);
} else {
  state.phase = 'title';
}

const input = createInput(canvas);
let lastStepWhole = 0;
let lastSuspicious = new Set();

function resetGame() {
  state = newState();
  state.phase = 'playing';
  lastStepWhole = 0;
  lastSuspicious = new Set();
}

function startFromTitle() {
  audio.unlock();
  resetGame();
}

canvas.addEventListener('click', () => {
  if (state.phase === 'title') startFromTitle();
  else if (state.phase === 'won' || state.phase === 'caught') resetGame();
});
window.addEventListener('keydown', (event) => {
  if (event.code === 'Enter' || event.code === 'Space') {
    if (state.phase === 'title') startFromTitle();
    else if (state.phase === 'won' || state.phase === 'caught') resetGame();
  }
});

// One fixed-size frame of play.
function update(dt) {
  if (state.phase !== 'playing') return;

  state.time += dt;
  state.timeSec += dt;

  // Click-to-move destination, in game coordinates.
  if (input.clickTarget) {
    state.player.moveTarget = input.clickTarget;
    input.clickTarget = null;
  }
  const noise = updatePlayer(state.player, input, dt);
  state.player.hidden = pointInBush(state.player.x, state.player.y);

  // Footsteps: one tap per stride, alternating feet.
  const stepWhole = Math.floor(state.player.stepPhase);
  if (state.player.moving && stepWhole !== lastStepWhole) {
    lastStepWhole = stepWhole;
    audio.footstep(stepWhole % 2 === 0, state.player.sneaking, state.player.running);
  }

  // Guards: step each one, watch for new suspicion and new alerts.
  for (const guard of state.guards) {
    const event = updateGuard(guard, state.player, dt);
    if (event === 'spotted') {
      state.detections += 1;
      audio.alertSting();
    }
    if (guard.state === 'suspicious' && !lastSuspicious.has(guard.id)) {
      audio.suspiciousBlip();
    }
  }
  lastSuspicious = new Set(state.guards.filter((g) => g.state === 'suspicious').map((g) => g.id));

  // Caught: any alerted guard that closes to touching distance.
  for (const guard of state.guards) {
    if (guardCaughtPlayer(guard, state.player)) {
      state.phase = 'caught';
      audio.caught();
      break;
    }
  }
  if (state.phase !== 'playing') return;

  // Ledger pages: walk over one to pocket it.
  for (const item of state.intel) {
    if (!item.collected && Math.hypot(item.x - state.player.x, item.y - state.player.y) < 26) {
      item.collected = true;
      state.collected += 1;
      audio.pickup();
    }
  }

  // The exit opens once all three pages are recovered.
  const exit = LEVEL.exit;
  const atExit =
    state.player.x > exit.x - 6 &&
    state.player.x < exit.x + exit.w + 6 &&
    state.player.y > exit.y - 6 &&
    state.player.y < exit.y + exit.h + 6;
  if (atExit && state.collected >= state.total) {
    state.phase = 'won';
    audio.win();
  }

  // HUD numbers, refreshed every frame from the live state.
  state.hud.collected = state.collected;
  state.hud.total = state.total;
  state.hud.timeSec = state.timeSec;
  const mm = String(Math.floor(state.timeSec / 60)).padStart(2, '0');
  const ss = String(Math.floor(state.timeSec % 60)).padStart(2, '0');
  state.hud.timeText = `${mm}:${ss}`;
  state.hud.alert = Math.max(0, ...state.guards.map((g) => g.suspicion));
  state.hud.detections = state.detections;
}

// Staged scenes render one frozen frame; live play runs the loop.
let lastTime = performance.now();
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (!frozen) update(dt);
  render(ctx, state, state.time);
  requestAnimationFrame(frame);
}

if (frozen) {
  render(ctx, state, state.time);
} else {
  requestAnimationFrame(frame);
}

// Expose the live state for play-testing: the screenshot and test
// scripts drive the game through this handle instead of guessing.
window.__shadowLedger = {
  state: () => state,
  reset: resetGame,
  version: 'shadow-ledger-1.0.0',
};
