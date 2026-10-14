const DAY = 86400000;
export const CAL_START = '2026-10-12';
export const CAL_END = '2026-11-08';
export const KUR_START = '2026-10-14';
export const KUR_END = '2026-11-04';
export const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function parse(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
export const toISO = (ms) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (iso, n) => toISO(parse(iso) + n * DAY);
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / DAY);
export const weekday = (iso) => (new Date(parse(iso)).getUTCDay() + 6) % 7;
export const weekStart = (iso) => addDays(iso, -weekday(iso));

export function range(a, b) {
  const out = [];
  for (let d = a; d <= b; d = addDays(d, 1)) out.push(d);
  return out;
}
export function weeks(a, b) {
  const all = range(weekStart(a), addDays(weekStart(b), 6));
  const out = [];
  for (let i = 0; i < all.length; i += 7) out.push(all.slice(i, i + 7));
  return out;
}
export function todayISO(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
export function dayOfKur(today, start, end) {
  if (today < start || today > end) return null;
  return diffDays(start, today) + 1;
}
export function formatShort(iso) {
  const [, m, d] = iso.split('-');
  return `${WD[weekday(iso)]} ${d}.${m}.`;
}
