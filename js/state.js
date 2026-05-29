export const state = {
  forms: [],
  query: '',
  category: 'all',
  orderContext: null,
  lieferscheinDraft: null,
  isDraftCleared: false
};

const LOCAL_STORAGE_KEY = 'activeOrderContext';
const LIEFERSCHEIN_DRAFT_KEY = 'gebatechLieferscheinDraft';

// ========================================================
// ACTIVE ORDER CONTEXT (PDF DATA)
// ========================================================
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

// ========================================================
// GEBATECH LIEFERSCHEIN DRAFT PERSISTENCE
// ========================================================
export function saveLieferscheinDraft(draft) {
  state.lieferscheinDraft = draft;
  if (draft) {
    localStorage.setItem(LIEFERSCHEIN_DRAFT_KEY, JSON.stringify(draft));
  } else {
    localStorage.removeItem(LIEFERSCHEIN_DRAFT_KEY);
  }
}

export function loadLieferscheinDraft() {
  const stored = localStorage.getItem(LIEFERSCHEIN_DRAFT_KEY);
  if (stored) {
    try {
      state.lieferscheinDraft = JSON.parse(stored);
    } catch (e) {
      console.error('Fehler beim Laden des Lieferschein-Entwurfs:', e);
      state.lieferscheinDraft = null;
    }
  }
  return state.lieferscheinDraft;
}

export function clearLieferscheinDraft() {
  saveLieferscheinDraft(null);
}

// ========================================================
// HIGH-SECURITY 3-PASS SHREDDER (ES5/ES6 Sandbox-Effort)
// ========================================================
export function secureShredLocalStorageKey(key) {
  try {
    if (!window.localStorage) return;
    const originalValue = window.localStorage.getItem(key);
    if (!originalValue) return;

    const length = originalValue.length;
    
    // Pass 1: Überschreiben mit Nullen
    const pass1 = Array(length + 1).join('0');
    window.localStorage.setItem(key, pass1);

    // Pass 2: Überschreiben mit Einsen
    const pass2 = Array(length + 1).join('1');
    window.localStorage.setItem(key, pass2);

    // Pass 3: Überschreiben mit Rauschen (hoch-entropische Zeichen)
    let pass3 = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const charsLength = chars.length;
    for (let i = 0; i < length; i++) {
      pass3 += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    window.localStorage.setItem(key, pass3);

    // Endgültig entfernen
    window.localStorage.removeItem(key);
    console.log(`[SignatureWipe] Key '${key}' wurde erfolgreich mit 3-Pass-Rauschen geschreddert.`);
  } catch (e) {
    console.error(`[SignatureWipe] Fehler beim Schreddern von Key '${key}':`, e);
    try { window.localStorage.removeItem(key); } catch (_) {}
  }
}

/**
 * Löscht den gesamten Auftrag inklusive aller Daten und Unterschriften absolut sicher.
 */
export function shredCompleteActiveOrder() {
  secureShredLocalStorageKey(LOCAL_STORAGE_KEY);
  secureShredLocalStorageKey(LIEFERSCHEIN_DRAFT_KEY);
  state.orderContext = null;
  state.lieferscheinDraft = null;
}

// ========================================================
// FILTER UTILS
// ========================================================
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
