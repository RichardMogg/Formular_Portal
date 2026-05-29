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

## 2. Projektziel

Das Projekt ist ein statisches Formular-Portal.

Das Portal soll mehrere fertige Formular-Webapps zentral sammeln, strukturieren und zugänglich machen.

Die einzelnen Formular-Webapps liegen in diesem Portal-Repository in eigenen Unterordnern unter `forms/`.

Das Portal sammelt und verlinkt diese fertigen Formular-Webapps und ermöglicht den strukturierten Kopfdaten-Import.

---

## 3. Grundstruktur des Portal-Repositories

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

## 4. Rollen der Projektbestandteile

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

Es verwaltet Metadaten, Kategorien, Suche, Filter und den PDF-Kopfdatenimport zur automatischen Vorbefüllung.

---

## 5. Zentrale Manifest-Datei

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

## 6. Pflichtfelder in forms.json

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

## 7. Statuswerte

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

## 8. Kategorien

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

Kategorien sollen aus `forms.json` gelesen werden.

---

## 9. Statische Ausführung

Das Portal soll statisch funktionieren.

Grundsätze:

- kein Backend erforderlich
- kein Server-Datenbanksystem erforderlich
- keine Anmeldung erforderlich, solange nicht ausdrücklich entschieden
- keine Build-Pipeline erforderlich, solange nicht ausdrücklich entschieden
- lauffähig über GitHub Pages
- lauffähig lokal im Browser, soweit technisch möglich

---

## 10. GitHub-Pages-Kompatibilität

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

## 11. Trennung Portal / Formular

Das Portal darf die einzelnen Formular-Webapps nicht unnötig verändern.

Nicht erlaubt ohne ausdrückliche Freigabe:

- Formularlogik aus Formular-Webapps ins Portal kopieren
- Portal-Logik fest in einzelne Formular-Webapps einbauen (nur lose Kopplung über Prefill)
- bestehende Formularordner manuell umbauen, so dass sie an Eigenständigkeit verlieren

Ziel:

```text
Formular-Webapp läuft alleine.
Portal verlinkt Formular-Webapp.
```

---

## 12. Such- und Filterlogik

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

---

## 13. Einbindung der Formulare

Standardverhalten:

- Portal zeigt Formular-Karte
- Klick öffnet `url`
- Formular-Webapp läuft eigenständig
- Optionale Prefill-Parameter werden via URL-Hash / Query übergeben

---

## 14. Arbeitsmodus

Vor jeder Änderung prüfen:

1. Was genau soll geändert werden?
2. Betrifft die Änderung das Portal?
3. Betrifft die Änderung einzelne Formular-Webapps?
4. Betrifft die Änderung `forms.json`?
5. Bleiben alle Formular-Webapps eigenständig lauffähig?
6. Bleibt das Portal GitHub-Pages-tauglich?
7. Sind die Pfade korrekt?
8. Gibt es Risiken für bestehende Formularordner?

---

## 15. Antwortstil

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

## 16. Standardablauf bei Änderungswünschen

1. Anforderung kurz zusammenfassen.
2. Betroffene Dateien oder Bereiche nennen.
3. Risiken und Nebenwirkungen nennen.
4. Offene Rückfragen stellen, falls nötig.
5. Konkreten Vorschlag machen.
6. Erst nach Freigabe Code ändern oder vollständige Datei ausgeben.

---

## 17. Repository-Schreibschutz

Direkte Änderungen am Repository nur nach ausdrücklicher Freigabe.

Keine großen Umbauten in einem Schritt.

Keine kompletten Datei-Ersetzungen ohne Freigabe.

Keine Assets, ZIP-Dateien oder Binärdateien schreiben, außer ausdrücklich verlangt.

---

## 18. Kritische Dateien

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

---

## 19. Priorität bei Widersprüchen

Wenn Dokumentationsdateien vorhanden sind, gilt folgende Priorität:

1. aktueller Code im GitHub-Repository `RichardMogg/Formular_Portal`
2. `PROJECT_STATE.md`
3. `DECISIONS.md`
4. ChatGPT-Projektanweisung
5. `docs/working-rules.md`
6. `CURRENT_STATUS.md`
7. `TODO.md`

---

## 20. Dokumentationsstruktur

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
- Portal-Konzept
- Prioritäten

### DECISIONS.md

Getroffene Architekturentscheidungen.

