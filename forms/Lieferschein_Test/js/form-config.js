'use strict';

window.FORM_RUNTIME_CONFIG = {
  "exportVersion": "0.1.0",
  "generatedAt": "2026-05-29T12:41:49.248Z",
  "schema": {
    "appType": "form-builder-schema",
    "schemaVersion": "0.3.0",
    "title": "Arbeitsnachweis / Lieferschein",
    "subtitle": "Kundendienstauftrag",
    "version": "",
    "theme": {
      "defaults": {
        "colors": {
          "pageBackground": "#f3f6fa",
          "headerBackground": "#ffffff",
          "headerText": "#003f75",
          "subtitleText": "#64748b",
          "brand": "#005ca9",
          "brandDark": "#003f75",
          "brandLight": "#e6f1fb",
          "accent": "#ffd200",
          "border": "#cbd5e1",
          "bodyText": "#111827",
          "mutedText": "#64748b",
          "sectionTitle": "#235ab3",
          "sectionSubtitle": "#2e3033",
          "fieldLabel": "#111827",
          "fieldText": "#111827",
          "sectionBackground": "#ffffff",
          "sectionHeaderClosed": "#ffffff",
          "sectionHeaderOpen": "#e6f1fb",
          "fieldCardBackground": "#ffffff",
          "inputBackground": "#ffffff",
          "inputFocusBackground": "#ffffff",
          "optionBackground": "#ffffff",
          "primaryButtonBackground": "#005ca9",
          "primaryButtonText": "#ffffff",
          "secondaryButtonBackground": "#e5e7eb",
          "secondaryButtonText": "#111827",
          "danger": "#dc2626",
          "okBackground": "#dcfce7",
          "okText": "#166534",
          "errorBackground": "#fee2e2",
          "errorText": "#991b1b",
          "warningBackground": "#fef3c7",
          "warningText": "#92400e",
          "footerBackground": "#ffffff",
          "footerText": "#64748b",
          "footerBorder": "#cbd5e1"
        },
        "opacity": {
          "section": 34,
          "sectionHeaderClosed": 42,
          "sectionHeaderOpen": 42,
          "fieldCard": 38,
          "input": 86,
          "inputFocus": 94,
          "option": 42,
          "backgroundOverlayTop": 8,
          "backgroundOverlayBottom": 14,
          "panel": 88,
          "panelStrong": 96,
          "footer": 34
        }
      },
      "userControls": {
        "enabled": false,
        "sectionTitle": "Darstellung / Transparenz",
        "sectionSubtitle": "Farben, Hintergrund, Abschnitte und Felder einstellen",
        "allowReset": true,
        "persistInBrowser": true
      }
    },
    "footer": {
      "enabled": true,
      "lines": [
        {
          "text": "Gebatech Impressum"
        }
      ]
    },
    "sections": [
      {
        "id": "protocol_kopfdaten",
        "title": "1. Kopfdaten",
        "subtitle": "Kopfdaten für Protokollliste, spätere Exporte und spätere Datei-Importe",
        "openByDefault": false,
        "lockedByRuntime": true,
        "runtimeRole": "protocolListSource",
        "titleLocked": true,
        "deleteLocked": true,
        "moveLocked": true,
        "fields": [
          {
            "id": "neues_feld_mpquzb2h_lbtq4",
            "label": "Auftrags-Nummer",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 49,
            "prefill": "orderId"
          },
          {
            "id": "neues_feld_mpquzzca_6usbc",
            "label": "Datum",
            "type": "date",
            "required": true,
            "unit": "",
            "widthPercent": 49
          },
          {
            "id": "neues_feld_mpquz9g0_60asa",
            "label": "Auftraggeber",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 100,
            "prefill": "clientName"
          },
          {
            "id": "neues_feld_mpquzxkx_lls3x",
            "label": "Auftraggeber Straße",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 37,
            "prefill": "clientStreet"
          },
          {
            "id": "neues_feld_mpqv02za_544pg",
            "label": "Auftraggeber PLZ",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 20,
            "prefill": "clientZip"
          },
          {
            "id": "neues_feld_mpqv03ra_rvuf2",
            "label": "Auftraggeber Ort",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 37,
            "prefill": "clientCity"
          },
          {
            "id": "neues_feld_mpqv8040_nvpc8",
            "label": "Kunde / Objekt",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 100,
            "prefill": "customerName"
          },
          {
            "id": "neues_feld_mpqv877p_w22mq",
            "label": "Kunde / Objekt Straße",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 32,
            "prefill": "customerStreet"
          },
          {
            "id": "neues_feld_mpqv87yr_rrt3r",
            "label": "Kunde / Objekt PLZ",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 32,
            "prefill": "customerZip"
          },
          {
            "id": "neues_feld_mpqv88n3_4ovlp",
            "label": "Kunde / Objekt Ort",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 32,
            "prefill": "customerCity"
          }
        ]
      },
      {
        "id": "section_mpqvbusf_2cina",
        "title": "2. Auftrag & Leistungsbeschreibung",
        "subtitle": "Beschreibung des Abschnitts",
        "openByDefault": false,
        "fields": [
          {
            "id": "neues_feld_mpqvclo8_jmzke",
            "label": "Auftragsgrundlage",
            "type": "select",
            "required": false,
            "unit": "",
            "widthPercent": 100,
            "options": [
              "Reparatur",
              "Störung",
              "Wartung",
              "Prüfung",
              "Inbetriebnahme",
              "Installation"
            ]
          },
          {
            "id": "neues_feld_mpqvc5pe_x4l6f",
            "label": "Bechreibung",
            "type": "text",
            "required": true,
            "unit": "",
            "widthPercent": 100,
            "prefill": "orderBasis"
          },
          {
            "id": "neues_feld_mpqvc7du_idax4",
            "label": "Leistungsbeschreibung",
            "type": "textarea",
            "required": true,
            "unit": "",
            "widthPercent": 100
          }
        ]
      },
      {
        "id": "section_mpqvgle9_nen6z",
        "title": "3. Material",
        "subtitle": "Beschreibung des Abschnitts",
        "openByDefault": false,
        "fields": [
          {
            "id": "neues_feld_mpqvhtuc_w9fjy",
            "label": "Menge",
            "type": "number",
            "required": false,
            "unit": "",
            "widthPercent": 20
          },
          {
            "id": "neues_feld_mpqvhx4z_eaqk8",
            "label": "Bez",
            "type": "text",
            "required": false,
            "unit": "",
            "widthPercent": 20
          },
          {
            "id": "neues_feld_mpqvhxum_ywh6q",
            "label": "Material",
            "type": "text",
            "required": false,
            "unit": "",
            "widthPercent": 51
          }
        ]
      },
      {
        "id": "section_mpqw44rg_5kjoa",
        "title": "4. Techniker Unterschrift",
        "subtitle": "Beschreibung des Abschnitts",
        "openByDefault": false,
        "fields": [
          {
            "id": "ort_datum_mpqw4lgp_4gzv3",
            "label": "Ort / Datum",
            "type": "locationDate",
            "required": true,
            "unit": "",
            "widthPercent": 100,
            "locationLabel": "Ort",
            "dateLabel": "Datum"
          },
          {
            "id": "neues_feld_mpqw4ne2_ixh2l",
            "label": "Techniker Unterschrift",
            "type": "signature",
            "required": true,
            "unit": "",
            "widthPercent": 100
          }
        ]
      },
      {
        "id": "section_mpqw45oz_zeovs",
        "title": "5. Kunde Unterschrift",
        "subtitle": "Beschreibung des Abschnitts",
        "openByDefault": false,
        "fields": [
          {
            "id": "neue_ja_nein_frage_mpqw6m8v_gllly",
            "label": "Kunde anwesend?",
            "type": "bool",
            "required": true,
            "unit": "",
            "widthPercent": 100
          },
          {
            "id": "ort_datum_mpqw6pu5_ynbve",
            "label": "Ort / Datum",
            "type": "locationDate",
            "required": false,
            "unit": "",
            "widthPercent": 100,
            "locationLabel": "Ort",
            "dateLabel": "Datum",
            "visibleWhen": {
              "sourceFieldId": "neue_ja_nein_frage_mpqw6m8v_gllly",
              "operator": "equals",
              "value": "Ja"
            },
            "clearWhenHidden": true,
            "requiredWhen": {
              "sourceFieldId": "neue_ja_nein_frage_mpqw6m8v_gllly",
              "operator": "equals",
              "value": "Ja"
            }
          },
          {
            "id": "neues_feld_mpqw6r8d_41ltb",
            "label": "Unterschrift Kunde",
            "type": "signature",
            "required": false,
            "unit": "",
            "widthPercent": 100,
            "visibleWhen": {
              "sourceFieldId": "neue_ja_nein_frage_mpqw6m8v_gllly",
              "operator": "equals",
              "value": "Ja"
            },
            "clearWhenHidden": true,
            "requiredWhen": {
              "sourceFieldId": "neue_ja_nein_frage_mpqw6m8v_gllly",
              "operator": "equals",
              "value": "Ja"
            }
          }
        ]
      }
    ],
    "assets": {
      "headerLogo": {
        "kind": "headerLogo",
        "format": "svg",
        "filename": "logo.svg",
        "svgText": "<svg viewBox=\"0 0 520 180\" role=\"img\" aria-label=\"GEBATECH Gebäude- und Anlagentechnik Logo\" xmlns=\"http://www.w3.org/2000/svg\">\n  <defs>\n    <style>\n      .gbt-black{fill:#111111}\n      .gbt-brand{fill:#c4bd18}\n      .gbt-text{fill:#111111;font-family:Arial,Helvetica,sans-serif;font-weight:900}\n      .gbt-sub{fill:#111111;font-family:Arial,Helvetica,sans-serif;font-weight:700}\n    </style>\n  </defs>\n  <g transform=\"translate(20 12) scale(0.85) translate(-82.111 -8.672)\">\n    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"#1D1D1B\" d=\"M143.14,48.858v63.52l-0.312,0.002 c-17.541,0-31.761-14.22-31.761-31.761c0-17.542,14.22-31.762,31.761-31.762L143.14,48.858z M143.14,8.672v34.757l-0.312,0.004 c-5.72,0-10.428-4.337-11.015-9.901c-5.202,1.213-10.082,3.265-14.489,6.007c3.518,4.35,3.255,10.742-0.79,14.786 c-4.043,4.044-10.437,4.308-14.786,0.79c-2.745,4.413-4.8,9.301-6.011,14.513c5.545,0.604,9.861,5.303,9.861,11.01 c0,5.703-4.312,10.4-9.854,11.01c1.215,5.205,3.27,10.087,6.015,14.495c4.349-3.471,10.704-3.192,14.73,0.835 c4.025,4.024,4.305,10.376,0.839,14.725c4.406,2.741,9.285,4.792,14.486,6.004c0.635-5.514,5.318-9.794,11.003-9.795l0.322,0.005 v21.971l-61.028-0.003V44.081L143.14,8.672z\"/>\n    <path fill=\"#D3BF00\" d=\"M153.82,127.71c-0.621-5.411-5.141-9.637-10.681-9.795v-5.537c17.397-0.167,31.449-14.321,31.449-31.759 c0-17.438-14.052-31.594-31.449-31.761v-5.43c5.578-0.154,10.127-4.435,10.702-9.897c5.223,1.217,10.119,3.28,14.54,6.037 c-3.515,4.35-3.25,10.74,0.793,14.783c4.037,4.037,10.413,4.307,14.763,0.81c2.74,4.415,4.788,9.305,5.994,14.517 c-5.538,0.612-9.845,5.308-9.845,11.009c0,5.69,4.29,10.379,9.813,11.007c-1.218,5.196-3.274,10.07-6.018,14.472 c-4.35-3.454-10.691-3.17-14.713,0.851c-4.016,4.016-4.303,10.35-0.861,14.697C163.902,124.451,159.022,126.5,153.82,127.71z\"/>\n  </g>\n  <text x=\"160\" y=\"88\" class=\"gbt-text\" font-size=\"54\">GEBA<tspan class=\"gbt-brand\">TECH</tspan></text>\n  <text x=\"164\" y=\"122\" class=\"gbt-sub\" font-size=\"23\">GEBÄUDE | ANLAGENTECHNIK</text>\n</svg>",
        "alt": "",
        "enabled": true,
        "sizeBytes": 1996,
        "layout": {
          "scalePercent": 147,
          "positionXPercent": 50,
          "positionYPercent": 68.3
        }
      },
      "backgroundGraphic": {
        "kind": "backgroundGraphic",
        "format": "svg",
        "filename": "frontpage_gear.svg",
        "svgText": "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generator: Adobe Illustrator 15.1.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"500px\"\n\t height=\"500px\" viewBox=\"0 0 500 500\" enable-background=\"new 0 0 500 500\" xml:space=\"preserve\">\n<g id=\"Hintergrund\">\n</g>\n<g id=\"Hilfslinien_anzeigen\">\n</g>\n<g id=\"Vordergrund\">\n\t<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"#D3BF00\" d=\"M87.013,249.988c0-90,72.957-162.957,162.957-162.957\n\t\ts162.957,72.957,162.957,162.957S339.97,412.945,249.97,412.945S87.013,339.988,87.013,249.988z M8.357,193.592\n\t\tc6.216-26.736,16.755-51.814,30.842-74.457c22.317,18.046,55.116,16.694,75.864-4.054s22.1-53.547,4.054-75.865\n\t\tc22.609-14.065,47.647-24.595,74.34-30.814c3.011,28.552,27.163,50.8,56.513,50.8s53.503-22.248,56.514-50.8\n\t\tc26.793,6.243,51.918,16.828,74.594,30.973c-18.029,22.318-16.673,55.104,4.07,75.848c20.711,20.711,53.428,22.097,75.744,4.155\n\t\tc14.057,22.652,24.566,47.736,30.752,74.477c-28.413,3.144-50.51,27.232-50.51,56.484c0,29.196,22.016,53.25,50.352,56.468\n\t\tc-6.25,26.664-16.799,51.673-30.88,74.252c-22.31-17.719-54.849-16.264-75.478,4.365c-20.605,20.606-22.078,53.1-4.422,75.408\n\t\tc-22.608,14.049-47.644,24.562-74.333,30.768c-3.249-28.301-27.285-50.278-56.456-50.277c-29.161,0-53.191,21.965-56.453,50.253\n\t\tc-26.686-6.217-51.719-16.741-74.322-30.801c17.781-22.312,16.347-54.902-4.305-75.553c-20.659-20.658-53.266-22.086-75.577-4.284\n\t\tC25.175,358.322,14.63,333.275,8.4,306.57c28.433-3.125,50.553-27.224,50.552-56.488C58.952,220.804,36.81,196.697,8.357,193.592z\"\n\t\t/>\n</g>\n</svg>",
        "alt": "",
        "enabled": true,
        "sizeBytes": 1753,
        "layout": {
          "scalePercent": 113,
          "positionXPercent": 102.9,
          "positionYPercent": 56.2
        }
      }
    },
    "runtime": {
      "protocols": {
        "enabled": true,
        "listSectionId": "protocol_kopfdaten",
        "listFieldIds": [
          "neues_feld_mpquzb2h_lbtq4",
          "neues_feld_mpquz9g0_60asa",
          "neues_feld_mpqv8040_nvpc8"
        ],
        "dataSource": {
          "mode": "manual"
        },
        "maxBuilderPreviewProtocols": 2,
        "allowDuplicate": false,
        "allowIncompleteInList": true,
        "blockExportWhenIncomplete": true,
        "jsonImportMode": "ask-add-or-replace",
        "afterZipExport": "ask-clear-or-keep",
        "storage": "temporary-local-until-final-zip",
        "exports": {
          "json": false,
          "csv": true,
          "pdf": true,
          "html": true,
          "images": false
        }
      }
    },
    "rendering": {
      "print": {
        "version": "0.1.0",
        "enabled": true,
        "target": "new-window",
        "dataSource": "selected-test-protocol",
        "page": {
          "format": "A4",
          "orientation": "portrait",
          "widthMm": 210,
          "heightMm": 297,
          "marginMm": 8
        },
        "layout": {
          "mode": "reference-report",
          "sectionMode": "tables",
          "showEmptyFields": true,
          "showHiddenRuleFields": false,
          "includeFileFields": false,
          "includeFileMetadata": false
        },
        "header": {
          "showLogo": true,
          "showTitle": true,
          "showSubtitle": true,
          "showVersion": true,
          "logoMaxWidthMm": 52,
          "logoMaxHeightMm": 18
        },
        "background": {
          "showGraphic": true,
          "mode": "watermark",
          "opacityPercent": 8,
          "scalePercent": 100,
          "positionXPercent": 50,
          "positionYPercent": 50
        },
        "footer": {
          "showFooter": true,
          "repeatOnEachPage": true
        },
        "fieldOutput": {
          "textMode": "value-cell",
          "textareaMode": "box",
          "boolMode": "yes-no-columns",
          "selectMode": "value-cell",
          "checklistMode": "yes-no-note-table",
          "locationDateMode": "location-date-lines",
          "coordinatesMode": "coordinates-lines",
          "signatureMode": "image-or-status",
          "fileMode": "omit"
        },
        "exportRules": {
          "allowIncompleteProtocols": false,
          "onePdfPerProtocol": true,
          "includePhotos": false,
          "includeFileMetadata": false
        }
      },
      "section": {
        "mode": "details-card",
        "rememberOpenState": true,
        "summaryLayout": "title-subtitle-count"
      },
      "fields": {
        "bool": "yes-no-pills",
        "checklist": "yes-no-pills-with-note",
        "locationDate": "location-date-pair",
        "coordinates": "coordinates-button",
        "signature": "canvas-signature",
        "file": "file-list-metadata",
        "widthMode": "percent"
      },
      "validation": {
        "showRequiredMarker": true,
        "showSummaryStatus": true
      },
      "pdf": {
        "version": "0.1.0",
        "enabled": true,
        "source": "html-print-preview",
        "engine": "html2canvas-jspdf",
        "dependencyMode": "cdn-prepared-local-later",
        "libraries": {
          "html2canvas": {
            "globalName": "html2canvas",
            "cdnUrl": "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            "localPath": "js/vendor/html2canvas.min.js"
          },
          "jspdf": {
            "globalName": "jspdf.jsPDF",
            "cdnUrl": "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
            "localPath": "js/vendor/jspdf.umd.min.js"
          }
        },
        "page": {
          "format": "a4",
          "orientation": "p",
          "unit": "mm",
          "widthMm": 210,
          "heightMm": 297
        },
        "render": {
          "scale": 3,
          "backgroundColor": "#ffffff",
          "useCORS": true,
          "imageType": "PNG",
          "imageQuality": 1,
          "pageBreakMode": "canvas-slice"
        }
      },
      "version": "0.2.0"
    },
    "id": "gbtlieferschein"
  },
  "manifest": {
    "exportVersion": "0.1.0",
    "generatedAt": "2026-05-29T12:41:49.248Z",
    "appType": "form-runtime-config",
    "target": "static-runtime-webapp",
    "filesPlanned": [
      "index.html",
      "css/app.css",
      "js/form-config.js",
      "js/runtime-state.js",
      "js/runtime-app.js",
      "js/runtime-coordinates-field.js",
      "js/runtime-assets.js",
      "js/runtime-footer.js",
      "js/runtime-zip-export-actions.js",
      "assets/",
      "README.md",
      ".nojekyll"
    ],
    "currentFile": "js/form-config.js",
    "schemaTitle": "Arbeitsnachweis / Lieferschein",
    "schemaVersion": "0.3.0",
    "runtime": {
      "protocols": {
        "enabled": true,
        "listSectionId": "protocol_kopfdaten",
        "listFieldIds": [
          "neues_feld_mpquzb2h_lbtq4",
          "neues_feld_mpquz9g0_60asa",
          "neues_feld_mpqv8040_nvpc8"
        ],
        "dataSource": {
          "mode": "manual"
        },
        "maxBuilderPreviewProtocols": 2,
        "allowDuplicate": false,
        "allowIncompleteInList": true,
        "blockExportWhenIncomplete": true,
        "jsonImportMode": "ask-add-or-replace",
        "afterZipExport": "ask-clear-or-keep",
        "storage": "temporary-local-until-final-zip",
        "exports": {
          "json": false,
          "csv": true,
          "pdf": true,
          "html": true,
          "images": false
        }
      }
    }
  }
};
