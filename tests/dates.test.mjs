import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as d from '../js/dates.js';

test('addDays über Monatsgrenze', () => {
  assert.equal(d.addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(d.addDays('2026-11-01', -1), '2026-10-31');
});
test('weekday Mo=0', () => {
  assert.equal(d.weekday('2026-10-12'), 0);
  assert.equal(d.weekday('2026-10-18'), 6);
});
test('weeks liefert 4 Wochen Mo–So', () => {
  const w = d.weeks(d.CAL_START, d.CAL_END);
  assert.equal(w.length, 4);
  assert.equal(w[0][0], '2026-10-12');
  assert.equal(w[3][6], '2026-11-08');
});
test('dayOfKur', () => {
  assert.equal(d.dayOfKur('2026-10-14', d.KUR_START, d.KUR_END), 1);
  assert.equal(d.dayOfKur('2026-11-04', d.KUR_START, d.KUR_END), 22);
  assert.equal(d.dayOfKur('2026-10-13', d.KUR_START, d.KUR_END), null);
});
test('todayISO nutzt lokale Zeit', () => {
  assert.equal(d.todayISO(new Date(2026, 9, 14, 23, 59)), '2026-10-14');
  assert.equal(d.todayISO(new Date(2026, 9, 15, 0, 1)), '2026-10-15');
});
test('formatShort', () => {
  assert.equal(d.formatShort('2026-10-14'), 'Mi 14.10.');
});
