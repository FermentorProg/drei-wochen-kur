import { ctx, esc, toast } from './ctx.js';
import * as M from './model.js';
import { addDays, CAL_START, CAL_END } from './dates.js';
import { openSheet, closeSheet } from './sheet.js';
import { play } from './sound.js';

// Termin anlegen (event = null) oder bearbeiten.
export function openEventEditor(event, presetDate) {
  const e = event || { title: '', date: presetDate, endDate: null, optional: false };
  openSheet({
    title: event ? 'Termin bearbeiten' : 'Neuer Termin',
    live: false,
    render(body) {
      body.innerHTML = `<form id="event-form">
        <label class="field"><span>Titel</span><input name="title" required value="${esc(e.title)}" autocomplete="off"></label>
        <label class="field"><span>Datum</span><input type="date" name="date" required min="${addDays(CAL_START, -30)}" max="${addDays(CAL_END, 60)}" value="${e.date || ''}"></label>
        <label class="field"><span>Bis (optional, mehrtägig)</span><input type="date" name="endDate" value="${e.endDate || ''}"></label>
        <div class="set-row"><span>Nur vielleicht (gestrichelt)</span><button type="button" class="toggle" role="switch" aria-checked="${!!e.optional}" data-optional aria-label="Nur vielleicht"></button></div>
        <button class="btn primary wide" type="submit">Speichern</button>
        ${event ? '<button class="btn wide" type="button" data-del>Termin löschen</button>' : ''}
      </form>`;
      const form = body.querySelector('form');
      const opt = form.querySelector('[data-optional]');
      opt.onclick = () => opt.setAttribute('aria-checked', String(opt.getAttribute('aria-checked') !== 'true'));
      form.querySelector('[data-del]')?.addEventListener('click', () => {
        if (!confirm(`„${e.title}“ löschen?`)) return;
        ctx.store.update((s) => M.removeEvent(s, event.id));
        play('blop');
        closeSheet();
      });
      form.onsubmit = (ev) => {
        ev.preventDefault();
        const f = new FormData(form);
        const fields = {
          title: f.get('title'), date: f.get('date'), endDate: f.get('endDate') || null,
          optional: opt.getAttribute('aria-checked') === 'true',
        };
        if (!String(fields.title).trim() || !fields.date) return;
        if (event) ctx.store.update((s) => M.updateEvent(s, event.id, fields));
        else ctx.store.update((s) => M.addEvent(s, fields));
        play('blip');
        closeSheet();
        toast(event ? 'Termin gespeichert' : 'Termin angelegt');
      };
      if (!event) form.querySelector('input[name="title"]').focus();
    },
  });
}
