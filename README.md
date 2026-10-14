# Drei Wochen Kur

Kleine Handy-App (PWA) für die Zeit vom 14.10. bis 04.11.2026: Gitarre, Yazio und Sport als Streaks, Aufgaben mit Parkplatz, Termine und Ziele. Läuft offline, alle Daten bleiben auf dem Handy.

## Auf GitHub Pages veröffentlichen

1. Auf github.com ein neues **öffentliches** Repository anlegen, z. B. `drei-wochen-kur` (ohne README).
2. Im Projektordner:
   ```bash
   git remote add origin https://github.com/<DEIN-NAME>/drei-wochen-kur.git
   git push -u origin main
   ```
3. Im Repo auf GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch `main`, Ordner `/ (root)`, **Save**.
4. Nach 1–2 Minuten ist die App erreichbar unter `https://<DEIN-NAME>.github.io/drei-wochen-kur/`.

Updates: Änderungen committen und pushen. Wenn sich App-Dateien ändern, in `sw.js` die `CACHE_VERSION` hochzählen (z. B. `dwk-v2`), damit das Handy die neue Version sicher übernimmt.

## Auf Android installieren

1. Die Pages-Adresse in **Chrome** öffnen.
2. Menü **⋮ → „App installieren“** (oder „Zum Startbildschirm hinzufügen“).
3. Die App einmal online öffnen, danach funktioniert sie auch offline.

## Eigene Daten importieren

Die Startdaten im Repo sind bewusst neutral gehalten. Persönliche Daten (Namen, Termine) liegen als JSON-Datei nur lokal und werden einmalig auf dem Handy importiert: Zahnrad → **Importieren** → Datei wählen. Am besten direkt nach der Installation, bevor du etwas abhakst, denn der Import ersetzt alle Daten.

## Backup

Zahnrad oben rechts → **Exportieren (JSON)** speichert alle Daten als Datei. **Importieren** stellt ein Backup wieder her (ersetzt die aktuellen Daten). Achtung: Wer in Chrome die Website-Daten löscht oder die App deinstalliert, löscht auch die Daten. Darum ab und zu exportieren.

## Warum keine Benachrichtigung um 20 Uhr?

Eine PWA ohne eigenen Server kann auf Android keine **zuverlässig zeitgesteuerten** Benachrichtigungen auslösen: Die dafür gedachte „Notification Triggers“-Schnittstelle wurde von Chrome eingestellt, und „Periodic Background Sync“ läuft nur gelegentlich, nach Ermessen des Browsers. Echte Push-Nachrichten bräuchten einen Server. Deshalb zeigt die App ab 20:00 Uhr beim Öffnen ein **Check-in-Banner** mit allem, was heute noch offen ist. Tipp: einen normalen Android-Wecker/Timer um 20 Uhr als Erinnerung stellen.

## Entwicklung

- Lokal starten: `python -m http.server 8080`, dann http://localhost:8080
- Testparameter: `?today=2026-10-20` (anderes Datum), `?now=20:30` (andere Uhrzeit fürs Check-in)
- Tests: `node --test "tests/*.test.mjs"`
- Icons neu erzeugen: `node tools/make-icons.mjs`
