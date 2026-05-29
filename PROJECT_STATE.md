# PROJECT_STATE.md

Stand: 2026-05-30

## Projektziel

`RichardMogg/Formular_Portal` ist ein statisches, GitHub-Pages-taugliches Formular-Portal.

Das Portal sammelt fertige exportierte Formular-Webapps, zeigt sie zentral an und ermöglicht Suche, Filterung, Öffnen sowie einen lokalen Datenimport über PDF-Kopfdaten.

Das Portal ist nicht der Formular-Baukasten. Der Baukasten bleibt Referenz; aktive Änderungen erfolgen nur im Repository `RichardMogg/Formular_Portal`.

## Architektur

Zentrale Datei für die sichtbare Formularliste ist `forms.json`.

Die Portal-Oberfläche besteht aktuell aus:

- `index.html`
- `css/app.css`
- `css/pdf-export-fix.css`
- `css/signature-overlay.css`
- `js/app.js`
- `js/ui.js`
- `js/state.js`
- `js/pdf-handler.js`
- `js/portal-prefill.js`
- `js/signature-pad.js`
- `js/signature-overlay.js`
- `js/logo-rasterize.js`
- `js/time-date-picker.js`
- `forms.json`
- `assets/logo.svg`
- `assets/mail.md`

Exportierte Formular-Webapps liegen unter `forms/` in eigenen Unterordnern und bleiben eigenständig lauffähig.

## Mobile-first

Das Portal wird zuerst für mobile Nutzung geplant.

Smartphone und Tablet sind die Grundannahme. Desktop darf mehr Platz nutzen, ist aber nicht die Basis der Bedienlogik.

Mobile-relevante Ist-Funktionen:

- Formular-Karten öffnen Formular-Webapps in einem neuen Browserfenster bzw. Tab.
- Unterschriften werden nicht direkt im kleinen Canvas erfasst, sondern über ein mobiles Vollbild-Unterschriftsfeld.
- Arbeitszeit-Datumsfelder verwenden native Browser-Datepicker.
- Arbeitszeitspalte `Arbeitszeit von - bis` ist verbreitert, damit Zeitwerte auf Mobilgeräten nicht abgeschnitten werden.

## Auftrag-PDF-Import & Adress-Splittung (Iststand)

Das Portal enthält eine lokale Import-Schnittstelle für Auftrag-PDFs:

- PDF-Verarbeitung erfolgt lokal im Browser.
- Render-Koordinaten werden genutzt, um Zeilenumbrüche von Adressblöcken strukturiert zu rekonstruieren.
- Mehrzeilige Adressangaben werden in Einzelfelder für Auftraggeber, Kunde/Objekt und Rechnungsempfänger aufgeteilt.
- Die Daten werden als temporärer Auftragskontext im Browser bereitgestellt.
- Formular-Webapps dürfen diese Kopfdaten optional übernehmen, bleiben aber eigenständig.

## Portal-Arbeitsnachweis / Lieferschein (Iststand)

Das Portal enthält aktuell zusätzlich zur Formularliste einen integrierten Arbeitsnachweis-/Lieferschein-Dialog.

Dieser Dialog ist Portal-Logik und keine kopierte Formular-Webapp. Er dient aktuell als mobile Arbeitsmaske für geladene Aufträge.

Aktuelle Funktionen:

- Vorbefüllung aus lokal eingelesenen Auftrag-PDF-Kopfdaten.
- Materialzeilen und Arbeitszeitzeilen dynamisch erweiterbar.
- Arbeitszeitfeld `Tag/Monat` als nativer Datepicker.
- Arbeitszeitspalte `Arbeitszeit von - bis` verbreitert.
- Leistungsbericht als Textbereich mit PDF-kompatibler Ausgabedarstellung.
- GPS-Standort und Zeitstempel werden beim Abschließen erfasst.
- Techniker-Unterschrift ist Pflicht.
- Kunden-Unterschrift ist Pflicht, außer `Kunde nicht anwesend` oder `Unterschrift wird verweigert` ist gewählt.
- Bei aktivem Kunden-Grund ist der Kunden-Löschen-Button gesperrt.
- Unterschriften werden im PDF-Export um 20 % größer dargestellt, ohne das Feldlayout zu vergrößern.
- Nach erfolgreichem Abschluss werden Auftragsdaten und Unterschriften lokal geschreddert.

## PDF-Export (Iststand)

Der PDF-Export läuft clientseitig im Browser.

Aktuelle Stabilisierung:

- `css/pdf-export-fix.css` entschärft bekannte PDF-/html2canvas-Darstellungsprobleme.
- Das sichtbare SVG-Logo `assets/logo.svg` wird im Browser über `js/logo-rasterize.js` in eine PNG-Datenquelle gerastert, damit der PDF-Export das Logo stabil und wie in der App darstellt.
- Eingabefelder werden im PDF-Klon in statische Texte umgewandelt.
- Signatur-Canvas-Inhalte werden in den PDF-Klon kopiert und dort vergrößert.

## Mail-/Share-Ablauf (Iststand)

Der Mailversand bleibt in der statischen ersten Ausbaustufe ohne Backend und ohne eigene Mailanwendung.

Aktueller Ablauf:

1. PDF wird lokal im Browser erzeugt.
2. Wenn `navigator.share` mit Dateiunterstützung verfügbar ist, wird die PDF-Datei über die Web Share API geteilt.
3. Wenn Web Share nicht möglich ist oder abgebrochen wird, wird das PDF heruntergeladen und ein `mailto:`-Fallback geöffnet.

Wichtig:

- Der Browser kann keine Absenderadresse aus einer bestehenden Mail-App auslesen.
- `mailto:` kann keine Datei zuverlässig anhängen.
- Eine echte Ein-Klick-Mail mit Empfänger, Text und PDF-Anhang würde eine separate Architekturentscheidung mit externer Mail-API, OAuth oder Backend erfordern.

## Formular-Webapp-Integrationsmerkmale (Iststand)

Die unter `forms/` abgelegten Formulare arbeiten eigenständig.

Portal-Grundsätze bleiben:

- Keine Formularlogik aus exportierten Formularen ungeprüft ins Portal kopieren.
- Keine Portal-Logik fest in Formular-Webapps einbauen.
- `forms.json` enthält nur Metadaten, keine echten Auftragsdaten, keine PDF-Inhalte und keine sensiblen Daten.
