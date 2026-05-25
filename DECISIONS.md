# DECISIONS.md

Stand: 2026-05-25

## D-001 Arbeitsrepository

Das Arbeitsrepository ist `RichardMogg/Formular_Portal`.

`RichardMogg/Formular_Baukasten` ist nur Referenz und wird in diesem Projekt nicht veraendert.

## D-002 Baukasten als visuelle Referenz

Der Formular_Baukasten darf neben Struktur und Runtime-Aufbau auch als visuelle Referenz dienen.

Erlaubt ist Orientierung an Farbwelt, Kartenoptik, Header-Anmutung, technischer Formular-Anmutung und mobilem Verhalten.

Baukasten-Code, Baukasten-CSS und Baukasten-JavaScript duerfen nicht ungeprueft in das Portal uebernommen werden.

## D-003 Mobile-first

Das Portal wird primaer fuer Smartphone und Tablet geplant.

Desktop darf mehr Raum nutzen, ist aber nicht die Grundannahme.

## D-004 Auftrag-PDF-Import

Der Auftrag-PDF-Import gehoert zur Zielarchitektur des Portals.

In der ersten statischen Ausbaustufe werden Auftrag-PDFs nur lokal im Browser verarbeitet.

Keine serverseitige Verarbeitung, keine Uebertragung an externe Dienste und keine dauerhafte Speicherung echter Auftragsdaten ohne separate Entscheidung.

## D-005 Auftragsdaten und forms.json

`forms.json` enthaelt Formular-Metadaten und Faehigkeiten, aber keine echten Auftragsdaten, keine PDF-Inhalte und keine sensiblen Daten.

## D-006 Optionale Formular-Vorbefuellung

Formular-Webapps duerfen spaeter optional Portal-Kopfdaten uebernehmen.

Diese Vorbefuellung darf die Eigenstaendigkeit der Formular-Webapps nicht aufheben.
