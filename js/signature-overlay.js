import { elements, techSigPad, custSigPad, triggerDraftAutoSave } from './ui.js?v=1.1.1';
import { SignaturePad } from './signature-pad.js?v=1.1.1';

let overlay = null;
let overlayCanvas = null;
let overlayPad = null;
let activeTarget = null;
let activeSmallCanvas = null;
let activeSmallPad = null;
let originalBodyOverflow = '';

function initSignatureOverlay() {
  buildOverlay();
  bindPreview(elements.technicianSigCanvas, 'tech');
  bindPreview(elements.customerSigCanvas, 'customer');
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

  const sourceRect = sourceCanvas.getBoundingClientRect();
  const targetRect = targetCanvas.getBoundingClientRect();
  const ctx = targetCanvas.getContext('2d');

  if (!ctx || sourceCanvas.width === 0 || sourceCanvas.height === 0) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, targetCanvas.width, targetCanvas.height);
  ctx.restore();

  if (sourceRect.width <= 0 || targetRect.width <= 0) return;
}

function acceptSignature() {
  if (!activeSmallCanvas || !overlayCanvas) return;

  if (!hasVisibleInk(overlayCanvas)) {
    alert('Bitte zuerst unterschreiben oder mit Abbrechen schließen.');
    return;
  }

  drawOverlayToSmallCanvas();

  if (activeSmallPad) {
    activeSmallPad.pointsCount = 1;
  }

  triggerDraftAutoSave();
  closeOverlay();
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
  targetCtx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, targetCanvas.width, targetCanvas.height);
  targetCtx.restore();
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
  if (!canvas || canvas.width === 0 || canvas.height === 0) return false;

  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  try {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) {
        return true;
      }
    }
  } catch (_) {
    return false;
  }

  return false;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSignatureOverlay);
} else {
  initSignatureOverlay();
}
