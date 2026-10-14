import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createStore, validateState, KEY } from '../js/store.js';

const seed = JSON.parse(readFileSync(new URL('../data/seed.json', import.meta.url)));
const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }; };

test('Seed ist gültig', () => assert.equal(validateState(seed).ok, true));
test('erster Start lädt Seed und speichert', () => {
  const s = mem(); const st = createStore(s, seed);
  assert.equal(st.state.tasks.length, seed.tasks.length);
  assert.ok(s.m.has(KEY));
});
test('update speichert und benachrichtigt', () => {
  const s = mem(); const st = createStore(s, seed); let calls = 0;
  st.subscribe(() => calls++);
  st.update((x) => { x.tasks[0].title = 'Neu'; });
  assert.equal(JSON.parse(s.m.get(KEY)).tasks[0].title, 'Neu');
  assert.equal(calls, 1);
});
test('ungültiger Import ändert nichts', () => {
  const s = mem(); const st = createStore(s, seed);
  const before = s.m.get(KEY);
  assert.equal(st.importJSON('{kaputt').ok, false);
  assert.equal(st.importJSON('{"foo":1}').ok, false);
  assert.equal(s.m.get(KEY), before);
});
test('Export→Import Rundreise', () => {
  const st = createStore(mem(), seed);
  st.update((x) => { x.habits.guitar['2026-10-14'] = { done: true }; });
  const st2 = createStore(mem(), seed);
  assert.equal(st2.importJSON(st.exportJSON()).ok, true);
  assert.equal(st2.state.habits.guitar['2026-10-14'].done, true);
});
test('defekter Speicher → broken gesetzt, Seed geladen', () => {
  const st = createStore(mem({ [KEY]: '{oops' }), seed);
  assert.equal(st.broken, '{oops');
  assert.equal(st.state.tasks.length, seed.tasks.length);
});

test('silent update speichert ohne Neu-Rendern', () => {
  const s = mem(); const st = createStore(s, seed); let calls = 0;
  st.subscribe(() => calls++);
  st.update((x) => { x.habits.guitar['2026-10-14'] = { done: false, note: 'tipp' }; }, { silent: true });
  assert.equal(calls, 0);
  assert.equal(JSON.parse(s.m.get(KEY)).habits.guitar['2026-10-14'].note, 'tipp');
});

test('defekte Rohdaten werden separat gesichert und überleben die erste Änderung', () => {
  const s = mem({ [KEY]: '{oops' });
  const st = createStore(s, seed);
  st.update((x) => { x.tasks[0].title = 'neu'; });
  assert.equal(s.m.get(`${KEY}-broken`), '{oops');
  assert.equal(createStore(s, seed).broken, '{oops');
});
