import { ctx, toast } from './ctx.js';
import { openSheet, closeSheet } from './sheet.js';
import { formatShort } from './dates.js';
import * as X from './extras-model.js';
import { habitAction } from './actions.js';
import { play } from './sound.js';

const R = 90;
const C = 2 * Math.PI * R;
let tick = null;
let wakeLock = null;

const pad = (n) => String(n).padStart(2, '0');
function fmt(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// Bei jedem Rendern und jede Sekunde im Timer-Sheet: Ziel feiern, vergessene Timer beenden.
export function checkTimer() {
  const t = ctx.store.state.timer;
  if (!t) return;
  const now = Date.now();
  if (X.timerExpired(t, now)) {
    const min = ctx.store.update((s) => X.stopTimer(s, now));
    toast(`Timer nach ${min} Minuten automatisch gestoppt`);
    return;
  }
  if (X.timerProgress(t, now).goalReached && !t.celebrated) {
    ctx.store.update((s) => { s.timer.celebrated = true; }, { silent: true });
    if (!ctx.store.state.habits.guitar?.[t.date]?.done) habitAction('guitar', t.date);
    play('jingle7');
    toast(`🎸 ${t.goal || X.TIMER_GOAL_MIN} Minuten geschafft – spiel ruhig weiter!`, { big: true, ms: 3500 });
  }
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
        <p class="muted timer-msg"></p>
        <div class="row-btns" style="justify-content:center">${t
          ? '<button class="btn primary" data-a="stop">⏹ Stopp & Minuten speichern</button>'
          : '<button class="btn primary" data-a="start">▶ Start</button>'}</div>
        <p class="muted" style="text-align:center;font-size:12px">Ziel: mindestens ${X.TIMER_GOAL_MIN} Minuten. Danach läuft die Zeit weiter – jede Minute zählt.</p>`;
      const ring = body.querySelector('.ring-fg');
      const num = body.querySelector('.timer-num');
      const msg = body.querySelector('.timer-msg');
      const update = () => {
        checkTimer();
        const cur = ctx.store.state.timer;
        if (!cur) { num.textContent = '00:00'; ring.setAttribute('stroke-dashoffset', String(C)); msg.textContent = 'Bereit?'; return; }
        const p = X.timerProgress(cur, Date.now());
        const goalSec = (cur.goal || X.TIMER_GOAL_MIN) * 60;
        ring.setAttribute('stroke-dashoffset', String(C * (1 - p.fraction)));
        ring.classList.toggle('goal', p.goalReached);
        num.textContent = fmt(p.elapsedSec);
        msg.textContent = other ? `Timer läuft für ${formatShort(cur.date)}.`
          : p.goalReached ? `Ziel erreicht ✓ · Bonuszeit +${fmt(p.elapsedSec - goalSec)}`
          : `Noch ${fmt(goalSec - p.elapsedSec)} bis zum Ziel`;
      };
      release();
      update();
      if (t) { tick = setInterval(update, 1000); keepAwake(); }
      body.onclick = (e) => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'start') {
          ctx.store.update((s) => X.startTimer(s, date, Date.now()));
          play('blip');
          renderTimer(body);
        } else if (a === 'stop') {
          const min = ctx.store.update((s) => X.stopTimer(s, Date.now()));
          release();
          closeSheet();
          toast(min ? `${min} Minuten gespeichert 🎸` : 'Timer gestoppt');
        }
      };
    },
  });
}

// Laufzeit für den Timer-Button in der Heute-Liste.
export const timerLabel = (date) => {
  const t = ctx.store.state.timer;
  if (!t || t.date !== date) return null;
  return fmt(X.timerProgress(t, Date.now()).elapsedSec);
};
