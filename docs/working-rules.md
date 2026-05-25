# docs/working-rules.md

Diese Datei enthält ausführliche Arbeitsregeln für das Projekt `RichardMogg/Formular_Portal`.

Sie ergänzt die ChatGPT-Projektanweisung, ersetzt aber nicht den aktuellen Repository-Code.

---

## 1. Arbeitsrepository

Das Arbeitsrepository dieses Projekts ist:

```text
RichardMogg/Formular_Portal
```

Repository-URL:

```text
https://github.com/RichardMogg/Formular_Portal.git
```

Dieses Repository ist die technische Wahrheit für das Formular-Portal.

Alle aktiven Änderungen, Planungen und Umsetzungen dieses Projekts beziehen sich ausschließlich auf dieses Repository.

---

## 2. Referenzrepository Formular_Baukasten

Das Repository:

```text
RichardMogg/Formular_Baukasten
```

darf in diesem Projekt ausschließlich als Referenz verwendet werden.

Der Baukasten dient nur dazu, Aufbau und Exportstruktur fertiger Formular-Webapps zu verstehen.

Nicht erlaubt ohne ausdrückliche separate Freigabe:

- Dateien im Baukasten-Repository ändern
- Commits im Baukasten-Repository erzeugen
- Branches im Baukasten-Repository anlegen
- Pull Requests im Baukasten-Repository erstellen
- Issues im Baukasten-Repository erstellen
- Baukasten-Code ungeprüft in das Portal übernehmen
- Portal-Logik in den Baukasten einbauen

Der Baukasten darf nur verwendet werden, um zu verstehen:

- wie exportierte Formular-Webapps grundsätzlich aufgebaut sind,
- welche Dateistruktur exportierte Formulare haben,
- welche Runtime-Dateien typischerweise vorhanden sind,
- wie Formulare im Portal abgelegt werden können,
- welche Metadaten für `forms.json` sinnvoll sind.

Ausschlaggebend für dieses Projekt ist das Portal-Repository.

---

## 3. Projektziel

Das Projekt ist ein statisches Formular-Portal.

Das Portal soll mehrere fertige Formular-Webapps zentral sammeln, strukturieren und zugänglich machen.

Die einzelnen Formular-Webapps werden mit dem separaten Projekt `Formular_Baukasten` erzeugt und anschließend in diesem Portal-Repository in eigenen Unterordnern abgelegt.

Das Portal ist nicht der Baukasten.

Der Baukasten erstellt einzelne Formular-Webapps.

Das Portal sammelt und verlinkt diese fertigen Formular-Webapps.

---

## 4. Grundstruktur des Portal-Repositories

Empfohlene Repository-Struktur:

```text
Formular_Portal/
├─ index.html
├─ css/
│  └─ app.css
├─ js/
│  └─ app.js
├─ forms.json
├─ forms/
│  ├─ formular-1/
│  │  ├─ index.html
│  │  ├─ css/
│  │  ├─ js/
│  │  └─ assets/
│  ├─ formular-2/
│  │  ├─ index.html
│  │  ├─ css/
│  │  ├─ js/
│  │  └─ assets/
│  └─ formular-3/
│     ├─ index.html
│     ├─ css/
│     ├─ js/
│     └─ assets/
├─ README.md
└─ .nojekyll
```

---

## 5. Rollen der Projektbestandteile

### Formular_Baukasten

Der Formular_Baukasten ist ein separates Projekt.

Er erzeugt vollständige Formular-Webapps als exportierbare Runtime-Strukturen.

Der Baukasten ist nicht Bestandteil dieses Portals.

### Exportierte Formular-Webapp

Eine exportierte Formular-Webapp ist ein einzelnes fertiges Formular.

Sie besitzt eigene Dateien:

```text
index.html
css/
js/
assets/
README.md
.nojekyll
```

Sie muss eigenständig lauffähig bleiben.

### Formular_Portal

