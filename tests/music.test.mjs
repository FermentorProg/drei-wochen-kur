import { test } from 'node:test';
import assert from 'node:assert/strict';
import { patternAt, STEPS, CHORDS, LEAD } from '../js/music-pattern.js';

test('Loop: 8 Takte à 16 Schritte, Akkorde Am–F–C–G', () => {
  assert.equal(STEPS, 128);
  assert.deepEqual(CHORDS.map((c) => c.name), ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G']);
});
test('Melodie bleibt im Loop und überlappt nicht', () => {
  let end = 0;
  for (const [step, note, len] of LEAD) {
    assert.ok(step >= end, `Überlappung bei Schritt ${step}`);
    assert.ok(note >= 60 && note <= 90);
    end = step + len;
  }
  assert.ok(end <= STEPS);
});
test('Schlagzeug: Kick auf jeder Viertel, Snare auf 2 und 4, Hi-Hat auf Offbeats', () => {
  assert.deepEqual([0, 4, 8, 12].map((s) => patternAt(s).kick), [true, true, true, true]);
  assert.deepEqual([4, 12, 0].map((s) => patternAt(s).snare), [true, true, false]);
  assert.equal(patternAt(2).hat, true);
  assert.equal(patternAt(3).hat, false);
});
test('Bass auf Achteln mit Grundton, Arpeggio aus Akkordtönen', () => {
  assert.equal(patternAt(0).bass, 45);
  assert.equal(patternAt(1).bass, null);
  assert.equal(patternAt(16).bass, 41);
  assert.ok(CHORDS[0].notes.includes(patternAt(5).arp));
  assert.equal(patternAt(0).lead?.note, 76);
});
