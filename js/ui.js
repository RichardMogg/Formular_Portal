import { state, matchesFilters, saveLieferscheinDraft, loadLieferscheinDraft } from './state.js';
import { SignaturePad } from './signature-pad.js';

export const elements = {
  grid: document.querySelector('[data-form-grid]'),
  search: document.querySelector('[data-search]'),
  category: document.querySelector('[data-category-filter]'),
  status: document.querySelector('[data-status]'),
  
  // PDF-Upload DOM-Elemente
  uploadZone: document.querySelector('[data-upload-zone]'),
  fileInput: document.querySelector('#pdf-file-input'),
  activeOrder: document.querySelector('[data-active-order]'),
  
  // Auftragsdaten Detailfelder im Dashboard
  orderId: document.querySelector('[data-order-id]'),
  orderClient: document.querySelector('[data-order-client]'),
  orderAddress: document.querySelector('[data-order-address]'),
  orderBilling: document.querySelector('[data-order-billing]'),
  orderBasis: document.querySelector('[data-order-basis]'),
  orderAdditional: document.querySelector('[data-order-additional]'),
  orderTermin: document.querySelector('[data-order-termin]'),
  orderDate: document.querySelector('[data-order-date]'),
  btnDiscard: document.querySelector('[data-discard-order]'),
  
  // ========================================================
  // GEBATECH LIEFERSCHEIN MODAL ELEMENTS
  // ========================================================
  lieferscheinModal: document.getElementById('lieferscheinModal'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnCreateLieferschein: document.getElementById('btnCreateLieferschein'),
  modalSaveStatus: document.getElementById('modalSaveStatus'),
  
  // Modal Kopfdaten
  modalOrderId: document.getElementById('modalOrderId'),
  modalClientName: document.getElementById('modalClientName'),
  modalClientAddress: document.getElementById('modalClientAddress'),
  modalContact: document.getElementById('modalContact'),
  modalPhone: document.getElementById('modalPhone'),
  modalDate: document.getElementById('modalDate'),
  modalCustomerName: document.getElementById('modalCustomerName'),
  modalCustomerAddress: document.getElementById('modalCustomerAddress'),
  
  // Modal Auftragsgrundlage
  basisReparatur: document.getElementById('basisReparatur'),
  basisStoerung: document.getElementById('basisStoerung'),
  basisWartung: document.getElementById('basisWartung'),
  basisPruefung: document.getElementById('basisPruefung'),
  basisInbetriebnahme: document.getElementById('basisInbetriebnahme'),
  basisInstallation: document.getElementById('basisInstallation'),
  modalBasisNote1: document.getElementById('modalBasisNote1'),
  modalBasisNote2: document.getElementById('modalBasisNote2'),
  
  // Leistungsbericht
  modalLeistungsbericht: document.getElementById('modalLeistungsbericht'),
  
  // Tabellen
  materialTableBody: document.querySelector('#materialTable tbody'),
  btnAddMaterialRow: document.getElementById('btnAddMaterialRow'),
  timeTableBody: document.querySelector('#timeTable tbody'),
  btnAddTimeRow: document.getElementById('btnAddTimeRow'),
  
  // Status & Canvas
  statusAbgeschlossen: document.getElementById('statusAbgeschlossen'),
  statusFolgetermin: document.getElementById('statusFolgetermin'),
  technicianSigCanvas: document.getElementById('technicianSigCanvas'),
  customerSigCanvas: document.getElementById('customerSigCanvas'),
  btnClearTechSig: document.getElementById('btnClearTechSig'),
  btnClearCustSig: document.getElementById('btnClearCustSig'),
  btnCompleteOrder: document.getElementById('btnCompleteOrder'),
  btnPrintLieferschein: document.getElementById('btnPrintLieferschein'),
  btnResetLieferschein: document.getElementById('btnResetLieferschein'),
  
  // GPS & Verifizierung
  modalGpsCoords: document.getElementById('modalGpsCoords'),
  modalGpsTimestamp: document.getElementById('modalGpsTimestamp')
};

// Globale Signaturpads-Instanzen
export let techSigPad = null;
export let custSigPad = null;

// ========================================================
// PORTAL RENDERING
// ========================================================
export function renderCategoryFilter() {
  const categories = Array.from(new Set(state.forms.map((form) => form.category).filter(Boolean))).sort();
  elements.category.innerHTML = '<option value="all">Alle Kategorien</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    elements.category.appendChild(option);
  });
}