---

## 21. Qualitätskriterien

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

---

## 22. Sicherheits- und Datenschutzhinweise

In der statischen Version keine sensiblen Kundendaten dauerhaft im Portal speichern.

Nicht in `forms.json` speichern:

- Passwörter oder Zugangsdaten
- Kundengeheimnisse
- personenbezogene Daten, wenn nicht erforderlich
- API-Schlüssel
- interne vertrauliche Notizen

Digitale Unterschriften müssen bei den integrierten Formular-Webapps unmittelbar nach erfolgreichem Export sicherheitsgelöscht werden.

---

## 23. Mobile-first & visuelle Ausrichtung

### Visuelle Ausrichtung

Das Portal nutzt ein modernes, aufgeräumtes Design mit:
- Klarer Farbwelt (Blau-/Grau-Töne)
- Karten- und Panel-Optik
- Kompakten Badges für Kategorien und Status
- Abgerundeten, leicht bedienbaren Oberflächen-Elementen

### Mobile-first Portal

Das Portal wird primär für mobile Nutzung geplant. Mobile Bedienbarkeit ist eine zentrale Zielvorgabe.

Regeln:
- Zuerst Smartphone und Tablet planen
- Große Touch-Ziele verwenden
- Suche und Filter mobil prominent platzieren
- Formular-Kacheln mobil klar lesbar halten
- Status, Version, Kategorie und Tags kompakt als Badges darstellen
- PDF-Auftrag-Upload mobil bedienbar machen
- Erkannte Auftragsdaten mobil prüfbar und korrigierbar machen

---

## 24. Auftrag-PDF-Import & Adress-Splittung (Iststand)

Der Auftrag-PDF-Import gehört zur Portal-Zielarchitektur.

### Grundablauf:

PDF lokal im Browser laden
→ Text oder Daten extrahieren
→ Erkannte Adressdaten mittels y-Koordinaten-Analyse zeilenweise trennen
→ Adressblöcke in 12 strukturierte Einzelfelder parsen
→ Erkannte Auftragsdaten zur Prüfung anzeigen
→ Nutzer korrigiert ggf. Daten
→ Temporären Auftragskontext im Speicher ablegen
→ Formular mit diesem Auftragskontext zur Vorbefüllung öffnen

### Regeln der ersten statischen Ausbaustufe:

- Auftrag-PDFs nur lokal im Browser verarbeiten
- Keine serverseitige Verarbeitung oder Übertragung an Drittanbieter
- Keine dauerhafte Speicherung echter Auftragsdaten auf einem Server
- Keine Auftragsdaten in `forms.json`
- Keine Pflichtabhängigkeit der Formular-Webapps vom Portal (das Formular muss auch ohne Vorbefüllung komplett funktionieren)

### Adress-Mapping-Felder (12 neue Einzelfelder):

| Kategorie | Feldname | Beschreibung |
| :--- | :--- | :--- |
| **Auftraggeber** | `clientName` | Firmenname / Name |
| | `clientStreet` | Straße und Hausnummer |
| | `clientZip` | Postleitzahl |
| | `clientCity` | Ort / Stadt |
| **Kunde / Objekt** | `customerName` | Kunde / Baustellen-Name |
| | `customerStreet` | Straße und Hausnummer |
| | `customerZip` | Postleitzahl |
| | `customerCity` | Ort / Stadt |
| **Rechnungsempfänger** | `billingName` | Rechnungsempfänger Name |
| | `billingStreet` | Straße und Hausnummer |
| | `billingZip` | Postleitzahl |
| | `billingCity` | Ort / Stadt |

---

## 25. Formular-Sicherheitsfeatures (GDPR Compliance)

Jedes im Portal eingebettete Formular bietet zum Schutz der Privatsphäre:
1. **Physischer Offline-Speicher (IndexedDB):** Zur sicheren Handhabung großer Bildmengen und Dateiuploads auf Mobilgeräten, ohne den Browser-RAM zu überlasten.
2. **Automatischer Unterschriften-Wipe:** Sobald ein Export ausgelöst wird (ZIP-Export oder Einzelformat), werden sämtliche digitalen Unterschriften unwiederbringlich aus dem lokalen State, den Entwürfen und dem LocalStorage entfernt, sobald der Exportvorgang abgeschlossen ist und der Benutzer die restlichen Formulardaten behält.
