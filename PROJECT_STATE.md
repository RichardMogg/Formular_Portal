# PROJECT_STATE.md

Stand: 2026-05-25

## Projektziel

`RichardMogg/Formular_Portal` ist ein statisches, GitHub-Pages-taugliches Formular-Portal.

Das Portal sammelt fertige exportierte Formular-Webapps, zeigt sie zentral an und ermoeglicht Suche, Filterung und Oeffnen.

Das Portal ist nicht der Formular_Baukasten.

## Architektur

Zentrale Datei fuer die sichtbare Formularliste ist `forms.json`.

Die Portal-Oberflaeche besteht aus:

- `index.html`
- `css/app.css`
- `js/app.js`
- `forms.json`

Exportierte Formular-Webapps liegen spaeter unter `forms/` in eigenen Unterordnern.

## Mobile-first

Das Portal wird zuerst fuer mobile Nutzung geplant.

Smartphone und Tablet sind die Grundannahme.

Desktop darf mehr Platz nutzen, darf aber nicht die Basis der Bedienlogik sein.

## Baukasten-Referenz

`RichardMogg/Formular_Baukasten` ist nur Referenz.

Er darf fuer Exportstruktur, Runtime-Aufbau, sinnvolle Metadaten und visuelle Richtung herangezogen werden.

Der Baukasten wird nicht veraendert.

## Auftrag-PDF-Import

Das Portal soll perspektivisch Auftrag-PDFs lokal im Browser laden koennen.

Daraus sollen Auftrags- und Kopfdaten extrahiert, dem Nutzer zur Pruefung angezeigt und optional fuer Formulare bereitgestellt werden.

In der ersten statischen Ausbaustufe gilt:

- keine serverseitige Verarbeitung
- keine Uebertragung an externe Dienste
- keine dauerhafte Speicherung echter Auftragsdaten
- keine Auftragsdaten in `forms.json`
- keine Pflichtabhaengigkeit der Formular-Webapps vom Portal

## Aktueller Stand

Vorhanden:

- `index.html`
- `css/app.css`
- `js/app.js`
- `forms.json`
- `.nojekyll`
- `README.md`
- `DECISIONS.md`

Noch offen:

- echte exportierte Formular-Webapps einbinden
- Workrules-Ergaenzung dauerhaft aufnehmen
- PDF-Import konzipieren
- optionalen Auftragskontext konzipieren
- Vorbefuell-Schnittstelle konzipieren
