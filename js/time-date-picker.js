/*
 * Macht das Arbeitszeit-Feld "Tag/Monat" als nativen Datepicker bedienbar.
 * Das bestehende Tabellen-/Draft-Modell bleibt unverändert: gespeichert wird der ISO-Wert YYYY-MM-DD.
 */

const TIME_TAG_SELECTOR = '#timeTable input.time-tag';

function initTimeDatePickers() {
  convertExistingTimeTagInputs();
  observeTimeRows();
}

function convertExistingTimeTagInputs() {
  document.querySelectorAll(TIME_TAG_SELECTOR).forEach(convertTimeTagInput);
}

function observeTimeRows() {
  const tbody = document.querySelector('#timeTable tbody');
  if (!tbody || tbody.dataset.datePickerObserverBound === '1') return;

  const observer = new MutationObserver(() => {
    convertExistingTimeTagInputs();
  });

  observer.observe(tbody, { childList: true, subtree: true });
  tbody.dataset.datePickerObserverBound = '1';
}

function convertTimeTagInput(input) {
  if (!input || input.dataset.datePickerReady === '1') return;

  const currentValue = input.value;
  const normalizedValue = normalizeDateValue(currentValue);

  input.type = 'date';
  input.placeholder = '';
  input.autocomplete = 'off';
  input.dataset.datePickerReady = '1';

  if (normalizedValue) {
    input.value = normalizedValue;
  }
}

function normalizeDateValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const dotMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.?$/);
  if (!dotMatch) return '';

  const day = dotMatch[1].padStart(2, '0');
  const month = dotMatch[2].padStart(2, '0');
  const year = getContextYear();
  return `${year}-${month}-${day}`;
}

function getContextYear() {
  const modalDate = document.getElementById('modalDate');
  const modalYear = modalDate && /^\d{4}-\d{2}-\d{2}$/.test(modalDate.value)
    ? modalDate.value.slice(0, 4)
    : '';

  return modalYear || String(new Date().getFullYear());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTimeDatePickers);
} else {
  initTimeDatePickers();
}
