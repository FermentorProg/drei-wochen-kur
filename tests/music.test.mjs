import { test } from 'node:test';
import assert from 'node:assert/strict';
import { patternAt, STYLES, STYLE_IDS } from '../js/music-pattern.js';

test('drei Stile: cool, drama, ambient', () => {
  assert.deepEqual(STYLE_IDS, ['cool', 'drama', 'ambient']);
  for (const id of STYLE_IDS) {
    const s = STYLES[id];
    assert.equal(s.steps, s.chords.length * 16, `${id}: Schritte passen zu Takten`);
    assert.ok(s.bpm >= 60 && s.bpm <= 140);
    assert.ok(s.label);
  }
  assert.ok(STYLES.ambient.bpm < STYLES.cool.bpm && STYLES.cool.bpm < STYLES.drama.bpm);
});

test('Melodien bleiben im Loop, überlappen nicht, sinnvoller Tonumfang', () => {
  for (const id of STYLE_IDS) {
    let end = 0;
    for (const [step, note, len] of STYLES[id].lead) {
      assert.ok(step >= end, `${id}: Überlappung bei Schritt ${step}`);
      assert.ok(note >= 55 && note <= 96, `${id}: Note ${note}`);
      end = step + len;
    }
    assert.ok(end <= STYLES[id].steps, id);
  }
});

test('cool: Kick auf Vierteln, Snare 2 und 4, Bass mit Grundton, Arpeggio aus Akkordtönen', () => {
  assert.deepEqual([0, 4, 8, 12].map((s) => patternAt('cool', s).kick), [true, true, true, true]);
  assert.deepEqual([4, 12, 0].map((s) => patternAt('cool', s).snare), [true, true, false]);
  assert.equal(patternAt('cool', 0).bass, 45);
  assert.equal(patternAt('cool', 1).bass, null);
  assert.ok(STYLES.cool.chords[0].notes.includes(patternAt('cool', 5).arp));
  assert.equal(patternAt('cool', 0).lead?.note, 76);
});

test('ambient: Flächen statt Schlagzeug, drama: treibender Bass', () => {
  assert.equal(patternAt('ambient', 0).pad, true);
  assert.equal(patternAt('ambient', 4).snare, false);
  assert.ok([0, 1, 2, 3].every((s) => patternAt('drama', s).bass !== null));
});

test('unbekannter Stil fällt auf cool zurück', () => {
  assert.deepEqual(patternAt('quatsch', 0), patternAt('cool', 0));
});
