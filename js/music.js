// Hintergrundmusik: Synthwave-Loop, live mit Web Audio erzeugt (Lookahead-Scheduler).
import { audioContext } from './sound.js';
import { patternAt, BPM, STEPS } from './music-pattern.js';

const STEP = 60 / BPM / 4;
const LOOKAHEAD = 0.15;
const VOLUME = 0.09;

let ac = null;
let bus = null;
let noiseBuf = null;
let timer = null;
let step = 0;
let nextTime = 0;

const hz = (m) => 440 * 2 ** ((m - 69) / 12);

function voice(freq, t, dur, { type = 'square', vol = 0.3, attack = 0.005, vibrato = 0 } = {}) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (vibrato) {
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = 5.5;
    depth.gain.value = vibrato;
    lfo.connect(depth).connect(o.frequency);
    lfo.start(t + 0.08);
    lfo.stop(t + dur);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(vol * 0.6, t + dur * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(t, dur, { freq = 8000, type = 'highpass', vol = 0.2 } = {}) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(bus);
  src.start(t);
  src.stop(t + dur);
}

function kick(t) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + 0.2);
}

function playStep(s, t) {
  const p = patternAt(s);
  if (p.kick) kick(t);
  if (p.snare) noise(t, 0.16, { freq: 1800, type: 'bandpass', vol: 0.5 });
  if (p.hat) noise(t, 0.04, { freq: 7000, vol: 0.18 });
  if (p.bass !== null) voice(hz(p.bass), t, STEP * 1.8, { type: 'triangle', vol: 0.7 });
  voice(hz(p.arp), t, STEP * 0.9, { type: 'square', vol: 0.09 });
  if (p.lead) voice(hz(p.lead.note), t, STEP * p.lead.len * 0.95, { type: 'square', vol: 0.18, attack: 0.01, vibrato: 4 });
}

function schedule() {
  while (nextTime < ac.currentTime + LOOKAHEAD) {
    playStep(step, nextTime);
    step = (step + 1) % STEPS;
    nextTime += STEP;
  }
}

export const isPlaying = () => timer !== null;

export function startMusic() {
  if (timer) return;
  ac = audioContext();
  if (!ac) return;
  if (!bus) {
    bus = ac.createGain();
    bus.gain.value = VOLUME;
    bus.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  bus.gain.cancelScheduledValues(ac.currentTime);
  bus.gain.setValueAtTime(0.0001, ac.currentTime);
  bus.gain.exponentialRampToValueAtTime(VOLUME, ac.currentTime + 1.2);
  nextTime = ac.currentTime + 0.05;
  timer = setInterval(schedule, 25);
  schedule();
}

export function stopMusic() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  step = 0;
  // Bereits geplante Töne sanft ausblenden.
  bus.gain.cancelScheduledValues(ac.currentTime);
  bus.gain.setValueAtTime(bus.gain.value, ac.currentTime);
  bus.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.3);
}
