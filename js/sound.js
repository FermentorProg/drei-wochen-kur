// Chiptune-Sounds, live mit der Web Audio API erzeugt (Rechteck/Dreieck + Rauschen). Keine Audiodateien.
let ac = null;
let master = null;
let muted = false;

export function unlock() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0.16;
    master.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
}

export const setMuted = (m) => { muted = !!m; };

// Gemeinsamer AudioContext für die Hintergrundmusik.
export function audioContext() {
  unlock();
  return ac;
}

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function tone(f, t0, dur, { type = 'square', vol = 0.6, slideTo = null } = {}) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(t0, dur, { from = 3000, to = 300, vol = 0.5 } = {}) {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(from, t0);
  bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(master);
  src.start(t0);
}

// notes: [midi|null, Dauer in Schritten]
function melody(t0, step, notes, opts) {
  let t = t0;
  for (const [n, len = 1] of notes) {
    if (n !== null) tone(hz(n), t, step * len * 0.95, opts);
    t += step * len;
  }
  return t;
}

const SOUNDS = {
  blip: (t) => tone(1320, t, 0.07, { vol: 0.45, slideTo: 1760 }),
  blop: (t) => tone(392, t, 0.1, { vol: 0.45, slideTo: 220 }),
  swoosh: (t) => noise(t, 0.35),
  click: (t) => tone(2400, t, 0.015, { vol: 0.12 }),
  arp3: (t) => melody(t, 0.07, [[72], [76], [79], [84, 2]], { vol: 0.5 }),
  jingle7: (t) => {
    melody(t, 0.11, [[72], [76], [79], [84], [null], [79], [84, 2], [88, 3], [91, 6]], { vol: 0.45 });
    melody(t, 0.22, [[48, 2], [55, 2], [60, 4]], { type: 'triangle', vol: 0.6 });
  },
  jingle14: (t) => {
    melody(t, 0.085, [[72], [76], [79], [84], [79], [84], [88], [91], [88], [91], [96, 2], [null], [91], [96, 7]], { vol: 0.42 });
    melody(t, 0.17, [[48, 2], [52, 2], [55, 2], [60, 5]], { type: 'triangle', vol: 0.6 });
    noise(t + 1.6, 0.3, { from: 6000, to: 1500, vol: 0.25 });
  },
  levelup: (t) => {
    melody(t, 0.09, [[67], [72], [76], [79], [null], [76], [79, 2], [84, 6]], { vol: 0.45 });
    melody(t, 0.09, [[null, 4], [null], [64], [67, 2], [72, 6]], { type: 'triangle', vol: 0.5 });
  },
  chord: (t) => {
    for (const n of [72, 76, 79]) tone(hz(n), t, 0.45, { type: 'triangle', vol: 0.4 });
    tone(hz(84), t + 0.12, 0.4, { vol: 0.25 });
  },
};

export const SOUND_LIST = [
  ['blip', 'Abhaken'],
  ['blop', 'Haken entfernen'],
  ['swoosh', 'Aufgabe verschieben'],
  ['arp3', 'Streak 3 Tage'],
  ['jingle7', 'Streak 7 Tage'],
  ['jingle14', 'Streak 14 Tage'],
  ['levelup', 'Sport-Wochenziel'],
  ['chord', 'Alles erledigt'],
  ['click', 'Tab wechseln'],
];

export function play(name, { force = false } = {}) {
  if (muted && !force) return;
  unlock();
  if (!ac || !SOUNDS[name]) return;
  SOUNDS[name](ac.currentTime + 0.01);
}
