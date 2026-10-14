import { toast } from './ctx.js';
import { play } from './sound.js';
import { HABIT_LABELS } from './model.js';

const STREAK_SOUND = { 3: 'arp3', 7: 'jingle7', 14: 'jingle14' };
const DURATION = { arp3: 450, jingle7: 2000, jingle14: 2000, levelup: 1500, chord: 600 };
const COLORS = ['#FF2E88', '#22E6FF', '#FFD23F', '#B14CFF', '#FF9F43'];

let busyUntil = 0;

// Belohnungen nacheinander abspielen, damit sich Jingles nicht überlagern.
export function celebrate(kind, value, habit) {
  const [text, sound, big] =
    kind === 'streak' ? [`🔥 ${value} Tage ${HABIT_LABELS[habit]} am Stück!`, STREAK_SOUND[value], value >= 7]
    : kind === 'sportGoal' ? ['LEVEL UP! Sport-Wochenziel erreicht', 'levelup', true]
    : ['Alles erledigt für heute ✨', 'chord', false];
  const start = Math.max(Date.now() + 150, busyUntil);
  busyUntil = start + (DURATION[sound] || 800);
  setTimeout(() => {
    play(sound);
    toast(text, { big, ms: big ? 3000 : 2400 });
    burst(big ? 28 : 16);
    if (kind === 'allDone') {
      const hero = document.getElementById('hero');
      hero.classList.remove('pulse');
      void hero.offsetWidth;
      hero.classList.add('pulse');
    }
  }, start - Date.now());
}

function burst(n) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.className = 'spark';
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const r = 90 + Math.random() * 90;
    s.style.setProperty('--c', COLORS[i % COLORS.length]);
    s.style.setProperty('--dx', `${Math.cos(a) * r}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * r}px`);
    document.body.append(s);
    setTimeout(() => s.remove(), 1000);
  }
}
