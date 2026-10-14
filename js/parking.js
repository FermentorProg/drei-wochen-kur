import { ctx, esc, today, toast } from './ctx.js';
import * as M from './model.js';
import { weeks, WD, CAL_START, CAL_END, KUR_START, KUR_END } from './dates.js';
import { openSheet, closeSheet } from './sheet.js';
import { taskRow, bindItems } from './dayitems.js';
import { moveTask } from './actions.js';

const byDeadline = (a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999');

export function renderParking(el, state, day) {
  const undated = state.tasks.filter((t) => !t.date);
  const open = undated.filter((t) => !t.done);
  const done = undated.filter((t) => t.done);
  let html = Object.entries(M.CATEGORIES).map(([k, c]) => {
    const list = open.filter((t) => t.category === k).sort(byDeadline);
    if (!list.length) return '';
    return `<div class="pk-group" style="--cat:${c.color}"><h3>${esc(M.categoryLabel(state, k))}</h3>
      <div class="card list">${list.map((t) => taskRow(t, day)).join('')}</div></div>`;
  }).join('');
  if (!open.length) html = '<div class="card placeholder">Parkplatz ist leer – stark! 💪</div>';
  if (done.length) {
    html += `<details class="done-list"><summary>Erledigt (${done.length})</summary>
      <div class="card list">${done.map((t) => taskRow(t, day)).join('')}</div></details>`;
  }
  const wasOpen = el.querySelector('details.done-list')?.open;
  el.innerHTML = html;
  if (wasOpen) el.querySelector('details.done-list').open = true;
  bindItems(el, day);
}

export function openDatePicker(id) {
  openSheet({
    title: 'Tag wählen',
    render(body) {
      const t = M.findTask(ctx.store.state, id);
      if (!t) return closeSheet();
      const day = today();
      let html = `<div class="picker"><div class="cal-head">${WD.map((w) => `<span class="muted" style="text-align:center;font-size:11px">${w}</span>`).join('')}</div>`;
      for (const week of weeks(CAL_START, CAL_END)) {
        html += '<div class="pweek">' + week.map((d) => {
          const cls = `${d < KUR_START || d > KUR_END ? ' out' : ''}${d === day ? ' today' : ''}${d === t.date ? ' sel' : ''}`;
          return `<button class="pday${cls}" data-pick="${d}">${+d.slice(8)}</button>`;
        }).join('') + '</div>';
      }
      html += '</div>';
      if (t.date) html += '<button class="btn wide" data-pick="">Zurück in den Parkplatz</button>';
      body.innerHTML = `<p class="muted" style="margin-top:0">${esc(t.title)}</p>${html}`;
      body.onclick = (e) => {
        const b = e.target.closest('[data-pick]');
        if (!b) return;
        closeSheet();
        moveTask(id, b.dataset.pick || null);
      };
    },
  });
}

export function openTaskEditor(task, presetDate = null) {
  const t = task || { title: '', category: 'erledigen', date: presetDate, deadline: null };
  openSheet({
    title: task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe',
    live: false,
    render(body) {
      body.innerHTML = `<form id="task-form">
        <label class="field"><span>Titel</span><input name="title" required value="${esc(t.title)}" autocomplete="off"></label>
        <div class="field"><span>Kategorie</span><div class="chips">${Object.entries(M.CATEGORIES).map(([k, c]) =>
          `<button type="button" class="chip${t.category === k ? ' on' : ''}" data-cat="${k}" style="--c:${c.color}">${esc(M.categoryLabel(ctx.store.state, k))}</button>`).join('')}</div></div>
        <label class="field"><span>Datum (optional)</span><input type="date" name="date" min="${CAL_START}" max="${CAL_END}" value="${t.date || ''}"></label>
        <label class="field"><span>Deadline (optional)</span><input type="date" name="deadline" value="${t.deadline || ''}"></label>
        ${task ? '' : '<label class="field"><span>Notiz (optional)</span><textarea name="note"></textarea></label>'}
        <button class="btn primary wide" type="submit">Speichern</button>
        ${task ? '<button class="btn wide" type="button" data-del>Aufgabe löschen</button>' : ''}
      </form>`;
      const form = body.querySelector('form');
      let category = t.category;
      form.onclick = (e) => {
        const c = e.target.closest('[data-cat]');
        if (c) {
          category = c.dataset.cat;
          form.querySelectorAll('[data-cat]').forEach((b) => b.classList.toggle('on', b === c));
        }
        if (e.target.closest('[data-del]') && confirm(`„${t.title}“ wirklich löschen?`)) {
          ctx.store.update((s) => { s.tasks = s.tasks.filter((x) => x.id !== task.id); });
          closeSheet();
        }
      };
      form.onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const fields = {
          title: f.get('title').trim(), category,
          date: f.get('date') || null, deadline: f.get('deadline') || null,
        };
        if (!fields.title) return;
        if (task) ctx.store.update((s) => Object.assign(M.findTask(s, task.id), fields));
        else ctx.store.update((s) => M.addTask(s, { ...fields, note: (f.get('note') || '').trim() }, today()));
        closeSheet();
        toast(task ? 'Gespeichert' : 'Aufgabe angelegt');
      };
      if (!task) body.querySelector('input[name="title"]').focus();
    },
  });
}
