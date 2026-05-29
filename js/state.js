export const state = {
  forms: [],
  query: '',
  category: 'all',
  orderContext: null
};

const LOCAL_STORAGE_KEY = 'activeOrderContext';

export function saveOrderContext(context) {
  state.orderContext = context;
  if (context) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(context));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

export function loadOrderContext() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      state.orderContext = JSON.parse(stored);
    } catch (e) {
      console.error('Fehler beim Laden des Auftragskontextes:', e);
      state.orderContext = null;
    }
  }
  return state.orderContext;
}

export function clearOrderContext() {
  saveOrderContext(null);
}

export function matchesFilters(form) {
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
