// Shadow Ledger — render: everything the player sees.
// Top-down night archive: checkerboard floor, warm lamp pools, dark
// walls with lit tops, crates and ferns as cover, glowing ledger pages,
// a green exit door, and guards drawn as red figures inside cones of
// light that turn red as suspicion rises. The cone is clipped by walls
// (see vision.js), so the light on screen is the light the guard sees.

import { GAME, COLORS, GUARD, mulberry32 } from './config.js';
import { LEVEL } from './level.js';
import { conePolygon } from './vision.js';

const speckle = mulberry32(20261121);

function drawFloor(ctx) {
  for (let ty = 0; ty < GAME.height / GAME.tile; ty++) {
    for (let tx = 0; tx < GAME.width / GAME.tile; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorDark : COLORS.floorLight;
      ctx.fillRect(tx * GAME.tile, ty * GAME.tile, GAME.tile, GAME.tile);
    }
  }
  // Deterministic speckles: the same worn floorboards every load.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 160; i++) {
    const x = speckle() * GAME.width;
    const y = speckle() * GAME.height;
    ctx.fillRect(x, y, 3, 2);
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= GAME.width; x += GAME.tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GAME.height);
    ctx.stroke();
  }
  for (let y = 0; y <= GAME.height; y += GAME.tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME.width, y);
    ctx.stroke();
  }
}

function drawLamps(ctx) {
  for (const lamp of LEVEL.lamps) {
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
    glow.addColorStop(0, COLORS.lampGlow);
    glow.addColorStop(1, 'rgba(255, 196, 110, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
    // The lamp itself: a small brass dot on the floor.
    ctx.fillStyle = '#c9a24a';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRect(ctx, r, fill, top) {
  ctx.fillStyle = fill;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = top;
  ctx.fillRect(r.x, r.y, r.w, 5);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
}

function drawBush(ctx, b, t) {
  // Ferns sway almost imperceptibly; the sway is a function of time so
  // a screenshot at a fixed time is reproducible.
  ctx.fillStyle = COLORS.bush;
  ctx.beginPath();
  ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.bushTop;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.sin(t * 0.6 + i) * 0.05;
    const cx = b.x + b.w / 2 + Math.cos(a) * b.w * 0.26;
    const cy = b.y + b.h / 2 + Math.sin(a) * b.h * 0.26;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIntel(ctx, item, t) {
  if (item.collected) return;
  const bob = Math.sin(t * 2.4 + item.x) * 3;
  const cx = item.x;
  const cy = item.y + bob;
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30);
  glow.addColorStop(0, 'rgba(125, 227, 255, 0.5)');
  glow.addColorStop(1, 'rgba(125, 227, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();
  // A small glowing page with folded corner.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.fillStyle = '#eaf7ff';
  ctx.fillRect(-9, -12, 18, 24);
  ctx.fillStyle = COLORS.intel;
  ctx.fillRect(-6, -7, 12, 2);
  ctx.fillRect(-6, -2, 12, 2);
  ctx.fillRect(-6, 3, 8, 2);
  ctx.restore();
  ctx.fillStyle = COLORS.intel;
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(item.label, cx, cy + 30);
}

function drawExit(ctx, open, t) {
  const e = LEVEL.exit;
  ctx.fillStyle = open ? COLORS.exit : '#3f7d5a';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#a9f0c6' : '#2c5a40';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
  if (open) {
    const pulse = 0.5 + Math.sin(t * 3) * 0.5;
    ctx.fillStyle = `rgba(88, 214, 141, ${0.25 + pulse * 0.25})`;
    ctx.fillRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  }
  ctx.fillStyle = '#0c2418';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'GO!' : 'EXIT', e.x + e.w / 2, e.y + e.h / 2 + 4);
}

function drawCone(ctx, guard) {
  const points = conePolygon(guard);
  const color =
    guard.state === 'alerted'
      ? COLORS.coneAlert
      : guard.state === 'suspicious' || guard.state === 'search'
        ? COLORS.coneSuspicious
        : COLORS.coneCalm;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle =
    guard.state === 'alerted' ? 'rgba(255, 80, 80, 0.8)' : COLORS.coneEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, guard) {
  drawCone(ctx, guard);
  // Body: red coat, darker outline, facing tick.
  ctx.fillStyle = COLORS.guardDark;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a0d0d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * (GUARD.radius + 6), guard.y + Math.sin(guard.facing) * (GUARD.radius + 6));
  ctx.stroke();
  // Eyes: two dots looking where the guard looks.
  const ex = Math.cos(guard.facing);
  const ey = Math.sin(guard.facing);
  const px = -ey;
  const py = ex;
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.arc(guard.x + ex * 5 + px * 4, guard.y + ey * 5 + py * 4, 1.8, 0, Math.PI * 2);
  ctx.arc(guard.x + ex * 5 - px * 4, guard.y + ey * 5 - py * 4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion arc above the head: ? while curious, ! while alerted.
  if (guard.suspicion > 0.02) {
    ctx.fillStyle = guard.state === 'alerted' ? '#ff5252' : '#ffb347';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(guard.state === 'alerted' ? '!' : '?', guard.x, guard.y - GUARD.radius - 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * guard.suspicion);
    ctx.stroke();
    ctx.strokeStyle = guard.state === 'alerted' ? '#ff5252' : '#ffb347';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * guard.suspicion);
    ctx.stroke();
  }
}

function drawPlayer(ctx, player, t) {
  // A soft shadow ring while hidden in a fern.
  if (player.hidden) {
    ctx.fillStyle = 'rgba(63, 112, 68, 0.55)';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 17, 0, Math.PI * 2);
    ctx.fill();
  }
  // Noise ring while running: what the guards can hear.
  if (player.moving && player.running) {
    ctx.strokeStyle = 'rgba(232, 210, 122, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20 + Math.sin(t * 10) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 12.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerBody;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 11, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick and a little hood point.
  ctx.strokeStyle = '#5c4a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.facing) * 16, player.y + Math.sin(player.facing) * 16);
  ctx.stroke();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.facing) * 4, player.y + Math.sin(player.facing) * 4, 3, 0, Math.PI * 2);
  ctx.fill();
  if (player.sneaking) {
    ctx.fillStyle = COLORS.dimText;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y + 26);
  }
}

