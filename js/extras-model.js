import { addDays, diffDays, KUR_START } from './dates.js';
import { setHabit } from './model.js';

// ---------- Backup-Erinnerung ----------
const BACKUP_EVERY = 5;

export const daysSinceBackup = (state, today) =>
  state.settings.lastBackup ? diffDays(state.settings.lastBackup, today) : null;

// Nie gesichert: ab Kurtag 3 erinnern; sonst alle 5 Tage. "Später" blendet für den Tag aus.
export function backupDue(state, today) {
  if (state.settings.backupSnooze === today) return false;
  const since = daysSinceBackup(state, today);
  return since === null ? today >= addDays(KUR_START, 2) : since >= BACKUP_EVERY;
}
export function markBackup(state, today) { state.settings.lastBackup = today; }
export function snoozeBackup(state, today) { state.settings.backupSnooze = today; }

// ---------- Gitarren-Timer ----------
// Stoppuhr mit Mindestziel. Gespeichert wird nur die Startzeit, damit sie Bildschirmsperre und Neustart übersteht.
export const TIMER_GOAL_MIN = 30;
export const TIMER_MAX_MIN = 240;

export function startTimer(state, date, now) {
  state.timer = { date, start: now, goal: TIMER_GOAL_MIN, celebrated: false };
}
export function timerProgress(timer, now) {
  const elapsedSec = Math.floor(Math.max(0, now - timer.start) / 1000);
  const goalSec = (timer.goal || TIMER_GOAL_MIN) * 60;
  return { elapsedSec, goalReached: elapsedSec >= goalSec, fraction: Math.min(1, elapsedSec / goalSec) };
}
export const timerExpired = (timer, now) => now - timer.start > TIMER_MAX_MIN * 60000;

export function stopTimer(state, now) {
  const t = state.timer;
  if (!t) return 0;
  const minutes = Math.min(TIMER_MAX_MIN, Math.round(Math.max(0, now - t.start) / 60000));
  const prev = state.habits.guitar?.[t.date]?.minutes || 0;
  if (minutes > 0) setHabit(state, 'guitar', t.date, { minutes: prev + minutes });
  state.timer = null;
  return minutes;
}
export function guitarMinutes(state, start, end) {
  return Object.entries(state.habits.guitar || {})
    .filter(([d]) => d >= start && d <= end)
    .reduce((n, [, e]) => n + (e.minutes || 0), 0);
}

// ---------- Countdown ----------
// Nächster fester (nicht optionaler) Termin nach heute.
export function nextCountdown(state, today) {
  const next = state.events
    .filter((e) => !e.optional && e.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return next ? { label: next.short || next.title, days: diffDays(today, next.date) } : null;
}
