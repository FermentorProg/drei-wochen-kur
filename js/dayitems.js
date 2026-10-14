import { ctx, esc, today } from './ctx.js';
import * as M from './model.js';
import { segments, doneDates, segmentAt } from './streaks.js';
import { addDays, formatShort } from './dates.js';
import { habitAction, taskAction, confirmEventAction, moveTask } from './actions.js';
import { openSheet, closeSheet } from './sheet.js';
import { openDatePicker, openTaskEditor } from './parking.js';
import { ICON } from './icons.js';
import { guitarPieces } from './goals-model.js';

const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const SPORT_TYPES = { kraft: 'Kraft', ausdauer: 'Ausdauer' };
const drafts = {};
const shortDate = (iso) => `${iso.slice(8)}.${iso.slice(5, 7)}.`;

export function checkBtn(on, act, attrs, label, flashKey) {
  const just = on && ctx.flash === flashKey ? ' just' : '';
  return `<button class="check${on ? ' on' : ''}${just}" data-act="${act}" ${attrs} aria-pressed="${!!on}" aria-label="${esc(label)}">${CHECK_SVG}</button>`;
}

// Aktuelle Serie: inkl. Tag, falls erledigt, sonst die bis gestern.
function streakBadge(state, habit, date) {
  const segs = segments(doneDates(state.habits[habit]));
  const s = segmentAt(segs, date) || segmentAt(segs, addDays(date, -1));
  return s && s.length >= 2 ? `<span class="streak">🔥 ${s.length}</span>` : '';
}

export function taskRow(t, day) {
  const cat = M.CATEGORIES[t.category] || { color: '#A99BD6' };
  const left = t.repeatable
    ? `<button class="check count" data-act="task" data-id="${t.id}" aria-label="${esc(t.title)}: einmal mehr">+1</button>`
    : checkBtn(t.done, 'task', `data-id="${t.id}"`, `${t.title} erledigt`, `task:${t.id}`);
  const badges = [];
  if (t.repeatable && t.count) badges.push(`<span class="badge">${t.count}×</span>`);
  if (t.deadline && !t.done) badges.push(`<span class="badge${M.deadlineSoon(t, day) ? ' soon' : ''}">bis ${shortDate(t.deadline)}</span>`);
  if (t.notes?.length) badges.push(`<span class="badge">✎ ${t.notes.length}</span>`);
  return `<div class="item task${t.done ? ' done' : ''}" data-task-id="${t.id}" style="--cat:${cat.color}">
    ${left}
    <button class="item-title" data-act="task-open" data-id="${t.id}"><span class="t">${esc(t.title)}</span>${badges.join('')}</button>
    <button class="icon-btn" data-act="task-date" data-id="${t.id}" aria-label="Datum wählen">${ICON.cal}</button>
  </div>`;
}

function eventRow(state, e) {
  const done = e.group && M.isGroupDone(state, e.group);
  const confirm = e.optional && !done
    ? `<div><button class="btn small" data-act="confirm-ev" data-id="${e.id}">Diesen Termin festmachen</button></div>` : '';
  return `<div class="item event${e.optional ? ' opt' : ''}${done ? ' done' : ''}">
    <span class="ev-mark">${done ? '✓' : e.optional ? '?' : '●'}</span>
    <div class="item-main"><div class="item-title"><span class="t">${esc(e.title)}</span>${e.endDate ? `<span class="badge">bis ${shortDate(e.endDate)}</span>` : ''}</div>${confirm}</div>
  </div>`;
}