Das Portal ist die zentrale Startseite.

Es listet verfügbare Formulare auf und ermöglicht das Öffnen der jeweiligen Formular-Webapps.

Das Portal verwaltet Metadaten, Kategorien, Suche und Filter.

---

## 6. Zentrale Manifest-Datei

Die Datei `forms.json` ist die zentrale Liste aller im Portal verfügbaren Formulare.

Ein Formular muss in `forms.json` eingetragen sein, damit es im Portal sichtbar wird.

Beispiel:

```json
[
  {
    "id": "inbetriebnahme-dx-kuehler",
    "title": "Inbetriebnahmeprotokoll DX Kühler Outdoor",
    "category": "Inbetriebnahme",
    "description": "Protokoll für die Inbetriebnahme von DX-Kühlern Outdoor.",
    "url": "forms/inbetriebnahme-dx-kuehler/index.html",
    "version": "1.0",
    "status": "active",
    "tags": ["Kälte", "Inbetriebnahme", "DX"],
    "favorite": false
  }
]
```

`forms.json` soll möglichst einfach, portabel und manuell wartbar bleiben.

---

## 7. Pflichtfelder in forms.json

Empfohlene Pflichtfelder je Formular:

```json
{
  "id": "",
  "title": "",
  "category": "",
  "description": "",
  "url": "",
  "version": "",
  "status": "active"
}
```

Empfohlene optionale Felder:

```json
{
  "tags": [],
  "favorite": false,
  "created": "",
  "updated": "",
  "customer": "",
  "project": "",
  "country": "",
  "department": "",
  "icon": "",
  "thumbnail": ""
}
```

---

## 8. Statuswerte

Empfohlene Statuswerte:

```text
active
draft
archived
disabled
```

Bedeutung:

| Status | Bedeutung |
|---|---|
| active | Formular ist aktiv nutzbar |
| draft | Formular ist vorbereitet, aber noch nicht freigegeben |
| archived | Formular ist archiviert |
| disabled | Formular ist deaktiviert |

---

## 9. Kategorien

Kategorien sollen frei definierbar bleiben.

Beispiele:

```text
Inbetriebnahme
Wartung
Prüfung
Abnahme
Checkliste
Material
Störung
Dokumentation
```

Kategorien sollen möglichst aus `forms.json` gelesen werden.

Keine Kategorien hart im Code erzwingen, wenn sie aus `forms.json` ableitbar sind.

---

## 10. Statische Ausführung

Das Portal soll statisch funktionieren.

Grundsätze:

- kein Backend erforderlich
- keine Datenbank erforderlich
- keine Anmeldung erforderlich, solange nicht ausdrücklich entschieden
- keine Build-Pipeline erforderlich, solange nicht ausdrücklich entschieden
- lauffähig über GitHub Pages
- lauffähig lokal im Browser, soweit technisch möglich

---

## 11. GitHub-Pages-Kompatibilität

Alle Pfade müssen GitHub-Pages-kompatibel sein.

Regeln:

- relative Pfade verwenden
- keine lokalen Windows-Pfade verwenden
- keine absoluten Pfade wie `C:\...`
- keine unnötigen externen Abhängigkeiten
- `.nojekyll` im Repository verwenden, falls erforderlich
- Formularordner müssen sauber referenziert werden

Korrekt:

```text
forms/formularname/index.html
```

Falsch:

```text
C:\Users\...\formularname\index.html
```

---

## 12. Trennung Portal / Formular

Das Portal darf die einzelnen Formular-Webapps nicht unnötig verändern.

Nicht erlaubt ohne ausdrückliche Freigabe:

- Formularlogik aus Formular-Webapps ins Portal kopieren
- Portal-Logik in einzelne Formular-Webapps einbauen
- bestehende Formularordner umbauen
- Exportstruktur aus dem Baukasten verändern
- Formular-Webapps abhängig vom Portal machen

Ziel:

