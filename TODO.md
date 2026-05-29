# TODO.md

Stand: 2026-05-30

## Kurzfristig prüfen

- [ ] Portal nach Deployment im frischen Tab öffnen und Cache-Wirkung prüfen.
- [ ] Arbeitszeit-Datepicker auf Android testen.
- [ ] Arbeitszeit-Datepicker auf iPad testen.
- [ ] Prüfen, ob die Zeitfelder `von` und `bis` nach der Spaltenverbreiterung nicht mehr abgeschnitten werden.
- [ ] PDF-Export mit Techniker-Unterschrift und Kunden-Unterschrift testen.
- [ ] PDF-Export mit `Kunde nicht anwesend` testen.
- [ ] PDF-Export mit `Unterschrift wird verweigert` testen.
- [ ] Prüfen, ob der Kunden-Löschen-Button bei aktivem Kunden-Grund zuverlässig gesperrt bleibt.
- [ ] Mail-/Share-Ablauf auf Android prüfen.
- [ ] Mail-/Share-Ablauf auf iPad prüfen.

## Mittelfristig entscheiden

- [ ] Entscheiden, ob Kunden-Grund-Checkboxen als eigene Entwurfsdaten gespeichert werden sollen.
- [ ] Entscheiden, ob die PDF-Datumsdarstellung für Arbeitszeit von ISO `YYYY-MM-DD` in `DD.MM.YYYY` oder `DD.MM.` umgewandelt werden soll.
- [ ] Entscheiden, ob der integrierte Arbeitsnachweis dauerhaft Portal-Funktion bleibt oder später als eigenständige Formular-Webapp ausgelagert wird.
- [ ] Entscheiden, ob für echten Mailversand mit PDF-Anhang ein Backend oder eine Mail-API eingeführt werden soll.

## Grundsätze bei weiteren Arbeiten

- [ ] Keine echten Auftragsdaten in `forms.json` speichern.
- [ ] Keine exportierten Formular-Webapps ungefragt verändern.
- [ ] Portal-Pfade relativ und GitHub-Pages-tauglich halten.
- [ ] Mobile Bedienung zuerst prüfen.
- [ ] Auftrag-PDF-Import vom Formular getrennt halten.
