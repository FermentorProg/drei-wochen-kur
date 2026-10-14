import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as m from '../js/model.js';

const seed = () => JSON.parse(readFileSync(new URL('../data/seed.json', import.meta.url)));

test('toggleHabit schaltet und behält Notiz', () => {
  const st = seed();
  m.setHabit(st, 'guitar', '2026-10-14', { note: 'Akkorde' });
  assert.equal(m.toggleHabit(st, 'guitar', '2026-10-14'), true);
  assert.equal(st.habits.guitar['2026-10-14'].note, 'Akkorde');
  assert.equal(m.toggleHabit(st, 'guitar', '2026-10-14'), false);
});
test('Sport-Wochenzähler zählt Mo–So', () => {
  const st = seed();
  for (const d of ['2026-10-18', '2026-10-19', '2026-10-21']) m.setHabit(st, 'sport', d, { done: true });
  assert.equal(m.sportCountInWeek(st, '2026-10-20'), 2);
});
test('openHabits: Sport entfällt bei erreichtem Wochenziel', () => {
  const st = seed();
  assert.deepEqual(m.openHabits(st, '2026-10-22'), ['guitar', 'yazio', 'sport']);
  for (const d of ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22']) m.setHabit(st, 'sport', d, { done: true });
  m.setHabit(st, 'guitar', '2026-10-23', { done: true });
  assert.deepEqual(m.openHabits(st, '2026-10-23'), ['yazio']);
});
test('confirmEvent entfernt nur Kandidaten derselben Gruppe', () => {
  const st = seed();
  m.confirmEvent(st, 'amt-2');
  const groups = st.events.map((e) => e.id);
  assert.ok(groups.includes('amt-2') && !groups.includes('amt-1') && !groups.includes('amt-3'));
  assert.ok(groups.includes('werkstatt-1') && groups.includes('werkstatt-2'));
  assert.equal(m.findTask(st, 'amt').date, '2026-10-27');
});
test('isGroupDone folgt verknüpfter Aufgabe', () => {
  const st = seed();
  assert.equal(m.isGroupDone(st, 'werkstatt'), false);
  m.toggleTask(st, 'werkstatt', '2026-10-16');
  assert.equal(m.isGroupDone(st, 'werkstatt'), true);
});
test('wiederholbare Aufgabe zählt hoch', () => {
  const st = seed();
  m.toggleTask(st, 'spielplatz', '2026-10-14');
  m.toggleTask(st, 'spielplatz', '2026-10-15');
  assert.equal(m.findTask(st, 'spielplatz').count, 2);
  m.adjustCount(st, 'spielplatz', -1);
  assert.equal(m.findTask(st, 'spielplatz').count, 1);
});
test('deadlineSoon', () => {
  const t = { deadline: '2026-10-25', done: false };
  assert.equal(m.deadlineSoon(t, '2026-10-21'), false);
  assert.equal(m.deadlineSoon(t, '2026-10-22'), true);
});
test('itemsOnDate inkl. mehrtägiger Termine', () => {
  const st = seed();
  assert.ok(m.itemsOnDate(st, '2026-10-23').events.some((e) => e.id === 'besuch'));
  assert.ok(m.itemsOnDate(st, '2026-10-31').tasks.some((t) => t.id === 'halloween'));
});
test('addTask landet im Parkplatz ohne Datum', () => {
  const st = seed();
  const t = m.addTask(st, { title: 'Test', category: 'kind' }, '2026-10-14');
  assert.equal(t.date, null);
  assert.ok(st.tasks.includes(t));
});
test('Kategorie-Namen lassen sich über die Daten überschreiben', () => {
  const st = seed();
  assert.equal(m.categoryLabel(st, 'kind'), 'Mit Kind');
  st.settings.labels = { kind: 'Eigener Name' };
  assert.equal(m.categoryLabel(st, 'kind'), 'Eigener Name');
  assert.equal(m.categoryLabel(st, 'garten'), 'Garten / Gartenhaus');
});
