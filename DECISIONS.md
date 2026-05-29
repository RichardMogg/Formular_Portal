# DECISIONS.md

Stand: 2026-05-29

## D-001 Arbeitsrepository

Das Arbeitsrepository ist `RichardMogg/Formular_Portal`.

## D-002 Visuelle Ausrichtung

Das Portal orientiert sich an einer modernen, mobiltauglichen Kartenoptik mit klarer Trennung von HTML, CSS und JavaScript. Bedienelemente sind großflächig und für Touch-Gesten optimiert.

## D-003 Mobile-first

Das Portal wird primär für Smartphone und Tablet geplant.

Desktop darf mehr Raum nutzen, ist aber nicht die Grundannahme.

## D-004 Auftrag-PDF-Import

Der Auftrag-PDF-Import gehört zur Zielarchitektur des Portals.

In der ersten statischen Ausbaustufe werden Auftrag-PDFs nur lokal im Browser verarbeitet.

Keine serverseitige Verarbeitung, keine Übertragung an externe Dienste und keine dauerhafte Speicherung echter Auftragsdaten ohne separate Entscheidung.

## D-005 Auftragsdaten und forms.json

`forms.json` enthält Formular-Metadaten und Fähigkeiten, aber keine echten Auftragsdaten, keine PDF-Inhalte und keine sensiblen Daten.

## D-006 Optionale Formular-Vorbefüllung

Formular-Webapps dürfen optional Portal-Kopfdaten übernehmen.

Diese Vorbefüllung darf die Eigenständigkeit der Formular-Webapps nicht aufheben.

## D-007 Detaillierte Adress-Splittung

Zur Verbesserung der Datenqualität beim PDF-Import werden Adressblöcke zeilenweise anhand von Render-Koordinaten rekonstruiert und über einen intelligenten Parser in 12 präzise Einzelfelder (Name, Straße, PLZ, Ort für drei Parteien) aufgeteilt, statt flachen Freitext zu übergeben.

## D-008 High-Security Signature Auto-Wipe

Digitale Unterschriften sind hochsensible Daten. Nach jedem erfolgreichen Export eines Formulars (ZIP oder Einzelexport) werden alle Unterschriftsdaten (Vektoren/Data-URLs) sofort und unwiederbringlich aus dem lokalen Zustand, den Entwürfen und dem LocalStorage des Webbrowsers gelöscht, um unbefugten Zugriff im Browser-Cache zu verhindern.