function drawHud(ctx, state) {
  const { collected, total, timeSec, alert, detections } = state.hud;
  ctx.fillStyle = 'rgba(8, 8, 14, 0.72)';
  ctx.fillRect(0, 0, GAME.width, 34);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SHADOW LEDGER', 12, 22);
  ctx.fillStyle = COLORS.intel;
  ctx.fillText(`LEDGER ${collected}/${total}`, 190, 22);
  const mm = String(Math.floor(timeSec / 60)).padStart(2, '0');
  const ss = String(Math.floor(timeSec % 60)).padStart(2, '0');
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`${mm}:${ss}`, 330, 22);
  // Alert meter: the highest suspicion among all guards.
  ctx.fillStyle = COLORS.dimText;
  ctx.font = '12px monospace';
  ctx.fillText('ALERT', 420, 22);
  ctx.fillStyle = '#33222a';
  ctx.fillRect(470, 11, 150, 12);
  ctx.fillStyle = alert > 0.66 ? '#ff5252' : alert > 0.33 ? '#ffb347' : '#58d68d';
  ctx.fillRect(470, 11, 150 * Math.min(alert, 1), 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(470.5, 11.5, 150, 12);
  ctx.fillStyle = COLORS.dimText;
  ctx.fillText(`SPOTTED ${detections}x`, 640, 22);
  ctx.textAlign = 'right';
  ctx.fillText(state.phase === 'playing' ? 'SHIFT sneak · click to move' : '', GAME.width - 12, 22);
  ctx.textAlign = 'left';
}

function drawBanner(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 6, 12, 0.72)';
  ctx.fillRect(0, 0, GAME.width, GAME.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, GAME.width / 2, 250);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px monospace';
  lines.forEach((line, i) => ctx.fillText(line, GAME.width / 2, 300 + i * 28));
  ctx.fillStyle = COLORS.dimText;
  ctx.font = '13px monospace';
  ctx.fillText('Press ENTER or click to play again', GAME.width / 2, 300 + lines.length * 28 + 26);
  ctx.textAlign = 'left';
}

// The whole frame: world, then actors, then HUD, then any overlay.
export function render(ctx, state, t) {
  ctx.clearRect(0, 0, GAME.width, GAME.height);
  drawFloor(ctx);
  drawLamps(ctx);
  drawExit(ctx, state.collected >= state.total, t);
  for (const item of state.intel) drawIntel(ctx, item, t);
  for (const crate of LEVEL.crates) drawRect(ctx, crate, COLORS.crate, COLORS.crateTop);
  for (const bush of LEVEL.bushes) drawBush(ctx, bush, t);
  for (const wall of LEVEL.walls) drawRect(ctx, wall, COLORS.wall, COLORS.wallTop);
  for (const guard of state.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, state.player, t);
  drawHud(ctx, state);

  if (state.phase === 'title') {
    drawBanner(
      ctx,
      'SHADOW LEDGER',
      [
        'The Meridian Archive, after dark.',
        'Recover 3 ledger pages. Reach the green exit unseen.',
        'WASD / arrows to move · SHIFT to sneak · click to walk',
        'Ferns hide you. Crates and shelves block sight.',
        'A ? means a guard is curious. A ! means RUN — or hide.',
      ],
      COLORS.playerBody,
    );
  } else if (state.phase === 'won') {
    drawBanner(
      ctx,
      'LEDGER RECOVERED',
      [
        `All 3 pages safe. Time ${state.hud.timeText} · spotted ${state.detections} time(s).`,
        state.detections === 0
          ? 'A perfect ghost run — no guard ever raised the alarm.'
          : 'The archive never knew you were there… mostly.',
      ],
      COLORS.exit,
    );
  } else if (state.phase === 'caught') {
    drawBanner(
      ctx,
      'CAUGHT',
      [
        'A guard laid hands on the courier.',
        `Pages recovered: ${state.collected} of ${state.total}.`,
        'Patience beats speed. Watch the patrols, use the ferns.',
      ],
      '#ff5252',
    );
  }
}
