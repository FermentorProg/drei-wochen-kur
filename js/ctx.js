import { todayISO } from './dates.js';

// Gemeinsamer Laufzeit-Kontext: Store, Render-Hook, "gerade abgehakt"-Markierung.
export const ctx = { store: null, render: () => {}, flash: null };

const params = new URLSearchParams(location.search);
const pad = (n) => String(n).padStart(2, '0');

// ?today=YYYY-MM-DD und ?now=HH:MM erlauben Tests ohne Uhr-Umstellung.
export const today = () => params.get('today') || todayISO();
export function nowHM() {
  if (params.get('now')) return params.get('now');
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function toast(text, { big = false, ms = 2400 } = {}) {
  const root = document.getElementById('toast-root');
  const t = document.createElement('div');
  t.className = big ? 'toast big' : 'toast';
  t.textContent = text;
  root.append(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 450);
}