export function renderForms() {
  const visibleForms = state.forms.filter(matchesFilters);
  elements.status.textContent = `${visibleForms.length} von ${state.forms.length} Formularen angezeigt`;

  if (visibleForms.length === 0) {
    elements.grid.innerHTML = '<div class="empty-state">Keine passenden Formulare gefunden.</div>';
    return;
  }

  elements.grid.innerHTML = visibleForms.map(renderFormCard).join('');
}

function renderFormCard(form) {
  const tags = Array.isArray(form.tags) ? form.tags : [];
  const badges = [form.category, form.status, form.version ? `v${form.version}` : '', ...tags]
    .filter(Boolean)
    .map((item) => `<span class="badge">${escapeHtml(item)}</span>`)
    .join('');

  return `
    <article class="form-card">
      <div class="badges">${badges}</div>
      <h3>${escapeHtml(form.title || 'Unbenanntes Formular')}</h3>
      <p>${escapeHtml(form.description || 'Keine Beschreibung vorhanden.')}</p>
      <a class="open-link" href="${escapeAttribute(form.url || '#')}" target="_blank" rel="noopener noreferrer">Formular öffnen</a>
    </article>
  `;
}

export function renderOrderContext() {
  const context = state.orderContext;
  
  if (!context) {
    elements.activeOrder.classList.add('hidden');
    elements.uploadZone.classList.remove('hidden');
    if (elements.fileInput) {
      elements.fileInput.value = '';
    }
    return;
  }
  
  elements.uploadZone.classList.add('hidden');
  elements.activeOrder.classList.remove('hidden');
  
  elements.orderId.textContent = context.orderId || 'Keine Nummer gefunden';
  elements.orderClient.textContent = context.clientInfo || 'Keine Info';
  elements.orderAddress.textContent = context.customerAddress || 'Keine Adresse';
  elements.orderBilling.textContent = context.billingAddress || 'Keine Adresse';
  elements.orderBasis.textContent = context.orderBasis || 'Keine Angabe';
  elements.orderAdditional.textContent = context.additionalInfo || 'Keine Angabe';
  elements.orderTermin.textContent = context.orderTermin || 'Kein Termin';
  elements.orderDate.textContent = context.orderDate || 'Kein Datum';
}

// ========================================================
// GEBATECH LIEFERSCHEIN MODAL CONTROLS
// ========================================================
export function openLieferscheinModal() {
  elements.lieferscheinModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Scrollen im Hintergrund blockieren
  
  // 1. Initialisiere Signaturpads (falls noch nicht geschehen)
  initSignaturePads();
  
  // 2. Lade Entwurf oder fülle Kopfdaten aus PDF-Auftrag vor
  const savedDraft = loadLieferscheinDraft();
  if (savedDraft) {
    applyLieferscheinDraft(savedDraft);
  } else {
    prefillModalFromActiveOrder();
  }
  
  // Resize auslösen, damit Canvas-Pads sich richtig an die Breite anpassen!
  setTimeout(() => {
    if (techSigPad) techSigPad.resizeCanvas();
    if (custSigPad) custSigPad.resizeCanvas();
  }, 150);
}

export function closeLieferscheinModal() {
  // Sichert den Entwurf vor dem Schließen, außer es wurde explizit geleert!
  if (state.isDraftCleared) {
    state.isDraftCleared = false;
  } else {
    const draft = collectLieferscheinData();
    saveLieferscheinDraft(draft);
  }
  
  elements.lieferscheinModal.classList.add('hidden');
  document.body.style.overflow = '';
}

function initSignaturePads() {
  if (!techSigPad && elements.technicianSigCanvas) {
    techSigPad = new SignaturePad(elements.technicianSigCanvas);
  }
  if (!custSigPad && elements.customerSigCanvas) {
    custSigPad = new SignaturePad(elements.customerSigCanvas);
  }
}

// Löscht die Unterschriften und schrumpft Canvas zur sofortigen GPU-Texturbereinigung
export function clearSignaturePadsGPU() {
  if (techSigPad) {
    techSigPad.clear();
    shrinkCanvas(elements.technicianSigCanvas);
    techSigPad = null;
  }
  if (custSigPad) {
    custSigPad.clear();
    shrinkCanvas(elements.customerSigCanvas);
    custSigPad = null;
  }
}

function shrinkCanvas(canvas) {
  if (!canvas) return;
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
  } catch (_) {}
}

