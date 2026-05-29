# DECISIONS.md

Stand: 2026-05-30

## D-001 Arbeitsrepository

Das Arbeitsrepository ist `RichardMogg/Formular_Portal`.

`RichardMogg/Formular_Baukasten` ist nur Referenz und wird ohne ausdrückliche separate Beauftragung nicht verändert.

## D-002 Visuelle Ausrichtung

Das Portal orientiert sich an einer modernen, mobiltauglichen Kartenoptik mit klarer Trennung von HTML, CSS und JavaScript.

Bedienelemente sind großflächig und für Touch-Gesten optimiert.

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

Zur Verbesserung der Datenqualität beim PDF-Import werden Adressblöcke zeilenweise anhand von Render-Koordinaten rekonstruiert und über einen intelligenten Parser in präzise Einzelfelder aufgeteilt, statt flachen Freitext zu übergeben.

## D-008 High-Security Signature Auto-Wipe

Digitale Unterschriften sind hochsensible Daten.

Nach erfolgreichem Export bzw. Auftragsabschluss werden Unterschriftsdaten aus lokalem Zustand, Entwürfen und Browser-Speicher entfernt, soweit dies im statischen Browserkontext möglich ist.

## D-009 Statische Mail-/Share-Grenze

Das Portal bleibt in der ersten Ausbaustufe ohne Backend und ohne eigene Mailanwendung.

PDFs werden lokal erzeugt. Für mobile Geräte wird, wenn verfügbar, die Web Share API genutzt. Der Fallback ist PDF-Download plus `mailto:`.

Eine zuverlässige Ein-Klick-Mail mit Empfänger, Text und PDF-Anhang ist im rein statischen Browser nicht plattformübergreifend erzwingbar und würde eine separate Entscheidung zu externer Mail-API, OAuth oder Backend erfordern.

## D-010 Integrierter Portal-Arbeitsnachweis

Der aktuell integrierte Arbeitsnachweis-/Lieferschein-Dialog ist Portal-Funktionalität.

Er ersetzt keine exportierte Formular-Webapp und hebt die Eigenständigkeit der unter `forms/` abgelegten Formular-Webapps nicht auf.

Der Dialog darf lokale Auftrags-Kopfdaten übernehmen, darf aber keine echten Auftragsdaten dauerhaft im Repository oder in `forms.json` speichern.

## D-011 Mobile Unterschriftserfassung

Unterschriften werden mobil über ein Vollbild-Unterschriftsfeld erfasst und anschließend in die kleinen Signaturfelder übertragen.

Die kleinen Signaturfelder dienen primär als Vorschau und als PDF-Quelle.

Techniker-Unterschrift ist Pflicht. Kunden-Unterschrift ist Pflicht, außer `Kunde nicht anwesend` oder `Unterschrift wird verweigert` ist gewählt.

Bei aktivem Kunden-Grund darf der Kunden-Löschen-Button nicht wirken.

## D-012 PDF-Stabilisierung des Logos

Das sichtbare Portal-Logo bleibt `assets/logo.svg`.

Da mobile Browser bzw. html2canvas SVG-Text teilweise fehlerhaft in PDFs rendern, wird das Logo im Browser für den PDF-Export über `js/logo-rasterize.js` in eine PNG-Datenquelle gerastert.

Dies ist eine Portal-seitige Stabilisierung und keine Änderung an eingebundenen Formular-Webapps.

## D-013 Arbeitszeit-Datumsfeld

Das Feld `Tag/Monat` in der Arbeitszeittabelle wird als nativer Browser-Datepicker bedient.

Gespeichert wird der ISO-Wert `YYYY-MM-DD`; ältere Kurzwerte wie `29.05.` können anhand des Lieferscheindatumsjahres normalisiert werden.
