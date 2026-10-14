import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as G from '../js/goals-model.js';
import * as M from '../js/model.js';

const seed = () => JSON.parse(readFileSync(new URL('../data/seed.json', import.meta.url)));

test('Jazz-Stufe setzen, erneutes Tippen geht eine Stufe zurück', () => {
  const st = seed();
  G.setJazzStage(st, 'corcovado', 2);
  assert.equal(st.goals.jazz.corcovado, 2);
  G.setJazzStage(st, 'corcovado', 2);
  assert.equal(st.goals.jazz.corcovado, 1);
  assert.deepEqual(G.jazzProgress(st), { done: 1, total: 12 });
});

test('Arise-Checkliste', () => {
  const st = seed();
  G.toggleArise(st, 'murder');
  G.toggleArise(st, 'arise');
  assert.deepEqual(G.ariseProgress(st), { done: 2, total: 9 });
  assert.equal(G.ARISE_SONGS.length, 9);
});

test('Slow Cooker: Aufgabe erledigt, sobald drei Gerichte gekocht sind', () => {
  const st = seed();
  G.updateSlot(st, 0, { name: 'Tajine', date: '2026-10-18', rating: 4 }, '2026-10-18');
  G.updateSlot(st, 1, { name: 'Dal', date: '2026-10-25' }, '2026-10-25');
  assert.equal(M.findTask(st, 'slowcooker').done, false);
  G.updateSlot(st, 2, { name: 'Chili', date: '2026-11-01' }, '2026-11-01');
  assert.equal(M.findTask(st, 'slowcooker').done, true);
  G.updateSlot(st, 2, { date: null }, '2026-11-02');
  assert.equal(M.findTask(st, 'slowcooker').done, false);
});

test('Sport-Statistik nach Art und Woche', () => {
  const st = seed();
  M.setHabit(st, 'sport', '2026-10-13', { done: true, types: ['kraft'] });
  M.setHabit(st, 'sport', '2026-10-20', { done: true, types: ['kraft', 'ausdauer'] });
  M.setHabit(st, 'sport', '2026-10-21', { done: true, types: [] });
  M.setHabit(st, 'sport', '2026-10-22', { done: false, types: ['ausdauer'] });
  const s = G.sportStats(st);
  assert.equal(s.total, 3);
  assert.equal(s.kraft, 2);
  assert.equal(s.ausdauer, 1);
  assert.deepEqual(s.weeks.map((w) => w.count), [1, 2, 0, 0]);
});

test('Aufgaben-Fortschritt pro Kategorie, wiederholbar zählt ab 1×', () => {
  const st = seed();
  M.toggleTask(st, 'lochfraese', '2026-10-15');
  M.toggleTask(st, 'spielplatz', '2026-10-15');
  const s = G.taskStats(st);
  assert.equal(s.total, st.tasks.length);
  assert.equal(s.done, 2);
  assert.deepEqual(s.byCat.garten, { done: 1, total: 5 });
  assert.equal(s.byCat.kind.done, 1);
});

test('Nachgetragene Aufgabe: Erledigt-Datum ist der vergangene Tag', () => {
  const st = seed();
  M.setTaskDate(st, 'laub-harken', '2026-10-15');
  M.toggleTask(st, 'laub-harken', '2026-10-17');
  assert.equal(M.findTask(st, 'laub-harken').doneDate, '2026-10-15');
  M.toggleTask(st, 'wasserleitung', '2026-10-17');
  assert.equal(M.findTask(st, 'wasserleitung').doneDate, '2026-10-17');
});

test('Listen werden aus Standardwerten ergänzt (alte Backups)', () => {
  const st = seed();
  G.ensureGoalLists(st);
  assert.equal(st.goals.jazzPieces.length, 3);
  assert.equal(st.goals.ariseSongs.length, 9);
  st.goals.jazzPieces.push({ id: 'x', label: 'X', custom: true });
  G.ensureGoalLists(st);
  assert.equal(st.goals.jazzPieces.length, 4);
});

test('eigenes Jazz-Stück hinzufügen und löschen', () => {
  const st = seed();
  G.ensureGoalLists(st);
  const id = G.addJazzPiece(st, '  Blue Bossa ');
  assert.equal(st.goals.jazzPieces.at(-1).label, 'Blue Bossa');
  G.setJazzStage(st, id, 1);
  assert.deepEqual(G.jazzProgress(st), { done: 1, total: 16 });
  assert.equal(G.guitarPieces(st)[id], 'Blue Bossa');
  assert.equal(G.addJazzPiece(st, '   '), null);
  G.removeJazzPiece(st, id);
  assert.equal(st.goals.jazzPieces.length, 3);
  assert.equal(st.goals.jazz[id], undefined);
  G.removeJazzPiece(st, 'corcovado');
  assert.equal(st.goals.jazzPieces.length, 3, 'Standardstücke bleiben');
});

test('eigener Arise-Song zählt im Fortschritt', () => {
  const st = seed();
  G.ensureGoalLists(st);
  const id = G.addAriseSong(st, 'Refuse/Resist');
  G.toggleArise(st, id);
  assert.deepEqual(G.ariseProgress(st), { done: 1, total: 10 });
  G.removeAriseSong(st, id);
  assert.deepEqual(G.ariseProgress(st), { done: 0, total: 9 });
});

test('Slow Cooker: Bonus-Gerichte, Aufgabe ab 3 gekochten', () => {
  const st = seed();
  G.addSlot(st);
  assert.equal(st.goals.slowcooker.length, 4);
  for (const i of [0, 1, 3]) G.updateSlot(st, i, { date: '2026-10-20' }, '2026-10-20');
  assert.equal(M.findTask(st, 'slowcooker').done, true);
  assert.equal(G.cookedCount(st), 3);
  G.removeSlot(st, 3);
  assert.equal(M.findTask(st, 'slowcooker').done, false);
  G.removeSlot(st, 0);
  assert.equal(st.goals.slowcooker.length, 3, 'die ersten drei bleiben');
});