export function dayItemsHTML(state, date) {
  const g = state.habits.guitar?.[date] || {};
  const y = state.habits.yazio?.[date] || {};
  const s = state.habits.sport?.[date] || {};
  const { events, tasks } = M.itemsOnDate(state, date);
  const pieces = Object.entries(guitarPieces(state))
    .map(([k, l]) => `<button class="chip${g.piece === k ? ' on' : ''}" data-act="piece" data-piece="${k}">${l}</button>`).join('');
  const types = Object.entries(SPORT_TYPES)
    .map(([k, l]) => `<button class="chip ${k}${s.types?.includes(k) ? ' on' : ''}" data-act="stype" data-type="${k}">${l}</button>`).join('');
  return `${events.map((e) => eventRow(state, e)).join('')}
  <div class="item guitar">
    ${checkBtn(g.done, 'habit', 'data-habit="guitar"', 'Gitarre erledigt', `guitar:${date}`)}
    <div class="item-main">
      <div class="item-title">Gitarre <small>mind. 30 min</small>${streakBadge(state, 'guitar', date)}</div>
      <div class="chips">${pieces}</div>
      <textarea data-act="hnote" data-habit="guitar" placeholder="Was gespielt / gelernt?" aria-label="Gitarre Notiz">${esc(g.note)}</textarea>
    </div>
  </div>
  <div class="item yazio">
    ${checkBtn(y.done, 'habit', 'data-habit="yazio"', 'Yazio eingetragen', `yazio:${date}`)}
    <div class="item-main"><div class="item-title">Yazio eingetragen ${streakBadge(state, 'yazio', date)}</div></div>
  </div>
  <div class="item sport">
    ${checkBtn(s.done, 'habit', 'data-habit="sport"', 'Sport erledigt', `sport:${date}`)}
    <div class="item-main">
      <div class="item-title">Sport</div>
      <div class="chips">${types}</div>
      <textarea data-act="hnote" data-habit="sport" placeholder="Notiz (optional)" aria-label="Sport Notiz">${esc(s.note)}</textarea>
    </div>
  </div>
  ${tasks.map((t) => taskRow(t, today())).join('')}`;
}

// Ereignis-Delegation für alle Listen mit Tages-Einträgen und Aufgaben.
export function bindItems(el, date) {
  el.onclick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !el.contains(b)) return;
    const st = ctx.store.state;
    const { act, id } = b.dataset;
    if (act === 'habit') habitAction(b.dataset.habit, date);
    else if (act === 'piece') {
      const cur = st.habits.guitar?.[date]?.piece;
      habitAction('guitar', date, { piece: cur === b.dataset.piece ? null : b.dataset.piece });
    } else if (act === 'stype') {
      const cur = st.habits.sport?.[date] || {};
      const set = new Set(cur.types || []);
      set.has(b.dataset.type) ? set.delete(b.dataset.type) : set.add(b.dataset.type);
      habitAction('sport', date, set.size && !cur.done ? { types: [...set], done: true } : { types: [...set] });
    } else if (act === 'task') taskAction(id, today());
    else if (act === 'task-open') openTask(id);
    else if (act === 'task-date') openDatePicker(id);
    else if (act === 'confirm-ev') confirmEventAction(id);
    else if (act === 'new-task') openTaskEditor(null, date);
  };
  el.oninput = (e) => {
    const t = e.target;
    if (t.dataset.act !== 'hnote') return;
    clearTimeout(t._save);
    t._save = setTimeout(() => saveHabitNote(t.dataset.habit, date, t.value), 300);
  };
  el.onchange = (e) => {
    const t = e.target;
    if (t.dataset.act === 'hnote') { clearTimeout(t._save); saveHabitNote(t.dataset.habit, date, t.value); }
  };
}

function saveHabitNote(habit, date, text) {
  ctx.store.update((s) => M.setHabit(s, habit, date, { note: text.trim() }), { silent: true });
}

export function renderDayItems(el, state, date) {
  el.innerHTML = dayItemsHTML(state, date);
  bindItems(el, date);
}

export function renderSportWeek(el, state, date) {
  const n = M.sportCountInWeek(state, date);
  const goal = n >= M.SPORT_GOAL;
  el.classList.toggle('goal', goal);
  el.innerHTML = `<div class="sw-num">SPORT ${n}/${M.SPORT_MAX}</div>
    <div style="flex:1"><div class="sw-seg">${Array.from({ length: M.SPORT_MAX }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>
    <div class="sw-msg">${goal ? '🏆 Wochenziel erreicht!' : `Noch ${M.SPORT_GOAL - n} bis zum Wochenziel`}</div></div>`;
}

