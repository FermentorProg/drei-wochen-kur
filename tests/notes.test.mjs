import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { collectNotes } from '../js/notes-model.js';
import * as M from '../js/model.js';

const seed = () => JSON.parse(readFileSync(new URL('../data/seed.json', import.meta.url)));

function sample() {
  const st = seed();
  M.setHabit(st, 'guitar', '2026-10-14', { done: true, piece: 'autumn-leaves', note: 'Akkorde Teil A' });
  M.setHabit(st, 'guitar', '2026-10-16', { done: true, piece: 'corcovado', note: 'Melodie' });
  M.setHabit(st, 'guitar', '2026-10-15', { done: true, note: '' });
  M.setHabit(st, 'sport', '2026-10-15', { done: true, types: ['ausdauer'], note: '5 km' });
  M.addTaskNote(st, 'elektriker', '2026-10-17', 'Termin angefragt');
  return st;
}

test('alle Notizen, neueste zuerst, leere ausgelassen', () => {
  const n = collectNotes(sample(), 'all');
  assert.deepEqual(n.map((x) => x.date), ['2026-10-17', '2026-10-16', '2026-10-15', '2026-10-14']);
  assert.equal(n[0].kind, 'task');
  assert.equal(n[0].title, 'Elektriker: kaputte Steckdose reparieren lassen');
});
test('Filter Gitarre und je Stück', () => {
  assert.equal(collectNotes(sample(), 'guitar').length, 2);
  const al = collectNotes(sample(), 'guitar:autumn-leaves');
  assert.equal(al.length, 1);
  assert.equal(al[0].text, 'Akkorde Teil A');
});
test('Filter Sport und Aufgaben', () => {
  assert.equal(collectNotes(sample(), 'sport')[0].text, '5 km');
  assert.equal(collectNotes(sample(), 'tasks').length, 1);
});
