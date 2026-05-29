# PROJECT_STATE.md

Stand: 2026-05-29

## Projektziel

`RichardMogg/Formular_Portal` ist ein statisches, GitHub-Pages-taugliches Formular-Portal.

Das Portal sammelt fertige exportierte Formular-Webapps, zeigt sie zentral an und ermöglicht Suche, Filterung, Öffnen sowie einen automatisierten Datenimport über PDF-Kopfdaten.

## Architektur

Zentrale Datei für die sichtbare Formularliste ist `forms.json`.

Die Portal-Oberfläche besteht aus:

- `index.html`
- `css/app.css`
- `js/app.js`
- `js/portal-prefill.js` (Vorbefüllung und PDF-Parser)
- `forms.json`

Exportierte Formular-Webapps liegen unter `forms/` in eigenen Unterordnern.

## Mobile-first

Das Portal wird zuerst für mobile Nutzung geplant.

Smartphone und Tablet sind die Grundannahme.

Desktop darf mehr Platz nutzen, darf aber nicht die Basis der Bedienlogik sein.

## Auftrag-PDF-Import & Adress-Splittung (Iststand)

Das Portal enthält eine leistungsfähige lokale Import-Schnittstelle für Auftrag-PDFs:
- **Präzise Zeilenumbruch-Rekonstruktion:** Der PDF-Parser analysiert Render-Koordinaten (`y`-Werte), um die exakten Zeilenumbrüche von Adressblöcken strukturiert zu erhalten.
- **Intelligente Adress-Splittung:** Mehrzeilige Adressangaben werden automatisch in **12 detaillierte Einzelfelder** aufgeteilt (Straße, PLZ, Ort, Name) jeweils für Auftraggeber, Kunde/Objekt und Rechnungsempfänger.
- **Schnittstelle zur Vorbefüllung:** Diese Daten werden als temporärer Auftragskontext an die geöffneten Formular-Webapps übergeben, welche diese optional einlesen.

## Formular-Webapp Integrationsmerkmale (Iststand)

Die unter `forms/` abgelegten Formulare arbeiten eigenständig und bieten:
- **IndexedDB Persistent Photo Storage:** Fotos werden smartphone-schonend in einer persistenten lokalen Datenbank abgelegt, um RAM-Abstürze bei großen Datenmengen zu verhindern.
- **Direct Single-Format Download:** Der ZIP-Exporter weicht bei Auswahl eines einzigen Exportformats automatisch auf einen direkten Browser-Download aus.
- **High-Security Signature Auto-Wipe:** Zum Schutz sensibler Daten werden digitale Unterschriften unmittelbar nach erfolgreichem Export aus dem Browser-Speicher und dem LocalStorage spurlos gelöscht.