```text
Formular-Webapp läuft alleine.
Portal verlinkt Formular-Webapp.
```

---

## 13. Mögliche Portal-Funktionen

Erste Ausbaustufe:

- Formular-Kacheln
- Formularliste
- Formular öffnen
- Suche
- Kategorien
- Statusanzeige
- Versionsanzeige
- Beschreibung
- Tags
- Favoriten vorbereitet

Spätere Ausbaustufen:

- Favoritenbereich
- Archiv
- Sortierung
- Gruppierung nach Kunde, Projekt, Land oder Abteilung
- Länder-/Niederlassungsstruktur
- Benutzerrollen
- Rechtekonzept
- zentrale Formularupdates
- Formular-Importassistent
- automatische Erkennung neuer Formularordner

---

## 14. Such- und Filterlogik

Suche und Filter sollen aus `forms.json` arbeiten.

Durchsuchbare Felder:

- title
- category
- description
- tags
- version
- status
- customer
- project
- country
- department

Die Suche soll keine Formular-Webapps öffnen oder durchsuchen müssen.

---

## 15. Einbindung der Formulare

Standardverhalten:

- Portal zeigt Formular-Karte
- Klick öffnet `url`
- Formular-Webapp läuft eigenständig

Optional später:

- Öffnen in neuem Tab
- Detailseite je Formular
- Vorschau im iframe
- Favoritenbereich
- zuletzt geöffnet

Iframe-Einbindung nur nach bewusster Entscheidung, da sie Layout- und Browserprobleme verursachen kann.

---

## 16. Arbeitsmodus

Vor jeder Änderung prüfen:

1. Was genau soll geändert werden?
2. Betrifft die Änderung das Portal?
3. Betrifft die Änderung einzelne Formular-Webapps?
4. Betrifft die Änderung `forms.json`?
5. Bleiben alle Formular-Webapps eigenständig lauffähig?
6. Bleibt das Portal GitHub-Pages-tauglich?
7. Sind die Pfade korrekt?
8. Gibt es Risiken für bestehende Formularordner?
9. Wird versehentlich das Baukasten-Repository betroffen?
10. Wird Baukasten-Code ungeprüft übernommen?

Bei Unklarheit gezielte Rückfragen stellen.

---

## 17. Antwortstil

- Antworten auf Deutsch
- sachlich und direkt
- keine unnötigen Floskeln
- keine allgemeinen Grundlagen-Erklärungen
- bei Code vollständig kopierbar oder klar begrenzter Austauschblock
- bei Fehleranalyse:
  - Ursache nennen
  - betroffene Datei nennen
  - konkrete Änderung nennen

---

## 18. Standardablauf bei Änderungswünschen

1. Anforderung kurz zusammenfassen.
2. Betroffene Dateien oder Bereiche nennen.
3. Risiken und Nebenwirkungen nennen.
4. Offene Rückfragen stellen, falls nötig.
5. Konkreten Vorschlag machen.
6. Erst nach Freigabe Code ändern oder vollständige Datei ausgeben.

---

## 19. Repository-Schreibschutz

Direkte Änderungen am Repository nur nach ausdrücklicher Freigabe.

Keine großen Umbauten in einem Schritt.

Keine kompletten Datei-Ersetzungen ohne Freigabe.

Keine Assets, ZIP-Dateien oder Binärdateien schreiben, außer ausdrücklich verlangt.

Keine Änderungen an eingebetteten Formular-Webapps, außer ausdrücklich beauftragt.

Keine Änderungen im Repository `RichardMogg/Formular_Baukasten`.

---

## 20. Kritische Dateien

Besonders kritisch:

```text
index.html
forms.json
js/app.js
css/app.css
forms/*/index.html
forms/*/js/*
forms/*/css/*
```

Änderungen an `forms/*` betreffen einzelne exportierte Formular-Webapps und dürfen nicht automatisch erfolgen.

---

## 21. Priorität bei Widersprüchen

