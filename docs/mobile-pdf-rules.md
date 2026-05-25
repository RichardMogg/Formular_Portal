# Mobile- und PDF-Regeln

Stand: 2026-05-25

Diese Datei ergaenzt `docs/working-rules.md`.

## Mobile-first

Das Portal wird primaer fuer Smartphone und Tablet geplant.

Regeln:

- grosse Touch-Ziele
- Suche und Filter mobil gut erreichbar
- Formular-Karten einspaltig nutzbar
- Status, Version und Kategorie als kompakte Badges
- PDF-Auftrag-Upload mobil bedienbar
- erkannte Auftragsdaten mobil pruefbar

## Baukasten-Optik

Der Formular_Baukasten darf als visuelle Referenz dienen.

Keine ungepruefte Uebernahme von Baukasten-Code, Baukasten-CSS oder Baukasten-JavaScript.

## Auftrag-PDF-Import

Auftrag-PDFs werden in der ersten statischen Ausbaustufe nur lokal im Browser verarbeitet.

Nicht erlaubt ohne separate Entscheidung:

- serverseitige Verarbeitung
- Uebertragung an externe Dienste
- dauerhafte Speicherung echter Auftragsdaten
- echte Auftragsdaten in `forms.json`

## Formular-Eigenstaendigkeit

Formular-Webapps bleiben eigenstaendig lauffaehig.

Portal-Kopfdaten duerfen spaeter nur optional uebernommen werden.

Der Auftrag-PDF-Import bleibt Portal-Logik und wird nicht in einzelne Formular-Webapps eingebaut.
