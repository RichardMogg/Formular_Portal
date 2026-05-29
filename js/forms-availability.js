/*
 * Filtert beim Laden des Portals tote forms.json-Einträge heraus.
 *
 * Hintergrund:
 * Eine statische GitHub-Pages-Seite kann den Ordner forms/ nicht direkt scannen.
 * Sie kann aber für die in forms.json eingetragenen Apps prüfen, ob deren URL noch existiert.
 * Dadurch werden gelöschte Formularordner nicht mehr als Karten angezeigt.
 */

const originalFetch = window.fetch.bind(window);

window.fetch = async function patchedFetch(input, init) {
  const response = await originalFetch(input, init);

  if (!isFormsJsonRequest(input) || !response.ok) {
    return response;
  }

  try {
    const forms = await response.clone().json();
    if (!Array.isArray(forms)) {
      return response;
    }

    const availableForms = await filterAvailableForms(forms);

    return new Response(JSON.stringify(availableForms, null, 2), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  } catch (error) {
    console.warn('[FormsAvailability] forms.json konnte nicht gefiltert werden:', error);
    return response;
  }
};

function isFormsJsonRequest(input) {
  const url = typeof input === 'string'
    ? input
    : input && typeof input.url === 'string'
      ? input.url
      : '';

  if (!url) return false;

  try {
    const resolvedUrl = new URL(url, window.location.href);
    return resolvedUrl.pathname.endsWith('/forms.json');
  } catch (_) {
    return url === 'forms.json' || url.endsWith('/forms.json');
  }
}

async function filterAvailableForms(forms) {
  const checks = await Promise.all(forms.map(async (form) => {
    const available = await isFormAvailable(form);
    return { form, available };
  }));

  const missingForms = checks.filter((item) => !item.available).map((item) => item.form);

  if (missingForms.length > 0) {
    console.info(
      '[FormsAvailability] Ausgeblendete forms.json-Einträge ohne erreichbare App:',
      missingForms.map((form) => form.url || form.id || form.title)
    );
  }

  return checks
    .filter((item) => item.available)
    .map((item) => item.form);
}

async function isFormAvailable(form) {
  if (!form || typeof form.url !== 'string' || form.url.trim() === '') {
    return false;
  }

  const url = form.url.trim();

  try {
    const headResponse = await originalFetch(url, {
      method: 'HEAD',
      cache: 'no-store'
    });

    if (headResponse.ok) {
      return true;
    }

    if (headResponse.status === 404) {
      return false;
    }
  } catch (_) {
    // Einige lokale Testserver oder Browser unterstützen HEAD nicht zuverlässig.
    // In diesem Fall folgt ein kleiner GET-Fallback.
  }

  try {
    const getResponse = await originalFetch(url, {
      method: 'GET',
      cache: 'no-store'
    });
    return getResponse.ok;
  } catch (_) {
    return false;
  }
}
[

  {
    "url": "forms/GBT Störungsbericht/index.html",
    "id": "GBT Störungsbericht",
    "title": "GBT Störungsbericht",
    "category": "Berichte",
    "description": "",
    "version": "1.0",
    "status": "active",
    "tags": ["GBT Störungsbericht", "Berichte"],
    "favorite": false,
    "acceptsOrderContext": true,
    "prefillProfile": "standard"
  }
]