# CLAUDE.md – Drei Wochen Kur

PWA für Android (Chrome), läuft auf GitHub Pages. Anforderungen: `drei-wochen-kur-prompt.md`. Design-Entscheidungen: `docs/superpowers/specs/2026-10-14-drei-wochen-kur-design.md`.

## Arbeitsregeln

- **Usage-Budget:** Verbrauch des 5h-Fensters per `get_usage` prüfen. Warnen bei 5/10/15/20/25 % und (seit 2026-10-14 erweitert) bei 40/50/60/65 %. Bei **70 %** stoppen und Stand übergeben.
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
