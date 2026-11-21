// Shadow Ledger — input: keyboard and mouse, nothing else.
// WASD / arrows move, Shift sneaks, hold right mouse to sneak too,
// left click sets a click-to-move destination. Keys are tracked by code
// so held keys survive focus changes cleanly.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    run: false,
    clickTarget: null, // {x, y} in game coordinates, consumed by main.js
    anyKey: false,
  };

  function refresh() {
    input.up = keys.has('KeyW') || keys.has('ArrowUp');
    input.down = keys.has('KeyS') || keys.has('ArrowDown');
    input.left = keys.has('KeyA') || keys.has('ArrowLeft');
    input.right = keys.has('KeyD') || keys.has('ArrowRight');
    input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight') || input.mouseSneak;
    input.run = keys.has('KeyR');
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    keys.add(event.code);
    input.anyKey = true;
    refresh();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    refresh();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    refresh();
  });

  // Convert a mouse event into game coordinates (canvas is scaled).
  function toGame(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 2) {
      input.mouseSneak = true;
      refresh();
    } else if (event.button === 0) {
      input.clickTarget = toGame(event);
      input.anyKey = true;
    }
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 2) {
      input.mouseSneak = false;
      refresh();
    }
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return input;
}
