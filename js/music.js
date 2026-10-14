// Hintergrundmusik: Synthwave-Loop, live mit Web Audio erzeugt (Lookahead-Scheduler).
import { audioContext } from './sound.js';
import { patternAt, getStyle } from './music-pattern.js';
const LOOKAHEAD = 0.15;
const VOLUME = 0.09;

let ac = null;
let bus = null;
let noiseBuf = null;
let timer = null;
let step = 0;
let styleId = 'cool';
const stepLen = () => 60 / getStyle(styleId).bpm / 4;
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

function tom(t, freq) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.15);
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + 0.2);
}

function playStep(s, t) {
  const st = getStyle(styleId);
  const STEP = stepLen();
  const p = patternAt(styleId, s);
  const ambient = styleId === 'ambient';
  if (p.kick) kick(t);
  if (p.snare) noise(t, 0.16, { freq: 1800, type: 'bandpass', vol: 0.5 });
  if (p.hat) noise(t, ambient ? 0.3 : 0.04, { freq: ambient ? 5000 : 7000, vol: ambient ? 0.05 : 0.18 });
  if (p.fill) tom(t, 220 - (s % 4) * 30);
  if (p.pad) for (const n of p.chord) voice(hz(n), t, STEP * 16, { type: 'triangle', vol: 0.08, attack: 0.8 });
  if (p.bass !== null) voice(hz(p.bass), t, STEP * (ambient ? 7 : 1.8), { type: st.sound.bass, vol: ambient ? 0.5 : 0.6, attack: ambient ? 0.1 : 0.005 });
  if (p.arp !== null) voice(hz(p.arp + (ambient ? 12 : 0)), t, STEP * (ambient ? 3 : 0.9), { type: ambient ? 'sine' : 'square', vol: st.sound.arpVol });
  if (p.lead) voice(hz(p.lead.note), t, STEP * p.lead.len * 0.95, { type: st.sound.lead, vol: st.sound.leadVol, attack: ambient ? 0.02 : 0.01, vibrato: ambient ? 2 : 4 });
}

function schedule() {
  while (nextTime < ac.currentTime + LOOKAHEAD) {
    playStep(step, nextTime);
    step = (step + 1) % getStyle(styleId).steps;
    nextTime += stepLen();
  }
}

export const isPlaying = () => timer !== null;

// Stil wechseln; läuft Musik, startet sie im neuen Stil neu.
export function setMusicStyle(id) {
  if (id === styleId) return;
  styleId = id;
  if (timer) { stopMusic(); setTimeout(startMusic, 350); }
}

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
