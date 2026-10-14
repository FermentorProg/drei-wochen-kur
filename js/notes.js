import { esc } from './ctx.js';
import { CATEGORIES } from './model.js';
import { guitarPieces } from './goals-model.js';
import { formatShort } from './dates.js';
import { collectNotes } from './notes-model.js';
import { openDay, openTask } from './dayitems.js';

let filter = 'all';
const filters = (state) => [
  ['all', 'Alle'], ['guitar', 'Gitarre'],
  ...Object.entries(guitarPieces(state)).map(([k, l]) => [`guitar:${k}`, l]),
  ['sport', 'Sport'], ['tasks', 'Aufgaben'],
];
const COLOR = { guitar: 'var(--magenta)', sport: 'var(--yellow)' };
const SPORT = { kraft: 'Kraft', ausdauer: 'Ausdauer' };

export function renderNotes(el, state) {
  const notes = collectNotes(state, filter);
  let html = `<h2>Tagebuch</h2><div class="chips n-filter">${filters(state).map(([k, l]) =>
    `<button class="chip${filter === k ? ' on' : ''}" data-filter="${k}">${esc(l)}</button>`).join('')}</div>`;
  if (!notes.length) html += '<div class="card placeholder">Noch keine Notizen. Schreib nach dem Üben auf, was du gespielt hast – hier entsteht dein Tagebuch.</div>';
  let lastDate = null;
  for (const n of notes) {
    if (n.date !== lastDate) {
      html += `<h3 class="n-date">${formatShort(n.date)}</h3>`;
      lastDate = n.date;
    }
    const color = COLOR[n.kind] || CATEGORIES[n.category]?.color || 'var(--cyan)';
    const sub = n.kind === 'sport' && n.types.length ? ` · ${n.types.map((t) => SPORT[t]).join(' + ')}` : '';
    const open = n.kind === 'task' ? `data-task="${n.taskId}"` : `data-day="${n.date}"`;
    html += `<button class="card n-card" style="--c:${color}" ${open}>
      <span class="n-kind">${esc(n.title)}${sub}</span><span class="n-text">${esc(n.text)}</span></button>`;
  }
  el.innerHTML = html;
  el.onclick = (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) { filter = f.dataset.filter; renderNotes(el, state); return; }
    const c = e.target.closest('.n-card');
    if (c?.dataset.task) openTask(c.dataset.task);
    else if (c?.dataset.day) openDay(c.dataset.day);
  };
}
