// Drag-and-drop per Long-Press für Touch und Maus (Pointer Events).
const HOLD_MS = 350;
const MOVE_TOLERANCE = 8;
const EDGE = 70;

export function enableDnd(root, { onDrop }) {
  let pending = null;
  let drag = null;
  let suppressClick = false;

  root.addEventListener('pointerdown', (e) => {
    const src = e.target.closest('[data-task-id]');
    if (!src || e.button > 0 || drag || e.target.closest('.check, textarea, input')) return;
    pending = { src, id: src.dataset.taskId, x: e.clientX, y: e.clientY };
    pending.timer = setTimeout(start, HOLD_MS);
  });

  function cancelPending() {
    if (pending) clearTimeout(pending.timer);
    pending = null;
  }

  function start() {
    const { src, id, x, y } = pending;
    pending = null;
    const r = src.getBoundingClientRect();
    const ghost = src.cloneNode(true);
    ghost.classList.add('dnd-ghost');
    Object.assign(ghost.style, { width: `${r.width}px`, left: `${r.left}px`, top: `${r.top}px` });
    document.body.append(ghost);
    src.classList.add('dnd-src');
    document.body.classList.add('dragging');
    navigator.vibrate?.(15);
    drag = { src, id, ghost, dx: x - r.left, dy: y - r.top, x, y, target: null, raf: 0 };
    tick();
  }

  function setTarget(x, y) {
    const t = document.elementFromPoint(x, y)?.closest('[data-date],[data-drop="parking"]') || null;
    if (t === drag.target) return;
    drag.target?.classList.remove('drop-hover');
    t?.classList.add('drop-hover');
    drag.target = t;
  }

  // Auto-Scroll am Bildschirmrand, solange gezogen wird.
  function tick() {
    if (!drag) return;
    const bottomEdge = innerHeight - EDGE - 64;
    if (drag.y < EDGE) scrollBy(0, -10);
    else if (drag.y > bottomEdge) scrollBy(0, 10);
    setTarget(drag.x, drag.y);
    drag.raf = requestAnimationFrame(tick);
  }

  window.addEventListener('pointermove', (e) => {
    if (pending) {
      if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > MOVE_TOLERANCE) cancelPending();
      return;
    }
    if (!drag) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.ghost.style.left = `${e.clientX - drag.dx}px`;
    drag.ghost.style.top = `${e.clientY - drag.dy}px`;
    setTarget(e.clientX, e.clientY);
  });

  function finish(drop) {
    cancelPending();
    if (!drag) return;
    const d = drag;
    drag = null;
    cancelAnimationFrame(d.raf);
    d.ghost.remove();
    d.src.classList.remove('dnd-src');
    d.target?.classList.remove('drop-hover');
    document.body.classList.remove('dragging');
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 300);
    if (drop && d.target) onDrop(d.id, d.target.dataset.date || null);
  }

  window.addEventListener('pointerup', (e) => {
    if (drag) setTarget(e.clientX, e.clientY);
    finish(true);
  });
  window.addEventListener('pointercancel', () => finish(false));
  // Scrollen während des Ziehens verhindern.
  document.addEventListener('touchmove', (e) => { if (drag) e.preventDefault(); }, { passive: false });
  root.addEventListener('contextmenu', (e) => { if (e.target.closest('[data-task-id]')) e.preventDefault(); });
  root.addEventListener('click', (e) => {
    if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; }
  }, true);
}
