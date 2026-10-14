import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as X from '../js/extras-model.js';
import * as M from '../js/model.js';

const seed = () => JSON.parse(readFileSync(new URL('../data/seed.json', import.meta.url)));

test('Backup fällig: nie gesichert ab Tag 3, sonst nach 5 Tagen, Später für heute', () => {
  const st = seed();
  assert.equal(X.backupDue(st, '2026-10-15'), false);
  assert.equal(X.backupDue(st, '2026-10-16'), true);
  X.markBackup(st, '2026-10-16');
  assert.equal(X.backupDue(st, '2026-10-20'), false);
  assert.equal(X.backupDue(st, '2026-10-21'), true);
  X.snoozeBackup(st, '2026-10-21');
  assert.equal(X.backupDue(st, '2026-10-21'), false);
  assert.equal(X.backupDue(st, '2026-10-22'), true);
  assert.equal(X.daysSinceBackup(st, '2026-10-22'), 6);
});

test('Timer: Fortschritt aus Startzeit, Minuten gutschreiben', () => {
  const st = seed();
  const t0 = Date.UTC(2026, 9, 20, 17, 0, 0);
  X.startTimer(st, '2026-10-20', t0, 30);
  let p = X.timerProgress(st.timer, t0 + 10 * 60000);
  assert.deepEqual([p.elapsedMin, p.remainingSec, p.done], [10, 20 * 60, false]);
  p = X.timerProgress(st.timer, t0 + 31 * 60000);
  assert.equal(p.done, true);
  const min = X.stopTimer(st, t0 + 31 * 60000);
  assert.equal(min, 30, 'gedeckelt auf Timerdauer');
  assert.equal(st.timer, null);
  assert.equal(st.habits.guitar['2026-10-20'].minutes, 30);
  X.startTimer(st, '2026-10-20', t0, 30);
  X.stopTimer(st, t0 + 12.4 * 60000);
  assert.equal(st.habits.guitar['2026-10-20'].minutes, 42);
  assert.equal(X.guitarMinutes(st, '2026-10-19', '2026-10-25'), 42);
});

test('Countdown zum nächsten festen Termin', () => {
  const st = seed();
  assert.deepEqual(X.nextCountdown(st, '2026-10-14'), { label: 'Besuch Kur', days: 8 });
  assert.deepEqual(X.nextCountdown(st, '2026-10-21'), { label: 'Besuch Kur', days: 1 });
  assert.deepEqual(X.nextCountdown(st, '2026-10-22'), { label: 'Halloween', days: 9 });
  assert.equal(X.nextCountdown(st, '2026-11-04'), null);
  M.addEvent(st, { title: 'Elternabend', date: '2026-10-28', optional: true });
  assert.equal(X.nextCountdown(st, '2026-10-25').label, 'Halloween', 'optionale Termine zählen nicht');
});
