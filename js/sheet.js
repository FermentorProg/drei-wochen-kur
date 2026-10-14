import { esc } from './ctx.js';
import { ICON } from './icons.js';

let current = null;

// Bottom Sheet. render(body) wird beim Öffnen und bei jeder Store-Änderung aufgerufen (außer live:false).
export function openSheet({ title, render, onClose, live = true }) {
  const replacing = !!current;
  teardown();
  const root = document.getElementById('sheet-root');
  root.innerHTML = `<div class="sheet-backdrop"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-grip"></div>
      <header class="sheet-head"><h2>${esc(title)}</h2>
        <button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></header>
      <div class="sheet-body"></div>
    </section>`;
  const body = root.querySelector('.sheet-body');
  const sheet = root.querySelector('.sheet');
  current = { root, live, onClose, render: () => render(body) };
  current.render();
  if (!current) return;
  root.classList.add('open');
  root.querySelector('.sheet-backdrop').onclick = () => closeSheet();
  root.querySelector('[data-close]').onclick = () => closeSheet();
  enableSwipe(root.querySelector('.sheet-head'), sheet);
  if (replacing) history.replaceState({ sheet: true }, '');
  else history.pushState({ sheet: true }, '');
}

function enableSwipe(handle, sheet) {
  let y0 = null;
  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    y0 = e.clientY;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (y0 !== null) sheet.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`;
  });
  const end = (e) => {
    if (y0 === null) return;
    const dy = e.clientY - y0;
    y0 = null;
    if (dy > 80) closeSheet();
    else sheet.style.transform = '';
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

function teardown() {
  if (!current) return null;
  const c = current;
  current = null;
  c.root.classList.remove('open');
  c.root.innerHTML = '';
  return c;
}

export function closeSheet() {
  const c = teardown();
  if (!c) return;
  c.onClose?.();
  if (history.state?.sheet) history.back();
}

export function refreshSheet() {
  if (current?.live) current.render();
}

window.addEventListener('popstate', () => teardown()?.onClose?.());
// Nach einem Neuladen mit offenem Sheet bleibt ein History-Eintrag übrig: neutralisieren.
if (history.state?.sheet) history.replaceState(null, '');
