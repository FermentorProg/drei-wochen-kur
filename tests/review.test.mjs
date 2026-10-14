import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { weekReview, reviewWeeks } from '../js/review-model.js';
import * as M from '../js/model.js';
import * as G from '../js/goals-model.js';

const seed = () => JSON.parse(readFileSync(new URL('../data/seed.json', import.meta.url)));

test('Wochenrückblick zählt nur Tage der Woche Mo–So', () => {
  const st = seed();
  for (const d of ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-26']) M.setHabit(st, 'guitar', d, { done: true });
  M.setHabit(st, 'guitar', '2026-10-21', { done: true, note: 'Blue Bossa Melodie' });
  M.setHabit(st, 'yazio', '2026-10-19', { done: true });
  M.setHabit(st, 'sport', '2026-10-20', { done: true, types: ['kraft'] });
  M.setHabit(st, 'sport', '2026-10-22', { done: true, types: ['ausdauer'], note: '5 km' });
  M.toggleTask(st, 'lochfraese', '2026-10-21');
  M.toggleTask(st, 'wasserleitung', '2026-10-27');
  G.updateSlot(st, 0, { name: 'Tajine', date: '2026-10-24' }, '2026-10-24');
  const r = weekReview(st, '2026-10-19');
  assert.equal(r.start, '2026-10-19');
  assert.equal(r.end, '2026-10-25');
  assert.equal(r.guitar, 3);
  assert.equal(r.yazio, 1);
  assert.deepEqual(r.sport, { count: 2, kraft: 1, ausdauer: 1 });
  assert.deepEqual(r.tasksDone, ['Lochfräse besorgen', 'Slow Cooker: 3 Gerichte ausprobieren'].slice(0, 1));
  assert.deepEqual(r.cooked, ['Tajine']);
  assert.deepEqual(r.notes.map((n) => n.text), ['5 km', 'Blue Bossa Melodie']);
  assert.equal(r.bestGuitarStreak, 4);
});

test('reviewWeeks liefert die 4 Kalenderwochen und markiert die aktuelle', () => {
  const w = reviewWeeks('2026-10-21');
  assert.deepEqual(w.map((x) => x.start), ['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02']);
  assert.equal(w.find((x) => x.current).start, '2026-10-19');
});
