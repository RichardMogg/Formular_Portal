import { state, loadOrderContext, saveOrderContext, clearOrderContext } from './state.js';
import { elements, renderCategoryFilter, renderForms, renderOrderContext, escapeHtml } from './ui.js';
import { parsePdfOrder } from './pdf-handler.js';

async function init() {
  bindEvents();
  await loadForms();
  
  // Geladenen Auftrag aus sessionStorage wiederherstellen (falls vorhanden)
  loadOrderContext();
  renderOrderContext();
}

function bindEvents() {
  // Filter- und Suche-Events
  elements.search.addEventListener('input', () => {
    state.query = elements.search.value.trim().toLowerCase();
    renderForms();
  });

  elements.category.addEventListener('change', () => {
    state.category = elements.category.value;
    renderForms();
  });

  // PDF-Upload per Klick/Dateiauswahl
  elements.fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handlePdfUpload(file);
    }
  });

  // PDF-Upload per Drag & Drop
  const zone = elements.uploadZone;
  
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  
  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });
  
  zone.addEventListener('drop', async (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        await handlePdfUpload(file);
      } else {
        alert('Bitte laden Sie eine gültige PDF-Datei hoch.');
      }
    }
  });

  // Auftrag entfernen (Verwerfen)
  elements.btnDiscard.addEventListener('click', () => {
    clearOrderContext();
    renderOrderContext();
  });
}

async function handlePdfUpload(file) {
  const textEl = elements.uploadZone.querySelector('.upload-text');
  const originalText = textEl ? textEl.textContent : 'PDF-Auftrag per E-Mail erhalten? Hierher ziehen oder anklicken';
  
  try {
    if (textEl) {
      textEl.textContent = 'Analysiere PDF-Auftrag...';
    }
    
    const parsedData = await parsePdfOrder(file);
    saveOrderContext(parsedData);
    renderOrderContext();
  } catch (error) {
    console.error('Fehler beim PDF-Import:', error);
    alert('Fehler beim Einlesen der PDF: ' + error.message);
  } finally {
    if (textEl) {
      textEl.textContent = originalText;
    }
  }
}

async function loadForms() {
  try {
    const response = await fetch('forms.json', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`forms.json konnte nicht geladen werden (${response.status}).`);
    }

    const forms = await response.json();

    if (!Array.isArray(forms)) {
      throw new Error('forms.json muss ein Array enthalten.');
    }

    state.forms = forms;
    renderCategoryFilter();
    renderForms();
  } catch (error) {
    elements.grid.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`;
  }
}

init();
