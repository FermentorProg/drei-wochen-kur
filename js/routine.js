import { today } from './ctx.js';
import { addDays, formatShort, CAL_START, CAL_END } from './dates.js';
import { segments, doneDates, segmentAt } from './streaks.js';
import { habitsHTML, bindItems, renderSportWeek } from './dayitems.js';
import { sportStats } from './goals-model.js';

let routineDate = null;

// Aktuelle Serie (inkl. heute, sonst bis gestern) und Bestwert.
function streakInfo(state, habit, day) {
  const segs = segments(doneDates(state.habits[habit]));
  const cur = segmentAt(segs, day) || segmentAt(segs, addDays(day, -1));
  return { current: cur ? cur.length : 0, best: Math.max(0, ...segs.map((s) => s.length)) };
}

export function renderRoutine(el, state) {
  const day = today();
  const date = routineDate || day;
  const g = streakInfo(state, 'guitar', day);
  const y = streakInfo(state, 'yazio', day);
  const sp = sportStats(state);
  el.innerHTML = `<h2>Routine</h2>
    <div class="card r-nav">
      <button class="icon-btn" data-rnav="-1" aria-label="Vorheriger Tag" ${date <= CAL_START ? 'disabled' : ''}>‹</button>
      <div class="r-date"><span class="num">${formatShort(date)}</span>${date === day ? '<small>Heute</small>' : '<button class="btn small" data-rnav="0">Zu heute</button>'}</div>
      <button class="icon-btn" data-rnav="1" aria-label="Nächster Tag" ${date >= CAL_END ? 'disabled' : ''}>›</button>
    </div>
    <div class="card list" id="routine-items">${habitsHTML(state, date)}</div>
    <div class="card sw" id="routine-sport"></div>
    <h2>Streaks</h2>
    <div class="card r-streaks">
      <div class="g-row"><span>🎸 Gitarre</span><span class="num">🔥 ${g.current}<small> · Best ${g.best}</small></span></div>
      <div class="g-row"><span>🥗 Yazio</span><span class="num">🔥 ${y.current}<small> · Best ${y.best}</small></span></div>
      <div class="g-row"><span>🏋️ Sport</span><span class="num">${sp.total}<small> Einheiten (${sp.kraft} K / ${sp.ausdauer} A)</small></span></div>
    </div>`;
  bindItems(el.querySelector('#routine-items'), date);
  renderSportWeek(el.querySelector('#routine-sport'), state, date);
  el.querySelector('.r-nav').onclick = (e) => {
    const b = e.target.closest('[data-rnav]');
    if (!b) return;
    const n = +b.dataset.rnav;
    const next = n === 0 ? day : addDays(date, n);
    if (next < CAL_START || next > CAL_END) return;
    routineDate = next === day ? null : next;
    renderRoutine(el, state);
  };
}
