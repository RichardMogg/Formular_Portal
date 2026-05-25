const state = {
  forms: [],
  query: '',
  category: 'all'
};

const elements = {
  grid: document.querySelector('[data-form-grid]'),
  search: document.querySelector('[data-search]'),
  category: document.querySelector('[data-category-filter]'),
  status: document.querySelector('[data-status]')
};

async function init() {
  bindEvents();
  await loadForms();
}

function bindEvents() {
  elements.search.addEventListener('input', () => {
    state.query = elements.search.value.trim().toLowerCase();
    renderForms();
  });

  elements.category.addEventListener('change', () => {
    state.category = elements.category.value;
    renderForms();
  });
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

function renderCategoryFilter() {
  const categories = Array.from(new Set(state.forms.map((form) => form.category).filter(Boolean))).sort();

  elements.category.innerHTML = '<option value="all">Alle Kategorien</option>';

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    elements.category.appendChild(option);
  });
}

function renderForms() {
  const visibleForms = state.forms.filter(matchesFilters);

  elements.status.textContent = `${visibleForms.length} von ${state.forms.length} Formularen angezeigt`;

  if (visibleForms.length === 0) {
    elements.grid.innerHTML = '<div class="empty-state">Keine passenden Formulare gefunden.</div>';
    return;
  }

  elements.grid.innerHTML = visibleForms.map(renderFormCard).join('');
}

function matchesFilters(form) {
  const haystack = [
    form.title,
    form.category,
    form.description,
    form.version,
    form.status,
    ...(Array.isArray(form.tags) ? form.tags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchesQuery = !state.query || haystack.includes(state.query);
  const matchesCategory = state.category === 'all' || form.category === state.category;

  return matchesQuery && matchesCategory;
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
      <a class="open-link" href="${escapeAttribute(form.url || '#')}">Formular öffnen</a>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

init();
