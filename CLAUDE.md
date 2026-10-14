# CLAUDE.md – Drei Wochen Kur

PWA für Android (Chrome), läuft auf GitHub Pages. Anforderungen: `drei-wochen-kur-prompt.md`. Design-Entscheidungen: `docs/superpowers/specs/2026-10-14-drei-wochen-kur-design.md`.

## Arbeitsregeln

- **Usage-Budget:** Verbrauch des 5h-Fensters per `get_usage` prüfen. Grenze seit 2026-10-14 auf **100 %** erweitert (Nutzerfreigabe). Weiter bei 60/70/80/90 % warnen.
- Erst planen, dann entwickeln. Größere Designabweichungen vom Prompt vorher abfragen.
- Alle UI-Texte auf Deutsch.
- Reihenfolge: Plan-Tab → Ziele → Notizen (Stand 2026-10-14: alle drei umgesetzt, auf `main`).

## Technik

- Vanilla HTML/CSS/JS als ES-Module, **kein Build-Schritt**, keine npm-Abhängigkeiten.
- Daten in `localStorage` (`dwk-state`), Startdaten in `data/seed.json`.
- Datumswerte immer als `"YYYY-MM-DD"`-Strings; Rechnen nur über `js/dates.js` (keine Zeitzonen-Fallen).
- Reine Logik (Streaks, Datum, Import-Validierung) bleibt DOM-frei und ist in `tests/` per `node --test` getestet.
- Bei Änderungen an gecachten Dateien `CACHE_VERSION` in `sw.js` erhöhen.

## Befehle

- Tests: `node --test "tests/*.test.mjs"`
- Lokal starten: `npx serve .` oder `python -m http.server 8080` (Service Worker braucht http://localhost)

## Design-Tokens

Farben und Schriften siehe Prompt, Abschnitt „Design“. Mobile first 360–430 px, Touch-Ziele ≥ 44 px, `prefers-reduced-motion` respektieren, Kontrast WCAG AA.

## Privatsphäre (öffentliches Repo!)

- `main` ist öffentlich auf GitHub (FermentorProg/drei-wochen-kur, Pages). **Keine echten Namen, Orte oder privaten Details** in Code, Seed, Tests oder Commit-Messages.
- Echte Daten liegen nur lokal in `privat/persoenlich.json` (gitignored) und werden auf dem Handy importiert. Kategorie-Namen sind per `settings.labels` überschreibbar.
- `drei-wochen-kur-prompt.md` und `docs/` sind lokal und gitignored (enthalten private Angaben).
- Branch `archiv-privat` enthält die alte Historie mit privaten Daten: **niemals pushen**. Nur `main` pushen.
- Git-Identität in diesem Repo: `Fermentor <261413185+FermentorProg@users.noreply.github.com>` (lokal gesetzt).
