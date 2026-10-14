import { addDays, weekStart, weeks, CAL_START, CAL_END } from './dates.js';
import { segments, doneDates } from './streaks.js';
import { collectNotes } from './notes-model.js';

export function reviewWeeks(today) {
  const current = weekStart(today);
  return weeks(CAL_START, CAL_END).map((w) => ({ start: w[0], end: w[6], current: w[0] === current }));
}

// Kennzahlen einer Woche (Mo–So) für den Wochenrückblick.
export function weekReview(state, start) {
  const end = addDays(start, 6);
  const inWeek = (d) => d && d >= start && d <= end;
  const days = (habit) => Object.entries(state.habits[habit] || {}).filter(([d, e]) => e.done && inWeek(d));
  const sport = days('sport');
  const guitarSegs = segments(doneDates(state.habits.guitar)).filter((s) => s.end >= start && s.start <= end);
  return {
    start, end,
    guitar: days('guitar').length,
    yazio: days('yazio').length,
    sport: {
      count: sport.length,
      kraft: sport.filter(([, e]) => e.types?.includes('kraft')).length,
      ausdauer: sport.filter(([, e]) => e.types?.includes('ausdauer')).length,
    },
    bestGuitarStreak: Math.max(0, ...guitarSegs.map((s) => s.length)),
    tasksDone: state.tasks.filter((t) => t.done && !t.repeatable && inWeek(t.doneDate)).map((t) => t.title),
    cooked: state.goals.slowcooker.filter((s) => inWeek(s.date)).map((s) => s.name || s.idea || 'Gericht'),
    notes: collectNotes(state, 'all').filter((n) => inWeek(n.date)).slice(0, 3),
  };
}
