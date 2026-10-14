import { openHabits, HABIT_LABELS } from './model.js';
import { habitAction } from './actions.js';

export function renderCheckin(el, state, day, now) {
  const open = now >= (state.settings.checkinTime || '20:00') ? openHabits(state, day) : [];
  el.hidden = !open.length;
  if (!open.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="banner" role="status">
    <div class="banner-title">🌙 ABEND-CHECK-IN</div>
    <p>Heute noch offen: ${open.map((h) => HABIT_LABELS[h]).join(', ')}</p>
    <div class="chips">${open.map((h) => `<button class="chip big ${h}" data-habit="${h}">✓ ${HABIT_LABELS[h]}</button>`).join('')}</div>
  </div>`;
  el.onclick = (e) => {
    const b = e.target.closest('[data-habit]');
    if (b) habitAction(b.dataset.habit, day);
  };
}