// Prefill Kopfdaten aus activeOrderContext
function prefillModalFromActiveOrder() {
  const context = state.orderContext;
  if (!context) {
    // Falls manuell gestartet wird, setzen wir nur das heutige Datum
    elements.modalDate.value = new Date().toISOString().substring(0, 10);
    clearAllModalFormFields();
    return;
  }
  
  elements.modalOrderId.value = context.orderId || '';
  elements.modalClientName.value = context.clientName || context.clientInfo || '';
  elements.modalClientAddress.value = [context.clientStreet, context.clientZip, context.clientCity].filter(Boolean).join(', ') || '';
  elements.modalCustomerName.value = context.customerName || context.customerAddress || '';
  elements.modalCustomerAddress.value = [context.customerStreet, context.customerZip, context.customerCity].filter(Boolean).join(', ') || '';
  elements.modalContact.value = context.sachbearbeiter || '';
  elements.modalPhone.value = '';
  
  // Datums-Formatierung für Input
  if (context.orderDate) {
    const dateParts = context.orderDate.split('.');
    if (dateParts.length === 3) {
      elements.modalDate.value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    } else {
      elements.modalDate.value = new Date().toISOString().substring(0, 10);
    }
  } else {
    elements.modalDate.value = new Date().toISOString().substring(0, 10);
  }
  
  // Checkboxen aus Auftragsgrundlage mappen
  const basis = String(context.orderBasis || '').toLowerCase();
  elements.basisReparatur.checked = basis.includes('reparatur');
  elements.basisStoerung.checked = basis.includes('störung') || basis.includes('störung');
  elements.basisWartung.checked = basis.includes('wartung');
  elements.basisPruefung.checked = basis.includes('prüfung') || basis.includes('prüfung');
  elements.basisInbetriebnahme.checked = basis.includes('inbetriebnahme');
  elements.basisInstallation.checked = basis.includes('installation');
  
  elements.modalBasisNote1.value = context.orderBasis || '';
  elements.modalBasisNote2.value = context.additionalInfo || '';
  
  // Textbereiche & Tabellen leeren
  elements.modalLeistungsbericht.value = '';
  elements.materialTableBody.innerHTML = '';
  elements.timeTableBody.innerHTML = '';
  
  // Standardmäßig leere Zeilen erzeugen
  addMaterialRow('', '', '');
  addMaterialRow('', '', '');
  addTimeRow('', '', '', '', '', '', '', '', '');
  
  if (techSigPad) techSigPad.clear();
  if (custSigPad) custSigPad.clear();
}

export function clearAllModalFormFields() {
  elements.modalOrderId.value = '';
  elements.modalClientName.value = '';
  elements.modalClientAddress.value = '';
  elements.modalCustomerName.value = '';
  elements.modalCustomerAddress.value = '';
  elements.modalContact.value = '';
  elements.modalPhone.value = '';
  
  elements.basisReparatur.checked = false;
  elements.basisStoerung.checked = false;
  elements.basisWartung.checked = false;
  elements.basisPruefung.checked = false;
  elements.basisInbetriebnahme.checked = false;
  elements.basisInstallation.checked = false;
  
  elements.modalBasisNote1.value = '';
  elements.modalBasisNote2.value = '';
  elements.modalLeistungsbericht.value = '';
  
  elements.materialTableBody.innerHTML = '';
  elements.timeTableBody.innerHTML = '';
  
  addMaterialRow('', '', '');
  addMaterialRow('', '', '');
  addTimeRow('', '', '', '', '', '', '', '', '');
  
  if (techSigPad) techSigPad.clear();
  if (custSigPad) custSigPad.clear();
  
  if (elements.modalGpsCoords) {
    elements.modalGpsCoords.textContent = 'Ausstehend (wird beim Abschließen erfasst)';
  }
  if (elements.modalGpsTimestamp) {
    elements.modalGpsTimestamp.textContent = 'Ausstehend';
  }
}

