import { ctx, today, toast } from './ctx.js';
import { openSheet } from './sheet.js';
import { play, setMuted, SOUND_LIST } from './sound.js';
import { ICON } from './icons.js';
import { markBackup, daysSinceBackup } from './extras-model.js';
import { STYLES, STYLE_IDS } from './music-pattern.js';
import { setMusicStyle, startMusic, stopMusic } from './music.js';

export const THEMES = [
  ['synthwave', 'Nacht', ['#140B2B', '#FF2E88', '#22E6FF', '#FFD23F']],
  ['sunset', 'Sonnenuntergang', ['#4A1A3A', '#FF4F8B', '#FFC15E', '#5EF2D0']],
  ['ice', 'Eis', ['#0B2233', '#8F7CFF', '#3DF5E0', '#5AA9FF']],
];

// Theme auf <html> setzen und die Browser-Leiste einfärben.
export function applyTheme(id) {
  const root = document.documentElement;
  if (id && id !== 'synthwave') root.dataset.theme = id;
  else delete root.dataset.theme;
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

export function setMusicOn(on) {
  ctx.store.update((s) => { s.settings.music = on; });
  on ? startMusic() : stopMusic();
}

export function setMutedAction(m) {
  ctx.store.update((s) => { s.settings.muted = m; });
  setMuted(m);
  if (!m) play('blip');
}

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function backupFile() {
  return new File([ctx.store.exportJSON()], `drei-wochen-kur-${today()}.json`, { type: 'application/json' });
}

async function shareBackup() {
  const file = backupFile();
  try {
    await navigator.share({ files: [file], title: 'Drei Wochen Kur – Backup' });
    ctx.store.update((s) => markBackup(s, today()));
  } catch (err) {
    if (err?.name !== 'AbortError') toast('Teilen nicht möglich – nutze „Exportieren“ oder „Kopieren“');
  }
}

async function copyBackup() {
  try {
    await navigator.clipboard.writeText(ctx.store.exportJSON());
    ctx.store.update((s) => markBackup(s, today()));
    toast('Daten kopiert – jetzt z. B. im Chat einfügen');
  } catch {
    toast('Kopieren nicht möglich – nutze „Exportieren“');
  }
}

export function exportBackup() {
  ctx.store.update((s) => markBackup(s, today()));
  download(`drei-wochen-kur-${today()}.json`, ctx.store.exportJSON());
}
export const exportRaw = (raw) => download(`drei-wochen-kur-defekt-${today()}.json`, raw);

export function openSettings() {
  openSheet({
    title: 'Einstellungen',
    render(body) {
      const s = ctx.store.state.settings;
      const theme = s.theme || 'synthwave';
      const style = s.musicStyle || 'cool';
      body.innerHTML = `
        <h3>Aussehen</h3>
        <div class="theme-picks">${THEMES.map(([id, label, sw]) => `<button class="theme-pick${theme === id ? ' on' : ''}" data-theme-pick="${id}" aria-pressed="${theme === id}">
          <span class="swatches">${sw.map((c) => `<i style="background:${c}"></i>`).join('')}</span>${label}</button>`).join('')}</div>
        <h3>Musik</h3>
        <div class="set-row"><span>Hintergrundmusik</span><button class="toggle" role="switch" aria-checked="${!!s.music}" data-a="music" aria-label="Hintergrundmusik"></button></div>
        <div class="chips" style="margin:10px 0">${STYLE_IDS.map((id) => `<button class="chip${style === id ? ' on' : ''}" data-style="${id}" aria-pressed="${style === id}">${STYLES[id].label}</button>`).join('')}</div>
        <h3>Soundeffekte</h3>
        <div class="set-row"><span>Ton aus</span><button class="toggle" role="switch" aria-checked="${!!s.muted}" data-a="mute" aria-label="Ton aus"></button></div>
        <div class="set-row"><span>Klick beim Tab-Wechsel</span><button class="toggle" role="switch" aria-checked="${!!s.tabClick}" data-a="tabclick" aria-label="Klick beim Tab-Wechsel"></button></div>
        <h3>Backup</h3>
        <div class="row-btns">
          <button class="btn primary" data-a="export">Exportieren (Datei)</button>
          ${navigator.canShare?.({ files: [backupFile()] }) ? '<button class="btn" data-a="share">Teilen …</button>' : ''}
          <button class="btn" data-a="copy">Kopieren</button>
          <button class="btn" data-a="import">Importieren …</button>
          <input type="file" accept="application/json,.json" hidden>
        </div>
        <p class="muted" style="font-size:13px">Alle Daten liegen nur auf diesem Handy. Letztes Backup: ${s.lastBackup ? (daysSinceBackup(ctx.store.state, today()) === 0 ? 'heute' : `vor ${daysSinceBackup(ctx.store.state, today())} Tagen`) : 'noch nie'}. Speicher dauerhaft geschützt: ${ctx.persisted ? 'ja ✓' : 'nicht bestätigt'}.</p>
        <h3>Sounds anhören</h3>
        <div class="list">${SOUND_LIST.map(([k, l]) => `<div class="set-row"><span>${l}</span><button class="icon-btn" data-play="${k}" aria-label="${l} abspielen">${ICON.play}</button></div>`).join('')}</div>`;
      const file = body.querySelector('input[type=file]');
      body.onclick = (e) => {
        const tp = e.target.closest('[data-theme-pick]');
        if (tp) { ctx.store.update((st) => { st.settings.theme = tp.dataset.themePick; }); applyTheme(tp.dataset.themePick); return; }
        const ms = e.target.closest('[data-style]');
        if (ms) {
          ctx.store.update((st) => { st.settings.musicStyle = ms.dataset.style; });
          setMusicStyle(ms.dataset.style);
          if (!ctx.store.state.settings.music) setMusicOn(true);
          return;
        }
        const p = e.target.closest('[data-play]');
        if (p) return play(p.dataset.play, { force: true });
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'music') setMusicOn(!s.music);
        else if (a === 'mute') setMutedAction(!s.muted);
        else if (a === 'tabclick') ctx.store.update((st) => { st.settings.tabClick = !st.settings.tabClick; });
        else if (a === 'export') exportBackup();
        else if (a === 'share') shareBackup();
        else if (a === 'copy') copyBackup();
        else if (a === 'import') file.click();
      };
      file.onchange = async () => {
        const f = file.files[0];
        if (!f) return;
        const text = await f.text();
        file.value = '';
        if (!confirm('Alle aktuellen Daten durch dieses Backup ersetzen?')) return;
        const res = ctx.store.importJSON(text);
        if (res.ok) { setMuted(ctx.store.state.settings.muted); toast('Backup importiert ✓'); }
        else toast(`Import fehlgeschlagen: ${res.errors.join(', ')}`, { ms: 4000 });
      };
    },
  });
}
