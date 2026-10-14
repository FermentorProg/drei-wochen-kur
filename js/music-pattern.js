// Eigene 8-Takt-Synthwave-Komposition in a-Moll (Am–F–C–G), 16tel-Raster. Reine Daten, kein Audio.
export const BPM = 112;
export const STEPS = 128;

export const CHORDS = [
  { name: 'Am', root: 45, notes: [69, 72, 76, 81] },
  { name: 'F', root: 41, notes: [65, 69, 72, 77] },
  { name: 'C', root: 48, notes: [67, 72, 76, 79] },
  { name: 'G', root: 43, notes: [67, 71, 74, 79] },
  { name: 'Am', root: 45, notes: [69, 72, 76, 81] },
  { name: 'F', root: 41, notes: [65, 69, 72, 77] },
  { name: 'C', root: 48, notes: [67, 72, 76, 79] },
  { name: 'G', root: 43, notes: [67, 71, 74, 79] },
];

// [Schritt, MIDI-Note, Länge in 16teln]
export const LEAD = [
  [0, 76, 4], [4, 81, 2], [6, 79, 2], [8, 76, 4], [12, 74, 2], [14, 76, 2],
  [16, 72, 4], [20, 69, 4], [24, 72, 2], [26, 74, 2], [28, 76, 4],
  [32, 79, 4], [36, 76, 2], [38, 79, 2], [40, 84, 6], [46, 83, 2],
  [48, 83, 4], [52, 79, 4], [56, 74, 4],
  [64, 81, 2], [66, 84, 2], [68, 83, 2], [70, 81, 2], [72, 76, 4], [76, 81, 4],
  [80, 77, 4], [84, 81, 2], [86, 79, 2], [88, 77, 2], [90, 76, 2], [92, 72, 4],
  [96, 76, 2], [98, 79, 2], [100, 84, 4], [104, 86, 2], [106, 84, 2], [108, 83, 4],
  [112, 86, 6], [118, 83, 2], [120, 79, 8],
];
const LEAD_AT = new Map(LEAD.map(([s, note, len]) => [s, { note, len }]));

// Was auf einem 16tel-Schritt erklingt.
export function patternAt(step) {
  const s = ((step % STEPS) + STEPS) % STEPS;
  const chord = CHORDS[Math.floor(s / 16)];
  const beat = s % 16;
  return {
    kick: beat % 4 === 0,
    snare: beat === 4 || beat === 12,
    hat: beat % 4 === 2,
    bass: beat % 2 === 0 ? chord.root + (beat % 4 === 2 ? 12 : 0) : null,
    arp: chord.notes[beat % 4],
    lead: LEAD_AT.get(s) || null,
  };
}
