import { state, matchesFilters } from './state.js';

export const elements = {
  grid: document.querySelector('[data-form-grid]'),
  search: document.querySelector('[data-search]'),
  category: document.querySelector('[data-category-filter]'),
  status: document.querySelector('[data-status]'),
  
  // PDF-Upload DOM-Elemente
  uploadZone: document.querySelector('[data-upload-zone]'),
  fileInput: document.querySelector('#pdf-file-input'),
  activeOrder: document.querySelector('[data-active-order]'),
  
  // Auftragsdaten Detailfelder
  orderId: document.querySelector('[data-order-id]'),
  orderClient: document.querySelector('[data-order-client]'),
  orderAddress: document.querySelector('[data-order-address]'),
  orderBilling: document.querySelector('[data-order-billing]'),
  orderBasis: document.querySelector('[data-order-basis]'),
  orderAdditional: document.querySelector('[data-order-additional]'),
  orderTermin: document.querySelector('[data-order-termin]'),
  orderDate: document.querySelector('[data-order-date]'),
  btnDiscard: document.querySelector('[data-discard-order]')
};

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
    // Wenn kein Auftrag geladen ist, Upload-Zone anzeigen und Details ausblenden
    elements.activeOrder.classList.add('hidden');
    elements.uploadZone.classList.remove('hidden');
    
    // File-Input zurücksetzen, damit dieselbe Datei erneut geladen werden kann
    if (elements.fileInput) {
      elements.fileInput.value = '';
    }
    return;
  }
  
  // Wenn Auftrag geladen ist, Upload-Zone ausblenden und Details anzeigen
  elements.uploadZone.classList.add('hidden');
  elements.activeOrder.classList.remove('hidden');
  
  // Werte in die Detailfelder schreiben
  elements.orderId.textContent = context.orderId || 'Keine Nummer gefunden';
  elements.orderClient.textContent = context.clientInfo || 'Keine Info';
  elements.orderAddress.textContent = context.customerAddress || 'Keine Adresse';
  elements.orderBilling.textContent = context.billingAddress || 'Keine Adresse';
  elements.orderBasis.textContent = context.orderBasis || 'Keine Angabe';
  elements.orderAdditional.textContent = context.additionalInfo || 'Keine Angabe';
  elements.orderTermin.textContent = context.orderTermin || 'Kein Termin';
  elements.orderDate.textContent = context.orderDate || 'Kein Datum';
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