// Dynamisches Hinzufügen von Materialzeilen
export function addMaterialRow(menge = '', bezeichnung = '', material = '') {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="sheet-table-input material-menge" value="${escapeAttribute(menge)}" placeholder="z.B. 2 Stk."></td>
    <td><input type="text" class="sheet-table-input material-bezeichnung" value="${escapeAttribute(bezeichnung)}" placeholder="Bezeichnung"></td>
    <td><input type="text" class="sheet-table-input material-name" value="${escapeAttribute(material)}" placeholder="Artikel-Nr./Material"></td>
    <td class="no-print text-center"><button type="button" class="btn-row-del" title="Zeile löschen">✕</button></td>
  `;
  
  tr.querySelector('.btn-row-del').addEventListener('click', () => {
    tr.remove();
    triggerDraftAutoSave();
  });
  
  // Auto-Save Trigger bei Input
  tr.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', triggerDraftAutoSave);
  });
  
  elements.materialTableBody.appendChild(tr);
}// Dynamisches Hinzufügen von Arbeitszeitzeilen
export function addTimeRow(tag = '', name = '', von = '', bis = '', n = '', p50 = '', p100 = '', fahrtzeit = '', km = '') {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="sheet-table-input time-tag" value="${escapeAttribute(tag)}" placeholder="29.05."></td>
    <td><input type="text" class="sheet-table-input time-name" value="${escapeAttribute(name)}" placeholder="Techniker - Tätigkeit"></td>
    <td>
      <div class="time-picker-wrapper">
        <input type="time" class="sheet-table-input time-von" value="${escapeAttribute(von)}" step="1800">
        <span>-</span>
        <input type="time" class="sheet-table-input time-bis" value="${escapeAttribute(bis)}" step="1800">
      </div>
    </td>
    <td><input type="text" class="sheet-table-input time-n" value="${escapeAttribute(n)}" placeholder="8"></td>
    <td><input type="text" class="sheet-table-input time-50" value="${escapeAttribute(p50)}"></td>
    <td><input type="text" class="sheet-table-input time-100" value="${escapeAttribute(p100)}"></td>
    <td><input type="text" class="sheet-table-input time-fahrtzeit" value="${escapeAttribute(fahrtzeit)}" placeholder="z.B. 1,5"></td>
    <td><input type="text" class="sheet-table-input time-km" value="${escapeAttribute(km)}" placeholder="42"></td>
    <td class="no-print text-center"><button type="button" class="btn-row-del" title="Zeile löschen">✕</button></td>
  `;
  
  tr.querySelector('.btn-row-del').addEventListener('click', () => {
    tr.remove();
    triggerDraftAutoSave();
  });
  
  tr.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', triggerDraftAutoSave);
    input.addEventListener('change', triggerDraftAutoSave);
  });
  
  elements.timeTableBody.appendChild(tr);
}

// Sammelt alle Formulardaten im Modal als JSON Objekt
export function collectLieferscheinData() {
  const materials = [];
  elements.materialTableBody.querySelectorAll('tr').forEach(tr => {
    const menge = tr.querySelector('.material-menge').value;
    const bezeichnung = tr.querySelector('.material-bezeichnung').value;
    const material = tr.querySelector('.material-name').value;
    if (menge || bezeichnung || material) {
      materials.push({ menge, bezeichnung, material });
    }
  });
  
  const times = [];
  elements.timeTableBody.querySelectorAll('tr').forEach(tr => {
    const tag = tr.querySelector('.time-tag').value;
    const name = tr.querySelector('.time-name').value;
    const von = tr.querySelector('.time-von').value;
    const bis = tr.querySelector('.time-bis').value;
    const n = tr.querySelector('.time-n').value;
    const p50 = tr.querySelector('.time-50').value;
    const p100 = tr.querySelector('.time-100').value;
    const fahrtzeit = tr.querySelector('.time-fahrtzeit').value;
    const km = tr.querySelector('.time-km').value;
    if (tag || name || von || bis || n || p50 || p100 || fahrtzeit || km) {
      times.push({ tag, name, von, bis, n, p50, p100, fahrtzeit, km });
    }
  });

  return {
    orderId: elements.modalOrderId.value,
    clientName: elements.modalClientName.value,
    clientAddress: elements.modalClientAddress.value,
    contact: elements.modalContact.value,
    phone: elements.modalPhone.value,
    date: elements.modalDate.value,
    customerName: elements.modalCustomerName.value,
    customerAddress: elements.modalCustomerAddress.value,
    
    basisReparatur: elements.basisReparatur.checked,
    basisStoerung: elements.basisStoerung.checked,
    basisWartung: elements.basisWartung.checked,
    basisPruefung: elements.basisPruefung.checked,
    basisInbetriebnahme: elements.basisInbetriebnahme.checked,
    basisInstallation: elements.basisInstallation.checked,
    basisNote1: elements.modalBasisNote1.value,
    basisNote2: elements.modalBasisNote2.value,
    
    leistungsbericht: elements.modalLeistungsbericht.value,
    materials: materials,
    times: times,
    
    statusAbgeschlossen: elements.statusAbgeschlossen.checked,
    statusFolgetermin: elements.statusFolgetermin.checked,
    
    // GPS & Verifizierung
    gpsCoords: elements.modalGpsCoords ? elements.modalGpsCoords.textContent : '',
    gpsTimestamp: elements.modalGpsTimestamp ? elements.modalGpsTimestamp.textContent : '',
    
    // Unterschriften als Base64
    techSig: techSigPad ? techSigPad.getDataUrl() : '',
    custSig: custSigPad ? custSigPad.getDataUrl() : ''
  };
}

