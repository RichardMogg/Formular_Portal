'use strict';

window.FORM_RUNTIME_CONFIG = {
    "exportVersion":  "0.1.0",
    "generatedAt":  "2026-05-29T15:22:36.320Z",
    "schema":  {
                   "id":  "antigrav_test_formular",
                   "subtitle":  "Automatisiertes Vorbefüllungs-Testformular",
                   "appType":  "form-builder-schema",
                   "rendering":  {
                                     "section":  {
                                                     "rememberOpenState":  true,
                                                     "mode":  "details-card"
                                                 },
                                     "fields":  {
                                                    "file":  "file-list-metadata",
                                                    "signature":  "canvas-signature",
                                                    "checklist":  "yes-no-pills-with-note",
                                                    "bool":  "yes-no-pills",
                                                    "widthMode":  "percent",
                                                    "locationDate":  "location-date-pair",
                                                    "coordinates":  "coordinates-button"
                                                }
                                 },
                   "sections":  [
                                    {
                                        "title":  "1. Kopfdaten",
                                        "openByDefault":  true,
                                        "fields":  [
                                                       {
                                                           "id":  "feld_auftragsnummer",
                                                           "label":  "Auftragsnummer",
                                                           "widthPercent":  100,
                                                           "type":  "text",
                                                           "required":  true,
                                                           "prefill":  "orderId"
                                                       },
                                                       {
                                                           "id":  "feld_auftraggeber",
                                                           "label":  "Auftraggeber",
                                                           "widthPercent":  100,
                                                           "type":  "textarea",
                                                           "required":  true,
                                                           "prefill":  "clientInfo"
                                                       },
                                                       {
                                                           "id":  "feld_objektadresse",
                                                           "label":  "Kunde / Objektanschrift",
                                                           "widthPercent":  100,
                                                           "type":  "textarea",
                                                           "required":  true,
                                                           "prefill":  "customerAddress"
                                                       },
                                                       {
                                                           "id":  "feld_rechnungsadresse",
                                                           "label":  "Rechnungsanschrift",
                                                           "widthPercent":  100,
                                                           "type":  "textarea",
                                                           "required":  false,
                                                           "prefill":  "billingAddress"
                                                       },
                                                       {
                                                           "id":  "feld_sachbearbeiter",
                                                           "label":  "Techniker / Sachbearbeiter",
                                                           "widthPercent":  100,
                                                           "type":  "text",
                                                           "required":  false,
                                                           "prefill":  "sachbearbeiter"
                                                       },
                                                       {
                                                           "id":  "feld_auftragsdatum",
                                                           "label":  "Auftragsdatum",
                                                           "widthPercent":  100,
                                                           "type":  "date",
                                                           "required":  false,
                                                           "prefill":  "orderDate"
                                                       },
                                                       {
                                                           "label":  "Unterschrift des Kunden",
                                                           "widthPercent":  100,
                                                           "id":  "feld_unterschrift",
                                                           "type":  "signature",
                                                           "required":  false
                                                       }
                                                   ],
                                        "id":  "protocol_kopfdaten",
                                        "subtitle":  "Kopfdaten für dieses Import-Formular"
                                    }
                                ],
                   "runtime":  {
                                   "protocols":  {
                                                     "listSectionId":  "protocol_kopfdaten",
                                                     "listFieldIds":  [
                                                                          "feld_auftragsnummer",
                                                                          "feld_auftraggeber"
                                                                      ],
                                                     "exports":  {
                                                                     "csv":  true,
                                                                     "html":  true,
                                                                     "pdf":  true,
                                                                     "json":  true,
                                                                     "images":  true
                                                                 },
                                                     "dataSource":  {
                                                                        "mode":  "manual"
                                                                    },
                                                     "enabled":  true
                                                 }
                               },
                   "title":  "Antigrav Test Formular",
                   "schemaVersion":  "0.3.0",
                   "version":  "V1.0"
               }
};

