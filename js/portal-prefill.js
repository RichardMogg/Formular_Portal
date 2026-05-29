/**
 * Portal Prefill Helper (Template für Formulare)
 * 
 * Binden Sie dieses Skript in ein beliebiges Formular ein, um die aktiven Auftragsdaten
 * aus dem Portal (localStorage) automatisch in die Eingabefelder einzulesen.
 * 
 * Enthält ein intelligentes Label-Matching-Feature:
 * Da der Formular-Baukasten dynamische Feld-IDs vergibt (z. B. "neues_feld_mpql0lai..."),
 * sucht dieses Skript zusätzlich nach den Bezeichnungen (Labels) wie "Auftraggeber" oder
 * "Auftragsnummer". Dadurch funktioniert die Vorbefüllung völlig unabhängig von den technischen IDs!
 */
(function() {
  'use strict';

  // Standard ID- & Feld-Mappings (Fallback für feste Bestands-Strukturen)
  const ID_MAPPINGS = {
    'kundeInput': 'clientInfo',
    'objektInput': 'customerAddress',
    'signTechnikerInput': 'sachbearbeiter',
    'techniker': 'sachbearbeiter',
    'datumUhrzeit': 'orderDate',
    'anlagenerrichter': 'defaultGebatech'
  };

  // Zuweisung über menschenlesbare Feldbezeichnungen (Ultimative Baukasten-Lösung!)
  const LABEL_MAPPINGS = {
    'auftraggeber': 'clientInfo',
    'kunde': 'customerAddress',
    'objektanschrift': 'customerAddress',
    'baustelle': 'customerAddress',
    'kundenadresse': 'customerAddress',
    'rechnungsadresse': 'billingAddress',
    'auftragsnummer': 'orderId',
    'auftrags-nr': 'orderId',
    'techniker': 'sachbearbeiter',
    'sachbearbeiter': 'sachbearbeiter',
    'auftragsgrundlage': 'orderBasis',
    'datum': 'orderDate',
    'termin': 'orderTermin'
  };

  // Eindeutige Kennung für dieses spezifische Formular basierend auf dem Dateipfad
  const FORM_ID = window.location.pathname;
  const PREFILL_STORAGE_KEY = `${FORM_ID}_last_prefilled_order_id`;

  function prefill() {
    try {
      const raw = localStorage.getItem('activeOrderContext');
      const lastPrefilledOrderId = localStorage.getItem(PREFILL_STORAGE_KEY);

      // Falls die Formular-Elemente noch gar nicht gerendert wurden (z.B. vor runtime-app.js init),
      // brechen wir ab und warten auf das nächste Event (DOMContentLoaded / load)
      const formFields = document.querySelectorAll('[data-field], [data-prefill]');
      if (formFields.length === 0) {
        console.log('Portal-Vorbefüllung wartet auf das Rendern der Formularfelder...');
        return;
      }

      // Einmalig die Reset-Buttons abfangen, falls vorhanden
      bindResetButtons();

      if (!raw) {
        // FALL 2: Kein aktiver Auftrag im Portal (wurde gelöscht oder verworfen)
        if (lastPrefilledOrderId) {
          // Formular wurde zuvor befüllt -> Felder jetzt leeren!
          clearPrefilledFields();
          localStorage.removeItem(PREFILL_STORAGE_KEY);
          triggerSaveDraft();
          console.log('Portal-Vorbefüllung gelöscht, da der Auftrag im Portal entfernt wurde.');
        }
        return;
      }

      const orderData = JSON.parse(raw);
      if (!orderData) return;

      // FALL 1: Aktiver Auftrag im Portal vorhanden
      if (orderData.orderId !== lastPrefilledOrderId) {
        // Entweder neu befüllen oder Auftrag wurde geändert
        applyPrefill(orderData);
        localStorage.setItem(PREFILL_STORAGE_KEY, orderData.orderId);
        triggerSaveDraft();
        console.log(`Portal-Vorbefüllung für Auftrag ${orderData.orderId} erfolgreich angewendet.`);
      }
    } catch (e) {
      console.error('Fehler bei der Portal-Vorbefüllung:', e);
    }
  }

  let resetButtonsBound = false;
  function bindResetButtons() {
    if (resetButtonsBound) return;
    const btnNew = document.getElementById('runtimeNewProtocolButton');
    const btnClear = document.getElementById('runtimeClearDraftButton');
    
    if (btnNew || btnClear) {
      const handleReset = () => {
        console.log('Reset-Aktion im Formular erkannt -> Lösche Prefill-Key und trigger Re-Prefill.');
        localStorage.removeItem(PREFILL_STORAGE_KEY);
        // Kurzer Delay, damit der Reset-Vorgang der App durchgelaufen ist
        setTimeout(prefill, 100);
      };
      
      if (btnNew) btnNew.addEventListener('click', handleReset);
      if (btnClear) btnClear.addEventListener('click', handleReset);
      resetButtonsBound = true;
    }
  }

  function applyPrefill(orderData) {
    // 1. Zuweisung über das moderne data-prefill Attribut (Hohe Priorität)
    const prefillElements = document.querySelectorAll('[data-prefill]');
    prefillElements.forEach(el => {
      const key = el.getAttribute('data-prefill');
      if (orderData[key] !== undefined) {
        let value = orderData[key];
        
        // Datums-Formatierungen für Eingabefelder vornehmen
        if (el.type === 'date' && value) {
          const dateParts = value.split('.');
          if (dateParts.length === 3) {
            value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
          }
        } else if (el.type === 'datetime-local' && value) {
          const dateParts = value.split('.');
          if (dateParts.length === 3) {
            value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T08:00`;
          }
        }
        
        fillField(el, value);
      }
    });

    // 2. Zuweisung über klassische ID- und Data-Field-Mappings (Fallback)
    Object.keys(ID_MAPPINGS).forEach(id => {
      const el = document.getElementById(id) || document.querySelector(`[data-field="${id}"]`);
      if (el) {
        const key = ID_MAPPINGS[id];
        
        if (key === 'defaultGebatech') {
          fillField(el, 'GEBATECH');
        } else if (orderData[key] !== undefined) {
          let value = orderData[key];
          
          // Spezialkonvertierung für datetime-local Eingabefelder
          if (id === 'datumUhrzeit' && value) {
            const dateParts = value.split('.');
            if (dateParts.length === 3) {
              value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T08:00`;
            }
          }
          fillField(el, value);
        }
      }
    });

    // 3. Zuweisung über Feldbezeichnungen (Zentrales Baukasten-Matching)
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
      // Label-Text bereinigen (Pflichtfeld-Sternchen und überflüssige Leerzeichen entfernen)
      const cleanLabelText = label.textContent
        .replace(/\*/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      Object.keys(LABEL_MAPPINGS).some(keyword => {
        if (cleanLabelText.startsWith(keyword) || cleanLabelText === keyword) {
          const key = LABEL_MAPPINGS[keyword];
          if (orderData[key] !== undefined) {
            // Das Eingabefeld innerhalb des Labels oder verknüpft mit 'for' finden
            const input = label.querySelector('input, textarea, select') || 
                          (label.getAttribute('for') ? document.getElementById(label.getAttribute('for')) : null);
            
            if (input) {
              // Falls das Feld bereits ein explizites data-prefill Attribut hat,
              // überspringen wir das Label-Matching, da das explizite Mapping Priorität hat!
              if (input.hasAttribute('data-prefill')) {
                return true; // Gefunden, aber übersprungen
              }

              let value = orderData[key];
              
              // Datums-Formatierungen für Baukasten-Eingabefelder vornehmen
              if (input.type === 'date' && value) {
                const dateParts = value.split('.');
                if (dateParts.length === 3) {
                  value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                }
              } else if (input.type === 'datetime-local' && value) {
                const dateParts = value.split('.');
                if (dateParts.length === 3) {
                  value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T08:00`;
                }
              }
              
              fillField(input, value);
              return true; // Zuweisung für dieses Label erfolgreich abgeschlossen
            }
          }
        }
        return false;
      });
    });
  }

  function clearPrefilledFields() {
    // 1. Alle data-prefill Elemente leeren
    const prefillElements = document.querySelectorAll('[data-prefill]');
    prefillElements.forEach(el => clearField(el));

    // 2. Alle per ID gemappten Standardfelder leeren
    Object.keys(ID_MAPPINGS).forEach(id => {
      const el = document.getElementById(id) || document.querySelector(`[data-field="${id}"]`);
      if (el) clearField(el);
    });

    // 3. Alle per Label gemappten Felder leeren
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
      const cleanLabelText = label.textContent
        .replace(/\*/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      Object.keys(LABEL_MAPPINGS).some(keyword => {
        if (cleanLabelText.startsWith(keyword) || cleanLabelText === keyword) {
          const input = label.querySelector('input, textarea, select') || 
                        (label.getAttribute('for') ? document.getElementById(label.getAttribute('for')) : null);
          if (input) {
            clearField(input);
            return true;
          }
        }
        return false;
      });
    });
  }

  function fillField(el, value) {
    if (!el || value === undefined || value === null) return;

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      el.value = value;
      // Events triggern, damit reaktiver JS-Code auf die Befüllung anspringt
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      el.textContent = value;
    }
  }

  function clearField(el) {
    if (!el) return;

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      el.textContent = '';
    }
  }

  function triggerSaveDraft() {
    // Entwurfs-Speicherung der Formular-Webapp triggern (falls vorhanden)
    if (typeof window.saveDraft === 'function') {
      window.saveDraft(false);
    } else if (typeof saveDraft === 'function') {
      saveDraft(false);
    }
  }

  // Ausführen sobald das DOM bereit ist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prefill);
  } else {
    prefill();
  }

  // Sicherheits-Fallback, falls Skripte verzögert geladen werden
  window.addEventListener('load', prefill);
})();
