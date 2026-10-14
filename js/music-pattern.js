// Eigene Synthwave-Kompositionen in drei Stilen, 16tel-Raster. Reine Daten, kein Audio.
// lead: [Schritt, MIDI-Note, Länge in 16teln]

const chord = (name, root, notes) => ({ name, root, notes });

export const STYLES = {
  cool: {
    label: 'Cool', bpm: 112,
    chords: [
      chord('Am', 45, [69, 72, 76, 81]), chord('F', 41, [65, 69, 72, 77]), chord('C', 48, [67, 72, 76, 79]), chord('G', 43, [67, 71, 74, 79]),
      chord('Am', 45, [69, 72, 76, 81]), chord('F', 41, [65, 69, 72, 77]), chord('C', 48, [67, 72, 76, 79]), chord('G', 43, [67, 71, 74, 79]),
    ],
    lead: [
      [0, 76, 4], [4, 81, 2], [6, 79, 2], [8, 76, 4], [12, 74, 2], [14, 76, 2],
      [16, 72, 4], [20, 69, 4], [24, 72, 2], [26, 74, 2], [28, 76, 4],
      [32, 79, 4], [36, 76, 2], [38, 79, 2], [40, 84, 6], [46, 83, 2],
      [48, 83, 4], [52, 79, 4], [56, 74, 4],
      [64, 81, 2], [66, 84, 2], [68, 83, 2], [70, 81, 2], [72, 76, 4], [76, 81, 4],
      [80, 77, 4], [84, 81, 2], [86, 79, 2], [88, 77, 2], [90, 76, 2], [92, 72, 4],
      [96, 76, 2], [98, 79, 2], [100, 84, 4], [104, 86, 2], [106, 84, 2], [108, 83, 4],
      [112, 86, 6], [118, 83, 2], [120, 79, 8],
    ],
    rhythm: (beat) => ({
      kick: beat % 4 === 0, snare: beat === 4 || beat === 12, hat: beat % 4 === 2,
      bass: beat % 2 === 0 ? (beat % 4 === 2 ? 12 : 0) : null, arp: beat % 4, pad: false, fill: false,
    }),
    sound: { lead: 'square', leadVol: 0.18, bass: 'triangle', arpVol: 0.09 },
  },

  drama: {
    label: 'Dramatisch', bpm: 128,
    chords: [
      chord('Dm', 38, [62, 65, 69, 74]), chord('Bb', 46, [58, 62, 65, 70]), chord('Gm', 43, [55, 58, 62, 67]), chord('A', 45, [57, 61, 64, 69]),
      chord('Dm', 38, [62, 65, 69, 74]), chord('Bb', 46, [58, 62, 65, 70]), chord('C', 48, [60, 64, 67, 72]), chord('A', 45, [57, 61, 64, 69]),
    ],
    lead: [
      [0, 74, 4], [4, 77, 4], [8, 81, 6], [14, 79, 2],
      [16, 77, 4], [20, 74, 4], [24, 70, 4], [28, 74, 4],
      [32, 79, 6], [38, 77, 2], [40, 74, 4], [44, 70, 4],
      [48, 73, 8], [56, 76, 4], [60, 79, 4],
      [64, 81, 4], [68, 86, 4], [72, 84, 2], [74, 81, 2], [76, 77, 4],
      [80, 82, 6], [86, 81, 2], [88, 77, 4], [92, 74, 4],
      [96, 76, 4], [100, 79, 4], [104, 84, 4], [108, 79, 4],
      [112, 81, 8], [120, 85, 8],
    ],
    rhythm: (beat, bar) => ({
      kick: beat % 4 === 0 || beat === 10, snare: beat === 4 || beat === 12, hat: beat % 2 === 0,
      bass: [0, 0, 12, 0][beat % 4], arp: beat % 2 === 0 ? (beat / 2) % 4 : null, pad: false,
      fill: bar % 4 === 3 && beat >= 12,
    }),
    sound: { lead: 'sawtooth', leadVol: 0.12, bass: 'square', arpVol: 0.07 },
  },

  ambient: {
    label: 'Ambient', bpm: 76,
    chords: [
      chord('Cmaj7', 48, [60, 64, 67, 71]), chord('Am7', 45, [57, 60, 64, 67]), chord('Fmaj7', 41, [57, 60, 64, 65]), chord('G6', 43, [55, 59, 62, 64]),
      chord('Cmaj7', 48, [60, 64, 67, 71]), chord('Em7', 40, [55, 59, 62, 64]), chord('Fmaj7', 41, [57, 60, 64, 65]), chord('G6', 43, [55, 59, 62, 64]),
    ],
    lead: [
      [0, 76, 6], [8, 79, 6], [16, 72, 8], [28, 74, 4], [32, 77, 8], [44, 76, 4],
      [48, 74, 12], [64, 79, 6], [72, 83, 6], [80, 81, 8], [92, 79, 4], [96, 76, 8],
      [108, 74, 4], [112, 72, 16],
    ],
    rhythm: (beat) => ({
      kick: false, snare: false, hat: beat === 8,
      bass: beat === 0 || beat === 8 ? 0 : null, arp: beat % 4 === 0 ? (beat / 4) % 4 : null,
      pad: beat === 0, fill: false,
    }),
    sound: { lead: 'sine', leadVol: 0.22, bass: 'sine', arpVol: 0.06 },
  },
};
export const STYLE_IDS = Object.keys(STYLES);
for (const s of Object.values(STYLES)) {
  s.steps = s.chords.length * 16;
  s.leadAt = new Map(s.lead.map(([step, note, len]) => [step, { note, len }]));
}

export const getStyle = (id) => STYLES[id] || STYLES.cool;

// Was auf einem 16tel-Schritt erklingt.
export function patternAt(styleId, step) {
  const st = getStyle(styleId);
  const s = ((step % st.steps) + st.steps) % st.steps;
  const bar = Math.floor(s / 16);
  const c = st.chords[bar];
  const r = st.rhythm(s % 16, bar);
  return {
    kick: r.kick, snare: r.snare, hat: r.hat, fill: r.fill, pad: r.pad,
    bass: r.bass === null ? null : c.root + r.bass,
    arp: r.arp === null ? null : c.notes[r.arp],
    chord: c.notes,
    lead: st.leadAt.get(s) || null,
  };
}
