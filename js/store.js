export const KEY = 'dwk-state';
const BROKEN_KEY = `${KEY}-broken`;

export function validateState(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return { ok: false, errors: ['Kein Objekt'] };
  const errors = [];
  if (s.version !== 1) errors.push('version');
  for (const k of ['habits', 'goals', 'settings']) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) errors.push(k);
  for (const k of ['tasks', 'events']) if (!Array.isArray(s[k])) errors.push(k);
  return { ok: errors.length === 0, errors };
}

export function createStore(storage, seed) {
  const fresh = () => { const s = structuredClone(seed); delete s['//file']; return s; };
  const listeners = new Set();
  // Defekte Rohdaten separat aufheben, bis der Nutzer "Neu starten" wählt.
  let broken = storage.getItem(BROKEN_KEY);
  let state;
  const raw = storage.getItem(KEY);
  if (raw === null) {
    state = fresh();
    storage.setItem(KEY, JSON.stringify(state));
  } else {
    try {
      state = JSON.parse(raw);
      if (!validateState(state).ok) throw new Error('invalid');
    } catch {
      broken = raw;
      storage.setItem(BROKEN_KEY, raw);
      state = fresh();
    }
  }
  const commit = (silent = false) => {
    storage.setItem(KEY, JSON.stringify(state));
    if (!silent) listeners.forEach((l) => l(state));
  };
  return {
    get state() { return state; },
    get broken() { return broken; },
    // silent: speichern ohne Neu-Rendern (z. B. Notizen während des Tippens).
    update(fn, { silent = false } = {}) { const r = fn(state); commit(silent); return r; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    exportJSON: () => JSON.stringify(state, null, 2),
    importJSON(text) {
      let parsed;
      try { parsed = JSON.parse(text); } catch { return { ok: false, errors: ['Kein gültiges JSON'] }; }
      const v = validateState(parsed);
      if (!v.ok) return v;
      state = parsed;
      commit();
      return v;
    },
    reset() { state = fresh(); broken = null; storage.removeItem?.(BROKEN_KEY); commit(); },
  };
}
