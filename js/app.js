import { createStore } from './store.js';
import { ctx, today, nowHM, esc } from './ctx.js';
import { dayOfKur, diffDays, formatShort, KUR_START, KUR_END } from './dates.js';
import { renderCalendar } from './calendar.js';
import { renderDayItems, renderSportWeek, openDay } from './dayitems.js';
import { renderParking, openTaskEditor } from './parking.js';
import { renderCheckin } from './checkin.js';
import { renderGoals } from './goals.js';
import { renderNotes } from './notes.js';
import { openSettings, setMutedAction, exportRaw, exportBackup, applyTheme, setMusicOn } from './settings.js';
import { backupDue, daysSinceBackup, snoozeBackup, nextCountdown } from './extras-model.js';
import { checkTimer } from './timer.js';
import { startMusic, stopMusic, isPlaying, setMusicStyle } from './music.js';
import { refreshSheet } from './sheet.js';
import { enableDnd } from './dnd.js';
import { moveTask } from './actions.js';
import * as sound from './sound.js';
import { ICON } from './icons.js';

const $ = (id) => document.getElementById(id);

function renderHeader(state, day) {
  const n = dayOfKur(day, KUR_START, KUR_END);
  const main = n ? `Tag ${n} von 22`
    : day < KUR_START ? `Noch ${diffDays(day, KUR_START)} Tage bis zur Kur` : 'Kur geschafft! 🎉';
  const cd = nextCountdown(state, day);
  const sub = cd ? (cd.days === 1 ? `Morgen: ${cd.label}` : `noch ${cd.days} Tage bis ${cd.label}`) : '';
  $('daycount').innerHTML = `${esc(main)}${sub ? `<small>⏳ ${esc(sub)}</small>` : ''}`;
  $('btn-mute').innerHTML = state.settings.muted ? ICON.mute : ICON.sound;
  $('btn-mute').setAttribute('aria-label', state.settings.muted ? 'Ton einschalten' : 'Ton ausschalten');
  $('btn-music').classList.toggle('on', !!state.settings.music);
  $('btn-music').setAttribute('aria-pressed', String(!!state.settings.music));
  $('btn-music').setAttribute('aria-label', state.settings.music ? 'Musik ausschalten' : 'Musik einschalten');
}

function renderAlert() {
  const el = $('alert');
  if (!ctx.store.broken) return renderBackupReminder(el);
  el.innerHTML = `<div class="banner" role="alert"><div class="banner-title">⚠️ GESPEICHERTE DATEN BESCHÄDIGT</div>
    <p>Die App startet mit den Startdaten. Sichere die alten Rohdaten, bevor du weitermachst.</p>
    <div class="row-btns"><button class="btn" data-a="raw">Rohdaten sichern</button><button class="btn primary" data-a="reset">Neu starten</button></div></div>`;
  el.onclick = (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'raw') exportRaw(ctx.store.broken);
    if (a === 'reset' && confirm('Mit den Startdaten neu beginnen?')) ctx.store.reset();
  };
}

function renderBackupReminder(el) {
  const state = ctx.store.state;
  const day = today();
  if (!backupDue(state, day)) { el.innerHTML = ''; return; }
  const since = daysSinceBackup(state, day);
  el.innerHTML = `<div class="banner" role="status"><div class="banner-title">💾 BACKUP</div>
    <p>${since === null ? 'Du hast noch nie ein Backup gemacht.' : `Letztes Backup vor ${since} Tagen.`} Deine Daten liegen nur auf diesem Handy.</p>
    <div class="row-btns"><button class="btn primary" data-a="backup">Jetzt sichern</button><button class="btn" data-a="later">Später</button></div></div>`;
  el.onclick = (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'backup') exportBackup();
    if (a === 'later') ctx.store.update((s) => snoozeBackup(s, day));
  };
}

function renderAll() {
  checkTimer();
  const state = ctx.store.state;
  const day = today();
  renderHeader(state, day);
  renderAlert();
  renderCheckin($('checkin'), state, day, nowHM());
  renderCalendar($('calendar'), state, day);
  renderSportWeek($('sport-week'), state, day);
  $('today-title').textContent = `Heute · ${formatShort(day)}`;
  renderDayItems($('today'), state, day);
  renderParking($('parking'), state, day);
  renderGoals($('goals'), state);
  renderNotes($('notes'), state);
  refreshSheet();
  setTimeout(() => { ctx.flash = null; }, 0);
}

function switchTab(name) {
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${name}`));
  $('fab').hidden = name !== 'plan';
  if (ctx.store.state.settings.tabClick) sound.play('click');
  scrollTo(0, 0);
}

async function init() {
  const seed = await fetch('data/seed.json').then((r) => r.json());
  ctx.store = createStore(localStorage, seed);
  ctx.render = renderAll;
  ctx.store.subscribe(renderAll);
  sound.setMuted(ctx.store.state.settings.muted);

  $('btn-settings').innerHTML = ICON.gear;
  $('fab').innerHTML = ICON.plus;
  $('btn-settings').onclick = openSettings;
  $('btn-music').innerHTML = ICON.music;
  $('btn-music').onclick = () => setMusicOn(!ctx.store.state.settings.music);
  applyTheme(ctx.store.state.settings.theme);
  setMusicStyle(ctx.store.state.settings.musicStyle || 'cool');
  // Musik darf erst nach einer Berührung starten (Autoplay-Regel); im Hintergrund pausieren.
  document.addEventListener('pointerdown', () => { if (ctx.store.state.settings.music && !isPlaying()) startMusic(); }, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMusic();
    else if (ctx.store.state.settings.music && navigator.userActivation?.hasBeenActive) startMusic();
  });
  $('btn-mute').onclick = () => setMutedAction(!ctx.store.state.settings.muted);
  $('fab').onclick = () => openTaskEditor(null);
  $('calendar').onclick = (e) => {
    const c = e.target.closest('.day-col');
    if (c) openDay(c.dataset.date);
  };
  document.querySelector('.tabbar').onclick = (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) switchTab(b.dataset.tab);
  };
  enableDnd($('tab-plan'), { onDrop: moveTask });
  document.addEventListener('pointerdown', sound.unlock, { once: true });

  // Beim Zurückkehren in die App und jede Minute aktualisieren (Datum, Check-in), aber nicht beim Tippen.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderAll(); });
  setInterval(() => {
    const a = document.activeElement;
    if (!a || !/^(INPUT|TEXTAREA)$/.test(a.tagName)) renderAll();
  }, 60000);

  renderAll();

  // Dauerhaften Speicher anfordern, damit Chrome die Daten nicht bei Platzmangel löscht.
  navigator.storage?.persist?.().then((ok) => { ctx.persisted = ok; }).catch(() => {});

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init().catch((err) => {
  document.body.insertAdjacentHTML('afterbegin', `<div class="banner" style="margin:12px">Fehler beim Start: ${esc(err.message)}</div>`);
});
