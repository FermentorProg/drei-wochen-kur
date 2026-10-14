import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as s from '../js/streaks.js';
import { range } from '../js/dates.js';

test('doneDates filtert done', () => {
  assert.deepEqual(s.doneDates({ '2026-10-15': { done: true }, '2026-10-14': { done: false }, '2026-10-13': { done: true } }),
    ['2026-10-13', '2026-10-15']);
});
test('segments verschmilzt und reißt bei Lücke', () => {
  const segs = s.segments(['2026-10-14', '2026-10-15', '2026-10-16', '2026-10-18']);
  assert.deepEqual(segs, [
    { start: '2026-10-14', end: '2026-10-16', length: 3 },
    { start: '2026-10-18', end: '2026-10-18', length: 1 },
  ]);
});
test('segments über Monatswechsel', () => {
  assert.equal(s.segments(['2026-10-31', '2026-11-01'])[0].length, 2);
});
test('tier', () => {
  assert.deepEqual([1, 2, 3, 6, 7, 14].map(s.tier), [0, 0, 1, 1, 2, 2]);
});
test('Meilenstein 3 beim Verbinden zweier Streaks, nur einmal', () => {
  const before = ['2026-10-14', '2026-10-15', '2026-10-17', '2026-10-18'];
  const after = [...before, '2026-10-16'];
  assert.equal(s.milestoneReached(before, after, '2026-10-16'), 3);
});
test('kein Meilenstein, wenn Schwelle schon vorher erreicht', () => {
  const before = range('2026-10-14', '2026-10-17');
  assert.equal(s.milestoneReached(before, [...before, '2026-10-18'], '2026-10-18'), null);
});
test('Meilenstein 7 und 14', () => {
  const six = range('2026-10-14', '2026-10-19');
  assert.equal(s.milestoneReached(six, [...six, '2026-10-20'], '2026-10-20'), 7);
  const thirteen = range('2026-10-14', '2026-10-26');
  assert.equal(s.milestoneReached(thirteen, [...thirteen, '2026-10-27'], '2026-10-27'), 14);
});
test('Abhaken entfernen → kein Meilenstein', () => {
  assert.equal(s.milestoneReached(['2026-10-14'], [], '2026-10-14'), null);
});
test('sliceWeek über Wochenumbruch', () => {
  const segs = s.segments(range('2026-10-17', '2026-10-20')); // Sa–Di
  const w1 = range('2026-10-12', '2026-10-18');
  const w2 = range('2026-10-19', '2026-10-25');
  assert.deepEqual(s.sliceWeek(segs, w1), [{ startCol: 5, endCol: 6, length: 4, tier: 1, continuesLeft: false, continuesRight: true, isEnd: false }]);
  assert.deepEqual(s.sliceWeek(segs, w2), [{ startCol: 0, endCol: 1, length: 4, tier: 1, continuesLeft: true, continuesRight: false, isEnd: true }]);
});