// Befüllt das Modal mit den geladenen Entwurfsdaten
function applyLieferscheinDraft(draft) {
  elements.modalOrderId.value = draft.orderId || '';
  elements.modalClientName.value = draft.clientName || '';
  elements.modalClientAddress.value = draft.clientAddress || '';
  elements.modalContact.value = draft.contact || '';
  elements.modalPhone.value = draft.phone || '';
  elements.modalDate.value = draft.date || '';
  elements.modalCustomerName.value = draft.customerName || '';
  elements.modalCustomerAddress.value = draft.customerAddress || '';
  
  elements.basisReparatur.checked = !!draft.basisReparatur;
  elements.basisStoerung.checked = !!draft.basisStoerung;
  elements.basisWartung.checked = !!draft.basisWartung;
  elements.basisPruefung.checked = !!draft.basisPruefung;
  elements.basisInbetriebnahme.checked = !!draft.basisInbetriebnahme;
  elements.basisInstallation.checked = !!draft.basisInstallation;
  elements.modalBasisNote1.value = draft.basisNote1 || '';
  elements.modalBasisNote2.value = draft.basisNote2 || '';
  
  elements.modalLeistungsbericht.value = draft.leistungsbericht || '';
  
  // Tabellen befüllen
  elements.materialTableBody.innerHTML = '';
  if (Array.isArray(draft.materials) && draft.materials.length > 0) {
    draft.materials.forEach(m => addMaterialRow(m.menge, m.bezeichnung, m.material));
  } else {
    addMaterialRow('', '', '');
    addMaterialRow('', '', '');
  }
  
  elements.timeTableBody.innerHTML = '';
  if (Array.isArray(draft.times) && draft.times.length > 0) {
    draft.times.forEach(t => addTimeRow(t.tag, t.name, t.von || '', t.bis || '', t.n, t.p50, t.p100, t.fahrtzeit, t.km));
  } else {
    addTimeRow('', '', '', '', '', '', '', '', '');
  }
  
  elements.statusAbgeschlossen.checked = !!draft.statusAbgeschlossen;
  elements.statusFolgetermin.checked = !!draft.statusFolgetermin;
  
  if (draft.gpsCoords && elements.modalGpsCoords) {
    elements.modalGpsCoords.textContent = draft.gpsCoords;
  }
  if (draft.gpsTimestamp && elements.modalGpsTimestamp) {
    elements.modalGpsTimestamp.textContent = draft.gpsTimestamp;
  }
  
  // Unterschriften wiederherstellen
  if (techSigPad) techSigPad.clear();
  if (custSigPad) custSigPad.clear();
  
  if (draft.techSig && techSigPad) {
    drawBase64OnCanvas(elements.technicianSigCanvas, draft.techSig);
  }
  if (draft.custSig && custSigPad) {
    drawBase64OnCanvas(elements.customerSigCanvas, draft.custSig);
  }
}

function drawBase64OnCanvas(canvas, base64) {
  const img = new Image();
  img.onload = function() {
    const ctx = canvas.getContext('2d');
    // Wir müssen die Skalierung beim Einzeichnen anpassen
    const rect = canvas.getBoundingClientRect();
    ctx.drawImage(img, 0, 0, rect.width, rect.height);
  };
  img.src = base64;
}

// Auto-Save Trigger mit dezentem Debounce, um Performance zu sparen
let autoSaveTimeout = null;
export function triggerDraftAutoSave() {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  
  if (elements.modalSaveStatus) {
    elements.modalSaveStatus.textContent = 'Änderungen werden lokal gesichert...';
  }
  
  autoSaveTimeout = setTimeout(() => {
    const draft = collectLieferscheinData();
    saveLieferscheinDraft(draft);
    if (elements.modalSaveStatus) {
      elements.modalSaveStatus.textContent = 'Alle Änderungen lokal gesichert';
    }
  }, 500);
}

// ========================================================
// SECURITY & RESET ACTIONS
// ========================================================
export function resetPortalToInitialState() {
  clearAllModalFormFields();
  clearSignaturePadsGPU();
  renderOrderContext();
}

// ========================================================
// ESCAPE UTILS
// ========================================================
export function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
