import { ctx, esc, today } from './ctx.js';
import { CATEGORIES, SPORT_MAX, SPORT_GOAL, categoryLabel } from './model.js';
import * as G from './goals-model.js';
import { addDays, CAL_START, CAL_END } from './dates.js';
import { checkBtn } from './dayitems.js';
import { play } from './sound.js';
import { ICON } from './icons.js';

const addForm = (kind, placeholder) => `<form class="g-add" data-add="${kind}"><input placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off"><button class="btn small" type="submit">+ Hinzufügen</button></form>`;
const delBtn = (kind, id, label) => `<button class="icon-btn g-del" data-del="${kind}" data-id="${id}" aria-label="${esc(label)} entfernen">${ICON.close}</button>`;

const pct = (d, t) => (t ? Math.round((d / t) * 100) : 0);
const bar = (d, t, color) => `<div class="pbar" style="--c:${color}"><i style="width:${pct(d, t)}%"></i></div>`;
const dm = (iso) => `${iso.slice(8)}.${iso.slice(5, 7)}.`;

function overall(state) {
  const s = G.taskStats(state);
  const cats = Object.entries(CATEGORIES).map(([k, c]) => {
    const v = s.byCat[k];
    return `<div class="g-row"><span>${esc(categoryLabel(state, k))}</span><span class="num">${v.done}/${v.total}</span></div>${bar(v.done, v.total, c.color)}`;
  }).join('');
  return `<div class="card"><div class="g-head"><span class="g-big num">${s.done}<small>/${s.total}</small></span><span>Aufgaben erledigt</span></div>
    ${bar(s.done, s.total, 'var(--cyan)')}<div class="g-cats">${cats}</div></div>`;
}

function jazz(state) {
  const p = G.jazzProgress(state);
  const rows = state.goals.jazzPieces.map(({ id: k, label, custom }) => {
    const v = state.goals.jazz[k] || 0;
    const steps = G.JAZZ_STAGES.map((s, i) =>
      `<button class="stage${i < v ? ' on' : ''}" data-jazz="${k}" data-stage="${i + 1}" aria-pressed="${i < v}">${s}</button>`).join('');
    return `<div class="g-piece"><div class="g-row"><strong>${esc(label)}</strong><span class="muted">${v ? G.JAZZ_STAGES[v - 1] : 'noch nicht begonnen'}${custom ? delBtn('jazz', k, label) : ''}</span></div><div class="stages">${steps}</div></div>`;
  }).join('');
  return `<div class="card guitar"><div class="g-row"><h3>🎷 Jazz-Standards</h3><span class="num">${pct(p.done, p.total)}%</span></div>
    ${bar(p.done, p.total, 'var(--magenta)')}${rows}${addForm('jazz', 'Neues Stück …')}</div>`;
}

function arise(state) {
  const p = G.ariseProgress(state);
  const list = state.goals.ariseSongs.map(({ id: k, label, custom }, i) =>
    `<div class="item guitar">${checkBtn(state.goals.arise[k], 'arise', `data-song="${k}"`, label, `arise:${k}`)}
      <div class="item-title"><span class="t"><span class="muted">${i + 1}.</span> ${esc(label)}</span></div>${custom ? delBtn('arise', k, label) : ''}</div>`).join('');
  return `<div class="card"><div class="g-row"><h3>🤘 Sepultura – Arise</h3><span class="num">${p.done}/${p.total}</span></div>
    ${bar(p.done, p.total, 'var(--magenta)')}<div class="list">${list}</div>${addForm('arise', 'Neuer Song …')}</div>`;
}

function slowcooker(state) {
  const slots = state.goals.slowcooker.map((s, i) => {
    const stars = [1, 2, 3, 4, 5].map((n) =>
      `<button class="star${s.rating >= n ? ' on' : ''}" data-slot="${i}" data-rate="${n}" aria-label="${n} von 5">★</button>`).join('');
    return `<div class="g-slot${s.date ? ' cooked' : ''}">
      <div class="g-row"><strong>Gericht ${i + 1}${i >= G.SLOWCOOKER_GOAL ? ' · Bonus' : ''}</strong><span>${s.date ? '<span class="badge">gekocht ✓</span>' : ''}${i >= G.SLOWCOOKER_GOAL ? delBtn('slot', i, `Gericht ${i + 1}`) : ''}</span></div>
      <input data-slot="${i}" data-field="name" value="${esc(s.name)}" placeholder="${esc(s.idea ? `Idee: ${s.idea}` : 'Name des Gerichts')}" aria-label="Gericht ${i + 1} Name">
      <div class="g-row"><input type="date" data-slot="${i}" data-field="date" value="${s.date || ''}" min="${addDays(CAL_START, -30)}" max="${CAL_END}" aria-label="Gekocht am"><div class="stars">${stars}</div></div>
      <textarea data-slot="${i}" data-field="note" placeholder="Notiz: Rezept, was ändern?" aria-label="Notiz">${esc(s.note)}</textarea>
    </div>`;
  }).join('');
  const n = G.cookedCount(state), goal = G.SLOWCOOKER_GOAL;
  return `<div class="card"><div class="g-row"><h3>🍲 Slow Cooker</h3><span class="num">${n}/${goal}${n >= goal ? ' 🏆' : ''}</span></div>${bar(Math.min(n, goal), goal, 'var(--orange)')}${slots}
    <button class="btn wide" data-addslot>+ Gericht hinzufügen</button></div>`;
}

