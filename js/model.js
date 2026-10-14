import { addDays, diffDays, range, weekStart } from './dates.js';

export const SPORT_GOAL = 4;
export const SPORT_MAX = 5;
export const HABITS = ['guitar', 'yazio', 'sport'];
export const HABIT_LABELS = { guitar: 'Gitarre', yazio: 'Yazio', sport: 'Sport' };
export const CATEGORIES = {
  erledigen: { label: 'Erledigen', color: '#22E6FF' },
  garten: { label: 'Garten / Gartenhaus', color: '#7CF29A' },
  kind: { label: 'Mit Kind', color: '#FF2E88' },
  ich: { label: 'Für mich', color: '#B14CFF' },
};

// Anzeigename einer Kategorie; per Import überschreibbar (settings.labels), damit private Namen nicht im Code stehen.
export const categoryLabel = (state, key) => state.settings?.labels?.[key] || CATEGORIES[key]?.label || key;

export function setHabit(state, habit, date, patch) {
  const map = (state.habits[habit] ||= {});
  map[date] = { done: false, ...map[date], ...patch };
  return map[date];
}
export const toggleHabit = (state, habit, date) =>
  setHabit(state, habit, date, { done: !state.habits[habit]?.[date]?.done }).done;

export function sportCountInWeek(state, iso) {
  const ws = weekStart(iso);
  return range(ws, addDays(ws, 6)).filter((d) => state.habits.sport?.[d]?.done).length;
}
export function openHabits(state, date) {
  const open = [];
  if (!state.habits.guitar?.[date]?.done) open.push('guitar');
  if (!state.habits.yazio?.[date]?.done) open.push('yazio');
  if (!state.habits.sport?.[date]?.done && sportCountInWeek(state, date) < SPORT_GOAL) open.push('sport');
  return open;
}
export const allHabitsDone = (state, date) => openHabits(state, date).length === 0;

export const findTask = (state, id) => state.tasks.find((t) => t.id === id);
export function setTaskDate(state, id, date) { findTask(state, id).date = date; }
export function toggleTask(state, id, today) {
  const t = findTask(state, id);
  if (t.repeatable) { t.count = (t.count || 0) + 1; return true; }
  t.done = !t.done;
  t.doneDate = t.done ? (t.date && t.date < today ? t.date : today) : null;
  return t.done;
}
export function adjustCount(state, id, delta) {
  const t = findTask(state, id);
  t.count = Math.max(0, (t.count || 0) + delta);
}
export const PLACES = { drinnen: '🏠 drinnen', draussen: '🌳 draußen' };

export function addTask(state, { title, category, date = null, deadline = null, note = '', place = null }, today) {
  const t = {
    id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title, category, date, deadline, done: false, doneDate: null,
    notes: note ? [{ date: today, text: note }] : [], group: null, repeatable: false, count: 0,
    ...(place ? { place } : {}),
  };
  state.tasks.push(t);
  return t;
}
// Offene, noch nicht eingeplante Unternehmungen fürs Kind; place: all | drinnen | draussen.
export const ideas = (state, place = 'all') => state.tasks.filter((t) =>
  t.category === 'kind' && !t.date && !t.done && (place === 'all' || t.place === place));

export function addTaskNote(state, id, date, text) { findTask(state, id).notes.push({ date, text }); }

// Kurztext für die Kalender-Pille: erstes Wort, max. 11 Zeichen.
const shortOf = (title) => title.split(/[\s,:]+/)[0].slice(0, 11);

export function addEvent(state, { title, date, endDate = null, optional = false }) {
  const text = String(title || '').trim();
  if (!text || !date) return null;
  const e = { id: `e-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, title: text, short: shortOf(text), date, endDate: null, optional: !!optional, group: null };
  state.events.push(e);
  updateEvent(state, e.id, { endDate });
  return e;
}
export function updateEvent(state, id, patch) {
  const e = state.events.find((x) => x.id === id);
  if (!e) return;
  Object.assign(e, patch);
  if (patch.title !== undefined) { e.title = String(patch.title).trim(); e.short = shortOf(e.title); }
  if (!e.endDate || e.endDate <= e.date) e.endDate = null;
}
export function removeEvent(state, id) {
  state.events = state.events.filter((x) => x.id !== id);
}

export function confirmEvent(state, eventId) {
  const ev = state.events.find((e) => e.id === eventId);
  if (ev.group) state.events = state.events.filter((e) => e === ev || e.group !== ev.group);
  ev.optional = false;
  ev.confirmed = true;
  const task = state.tasks.find((t) => t.group && t.group === ev.group);
  if (task) task.date = ev.date;
}
export const isGroupDone = (state, group) => !!state.tasks.find((t) => t.group === group)?.done;
export const deadlineSoon = (task, today, days = 3) =>
  !!task.deadline && !task.done && diffDays(today, task.deadline) <= days;

export function itemsOnDate(state, date) {
  return {
    events: state.events.filter((e) => e.date <= date && date <= (e.endDate || e.date)),
    tasks: state.tasks.filter((t) => t.date === date),
  };
}