export function openDay(date) {
  const isToday = date === today();
  openSheet({
    title: `${formatShort(date)}${isToday ? ' · Heute' : ''}`,
    render(body) {
      body.innerHTML = `<div class="list">${dayItemsHTML(ctx.store.state, date)}</div>
        <button class="btn wide" data-act="new-task">+ Aufgabe für diesen Tag</button>`;
      bindItems(body, date);
    },
  });
}

export function openTask(id) {
  openSheet({
    title: M.findTask(ctx.store.state, id)?.title || 'Aufgabe',
    render(body) {
      const st = ctx.store.state;
      const t = M.findTask(st, id);
      if (!t) { closeSheet(); return; }
      const cat = M.CATEGORIES[t.category] || { label: t.category, color: '#A99BD6' };
      const cands = t.group ? st.events.filter((e) => e.group === t.group) : [];
      const main = t.repeatable
        ? `<button class="btn" data-a="dec" aria-label="einmal weniger">−1</button><span class="num" style="font-size:20px">${t.count || 0}×</span><button class="btn primary" data-a="inc">+1</button>`
        : `<button class="btn primary" data-a="toggle">${t.done ? 'Wieder öffnen' : 'Erledigt ✓'}</button>`;
      body.innerHTML = `
        <div class="row-btns">
          <span class="badge cat" style="--cat:${cat.color}">${esc(M.categoryLabel(st, t.category))}</span>
          <span class="badge">${t.date ? formatShort(t.date) : 'Parkplatz'}</span>
          ${t.deadline ? `<span class="badge${M.deadlineSoon(t, today()) ? ' soon' : ''}">Deadline ${shortDate(t.deadline)}</span>` : ''}
        </div>
        <div class="row-btns">${main}</div>
        <div class="row-btns">
          <button class="btn" data-a="date">Datum wählen</button>
          ${t.date ? '<button class="btn" data-a="park">In Parkplatz</button>' : ''}
          <button class="btn" data-a="edit">Bearbeiten</button>
        </div>
        ${cands.length ? `<h3>Termin-Kandidaten</h3><div class="list">${cands.map((e) => eventRow(st, { ...e, title: `${formatShort(e.date)}${e.optional ? '' : ' (fest)'}` })).join('')}</div>` : ''}
        <h3>Notizen</h3>
        <ul class="notes">${t.notes.map((n) => `<li><time>${formatShort(n.date)}</time>${esc(n.text)}</li>`).join('') || '<li class="muted">Noch keine Notizen.</li>'}</ul>
        <textarea id="task-note" placeholder="Neue Notiz …" aria-label="Neue Notiz"></textarea>
        <button class="btn primary wide" data-a="note">Notiz speichern</button>`;
      const noteEl = body.querySelector('#task-note');
      noteEl.value = drafts[id] || '';
      noteEl.oninput = () => { drafts[id] = noteEl.value; };
      body.onclick = (e) => {
        const b = e.target.closest('[data-a],[data-act]');
        if (!b) return;
        if (b.dataset.act === 'confirm-ev') return confirmEventAction(b.dataset.id);
        const a = b.dataset.a;
        if (a === 'toggle' || a === 'inc') taskAction(id, today());
        else if (a === 'dec') ctx.store.update((s) => M.adjustCount(s, id, -1));
        else if (a === 'date') openDatePicker(id);
        else if (a === 'park') { closeSheet(); moveTask(id, null); }
        else if (a === 'edit') openTaskEditor(t);
        else if (a === 'note') {
          const text = body.querySelector('#task-note').value.trim();
          if (!text) return;
          delete drafts[id];
          ctx.store.update((s) => M.addTaskNote(s, id, today(), text));
        }
      };
    },
  });
}
