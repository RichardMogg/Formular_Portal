'use strict';

(function () {
  // IndexedDB Persistent Storage for Photos
  var dbName = 'FormRuntimePhotoDB';
  var storeName = 'photos';
  var db = null;

  function initDB() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        console.warn('IndexedDB is not supported by this browser. Falling back to temporary in-memory RAM storage.');
        resolve(null);
        return;
      }
      var request = window.indexedDB.open(dbName, 1);
      request.onupgradeneeded = function (event) {
        var database = event.target.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = function (event) {
        db = event.target.result;
        resolve(db);
      };
      request.onerror = function (event) {
        console.error('IndexedDB open error:', event.target.error);
        resolve(null); // fallback gracefully
      };
    });
  }

  function getDB() {
    if (db) return Promise.resolve(db);
    return initDB();
  }

  function savePhoto(recordId, fieldId, index, name, type, size, data) {
    return getDB().then(function (database) {
      if (!database) {
        // RAM fallback
        window.FormRuntimeAppPhotoStore = window.FormRuntimeAppPhotoStore || {};
        window.FormRuntimeAppPhotoStore[recordId] = window.FormRuntimeAppPhotoStore[recordId] || {};
        window.FormRuntimeAppPhotoStore[recordId][fieldId] = window.FormRuntimeAppPhotoStore[recordId][fieldId] || [];
        window.FormRuntimeAppPhotoStore[recordId][fieldId].push({
          name: name,
          type: type,
          size: size,
          data: data
        });
        return Promise.resolve();
      }
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var id = recordId + '_' + fieldId + '_' + index;
        var request = store.put({
          id: id,
          recordId: recordId,
          fieldId: fieldId,
          index: index,
          name: name,
          type: type,
          size: size,
          data: data
        });
        tx.oncomplete = function () {
          resolve();
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  function getPhotosForRecord(recordId) {
    return getDB().then(function (database) {
      if (!database) {
        // RAM fallback
        window.FormRuntimeAppPhotoStore = window.FormRuntimeAppPhotoStore || {};
        var recordPhotos = window.FormRuntimeAppPhotoStore[recordId] || {};
        var list = [];
        Object.keys(recordPhotos).forEach(function (fieldId) {
          var filesList = recordPhotos[fieldId] || [];
          filesList.forEach(function (file, index) {
            list.push({
              recordId: recordId,
              fieldId: fieldId,
              index: index,
              name: file.name,
              type: file.type,
              size: file.size,
              data: file.data
            });
          });
        });
        return Promise.resolve(list);
      }
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, 'readonly');
        var store = tx.objectStore(storeName);
        var list = [];
        
        var request = store.openCursor();
        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            if (cursor.value.recordId === recordId) {
              list.push(cursor.value);
            }
            cursor.continue();
          } else {
            resolve(list);
          }
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    });
  }

  function renameRecordPhotos(oldRecordId, newRecordId) {
    return getDB().then(function (database) {
      if (!database) {
        // RAM fallback
        window.FormRuntimeAppPhotoStore = window.FormRuntimeAppPhotoStore || {};
        if (window.FormRuntimeAppPhotoStore[oldRecordId]) {
          window.FormRuntimeAppPhotoStore[newRecordId] = window.FormRuntimeAppPhotoStore[oldRecordId];
          delete window.FormRuntimeAppPhotoStore[oldRecordId];
        }
        return Promise.resolve();
      }
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var itemsToMove = [];

        var request = store.openCursor();
        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            if (cursor.value.recordId === oldRecordId) {
              itemsToMove.push(cursor.value);
            }
            cursor.continue();
          } else {
            var movePromises = itemsToMove.map(function (item) {
              var oldId = item.id;
              var newItem = Object.assign({}, item, {
                id: newRecordId + '_' + item.fieldId + '_' + item.index,
                recordId: newRecordId
              });
              return new Promise(function (res) {
                var delReq = store.delete(oldId);
                delReq.onsuccess = function () {
                  store.put(newItem).onsuccess = function () {
                    res();
                  };
                };
                delReq.onerror = function () {
                  res(); // ignore error on delete to keep moving
                };
              });
            });
            Promise.all(movePromises).then(function () {
              resolve();
            }).catch(reject);
          }
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    });
  }

  function deletePhotosForRecord(recordId) {
    return getDB().then(function (database) {
      if (!database) {
        // RAM fallback
        window.FormRuntimeAppPhotoStore = window.FormRuntimeAppPhotoStore || {};
        if (window.FormRuntimeAppPhotoStore[recordId]) {
          delete window.FormRuntimeAppPhotoStore[recordId];
        }
        return Promise.resolve();
      }
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var keysToDelete = [];

        var request = store.openCursor();
        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            if (cursor.value.recordId === recordId) {
              keysToDelete.push(cursor.value.id);
            }
            cursor.continue();
          } else {
            var deletePromises = keysToDelete.map(function (key) {
              return new Promise(function (res) {
                store.delete(key).onsuccess = function () { res(); };
              });
            });
            Promise.all(deletePromises).then(function () {
              resolve();
            }).catch(reject);
          }
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    });
  }

  // Global memory storage fallback if IndexedDB is disabled
  window.FormRuntimeAppPhotoStore = {};

  function clearAllPhotos() {
    return getDB().then(function (database) {
      if (!database) {
        // RAM fallback
        window.FormRuntimeAppPhotoStore = {};
        return Promise.resolve();
      }
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var request = store.clear();
        tx.oncomplete = function () {
          resolve();
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  // Initialize DB on start
  initDB().catch(function (err) {
    console.error('Failed to initialize photo IndexedDB persistent storage:', err);
  });

  // 1. Hook state management to move/delete photo files
  var originalAdd = window.addRuntimeProtocolRecord;
  if (originalAdd) {
    window.addRuntimeProtocolRecord = function (runtimeState, record, options) {
      var res = originalAdd.apply(this, arguments);
      renameRecordPhotos('draft', record.recordId)
        .catch(function (err) {
          console.error('Failed to rename draft photos to record:', err);
        });
      return res;
    };
  }

  var originalDelete = window.deleteRuntimeProtocolRecord;
  if (originalDelete) {
    window.deleteRuntimeProtocolRecord = function (runtimeState, recordId) {
      var res = originalDelete.apply(this, arguments);
      deletePhotosForRecord(recordId)
        .catch(function (err) {
          console.error('Failed to delete photos for record:', err);
        });
      return res;
    };
  }

  // 2. Intercept file uploads and load them into memory/IndexedDB
  document.addEventListener('change', function (event) {
    var el = event.target;
    if (el.tagName === 'INPUT' && el.type === 'file' && el.hasAttribute('data-file')) {
      var fieldId = el.getAttribute('data-file');
      var files = Array.prototype.slice.call(el.files || []);
      if (!files.length) return;

      var app = window.FormRuntimeApp;
      var editingId = app && typeof app.getEditingId === 'function' ? app.getEditingId() : '';
      var scopeId = editingId || 'draft';

      files.forEach(function (file, fileIdx) {
        var reader = new FileReader();
        reader.onload = function () {
          var binaryData = new Uint8Array(reader.result);
          savePhoto(scopeId, fieldId, fileIdx, file.name, file.type || 'application/octet-stream', file.size || 0, binaryData)
            .catch(function (err) {
              console.error('Failed to save photo to IndexedDB:', err);
            });
        };
        reader.readAsArrayBuffer(file);
      });
    }
  });

  // 3. Clear draft photos on reset/new protocol
  document.addEventListener('DOMContentLoaded', function () {
    var clearBtn = document.getElementById('runtimeClearDraftButton');
    var newBtn = document.getElementById('runtimeNewProtocolButton');
    var handleReset = function () {
      deletePhotosForRecord('draft')
        .catch(function (err) {
          console.error('Failed to clear draft photos:', err);
        });
    };
    if (clearBtn) clearBtn.addEventListener('click', handleReset);
    if (newBtn) newBtn.addEventListener('click', handleReset);
  });

  // 4. Helper for ZIP Date/Time and CRC32 (Standard ZIP format in browser)
  function dosDateTime(date) {
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  var crcTable = null;
  function crc32(bytes) {
    if (!crcTable) {
      crcTable = [];
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[n] = c >>> 0;
      }
    }
    var crc = 0 ^ -1;
    for (var i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function utf8(str) {
    return new TextEncoder().encode(String(str || ''));
  }

  function writeU16(arr, offset, value) {
    arr[offset] = value & 255;
    arr[offset + 1] = (value >>> 8) & 255;
  }

  function writeU32(arr, offset, value) {
    arr[offset] = value & 255;
    arr[offset + 1] = (value >>> 8) & 255;
    arr[offset + 2] = (value >>> 16) & 255;
    arr[offset + 3] = (value >>> 24) & 255;
  }

  function concatUint8Arrays(parts) {
    var total = parts.reduce(function (sum, part) { return sum + part.length; }, 0);
    var out = new Uint8Array(total);
    var offset = 0;
    parts.forEach(function (part) {
      out.set(part, offset);
      offset += part.length;
    });
    return out;
  }

  function buildZip(files) {
    var localParts = [];
    var centralParts = [];
    var offset = 0;
    var now = new Date();
    var dt = dosDateTime(now);

    files.forEach(function (file) {
      var nameBytes = utf8(file.name);
      var dataBytes = file.data instanceof Uint8Array ? file.data : utf8(String(file.data || ''));
      var crc = crc32(dataBytes);

      var local = new Uint8Array(30 + nameBytes.length);
      writeU32(local, 0, 0x04034b50);
      writeU16(local, 4, 20);
      writeU16(local, 6, 0x0800);
      writeU16(local, 8, 0);
      writeU16(local, 10, dt.time);
      writeU16(local, 12, dt.date);
      writeU32(local, 14, crc);
      writeU32(local, 18, dataBytes.length);
      writeU32(local, 22, dataBytes.length);
      writeU16(local, 26, nameBytes.length);
      writeU16(local, 28, 0);
      local.set(nameBytes, 30);

      localParts.push(local, dataBytes);

      var central = new Uint8Array(46 + nameBytes.length);
      writeU32(central, 0, 0x02014b50);
      writeU16(central, 4, 20);
      writeU16(central, 6, 20);
      writeU16(central, 8, 0x0800);
      writeU16(central, 10, 0);
      writeU16(central, 12, dt.time);
      writeU16(central, 14, dt.date);
      writeU32(central, 16, crc);
      writeU32(central, 20, dataBytes.length);
      writeU32(central, 24, dataBytes.length);
      writeU16(central, 28, nameBytes.length);
      writeU16(central, 30, 0);
      writeU16(central, 32, 0);
      writeU16(central, 34, 0);
      writeU16(central, 36, 0);
      writeU32(central, 38, 0);
      writeU32(central, 42, offset);
      central.set(nameBytes, 46);

      centralParts.push(central);
      offset += local.length + dataBytes.length;
    });

    var centralSize = centralParts.reduce(function (sum, part) { return sum + part.length; }, 0);
    var end = new Uint8Array(22);
    writeU32(end, 0, 0x06054b50);
    writeU16(end, 4, 0);
    writeU16(end, 6, 0);
    writeU16(end, 8, files.length);
    writeU16(end, 10, files.length);
    writeU32(end, 12, centralSize);
    writeU32(end, 16, offset);
    writeU16(end, 20, 0);

    return concatUint8Arrays(localParts.concat(centralParts).concat([end]));
  }

  // 5. Dynamic CSV builder
  function buildCsvForProtocols(schema, protocols) {
    var rows = [];
    rows.push(['Protokoll_ID', 'Bereich', 'Feld_ID', 'Feld_Label', 'Wert', 'Bemerkung/Einheit']);

    protocols.forEach(function (record) {
      var recordId = record.recordId;
      var data = record.data || {};

      (schema.sections || []).forEach(function (section) {
        (section.fields || []).forEach(function (field) {
          var val = data[field.id];
          if (val === undefined || val === null) return;

          if (field.type === 'checklist') {
            var stored = val && typeof val === 'object' ? val : {};
            Object.keys(stored).forEach(function (option) {
              var optVal = stored[option] || {};
              rows.push([recordId, section.title, field.id + '_' + option, option, optVal.answer || '', optVal.note || '']);
            });
          } else if (field.type === 'locationDate') {
            var loc = val && typeof val === 'object' && !Array.isArray(val) ? val : {};
            rows.push([recordId, section.title, field.id, field.label, (loc.location || '') + ' / ' + (loc.date || ''), '']);
          } else if (field.type === 'coordinates') {
            var coor = val && typeof val === 'object' && !Array.isArray(val) ? val : {};
            rows.push([recordId, section.title, field.id, field.label, 'Lat: ' + (coor.latitude || '') + ' / Lon: ' + (coor.longitude || ''), '']);
          } else if (field.type === 'file') {
            var files = Array.isArray(val) ? val : [];
            var fileNames = files.map(function (f) { return f.name; }).join(', ');
            rows.push([recordId, section.title, field.id, field.label, fileNames, 'Anzahl: ' + files.length]);
          } else {
            rows.push([recordId, section.title, field.id, field.label, String(val), field.unit || '']);
          }
        });
      });
    });

    return rows.map(function (row) {
      return row.map(function (cell) {
        var text = String(cell == null ? '' : cell);
        if (/[";\r\n]/.test(text)) {
          text = '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
      }).join(';');
    }).join('\r\n');
  }

  // 5.5 Helper to get clean list field values for folder naming
  function buildCleanRecordValueString(schema, record) {
    var protocols = schema.runtime && schema.runtime.protocols ? schema.runtime.protocols : {};
    var listFieldIds = Array.isArray(protocols.listFieldIds) ? protocols.listFieldIds : [];
    var data = record.data || {};
    var parts = [];

    function formatLabelValue(value) {
      if (typeof formatRuntimeProtocolLabelValue === 'function') {
        return formatRuntimeProtocolLabelValue(value);
      }
      if (Array.isArray(value)) {
        return value.map(function (item) {
          if (item && typeof item === 'object') return item.name || item.filename || '[Datei]';
          return String(item == null ? '' : item).trim();
        }).filter(Boolean).join(', ');
      }
      if (value && typeof value === 'object') {
        return Object.keys(value).map(function (key) {
          var item = value[key];
          if (item && typeof item === 'object') return item.answer ? key + ': ' + item.answer : '';
          return item ? key : '';
        }).filter(Boolean).join(', ');
      }
      return String(value == null ? '' : value).trim();
    }

    listFieldIds.forEach(function (fieldId) {
      var val = data[fieldId];
      if (val !== undefined && val !== null && val !== '') {
        var formattedVal = formatLabelValue(val);
        if (formattedVal) {
          parts.push(formattedVal);
        }
      }
    });

    return parts.length ? parts.join(' · ') : '';
  }

  var printLoading = null;
  var pdfLoading = null;

  function loadScriptOnce(path, check) {
    if (check()) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = path;
      script.onload = function () {
        if (check()) {
          resolve();
          return;
        }

        reject(new Error(path + ' wurde geladen, ist aber nicht verfügbar.'));
      };
      script.onerror = function () {
        reject(new Error(path + ' konnte nicht geladen werden.'));
      };
      document.body.appendChild(script);
    });
  }

  function ensurePrintRenderer() {
    if (!printLoading) {
      printLoading = loadScriptOnce('js/print-renderer.js', function () {
        return !!(window.FormPrintRenderer && typeof window.FormPrintRenderer.buildHtml === 'function');
      });
    }
    return printLoading;
  }

  function ensurePdfRenderer() {
    if (!pdfLoading) {
      pdfLoading = loadScriptOnce('js/pdf-renderer.js', function () {
        return !!(window.FormPdfRenderer && typeof window.FormPdfRenderer.generateBytes === 'function');
      });
    }
    return pdfLoading;
  }

  function updateZipStatus(msg, type) {
    var el = document.getElementById('runtimeStatus');
    if (el) {
      el.className = 'status ' + (type || '');
      el.textContent = msg || '';
    }
  }

  function clearAllSignaturesFromProtocols(schema, state, app) {
    var protocols = state && Array.isArray(state.protocols) ? state.protocols : [];
    var signatureFieldIds = [];

    (schema.sections || []).forEach(function (section) {
      (section.fields || []).forEach(function (field) {
        if (field.type === 'signature') {
          signatureFieldIds.push(field.id);
        }
      });
    });

    if (!signatureFieldIds.length) {
      return;
    }

    // 1. Clear saved protocols signatures
    protocols.forEach(function (record) {
      var data = record.data || {};
      signatureFieldIds.forEach(function (fieldId) {
        if (data[fieldId] !== undefined) {
          data[fieldId] = '';
        }
      });
    });

    // 2. Clear draft signatures
    var draftData = state.draft && state.draft.data ? state.draft.data : null;
    if (draftData) {
      signatureFieldIds.forEach(function (fieldId) {
        if (draftData[fieldId] !== undefined) {
          draftData[fieldId] = '';
        }
      });
    }

    // 3. Clear active form in-memory signatures
    var appData = app.getFormData ? app.getFormData() : null;
    if (appData) {
      signatureFieldIds.forEach(function (fieldId) {
        if (appData[fieldId] !== undefined) {
          appData[fieldId] = '';
        }
      });
    }

    // 4. Securely release graphics memory for any active canvas DOM elements
    if (typeof secureReleaseCanvasMemory === 'function') {
      document.querySelectorAll('canvas.signature-canvas').forEach(function (canvas) {
        secureReleaseCanvasMemory(canvas);
      });
    }
  }

  function persistRuntimeState(schema, state) {
    var key = 'form-runtime-state:' + String(schema.id || schema.schemaVersion || schema.title || 'default');
    state.savedAt = new Date().toISOString();
    try {
      if (window.localStorage) {
        if (typeof secureShredLocalStorageKey === 'function') {
          secureShredLocalStorageKey(key);
        }
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (e) {
      console.error('Speichern im Browser fehlgeschlagen:', e);
    }
  }

  // 6. Generic zip export runner
  async function exportZip() {
    var app = window.FormRuntimeApp;
    if (!app) return;

    var schema = app.getSchema();
    var state = app.getState();
    var protocols = state && Array.isArray(state.protocols) ? state.protocols : [];

    if (!protocols.length) {
      window.alert('Noch keine Protokolle in der Liste zum Exportieren.');
      return;
    }

    var exportsConfig = schema.runtime && schema.runtime.protocols && schema.runtime.protocols.exports
      ? schema.runtime.protocols.exports
      : { json: true, csv: true, pdf: true, html: true, images: true };

    // Dynamic lazy-loading of PDF & Print Renderers if required
    if (exportsConfig.html !== false || exportsConfig.pdf !== false) {
      updateZipStatus('Export-Engines werden geladen...', 'warn');
      if (exportsConfig.html !== false) {
        try {
          await ensurePrintRenderer();
        } catch (err_print) {
          console.error('Konnte print-renderer.js nicht laden:', err_print);
        }
      }
      if (exportsConfig.pdf !== false) {
        try {
          await ensurePrintRenderer();
          await ensurePdfRenderer();
        } catch (err_pdf) {
          console.error('Konnte pdf-renderer.js nicht laden:', err_pdf);
        }
      }
      updateZipStatus('Export-Engines geladen.', 'ok');
    }

    var editingId = app.getEditingId ? app.getEditingId() : '';
    if (editingId) {
      if (!window.confirm('Achtung: Es befindet sich noch ein Protokoll im Bearbeitungsmodus. Seine ungespeicherten Entwurfsdaten werden nicht exportiert. Trotzdem fortfahren?')) {
        return;
      }
    }

    var files = [];
    var now = new Date();
    var dateString = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    
    // Sluggified Formular-ID (schema.id) or title as filename prefix (Section 1)
    var titleSlug = schema.id ? String(schema.id).trim() : '';
    if (!titleSlug && schema.title) {
      titleSlug = schema.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }
    titleSlug = titleSlug || 'formular';
    var zipFileName = titleSlug + '_' + dateString + '.zip';

    // Direct single format download if only 1 is active (no ZIP creation)
    var activeFormats = [];
    if (exportsConfig.json !== false) activeFormats.push('json');
    if (exportsConfig.csv !== false) activeFormats.push('csv');
    if (exportsConfig.pdf !== false) activeFormats.push('pdf');
    if (exportsConfig.html !== false) activeFormats.push('html');
    if (exportsConfig.images !== false) activeFormats.push('images');

    if (activeFormats.length === 1) {
      var singleFormat = activeFormats[0];
      updateZipStatus('Dateien werden erzeugt...', 'warn');

      if (singleFormat === 'json') {
        var jsonPayload = {
          exportFormat: 'FORM_BUILDER_EXPORT_JSON_V1',
          exportedAt: now.toISOString(),
          schemaTitle: schema.title,
          schemaVersion: schema.version,
          protocols: protocols
        };
        var blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = titleSlug + '_export.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      else if (singleFormat === 'csv') {
        var csvContent = buildCsvForProtocols(schema, protocols);
        var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        var csvBytes = new TextEncoder().encode(csvContent);
        var csvWithBom = new Uint8Array(bom.length + csvBytes.length);
        csvWithBom.set(bom, 0);
        csvWithBom.set(csvBytes, bom.length);
        var blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = titleSlug + '_export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      else if (singleFormat === 'pdf') {
        for (var i = 0; i < protocols.length; i++) {
          var record = protocols[i];
          var filename = window.FormPdfRenderer.buildFilename(record, 'protokoll');
          await window.FormPdfRenderer.download(schema, record.data || {}, filename);
        }
      }

      else if (singleFormat === 'html') {
        for (var i = 0; i < protocols.length; i++) {
          var record = protocols[i];
          var htmlContent = window.FormPrintRenderer.buildHtml(schema, record.data || {});
          var blob = new Blob([htmlContent], { type: 'text/html' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          var suffix = buildCleanRecordValueString(schema, record).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          link.download = 'protokoll_' + String(i + 1).padStart(3, '0') + (suffix ? '_' + suffix : '') + '.html';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }

      else if (singleFormat === 'images') {
        var downloadedAny = false;
        for (var idx = 0; idx < protocols.length; idx++) {
          var record = protocols[idx];
          try {
            var photos = await getPhotosForRecord(record.recordId);
            photos.forEach(function (photo) {
              var blob = new Blob([photo.data], { type: photo.type });
              var url = URL.createObjectURL(blob);
              var link = document.createElement('a');
              link.href = url;
              link.download = 'protokoll_' + String(idx + 1).padStart(3, '0') + '_' + photo.name;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              downloadedAny = true;
            });
          } catch (err_photos) {
            console.error('Konnte Fotos aus IndexedDB nicht lesen:', err_photos);
          }
        }
        if (!downloadedAny) {
          window.alert('Keine Fotos/Dateien zum Herunterladen gefunden.');
        }
      }

      updateZipStatus('Export abgeschlossen.', 'ok');
      
      var clearNow = window.confirm('Export abgeschlossen.\n\nSollen alle Protokolle jetzt aus dem lokalen Browser-Speicher gelöscht werden, um Platz freizugeben?');
      if (clearNow) {
        state.protocols = [];
        clearAllPhotos().catch(function (err) {
          console.error('Fehler beim Löschen der Fotos aus IndexedDB:', err);
        });
        persistRuntimeState(schema, state);
        app.renderForm();
        app.renderProtocolList();
        updateZipStatus('Lokale Protokolle wurden gelöscht.', 'ok');
      } else {
        clearAllSignaturesFromProtocols(schema, state, app);
        persistRuntimeState(schema, state);
        app.renderForm();
        app.renderProtocolList();
        updateZipStatus('Export abgeschlossen. Unterschriften wurden sicherheitsgelöscht.', 'ok');
      }
      return;
    }

    // 1. JSON
    if (exportsConfig.json !== false) {
      var jsonPayload = {
        exportFormat: 'FORM_BUILDER_EXPORT_JSON_V1',
        exportedAt: now.toISOString(),
        schemaTitle: schema.title,
        schemaVersion: schema.version,
        protocols: protocols
      };
      files.push({ name: 'protokolle.json', data: JSON.stringify(jsonPayload, null, 2) });
    }

    // 2. CSV
    if (exportsConfig.csv !== false) {
      var csvContent = buildCsvForProtocols(schema, protocols);
      // UTF-8 BOM
      var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      var csvBytes = new TextEncoder().encode(csvContent);
      var csvWithBom = new Uint8Array(bom.length + csvBytes.length);
      csvWithBom.set(bom, 0);
      csvWithBom.set(csvBytes, bom.length);
      files.push({ name: 'protokolle.csv', data: csvWithBom });
    }

    // 3. Loop over all protocols
    for (var i = 0; i < protocols.length; i++) {
      var record = protocols[i];
      
      // Determine folder name using record's selected list fields or label
      var folderName = 'protokoll_' + String(i + 1).padStart(3, '0');
      var cleanSuffix = '';
      var recordValues = buildCleanRecordValueString(schema, record);
      if (recordValues) {
        cleanSuffix = recordValues.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      } else if (record.label) {
        cleanSuffix = record.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      }
      
      if (cleanSuffix) {
        folderName += '_' + cleanSuffix.slice(0, 30);
      }
      folderName += '/';

      // HTML
      if (exportsConfig.html !== false && window.FormPrintRenderer && typeof window.FormPrintRenderer.buildHtml === 'function') {
        try {
          var htmlContent = window.FormPrintRenderer.buildHtml(schema, record.data || {});
          files.push({ name: folderName + 'druckansicht.html', data: htmlContent });
        } catch (e_html) {
          console.error('Error generating HTML for record ' + record.recordId, e_html);
        }
      }

      // PDF
      if (exportsConfig.pdf !== false && window.FormPdfRenderer && typeof window.FormPdfRenderer.generateBytes === 'function') {
        try {
          var pdfBytes = await window.FormPdfRenderer.generateBytes(schema, record.data || {});
          files.push({ name: folderName + 'protokoll.pdf', data: pdfBytes });
        } catch (e_pdf) {
          console.error('Error generating PDF for record ' + record.recordId, e_pdf);
        }
      }

      // Photos/Attachments
      if (exportsConfig.images !== false) {
        try {
          var photos = await getPhotosForRecord(record.recordId);
          photos.forEach(function (photo) {
            var fieldId = photo.fieldId;
            var fieldLabel = fieldId;
            (schema.sections || []).forEach(function (sec) {
              (sec.fields || []).forEach(function (f) {
                if (f.id === fieldId && f.label) {
                  fieldLabel = f.label;
                }
              });
            });
            var cleanFieldLabel = fieldLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            var fileName = String(photo.index + 1).padStart(3, '0') + '_' + photo.name.replace(/[^a-zA-Z0-9\._\-]+/g, '_');
            files.push({
              name: folderName + 'fotos-dateien/' + cleanFieldLabel + '/' + fileName,
              data: photo.data
            });
          });
        } catch (err_photos) {
          console.error('Konnte Fotos aus IndexedDB nicht lesen für Protokoll ' + record.recordId, err_photos);
        }
      }
    }

    // 7. Compile ZIP and trigger download
    try {
      var zipData = buildZip(files);
      var blob = new Blob([zipData], { type: 'application/zip' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

      // Cleanup popup
      var clearNow = window.confirm('ZIP-Export abgeschlossen.\n\nSollen alle Protokolle jetzt aus dem lokalen Browser-Speicher gelöscht werden, um Platz freizugeben?');
      if (clearNow) {
        state.protocols = [];
        clearAllPhotos().catch(function (err) {
          console.error('Fehler beim Löschen der Fotos aus IndexedDB:', err);
        });
        persistRuntimeState(schema, state);
        app.renderForm();
        app.renderProtocolList();
        updateZipStatus('Lokale Protokolle wurden gelöscht.', 'ok');
      } else {
        clearAllSignaturesFromProtocols(schema, state, app);
        persistRuntimeState(schema, state);
        app.renderForm();
        app.renderProtocolList();
        updateZipStatus('ZIP-Export abgeschlossen. Unterschriften wurden sicherheitsgelöscht.', 'ok');
      }
    } catch (zipErr) {
      window.alert('ZIP-Export fehlgeschlagen: ' + zipErr.message);
    }
  }

  // Publish namespace globally
  window.FormRuntimeZipExportActions = {
    exportZip: exportZip
  };
})();