function sport(state) {
  const s = G.sportStats(state);
  const weeks = s.weeks.map((w) =>
    `<div class="g-week"><span class="muted">ab ${dm(w.start)}</span>${bar(w.count, SPORT_MAX, w.count >= SPORT_GOAL ? 'var(--yellow)' : 'var(--orange)')}<span class="num">${w.count}/${SPORT_MAX}${w.count >= SPORT_GOAL ? ' 🏆' : ''}</span></div>`).join('');
  return `<div class="card sport"><div class="g-head"><span class="g-big num">${s.total}</span><span>Einheiten Sport</span></div>
    <div class="g-split"><span><i class="ld" style="background:var(--yellow)"></i>Kraft <b class="num">${s.kraft}</b></span>
    <span><i class="ld" style="background:var(--orange)"></i>Ausdauer <b class="num">${s.ausdauer}</b></span></div>${weeks}</div>`;
}

function saveSlot(i, patch, silent) {
  ctx.store.update((st) => G.updateSlot(st, i, patch, today()), { silent });
}

export function renderGoals(el, state) {
  G.ensureGoalLists(state);
  el.innerHTML = `<h2>Gesamtfortschritt</h2>${overall(state)}
    <h2>Gitarre</h2>${jazz(state)}${arise(state)}
    <h2>Slow Cooker</h2>${slowcooker(state)}
    <h2>Sport</h2>${sport(state)}`;
  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.del) return removeItem(b.dataset.del, b.dataset.id);
    if ('addslot' in b.dataset) {
      ctx.store.update((st) => G.addSlot(st));
      el.querySelectorAll('.g-slot input[data-field="name"]').forEach((i, n, all) => n === all.length - 1 && i.focus());
      return;
    }
    if (b.dataset.jazz) {
      ctx.store.update((st) => G.setJazzStage(st, b.dataset.jazz, +b.dataset.stage));
      play(b.classList.contains('on') && !b.nextElementSibling?.classList.contains('on') ? 'blop' : 'blip');
    } else if (b.dataset.act === 'arise') {
      ctx.flash = `arise:${b.dataset.song}`;
      ctx.store.update((st) => G.toggleArise(st, b.dataset.song));
      play(ctx.store.state.goals.arise[b.dataset.song] ? 'blip' : 'blop');
    } else if (b.dataset.rate) {
      const i = +b.dataset.slot, n = +b.dataset.rate;
      saveSlot(i, { rating: ctx.store.state.goals.slowcooker[i].rating === n ? null : n });
      play('blip');
    }
  };
  el.onsubmit = (e) => {
    e.preventDefault();
    const form = e.target.closest('[data-add]');
    const input = form.querySelector('input');
    const kind = form.dataset.add;
    const id = ctx.store.update((st) => (kind === 'jazz' ? G.addJazzPiece(st, input.value) : G.addAriseSong(st, input.value)));
    if (id) play('blip');
  };
  // Texte beim Tippen still speichern, Datum normal (ändert Status und Aufgabe).
  el.oninput = (e) => {
    const t = e.target;
    if (!t.dataset.slot || t.dataset.field === 'date') return;
    clearTimeout(t._save);
    t._save = setTimeout(() => saveSlot(+t.dataset.slot, { [t.dataset.field]: t.value }, true), 300);
  };
  el.onchange = (e) => {
    const t = e.target;
    if (!t.dataset.slot) return;
    clearTimeout(t._save);
    const date = t.dataset.field === 'date';
    saveSlot(+t.dataset.slot, { [t.dataset.field]: date ? t.value || null : t.value }, !date);
    if (date && t.value) play('blip');
  };
}

function removeItem(kind, id) {
  const st = ctx.store.state;
  const label = kind === 'slot' ? `Gericht ${+id + 1}`
    : (kind === 'jazz' ? st.goals.jazzPieces : st.goals.ariseSongs).find((p) => p.id === id)?.label;
  if (!confirm(`„${label}“ entfernen?`)) return;
  ctx.store.update((s) => {
    if (kind === 'jazz') G.removeJazzPiece(s, id);
    else if (kind === 'arise') G.removeAriseSong(s, id);
    else G.removeSlot(s, +id, today());
  });
  play('blop');
}
