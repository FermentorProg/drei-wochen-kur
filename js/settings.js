import { ctx, today, toast } from './ctx.js';
import { openSheet } from './sheet.js';
import { play, setMuted, SOUND_LIST } from './sound.js';
import { ICON } from './icons.js';
import { markBackup, daysSinceBackup } from './extras-model.js';

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
      body.innerHTML = `
        <div class="set-row"><span>Ton aus</span><button class="toggle" role="switch" aria-checked="${!!s.muted}" data-a="mute" aria-label="Ton aus"></button></div>
        <div class="set-row"><span>Klick beim Tab-Wechsel</span><button class="toggle" role="switch" aria-checked="${!!s.tabClick}" data-a="tabclick" aria-label="Klick beim Tab-Wechsel"></button></div>
        <h3>Backup</h3>
        <div class="row-btns">
          <button class="btn primary" data-a="export">Exportieren (JSON)</button>
          <button class="btn" data-a="import">Importieren …</button>
          <input type="file" accept="application/json,.json" hidden>
        </div>
        <p class="muted" style="font-size:13px">Alle Daten liegen nur auf diesem Handy. Letztes Backup: ${s.lastBackup ? (daysSinceBackup(ctx.store.state, today()) === 0 ? 'heute' : `vor ${daysSinceBackup(ctx.store.state, today())} Tagen`) : 'noch nie'}. Speicher dauerhaft geschützt: ${ctx.persisted ? 'ja ✓' : 'nicht bestätigt'}.</p>
        <h3>Sounds anhören</h3>
        <div class="list">${SOUND_LIST.map(([k, l]) => `<div class="set-row"><span>${l}</span><button class="icon-btn" data-play="${k}" aria-label="${l} abspielen">${ICON.play}</button></div>`).join('')}</div>`;
      const file = body.querySelector('input[type=file]');
      body.onclick = (e) => {
        const p = e.target.closest('[data-play]');
        if (p) return play(p.dataset.play, { force: true });
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'mute') setMutedAction(!s.muted);
        else if (a === 'tabclick') ctx.store.update((st) => { st.settings.tabClick = !st.settings.tabClick; });
        else if (a === 'export') exportBackup();
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
