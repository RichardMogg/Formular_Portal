import { elements, techSigPad, custSigPad, triggerDraftAutoSave } from './ui.js?v=1.1.0';
import { SignaturePad } from './signature-pad.js?v=1.1.0';

let overlay = null;
let overlayCanvas = null;
let overlayPad = null;
let activeTarget = null;
let activeSmallCanvas = null;
let activeSmallPad = null;
let originalBodyOverflow = '';
let reasonNotPresent = null;
let reasonRefused = null;

function initSignatureOverlay() {
  buildOverlay();
  buildCustomerReasonOptions();
  bindPreview(elements.technicianSigCanvas, 'tech');
  bindPreview(elements.customerSigCanvas, 'customer');
}

function buildCustomerReasonOptions() {
  const footerCheckboxes = document.querySelector('.sheet-footer-checkboxes');
  if (!footerCheckboxes || document.getElementById('customerNotPresent')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'customer-signature-reason-options';
  wrapper.innerHTML = `
    <label class="sheet-checkbox-label">
      <input type="checkbox" id="customerNotPresent" class="gear-checkbox">
      <span class="gear-checkbox-custom"></span> Kunde nicht anwesend
    </label>
    <label class="sheet-checkbox-label">
      <input type="checkbox" id="customerSignatureRefused" class="gear-checkbox">
      <span class="gear-checkbox-custom"></span> Unterschrift wird verweigert
    </label>
  `;

  footerCheckboxes.insertAdjacentElement('afterend', wrapper);
  reasonNotPresent = wrapper.querySelector('#customerNotPresent');
  reasonRefused = wrapper.querySelector('#customerSignatureRefused');

  reasonNotPresent.addEventListener('change', () => handleReasonChange(reasonNotPresent));
  reasonRefused.addEventListener('change', () => handleReasonChange(reasonRefused));
}

function handleReasonChange(changedInput) {
  if (!reasonNotPresent || !reasonRefused) return;

  if (changedInput.checked) {
    if (changedInput === reasonNotPresent) {
      reasonRefused.checked = false;
      writeCustomerReasonToCanvas('Kunde nicht anwesend');
    } else {
      reasonNotPresent.checked = false;
      writeCustomerReasonToCanvas('Unterschrift wird verweigert');
    }
  } else if (!reasonNotPresent.checked && !reasonRefused.checked) {
    clearCustomerReasonCanvas();
  }

  triggerDraftAutoSave();
}

function writeCustomerReasonToCanvas(text) {
  const canvas = elements.customerSigCanvas;
  if (!canvas) return;

  if (custSigPad && typeof custSigPad.resizeCanvas === 'function') {
    custSigPad.resizeCanvas();
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1e3a8a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.max(18, Math.round(canvas.height * 0.16))}px Arial, sans-serif`;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  ctx.restore();

  if (custSigPad) {
    custSigPad.pointsCount = 1;
  }
}

function clearCustomerReasonCanvas() {
  if (custSigPad) {
    custSigPad.clear();
  }
}

function buildOverlay() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.className = 'signature-fullscreen-overlay hidden';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'signatureOverlayTitle');
  overlay.innerHTML = `
    <div class="signature-fullscreen-panel">
      <header class="signature-fullscreen-header">
        <h2 class="signature-fullscreen-title" id="signatureOverlayTitle">Unterschrift erfassen</h2>
        <p class="signature-fullscreen-note">Bitte im großen Feld unterschreiben. Danach übernehmen.</p>
      </header>
      <div class="signature-fullscreen-body">
        <div class="signature-fullscreen-canvas-wrap">
          <canvas class="signature-fullscreen-canvas" id="signatureOverlayCanvas"></canvas>
          <div class="signature-fullscreen-line" aria-hidden="true"></div>
        </div>
      </div>
      <footer class="signature-fullscreen-footer">
        <button type="button" class="signature-fullscreen-btn primary" data-signature-accept>Übernehmen</button>
        <div class="signature-fullscreen-actions">
          <button type="button" class="signature-fullscreen-btn secondary" data-signature-clear>Löschen</button>
          <button type="button" class="signature-fullscreen-btn danger" data-signature-cancel>Abbrechen</button>
        </div>
      </footer>
    </div>
  `;

  document.body.appendChild(overlay);
  overlayCanvas = overlay.querySelector('#signatureOverlayCanvas');

  overlay.querySelector('[data-signature-accept]').addEventListener('click', acceptSignature);
  overlay.querySelector('[data-signature-clear]').addEventListener('click', clearOverlaySignature);
  overlay.querySelector('[data-signature-cancel]').addEventListener('click', closeOverlay);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeOverlay();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
      closeOverlay();
    }
  });
}

function bindPreview(canvas, target) {
  if (!canvas || canvas.dataset.signatureOverlayBound === '1') return;

  const wrapper = canvas.closest('.signature-canvas-container') || canvas;
  wrapper.dataset.signatureTarget = target;
  wrapper.setAttribute('tabindex', '0');
  wrapper.setAttribute('role', 'button');
  wrapper.setAttribute('aria-label', target === 'tech' ? 'Techniker-Unterschrift öffnen' : 'Kunden-Unterschrift öffnen');

  wrapper.addEventListener('click', () => openOverlay(target));
  wrapper.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openOverlay(target);
    }
  });

  canvas.dataset.signatureOverlayBound = '1';
}

function openOverlay(target) {
  if (target === 'customer' && isCustomerReasonActive()) {
    return;
  }

  activeTarget = target;
  activeSmallCanvas = target === 'tech' ? elements.technicianSigCanvas : elements.customerSigCanvas;
  activeSmallPad = target === 'tech' ? techSigPad : custSigPad;

  const title = overlay.querySelector('#signatureOverlayTitle');
  title.textContent = target === 'tech' ? 'Techniker-Unterschrift erfassen' : 'Kunden-Unterschrift erfassen';

  originalBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  overlay.classList.remove('hidden');

  setTimeout(() => {
    setupOverlayPad();
    copyCanvas(activeSmallCanvas, overlayCanvas);
    if (overlayPad && hasVisibleInk(overlayCanvas)) {
      overlayPad.pointsCount = 1;
    }
  }, 80);
}

function isCustomerReasonActive() {
  return Boolean((reasonNotPresent && reasonNotPresent.checked) || (reasonRefused && reasonRefused.checked));
}

function setupOverlayPad() {
  if (overlayPad) {
    overlayPad.clear();
  } else {
    overlayPad = new SignaturePad(overlayCanvas);
  }

  resizeOverlayCanvas();
  overlayPad.clear();
}

function resizeOverlayCanvas() {
  const rect = overlayCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  overlayCanvas.width = width;
  overlayCanvas.height = height;

  const ctx = overlayCanvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (overlayPad) {
    overlayPad.ctx = ctx;
    overlayPad.pointsCount = 0;
  }
}

function copyCanvas(sourceCanvas, targetCanvas) {
  if (!sourceCanvas || !targetCanvas) return;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx || sourceCanvas.width === 0 || sourceCanvas.height === 0) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.restore();

  drawCanvasInkContained(sourceCanvas, targetCanvas, 0.08);
}

function acceptSignature() {
  if (!activeSmallCanvas || !overlayCanvas) return;

  if (!hasVisibleInk(overlayCanvas)) {
    alert('Bitte zuerst unterschreiben oder mit Abbrechen schließen.');
    return;
  }

  if (activeTarget === 'customer') {
    clearCustomerReasonSelection();
  }

  drawOverlayToSmallCanvas();

  if (activeSmallPad) {
    activeSmallPad.pointsCount = 1;
  }

  triggerDraftAutoSave();
  closeOverlay();
}

function clearCustomerReasonSelection() {
  if (reasonNotPresent) reasonNotPresent.checked = false;
  if (reasonRefused) reasonRefused.checked = false;
}

function drawOverlayToSmallCanvas() {
  const targetCanvas = activeSmallCanvas;
  const sourceCanvas = overlayCanvas;
  const targetPad = activeSmallPad;

  if (targetPad && typeof targetPad.resizeCanvas === 'function') {
    targetPad.resizeCanvas();
  }

  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) return;

  targetCtx.save();
  targetCtx.setTransform(1, 0, 0, 1, 0, 0);
  targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  targetCtx.restore();

  drawCanvasInkContained(sourceCanvas, targetCanvas, 0.1);
}

function drawCanvasInkContained(sourceCanvas, targetCanvas, paddingRatio = 0.08) {
  const bounds = getInkBounds(sourceCanvas);
  if (!bounds) return false;

  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) return false;

  const sourcePadding = Math.max(8, Math.round(Math.max(bounds.width, bounds.height) * paddingRatio));
  const sx = Math.max(0, bounds.left - sourcePadding);
  const sy = Math.max(0, bounds.top - sourcePadding);
  const sw = Math.min(sourceCanvas.width - sx, bounds.width + sourcePadding * 2);
  const sh = Math.min(sourceCanvas.height - sy, bounds.height + sourcePadding * 2);

  if (sw <= 0 || sh <= 0) return false;

  const targetPaddingX = Math.round(targetCanvas.width * 0.06);
  const targetPaddingY = Math.round(targetCanvas.height * 0.16);
  const availableW = Math.max(1, targetCanvas.width - targetPaddingX * 2);
  const availableH = Math.max(1, targetCanvas.height - targetPaddingY * 2);
  const scale = Math.min(availableW / sw, availableH / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (targetCanvas.width - dw) / 2;
  const dy = (targetCanvas.height - dh) / 2;

  targetCtx.save();
  targetCtx.setTransform(1, 0, 0, 1, 0, 0);
  targetCtx.drawImage(sourceCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
  targetCtx.restore();

  return true;
}

function getInkBounds(canvas) {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  try {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    let left = canvas.width;
    let right = -1;
    let top = canvas.height;
    let bottom = -1;

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha !== 0) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }

    if (right < left || bottom < top) return null;

    return {
      left,
      top,
      right,
      bottom,
      width: right - left + 1,
      height: bottom - top + 1
    };
  } catch (_) {
    return null;
  }
}

function clearOverlaySignature() {
  if (overlayPad) {
    overlayPad.clear();
  }
}

function closeOverlay() {
  if (!overlay) return;

  overlay.classList.add('hidden');
  document.body.style.overflow = originalBodyOverflow;
  activeTarget = null;
  activeSmallCanvas = null;
  activeSmallPad = null;

  if (overlayPad) {
    overlayPad.clear();
  }
}

function hasVisibleInk(canvas) {
  return getInkBounds(canvas) !== null;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSignatureOverlay);
} else {
  initSignatureOverlay();
}
