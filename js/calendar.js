import { weeks, WD, CAL_START, CAL_END, KUR_START, KUR_END, diffDays, formatShort } from './dates.js';
import { segments, doneDates, sliceWeek } from './streaks.js';
import { isGroupDone } from './model.js';
import { esc } from './ctx.js';

// Termine einer Woche zuschneiden und auf Spuren (lanes) verteilen, damit sich nichts überlappt.
function eventSlices(state, week) {
  const first = week[0], last = week[6];
  const lanes = [];
  const items = state.events
    .filter((e) => (e.endDate || e.date) >= first && e.date <= last)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const end = e.endDate || e.date;
      const a = diffDays(first, e.date < first ? first : e.date);
      const b = diffDays(first, end > last ? last : end);
      let lane = lanes.findIndex((lastCol) => lastCol < a);
      if (lane < 0) { lane = lanes.length; lanes.push(b); } else lanes[lane] = b;
      return { e, a, b, lane, cl: e.date < first, cr: end > last };
    });
  return { items, laneCount: Math.max(1, lanes.length) };
}

export function renderCalendar(el, state, today) {
  const segG = segments(doneDates(state.habits.guitar));
  const segY = segments(doneDates(state.habits.yazio));
  const sport = state.habits.sport || {};
  const openTasks = {};
  for (const t of state.tasks) if (t.date && !t.done) openTasks[t.date] = (openTasks[t.date] || 0) + 1;

  let html = `<div class="cal-head">${WD.map((w) => `<span>${w}</span>`).join('')}</div>`;
  for (const week of weeks(CAL_START, CAL_END)) {
    const { items, laneCount } = eventSlices(state, week);
    const rG = 2 + laneCount, rY = rG + 1, rS = rY + 1;
    html += `<div class="week" style="grid-template-rows:24px repeat(${laneCount},20px) 12px 12px 14px">`;
    week.forEach((d, i) => {
      const col = `grid-column:${i + 1}`;
      const cls = `${d < KUR_START || d > KUR_END ? ' out' : ''}${d === today ? ' today' : ''}`;
      html += `<button class="day-col${cls}" style="${col}" data-date="${d}" aria-label="${formatShort(d)} öffnen"></button>`;
      html += `<span class="dnum${cls}" style="${col}">${+d.slice(8)}</span>`;
      if (openTasks[d]) html += `<span class="tcount" style="${col}">${openTasks[d]}</span>`;
      const s = sport[d];
      if (s?.done) {
        const types = s.types || [];
        const kind = types.length === 2 ? 'both' : types[0] || 'none';
        html += `<span class="dot ${kind}" style="grid-row:${rS};${col}"></span>`;
      }
    });
    for (const it of items) {
      const cls = `${it.e.optional ? ' opt' : ''}${it.e.group && isGroupDone(state, it.e.group) ? ' done' : ''}${it.cl ? ' cl' : ''}${it.cr ? ' cr' : ''}`;
      html += `<span class="pill${cls}" style="grid-row:${2 + it.lane};grid-column:${it.a + 1}/${it.b + 2}">${esc(it.e.short || it.e.title)}${it.e.optional ? '?' : ''}</span>`;
    }
    for (const [segs, cls, row] of [[segG, 'g', rG], [segY, 'y', rY]]) {
      for (const b of sliceWeek(segs, week)) {
        const c = `bar ${cls} t${b.tier}${b.continuesLeft ? ' cl' : ''}${b.continuesRight ? ' cr' : ''}`;
        const flame = b.isEnd && b.tier >= 1 ? '<i class="flame">🔥</i>' : '';
        html += `<span class="${c}" style="grid-row:${row};grid-column:${b.startCol + 1}/${b.endCol + 2}">${flame}</span>`;
      }
    }
    html += '</div>';
  }
  html += `<div class="legend">
    <span><i class="lb" style="background:var(--magenta)"></i>Gitarre</span>
    <span><i class="lb" style="background:var(--cyan)"></i>Yazio</span>
    <span><i class="ld" style="background:var(--yellow)"></i>Kraft</span>
    <span><i class="ld" style="background:var(--orange)"></i>Ausdauer</span></div>`;
  el.innerHTML = html;
}
