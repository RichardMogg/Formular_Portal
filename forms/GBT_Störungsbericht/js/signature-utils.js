'use strict';

var SIGNATURE_CANVAS_DISPLAY_HEIGHT_PX = 195;

function isSignatureValue(value) {
  if (!value) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return value.signed === true && typeof value.dataUrl === 'string' && value.dataUrl.indexOf('data:image/') === 0;
}

function createSignatureValue(dataUrl, meta) {
  return Object.assign({
    signed: true,
    dataUrl: String(dataUrl || ''),
    signedAt: new Date().toISOString()
  }, meta || {});
}

function clearSignatureValue() {
  return '';
}

function getSignatureDataUrl(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.indexOf('data:image/') === 0 ? value : '';
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value.dataUrl || value.image || value.signatureDataUrl || '';
  }

  return '';
}

function getSignatureStatusText(value) {
  if (!value) {
    return 'Noch keine Unterschrift';
  }

  if (isSignatureValue(value)) {
    return 'Unterschrift vorhanden';
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value.status || value.name || value.signer || '';
  }

  return String(value || '').trim() || 'Noch keine Unterschrift';
}

function isSignatureMissing(value) {
  return !isSignatureValue(value);
}

function injectSignatureCanvasStyle() {
  if (document.getElementById('signatureCanvasSharedStyle')) {
    return;
  }

  var style = document.createElement('style');
  style.id = 'signatureCanvasSharedStyle';
  style.textContent = [
    '.signature-canvas-wrap{width:100%;border:2px solid var(--border);border-radius:12px;background:#fff;overflow:hidden;margin-top:8px;}',
    '.signature-canvas{display:block;width:100%;height:' + SIGNATURE_CANVAS_DISPLAY_HEIGHT_PX + 'px;background:#fff;touch-action:none;cursor:crosshair;}',
    '.signature-status{margin-top:8px;}',
    '.signature-actions{margin-top:8px;}',
    '.signature-canvas-runtime{width:100%;}'
  ].join('');
  document.head.appendChild(style);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSignatureCanvasStyle);
} else {
  injectSignatureCanvasStyle();
}

if (typeof validateForm === 'function') {
  var validateFormBeforeSignatureHelpers = validateForm;

  validateForm = function (schemaSource, dataSource) {
    var issues = [];

    schemaSource.sections.forEach(function (section) {
      (section.fields || []).forEach(function (field) {
        if (!field.required) {
          return;
        }

        var value = dataSource[field.id];
        var missing = false;

        if (field.type === 'checklist') {
          missing = !value || !Object.keys(value).some(function (key) {
            return value[key] && value[key].answer;
          });
        } else if (field.type === 'file') {
          missing = !Array.isArray(value) || value.length === 0;
        } else if (field.type === 'locationDate') {
          missing = typeof isLocationDateMissing === 'function'
            ? isLocationDateMissing(value)
            : !value || !value.location || !value.date;
        } else if (field.type === 'signature') {
          missing = isSignatureMissing(value);
        } else {
          missing = value == null || String(value).trim() === '';
        }

        if (missing) {
          issues.push(section.title + ': ' + field.label);
        }
      });
    });

    return issues;
  };
}

function secureShredLocalStorageKey(key) {
  try {
    if (!window.localStorage) return;
    var originalValue = window.localStorage.getItem(key);
    if (!originalValue) return;

    // Only perform heavy shredding if the old value actually contains signature data
    var containsSignature = originalValue.indexOf('data:image/') !== -1 || originalValue.indexOf('"signed":true') !== -1;
    if (!containsSignature) {
      return; // No signature data to shred, safe to overwrite directly
    }

    var length = originalValue.length;
    // Pass 1: Write all zeros
    var pass1 = Array(length + 1).join('0');
    window.localStorage.setItem(key, pass1);

    // Pass 2: Write all ones
    var pass2 = Array(length + 1).join('1');
    window.localStorage.setItem(key, pass2);

    // Pass 3: Write random/high-entropy printable characters to dirty database pages
    var pass3 = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var charsLength = chars.length;
    for (var i = 0; i < length; i++) {
      pass3 += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    window.localStorage.setItem(key, pass3);

    // Finally, remove the item
    window.localStorage.removeItem(key);
  } catch (e) {
    console.error('[SignatureWipe] localStorage shredding failed:', e);
    try { window.localStorage.removeItem(key); } catch (_) {}
  }
}

function secureReleaseCanvasMemory(canvas) {
  if (!canvas) return;
  try {
    var ctx = canvas.getContext('2d');
    if (ctx) {
      // 1. Overwrite backing store pixels with white block
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // 2. Clear context
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // 3. Force shrink backing store to 0x0 to reclaim GPU/RAM memory immediately
    canvas.width = 0;
    canvas.height = 0;
  } catch (e) {
    console.error('[SignatureWipe] Canvas memory release failed:', e);
  }
}