Wenn Dokumentationsdateien vorhanden sind, gilt folgende Priorität:

1. aktueller Code im GitHub-Repository `RichardMogg/Formular_Portal`
2. `PROJECT_STATE.md`
3. `DECISIONS.md`
4. ChatGPT-Projektanweisung
5. `docs/working-rules.md`
6. `CURRENT_STATUS.md`
7. `TODO.md`
8. aktuelle Projektchats
9. alte Chatverläufe nur als Archiv
10. `RichardMogg/Formular_Baukasten` nur als Referenz

---

## 22. Dokumentationsstruktur

Empfohlene Dateien:

```text
PROJECT_STATE.md
CURRENT_STATUS.md
DECISIONS.md
TODO.md
docs/working-rules.md
docs/analysis/
```

### PROJECT_STATE.md

Dauerhafte Projektbeschreibung.

Enthält:

- Projektziel
- Architektur
- Grundstruktur
- Abgrenzung zum Baukasten
- Portal-Konzept
- Prioritäten

### CURRENT_STATUS.md

Aktueller Entwicklungsstand.

Enthält:

- was funktioniert
- was ist teilweise umgesetzt
- was ist offen
- bekannte Risiken

### DECISIONS.md

Getroffene Architekturentscheidungen.

### TODO.md

Konkrete offene Aufgaben.

### docs/analysis/

Analysen, Konzepte und größere technische Vorbereitungen.

---

## 23. Keine automatische Vermischung mit dem Baukasten

Dieses Projekt darf nicht automatisch Funktionen aus dem Formular_Baukasten übernehmen.

Der Baukasten bleibt Quelle für exportierte Formular-Webapps.

Das Portal ist nur der zentrale Einstiegspunkt.

Wenn später eine direkte Verbindung zwischen Baukasten und Portal gewünscht wird, muss sie separat entschieden und geplant werden.

Mögliche spätere Verbindung:

- Baukasten exportiert Formular direkt in portal-kompatible Struktur
- Baukasten erzeugt zusätzlich Eintrag für `forms.json`
- Portal kann neue Formularordner automatisch erkennen
- Portal kann Formular-Metadaten aus exportiertem Formular lesen

Diese Funktionen sind nicht automatisch Bestandteil der ersten Portalversion.

---

## 24. Qualitätskriterien

Das Portal gilt als sauber umgesetzt, wenn:

- es statisch läuft
- es über GitHub Pages funktioniert
- Formulare aus `forms.json` angezeigt werden
- Formulare geöffnet werden können
- Suche und Filter funktionieren
- Pfade relativ und portabel sind
- einzelne Formular-Webapps eigenständig bleiben
- Struktur verständlich und wartbar ist
- neue Formulare einfach ergänzt werden können
- das Baukasten-Repository nicht verändert wurde

---

## 25. Sicherheits- und Datenschutzhinweise

In der ersten statischen Version keine sensiblen Daten im Portal speichern.

Nicht in `forms.json` speichern:

- Passwörter
- Zugangsdaten
- Kundengeheimnisse
- personenbezogene Daten, wenn nicht erforderlich
- API-Schlüssel
- interne vertrauliche Notizen

Wenn später Benutzerrechte oder geschützte Formulare benötigt werden, reicht GitHub Pages allein möglicherweise nicht aus.

Dann muss ein separates Berechtigungs- oder Hostingkonzept erstellt werden.

---

## 26. Grundsatzentscheidung

Das Portal ist ein eigenständiges Projekt.

Es ist die Sammel- und Startoberfläche für fertige Formular-Webapps.

Die Formular-Webapps bleiben eigenständige Anwendungen.

Das Portal soll einfach, statisch, wartbar und GitHub-Pages-tauglich bleiben.

Das Arbeitsrepository ist ausschließlich:

```text
RichardMogg/Formular_Portal
```

Das Baukasten-Repository ist ausschließlich Referenz.
