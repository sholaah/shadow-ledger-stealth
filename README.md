# Shadow Ledger

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/sholaah/shadow-ledger-stealth/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/sholaah/shadow-ledger-stealth/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

A top-down 2D stealth game, built for make.fun's **best-stealth-game-20261121-1759** competition. You are a night courier inside the Meridian Archive: recover **3 ledger pages**, then slip out the green exit — unseen.

## How to play

- **Move:** WASD or arrow keys, or left-click to walk to a spot.
- **Sneak:** hold **Shift** (or right mouse button) — slower, quieter, harder to spot. Running (**R**) is fast but loud; guards hear it.
- **Hide:** crouch inside the ferns (green bushes) — a guard's cone cannot see you there unless it is almost on top of you. Crates and shelves block sight and movement.
- **Guards:** four wardens patrol fixed routes with visible vision cones. Being seen fills their suspicion meter: a `?` means curious (they come to look), a `!` means alerted (they chase). Break line of sight and suspicion falls — you can recover from a near miss.
- **Win:** collect all 3 glowing ledger pages, then reach the green EXIT door. **Caught:** an alerted guard touches you.

The HUD shows pages recovered, the timer, a live alert meter (the highest suspicion among all guards) and how many times you have been spotted.

## Sound

Footsteps, a suspicious blip, an alert sting, pickup chimes and win/lose phrases — all synthesized in the browser with WebAudio. No audio files, no network requests.

## Play it

Serve `game/` with any static server (for example `node serve.ts`, then open http://localhost:8080) and play in desktop Chrome. Keyboard and mouse only; the game is plain static files with no build step and no library.

## Files

- `game/index.html` — the page, canvas only.
- `game/src/main.js` — game loop, rules, win/caught.
- `game/src/level.js` — the archive: walls, crates, ferns, lamps, patrols.
- `game/src/guards.js` — patrol + detection state machine (patrol → suspicious → alerted → search).
- `game/src/vision.js` — line of sight, vision cones, wall-clipped cone polygons.
- `game/src/player.js` — movement, sneak/run, click-to-move, collision.
- `game/src/render.js` — all canvas drawing: floor, lamps, cover, cones, HUD, overlays.
- `game/src/audio.js` — synthesized WebAudio sounds.
- `game/src/input.js` — keyboard and mouse.
- `game/src/shots.js` — deterministic staged scenes for screenshots (`?shot=start|play|alert|win`).
- `game/src/config.js` — tuning constants.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

## License

MIT — see [LICENSE](LICENSE).
