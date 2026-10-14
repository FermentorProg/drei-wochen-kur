import { addDays, diffDays } from './dates.js';

export const MILESTONES = [3, 7, 14];

export function doneDates(map = {}) {
  return Object.keys(map).filter((d) => map[d]?.done).sort();
}

export function segments(dates) {
  const out = [];
  for (const d of [...new Set(dates)].sort()) {
    const last = out[out.length - 1];
    if (last && addDays(last.end, 1) === d) { last.end = d; last.length++; }
    else out.push({ start: d, end: d, length: 1 });
  }
  return out;
}

export const tier = (length) => (length >= 7 ? 2 : length >= 3 ? 1 : 0);

export const segmentAt = (segs, date) => segs.find((s) => s.start <= date && date <= s.end) || null;

export function milestoneReached(beforeDates, afterDates, date) {
  const after = segmentAt(segments(afterDates), date);
  if (!after) return null;
  const prev = Math.max(0, ...segments(beforeDates)
    .filter((s) => s.start >= after.start && s.end <= after.end)
    .map((s) => s.length));
  const hit = MILESTONES.filter((t) => prev < t && after.length >= t);
  return hit.length ? hit[hit.length - 1] : null;
}

export function sliceWeek(segs, week) {
  const first = week[0], last = week[6];
  return segs
    .filter((s) => s.end >= first && s.start <= last)
    .map((s) => ({
      startCol: diffDays(first, s.start < first ? first : s.start),
      endCol: diffDays(first, s.end > last ? last : s.end),
      length: s.length,
      tier: tier(s.length),
      continuesLeft: s.start < first,
      continuesRight: s.end > last,
      isEnd: s.end <= last,
    }));
}
