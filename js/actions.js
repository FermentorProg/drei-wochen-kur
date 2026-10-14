import { ctx, toast } from './ctx.js';
import * as M from './model.js';
import { doneDates, milestoneReached } from './streaks.js';
import { formatShort } from './dates.js';
import { play } from './sound.js';
import { celebrate } from './fx.js';

// Zentrale Abhak-Logik für Gewohnheiten: ohne patch = umschalten, mit patch = Felder setzen.
export function habitAction(habit, date, patch) {
  const st = () => ctx.store.state;
  const wasDone = !!st().habits[habit]?.[date]?.done;
  const before = doneDates(st().habits[habit]);
  const sportBefore = M.sportCountInWeek(st(), date);
  const allBefore = M.allHabitsDone(st(), date);
  if (!patch || 'done' in patch) ctx.flash = `${habit}:${date}`;
  ctx.store.update((s) => (patch ? M.setHabit(s, habit, date, patch) : M.toggleHabit(s, habit, date)));
  const isDone = !!st().habits[habit]?.[date]?.done;
  if (isDone === wasDone) return;
  play(isDone ? 'blip' : 'blop');
  if (!isDone) return;
  const ms = habit !== 'sport' && milestoneReached(before, doneDates(st().habits[habit]), date);
  if (ms) celebrate('streak', ms, habit);
  if (habit === 'sport' && sportBefore < M.SPORT_GOAL && M.sportCountInWeek(st(), date) >= M.SPORT_GOAL) celebrate('sportGoal');
  if (!allBefore && M.allHabitsDone(st(), date)) celebrate('allDone');
}

export function taskAction(id, date) {
  ctx.flash = `task:${id}`;
  const done = ctx.store.update((s) => M.toggleTask(s, id, date));
  const t = M.findTask(ctx.store.state, id);
  play(done ? 'blip' : 'blop');
  if (t.repeatable) toast(`${t.title}: ${t.count}× 🎉`);
}

export function moveTask(id, date) {
  const t = M.findTask(ctx.store.state, id);
  if (!t || t.date === date) return;
  ctx.store.update((s) => M.setTaskDate(s, id, date));
  play('swoosh');
  toast(date ? `${t.title} → ${formatShort(date)}` : `${t.title} → Parkplatz`);
}

export function confirmEventAction(id) {
  ctx.store.update((s) => M.confirmEvent(s, id));
  play('blip');
  toast('Termin festgemacht');
}
