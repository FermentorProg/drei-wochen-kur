import { weeks, CAL_START, CAL_END } from './dates.js';
import { CATEGORIES, findTask } from './model.js';

export const JAZZ_PIECES = [
  ['corcovado', 'Corcovado'],
  ['autumn-leaves', 'Autumn Leaves'],
  ['all-the-things', 'All the Things You Are'],
];
export const JAZZ_STAGES = ['Akkorde', 'Melodie', 'Solo', 'Sitzt'];
export const ARISE_SONGS = [
  ['arise', 'Arise'],
  ['dead-embryonic-cells', 'Dead Embryonic Cells'],
  ['desperate-cry', 'Desperate Cry'],
  ['murder', 'Murder'],
  ['subtraction', 'Subtraction'],
  ['altered-state', 'Altered State'],
  ['under-siege', 'Under Siege (Regnum Irae)'],
  ['meaningless-movements', 'Meaningless Movements'],
  ['infected-voice', 'Infected Voice'],
];

const toList = (pairs) => pairs.map(([id, label]) => ({ id, label }));
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// Ältere Stände/Backups haben noch keine Listen: aus den Standardwerten ergänzen.
export function ensureGoalLists(state) {
  state.goals.jazzPieces ||= toList(JAZZ_PIECES);
  state.goals.ariseSongs ||= toList(ARISE_SONGS);
}

// Stücke für die Auswahl in der Heute-Liste und die Notiz-Filter: Jazz-Stücke + Arise.
export function guitarPieces(state) {
  ensureGoalLists(state);
  const out = {};
  for (const p of state.goals.jazzPieces) out[p.id] = p.label;
  out.arise = 'Sepultura – Arise';
  return out;
}

function addItem(list, label, prefix) {
  const text = String(label || '').trim();
  if (!text) return null;
  const id = newId(prefix);
  list.push({ id, label: text, custom: true });
  return id;
}

export function addJazzPiece(state, label) {
  ensureGoalLists(state);
  return addItem(state.goals.jazzPieces, label, 'jazz');
}
export function removeJazzPiece(state, id) {
  const list = state.goals.jazzPieces;
  if (!list.find((p) => p.id === id)?.custom) return;
  state.goals.jazzPieces = list.filter((p) => p.id !== id);
  delete state.goals.jazz[id];
}
export function addAriseSong(state, label) {
  ensureGoalLists(state);
  return addItem(state.goals.ariseSongs, label, 'song');
}
export function removeAriseSong(state, id) {
  const list = state.goals.ariseSongs;
  if (!list.find((p) => p.id === id)?.custom) return;
  state.goals.ariseSongs = list.filter((p) => p.id !== id);
  delete state.goals.arise[id];
}

// Stufe 1–4 setzen; Tippen auf die aktuelle Stufe nimmt sie zurück.
export function setJazzStage(state, piece, stage) {
  const cur = state.goals.jazz[piece] || 0;
  state.goals.jazz[piece] = cur === stage ? stage - 1 : stage;
}
export function jazzProgress(state) {
  ensureGoalLists(state);
  const total = state.goals.jazzPieces.length * JAZZ_STAGES.length;
  const done = state.goals.jazzPieces.reduce((n, p) => n + (state.goals.jazz[p.id] || 0), 0);
  return { done, total };
}

export function toggleArise(state, song) {
  state.goals.arise[song] = !state.goals.arise[song];
}
export function ariseProgress(state) {
  ensureGoalLists(state);
  const songs = state.goals.ariseSongs;
  return { done: songs.filter((p) => state.goals.arise[p.id]).length, total: songs.length };
}

export const SLOWCOOKER_GOAL = 3;
export const cookedCount = (state) => state.goals.slowcooker.filter((s) => s.date).length;

// Ein Gericht zählt als gekocht, sobald es ein Datum hat. Ab drei gekochten → Aufgabe "Slow Cooker" erledigt.
function syncSlowcookerTask(state, today) {
  const task = findTask(state, 'slowcooker');
  if (!task) return;
  const reached = cookedCount(state) >= SLOWCOOKER_GOAL;
  if (task.done !== reached) task.doneDate = reached ? today : null;
  task.done = reached;
}
export function updateSlot(state, index, patch, today) {
  Object.assign(state.goals.slowcooker[index], patch);
  syncSlowcookerTask(state, today);
}
export function addSlot(state) {
  state.goals.slowcooker.push({ idea: '', name: '', date: null, rating: null, note: '' });
}
// Die ersten drei Felder bleiben immer bestehen.
export function removeSlot(state, index, today = null) {
  if (index < SLOWCOOKER_GOAL) return;
  state.goals.slowcooker.splice(index, 1);
  syncSlowcookerTask(state, today);
}

export function sportStats(state) {
  const sport = state.habits.sport || {};
  const days = Object.keys(sport).filter((d) => sport[d].done);
  return {
    total: days.length,
    kraft: days.filter((d) => sport[d].types?.includes('kraft')).length,
    ausdauer: days.filter((d) => sport[d].types?.includes('ausdauer')).length,
    weeks: weeks(CAL_START, CAL_END).map((w) => ({ start: w[0], count: w.filter((d) => sport[d]?.done).length })),
  };
}

const isDone = (t) => (t.repeatable ? (t.count || 0) > 0 : t.done);
export function taskStats(state) {
  const byCat = {};
  for (const k of Object.keys(CATEGORIES)) byCat[k] = { done: 0, total: 0 };
  for (const t of state.tasks) {
    const c = (byCat[t.category] ||= { done: 0, total: 0 });
    c.total++;
    if (isDone(t)) c.done++;
  }
  return { done: state.tasks.filter(isDone).length, total: state.tasks.length, byCat };
}
