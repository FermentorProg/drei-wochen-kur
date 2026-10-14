import { ctx, toast } from './ctx.js';
import { openSheet, closeSheet } from './sheet.js';
import { formatShort } from './dates.js';
import * as X from './extras-model.js';
import { habitAction } from './actions.js';
import { play } from './sound.js';

const DURATION = 30;
const R = 90;
const C = 2 * Math.PI * R;
let tick = null;
let wakeLock = null;

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// Abgelaufenen Timer verbuchen: Minuten gutschreiben, Gitarre abhaken, feiern.
export function finishTimerIfDone() {
  const t = ctx.store.state.timer;
  if (!t || !X.timerProgress(t, Date.now()).done) return false;
  const min = ctx.store.update((s) => X.stopTimer(s, Date.now()), { silent: true });
  if (!ctx.store.state.habits.guitar?.[t.date]?.done) habitAction('guitar', t.date);
  play('jingle7');
  toast(`🎸 ${min} Minuten geübt – stark!`, { big: true, ms: 3000 });
  return true;
}

async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { wakeLock = null; }
}
function release() {
  clearInterval(tick);
  tick = null;
  wakeLock?.release?.();
  wakeLock = null;
}

export function openTimer(date) {
  openSheet({
    title: 'Gitarre · Übungstimer',
    live: false,
    onClose: release,
    render: function renderTimer(body) {
      const t = ctx.store.state.timer;
      const other = t && t.date !== date;
      body.innerHTML = `<div class="timer"><svg viewBox="0 0 200 200" class="ring" aria-hidden="true">
          <circle cx="100" cy="100" r="${R}" class="ring-bg"/>
          <circle cx="100" cy="100" r="${R}" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
        <div class="timer-num num" role="timer" aria-live="off"></div></div>
        <p class="muted timer-msg">${t ? (other ? `Timer läuft für ${formatShort(t.date)}.` : 'Läuft – du kannst das Handy weglegen, die Zeit zählt weiter.') : `Bereit für ${DURATION} Minuten?`}</p>
        <div class="row-btns" style="justify-content:center">${t
          ? '<button class="btn" data-a="stop">Stopp & Minuten speichern</button>'
          : '<button class="btn primary" data-a="start">▶ Start</button>'}</div>`;
      const ring = body.querySelector('.ring-fg');
      const num = body.querySelector('.timer-num');
      const update = () => {
        const cur = ctx.store.state.timer;
        const p = cur ? X.timerProgress(cur, Date.now()) : { remainingSec: DURATION * 60 };
        const total = (cur?.duration || DURATION) * 60;
        ring.setAttribute('stroke-dashoffset', String(C * (p.remainingSec / total)));
        num.textContent = fmt(p.remainingSec);
        if (cur && p.done) { release(); closeSheet(); finishTimerIfDone(); }
      };
      update();
      release();
      if (t) { tick = setInterval(update, 1000); keepAwake(); }
      body.onclick = (e) => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'start') {
          ctx.store.update((s) => X.startTimer(s, date, Date.now(), DURATION));
          play('blip');
          renderTimer(body);
        } else if (a === 'stop') {
          const min = ctx.store.update((s) => X.stopTimer(s, Date.now()));
          release();
          closeSheet();
          toast(min ? `${min} Minuten gespeichert` : 'Timer gestoppt');
        }
      };
    },
  });
}

export const timerLabel = (date) => {
  const t = ctx.store.state.timer;
  if (!t || t.date !== date) return null;
  return fmt(X.timerProgress(t, Date.now()).remainingSec);
};
