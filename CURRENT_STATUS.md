# CURRENT_STATUS.md

Stand: 2026-05-30

## Aktueller Umsetzungsstand

Das Portal ist weiterhin statisch und GitHub-Pages-tauglich.

Die letzten Arbeiten betrafen ausschließlich das Portal, insbesondere den integrierten Arbeitsnachweis-/Lieferschein-Dialog und die mobile Bedienbarkeit.

## Zuletzt umgesetzt

### Formularübersicht

- Formulare aus `forms.json` werden angezeigt.
- Formular-Webapps werden aus der Portalübersicht in einem neuen Browserfenster bzw. Tab geöffnet.
- Eingebundene Formular-Webapps bleiben eigenständig lauffähig.

### Arbeitsnachweis / Lieferschein

- Arbeitsnachweis-/Lieferschein-Dialog im Portal vorhanden.
- Kopfdaten können aus lokal eingelesenen Auftrag-PDFs übernommen werden.
- Material- und Arbeitszeitzeilen sind dynamisch erweiterbar.
- `Tag/Monat` in Arbeitszeitzeilen ist ein nativer Datepicker.
- Spalte `Arbeitszeit von - bis` wurde verbreitert, damit Zeitwerte nicht abgeschnitten werden.
- Techniker-Unterschrift ist Pflicht.
- Kunden-Unterschrift ist Pflicht, außer `Kunde nicht anwesend` oder `Unterschrift wird verweigert` ist gewählt.
- Bei aktivem Kunden-Grund ist der Kunden-Löschen-Button gesperrt.
- Unterschriften werden im PDF um 20 % größer dargestellt.

### PDF-Export

- PDF-Erstellung erfolgt lokal im Browser.
- Eingabefelder werden im PDF-Klon als statische Texte dargestellt.
- `css/pdf-export-fix.css` reduziert html2canvas-Range-/Layout-Probleme.
- `js/logo-rasterize.js` rastert das Portal-Logo für stabilere PDF-Ausgabe.

### Mail-/Share-Ablauf

- Web Share API wird genutzt, wenn Datei-Sharing verfügbar ist.
- Fallback ist PDF-Download plus `mailto:`.
- Es wurde bewusst kein Backend und keine externe Mail-API eingeführt.

## Relevante aktuelle Dateien

- `index.html`
- `css/app.css`
- `css/pdf-export-fix.css`
- `css/signature-overlay.css`
- `js/app.js`
- `js/ui.js`
- `js/signature-overlay.js`
- `js/logo-rasterize.js`
- `js/time-date-picker.js`
- `forms.json`
- `assets/mail.md`
- `assets/logo.svg`

## Offene Prüfpunkte

- PDF-Ausgabe auf Android testen.
- PDF-Ausgabe auf iPad testen.
- Mail-/Share-Ablauf auf den Zielgeräten erneut prüfen.
- Logo-Darstellung im endgültigen PDF visuell kontrollieren.
- Arbeitszeit-Datepicker und PDF-Darstellung des Datums auf Zielgeräten prüfen.
- Prüfen, ob Kunden-Grund-Checkboxen in Entwürfen zusätzlich als eigene Datenfelder gespeichert werden sollen.

## Bekannte Architekturgrenze

Eine echte automatische E-Mail mit PDF-Anhang kann im rein statischen Browser nicht zuverlässig erzwungen werden.

Für eine verbindliche Ein-Klick-Mail wäre eine separate Entscheidung für Backend, Mail-API oder OAuth notwendig.
