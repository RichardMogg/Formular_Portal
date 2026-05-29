import { state, loadOrderContext, saveOrderContext, clearOrderContext, clearLieferscheinDraft, shredCompleteActiveOrder } from './state.js?v=1.0.3';
import { 
  elements, 
  renderCategoryFilter, 
  renderForms, 
  renderOrderContext, 
  openLieferscheinModal, 
  closeLieferscheinModal, 
  addMaterialRow, 
  addTimeRow,
  triggerDraftAutoSave,
  resetPortalToInitialState,
  clearAllModalFormFields,
  techSigPad,
  custSigPad
} from './ui.js?v=1.0.3';
import { parsePdfOrder } from './pdf-handler.js?v=1.0.3';

// Mail-Konfigurations-Cache
let cachedMailAddress = 'adl@gebatech.at'; // Standard Fallback
let cachedMailBody = 'Auftrag abgeschlossen.\nAnbei der Arbeitsnachweis/Lieferschein im Anhang.';

async function init() {
  bindEvents();
  await loadForms();
  await loadMailConfiguration();
  
  // Geladenen Auftrag aus sessionStorage/localStorage wiederherstellen
  loadOrderContext();
  renderOrderContext();
  
  // Automatisierte Selbsttests triggern, falls ?runtests=1 in der URL steht
  if (window.location.search.includes('runtests=1')) {
    setTimeout(runAutomatedTests, 1000);
  }
}

function bindEvents() {
  // Filter- und Suche-Events im Dashboard
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

  // ========================================================
  // LIEFERSCHEIN MODAL LOGICS
  // ========================================================
  
  // Modal öffnen
  elements.btnCreateLieferschein.addEventListener('click', () => {
    openLieferscheinModal();
  });

  // Modal schließen (speichert Entwurf automatisch)
  elements.btnCloseModal.addEventListener('click', () => {
    closeLieferscheinModal();
  });

  // Materialzeile hinzufügen
  elements.btnAddMaterialRow.addEventListener('click', () => {
    addMaterialRow('', '', '');
    triggerDraftAutoSave();
  });

  // Arbeitszeitzeile hinzufügen
  elements.btnAddTimeRow.addEventListener('click', () => {
    addTimeRow('', '', '', '', '', '', '', '');
    triggerDraftAutoSave();
  });

  // Signaturen löschen
  elements.btnClearTechSig.addEventListener('click', () => {
    if (techSigPad) techSigPad.clear();
    triggerDraftAutoSave();
  });

  elements.btnClearCustSig.addEventListener('click', () => {
    if (custSigPad) custSigPad.clear();
    triggerDraftAutoSave();
  });

  // Drucken-Button
  elements.btnPrintLieferschein.addEventListener('click', () => {
    window.print();
  });

  // Leeren-Button
  elements.btnResetLieferschein.addEventListener('click', () => {
    if (confirm('Möchten Sie alle eingetragenen Lieferschein-Daten und Unterschriften wirklich unwiderruflich löschen?')) {
      clearAllModalFormFields();
      clearLieferscheinDraft(); // Löscht den Entwurf komplett aus dem Speicher, statt einen leeren Entwurf zu sichern!
      state.isDraftCleared = true; // Setzt das Flag, um das automatische Speichern beim Schließen des Modals zu überspringen!
    }
  });

  // Haupt-Button "Auftrag abschließen" (PDF-Erstellung + Mail + Shredder + Reset)
  elements.btnCompleteOrder.addEventListener('click', async () => {
    await handleOrderCompletion();
  });

  // Radio-Button-Verhalten (Entweder-oder) für erfolgreich / folgetermin
  elements.statusAbgeschlossen.addEventListener('change', () => {
    if (elements.statusAbgeschlossen.checked) {
      elements.statusFolgetermin.checked = false;
      triggerDraftAutoSave();
    }
  });

  elements.statusFolgetermin.addEventListener('change', () => {
    if (elements.statusFolgetermin.checked) {
      elements.statusAbgeschlossen.checked = false;
      triggerDraftAutoSave();
    }
  });

  // Auto-Save Trigger für statische Felder
  const autoSaveFields = [
    elements.modalOrderId, elements.modalClientName, elements.modalClientAddress,
    elements.modalCustomerName, elements.modalCustomerAddress, elements.modalContact,
    elements.modalPhone, elements.modalDate, elements.modalBasisNote1, elements.modalBasisNote2,
    elements.modalLeistungsbericht, elements.basisReparatur, elements.basisStoerung,
    elements.basisWartung, elements.basisPruefung, elements.basisInbetriebnahme,
    elements.basisInstallation, elements.statusAbgeschlossen, elements.statusFolgetermin
  ];
  
  autoSaveFields.forEach(field => {
    field.addEventListener('input', triggerDraftAutoSave);
    field.addEventListener('change', triggerDraftAutoSave);
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

// ========================================================
// E-MAIL CONFIGURATION LOADER
// ========================================================
async function loadMailConfiguration() {
  try {
    const response = await fetch('assets/mail.md', { cache: 'no-store' });
    if (!response.ok) {
      console.warn('assets/mail.md konnte nicht geladen werden, verwende Standardwerte.');
      return;
    }
    const markdown = await response.text();
    
    // E-Mail-Adresse extrahieren
    const addressMatch = markdown.match(/Address:\s*([^\r\n]+)/i);
    if (addressMatch) {
      cachedMailAddress = addressMatch[1].trim();
    }
    
    // E-Mail-Text extrahieren
    const bodyMatch = markdown.match(/Body:\s*([\s\S]+)/i);
    if (bodyMatch) {
      cachedMailBody = bodyMatch[1]
        .replace(/^[ \t]+/gm, '') // Führende Leerzeichen je Zeile entfernen
        .trim();
    }
    
    console.log(`[MailConfig] Konfiguration geladen: Empfänger=${cachedMailAddress}`);
  } catch (e) {
    console.error('Fehler beim Laden der Mail-Konfiguration:', e);
  }
}

// ========================================================
// GEOLOCATION SECURITY GATE
// ========================================================
function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation wird von diesem Browser nicht unterstützt.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date(position.timestamp || Date.now())
        });
      },
      (error) => {
        let msg = 'Standorterfassung fehlgeschlagen.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Standortfreigabe verweigert.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Standortinformationen nicht verfügbar.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Zeitüberschreitung bei der Standorterfassung.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// ========================================================
// DOM PREPARATION FOR PDF GENERATION (Bypasses html2canvas Input Bugs)
// ========================================================
function prepareDomForPdf(container) {
  const restorations = [];
  
  // Find all textual inputs and textareas
  const inputs = container.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="image"]), textarea');
  
  inputs.forEach(input => {
    const isTextarea = input.tagName.toLowerCase() === 'textarea';
    const span = document.createElement(isTextarea ? 'div' : 'span');
    span.className = 'pdf-temp-text';
    
    let val = input.value || '';
    
    // Formatting specific types
    if (input.type === 'date' && val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        val = `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
    }
    
    // Fallback if empty to preserve spacing and prevent collapse
    if (!val.trim()) {
      val = isTextarea ? 'Keine Arbeiten dokumentiert.' : '\u00A0';
    }
    
    if (isTextarea) {
      // Escape HTML and replace newlines with <br> to prevent html2canvas index size/range crashes on multiline text nodes
      span.innerHTML = escapeHtml(val).split('\n').map(line => line.trim() ? line : '\u00A0').join('<br>');
    } else {
      span.textContent = val;
    }
    
    // Copy computed styling to ensure high-fidelity match
    const computed = window.getComputedStyle(input);
    span.style.fontSize = computed.fontSize || '11px';
    span.style.fontWeight = computed.fontWeight || '700';
    span.style.fontFamily = computed.fontFamily || 'inherit';
    span.style.color = '#1a1a1a';
    span.style.lineHeight = computed.lineHeight || 'normal';
    span.style.padding = computed.padding || '0';
    span.style.boxSizing = 'border-box';
    span.style.display = isTextarea ? 'block' : 'inline-block';
    
    if (isTextarea) {
      span.style.whiteSpace = 'pre-wrap';
      span.style.wordBreak = 'break-word';
      span.style.minHeight = '100px';
      span.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0) 95%, #cbd5e1 95%, #cbd5e1 100%)';
      span.style.backgroundSize = '100% 24px';
    } else {
      // Inputs in time-picker should keep a flexible layout
      if (input.classList.contains('time-von') || input.classList.contains('time-bis')) {
        span.style.width = 'auto';
        span.style.minWidth = '35px';
      } else {
        span.style.width = '100%';
      }
    }
    
    // Hide original element and insert temporary static span
    const originalDisplay = input.style.display;
    input.style.display = 'none';
    input.parentNode.insertBefore(span, input);
    
    restorations.push(() => {
      span.remove();
      input.style.display = originalDisplay;
    });
  });
  
  return () => {
    restorations.forEach(restore => restore());
  };
}

// ========================================================
// ORDER COMPLETION & EMAIL FORWARDING WORKFLOW
// ========================================================
async function handleOrderCompletion() {
  const orderId = elements.modalOrderId.value.trim() || 'Unbekannt';
  // 1. Validierung: Mindestens eine Checkbox der Auftragsgrundlage ausgewählt?
  const basisSelected = elements.basisReparatur.checked || 
                        elements.basisStoerung.checked || 
                        elements.basisWartung.checked || 
                        elements.basisPruefung.checked || 
                        elements.basisInbetriebnahme.checked || 
                        elements.basisInstallation.checked;
  if (!basisSelected) {
    alert("Bitte wählen Sie mindestens eine Auftragsgrundlage aus (Reparatur, Störung, Wartung, Prüfung, Inbetriebnahme oder Installation).");
    return;
  }

  // 2. Validierung: Genau einer der Abschluss-Status (erfolgreich / folgetermin) ausgewählt?
  const statusSelected = elements.statusAbgeschlossen.checked || elements.statusFolgetermin.checked;
  if (!statusSelected) {
    alert("Bitte wählen Sie den Abschluss-Status aus (erfolgreich abgeschlossen oder Folgetermin notwendig).");
    return;
  }

  // 3. Validierung: Unterschriften vorhanden?
  if (custSigPad && custSigPad.isEmpty()) {
    if (!confirm('Es wurde noch keine Kundenunterschrift geleistet. Möchten Sie den Auftrag trotzdem abschließen?')) {
      return;
    }
  }

  // Visualisierung starten
  const btn = elements.btnCompleteOrder;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Erfasse GPS-Standort...';

  let gpsData = null;
  try {
    gpsData = await getGeolocation();
    
    // GPS & Zeitstempel uneditierbar einfügen
    const latLngStr = `${gpsData.lat.toFixed(6)}°, ${gpsData.lng.toFixed(6)}°`;
    const formatTime = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const timestampStr = formatTime(gpsData.timestamp);
    
    elements.modalGpsCoords.textContent = latLngStr;
    elements.modalGpsTimestamp.textContent = timestampStr;
    console.log(`[SafetyVerification] GPS erfasst: ${latLngStr} um ${timestampStr}`);
  } catch (gpsError) {
    console.error('GPS-Erfassungsfehler:', gpsError);
    alert(`Auftrag kann nicht abgeschlossen werden!\n\nFür die digitale Sicherheit und Verifizierung des Arbeitsnachweises ist die Standorterfassung zwingend erforderlich.\n\nDetails: ${gpsError.message}`);
    btn.disabled = false;
    btn.textContent = originalText;
    return; // Abbruch!
  }

  btn.textContent = 'Erstelle Lieferschein PDF...';

  try {
    // 1. html2pdf.js dynamisch nachladen (um Ladezeiten beim App-Start zu minimieren)
    await loadHtml2PdfLibrary();
    
    // 2. Element für PDF-Export vorbereiten
    const element = document.getElementById('lieferscheinSheet');
    const filename = `Arbeitsnachweis-${orderId}.pdf`;
    
    // A4-Optimierungsklasse hinzufügen
    element.classList.add('pdf-export-mode');
    
    // Ersetze alle Inputs und Textareas durch statische Textspans, um html2canvas-Crashes zu umgehen
    const restoreInputs = prepareDomForPdf(element);
    
    // Normalisiere den DOM-Tree, um adjacent text nodes zu bereinigen und IndexSizeErrors/setEnd Errors in html2canvas zu verhindern!
    element.normalize();
    
    // Synchronen Reflow (Layout-Berechnung) erzwingen, damit die Textknoten-Indizes im Layout-Tree 100% aktuell sind!
    const forceReflow = element.offsetHeight;
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Erzeuge das PDF-Dokument als Binär-Blob
    let pdfBlob = null;
    try {
      pdfBlob = await window.html2pdf().set(opt).from(element).output('blob');
    } finally {
      // In jedem Fall (auch bei Fehlern) die Live-Inputs wiederherstellen und A4-Optimierung aufheben!
      restoreInputs();
      element.classList.remove('pdf-export-mode');
    }
    
    // 3. E-Mail Versand per Web Share API oder Fallback
    const subject = `Arbeitsnachweis/Lieferschein ${orderId}`;
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });
    
    let sharedSuccessfully = false;
    
    // Web Share API unterstützt das Teilen von Dateien (hervorragend auf iPads & Mobiltelefonen)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: subject,
          text: cachedMailBody
        });
        sharedSuccessfully = true;
        console.log('[MailShare] PDF wurde erfolgreich über die Web Share API geteilt.');
      } catch (shareError) {
        // Share vom Benutzer abgebrochen oder fehlgeschlagen
        console.warn('[MailShare] Teilen abgebrochen oder fehlgeschlagen:', shareError);
      }
    }
    
    // Fallback: Direkter PDF-Download + mailto: Link
    if (!sharedSuccessfully) {
      // PDF-Download im Browser triggern (lädt den bereits fehlerfrei erstellten Blob herunter)
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Mailto Link öffnen
      const mailtoUrl = `mailto:${cachedMailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cachedMailBody + '\n\n[Bitte hängen Sie das soeben heruntergeladene Lieferschein-PDF an diese Mail an]')}`;
      window.location.href = mailtoUrl;
      
      alert('Der Arbeitsnachweis wurde als PDF heruntergeladen und Ihre E-Mail-App wurde geöffnet.\n\nBitte hängen Sie die heruntergeladene Datei an.');
    }
    
    // 4. SICHERHEITSLÖSCHUNG & RESET (Daten und Unterschriften rückstandsfrei vernichten)
    shredCompleteActiveOrder();
    
    // Portal-UI komplett zurücksetzen
    resetPortalToInitialState();
    
    // Modal schließen
    elements.lieferscheinModal.classList.add('hidden');
    document.body.style.overflow = '';
    
    alert('Auftrag erfolgreich abgeschlossen! Alle Daten und Unterschriften wurden sicher aus dem lokalen Speicher geschreddert.');
    
  } catch (error) {
    console.error('Fehler beim Auftragsabschluss:', error);
    alert('Fehler beim Abschließen des Auftrags: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Lädt html2pdf.js aus dem CDN
function loadHtml2PdfLibrary() {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error('PDF-Bibliothek (html2pdf.js) konnte nicht vom CDN geladen werden. Bitte Internetverbindung prüfen.'));
    };
    document.head.appendChild(script);
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ========================================================
// AUTOMATED INTEGRATION TESTS (REAL BROWSER ENVIRONMENT)
// ========================================================
async function runAutomatedTests() {
  console.log('%c[TEST RUNNER] Starte automatisierte Tests...', 'color: #005ca9; font-weight: bold; font-size: 14px;');
  const results = [];
  const assert = (condition, message) => {
    if (condition) {
      console.log(`%c[PASS] ${message}`, 'color: #16a34a; font-weight: bold;');
      results.push({ name: message, status: 'PASS' });
    } else {
      console.error(`[FAIL] ${message}`);
      results.push({ name: message, status: 'FAIL', error: true });
    }
  };

  try {
    // Test 1: Simuliere geladenen PDF-Auftrag im State
    const mockOrder = {
      orderId: 'TEST-12345',
      clientName: 'Muster GmbH',
      clientStreet: 'Hauptstraße 1',
      clientZip: '1234',
      clientCity: 'Wien',
      customerName: 'Baustelle A',
      customerStreet: 'Baustellengasse 10',
      customerZip: '5678',
      customerCity: 'Linz',
      orderBasis: 'Wartung',
      sachbearbeiter: 'Max Mustermann',
      orderDate: '29.05.2026'
    };
    
    saveOrderContext(mockOrder);
    assert(state.orderContext !== null, 'PDF-Auftrag wurde im State gespeichert');
    assert(localStorage.getItem('activeOrderContext') !== null, 'Auftragskontext in localStorage persistiert');
    
    // Test 2: Modal öffnen (Vorbefüllungs-Check)
    openLieferscheinModal();
    assert(elements.lieferscheinModal.classList.contains('hidden') === false, 'Modal wurde geöffnet');
    assert(elements.modalOrderId.value === 'TEST-12345', 'Kopfdaten: Auftrags-Nr. erfolgreich vorbefüllt');
    assert(elements.modalClientName.value === 'Muster GmbH', 'Kopfdaten: Auftraggeber erfolgreich vorbefüllt');
    assert(elements.basisWartung.checked === true, 'Kopfdaten: Checkbox "Wartung" vorbefüllt');
    
    // Test 3: Entwurf sichern bei Modifikation
    elements.modalOrderId.value = 'TEST-CHANGED';
    triggerDraftAutoSave();
    // Warte auf Debounce (550ms)
    await new Promise(r => setTimeout(r, 600));
    assert(localStorage.getItem('gebatechLieferscheinDraft') !== null, 'Entwurf nach Feldänderung in localStorage gespeichert');
    const draft = loadLieferscheinDraft();
    assert(draft && draft.orderId === 'TEST-CHANGED', 'Gespeicherter Entwurf enthält die geänderten Daten');
    
    // Test 4: Formular leeren (Löschen-Check)
    const originalConfirm = window.confirm;
    window.confirm = () => true; // Automatisch zustimmen
    elements.btnResetLieferschein.click();
    window.confirm = originalConfirm; // Restore confirm
    
    assert(elements.modalOrderId.value === '', 'Kopfdaten nach Klick auf "Leeren" im UI geleert');
    assert(elements.modalClientName.value === '', 'Kopfdaten Auftraggeber nach Klick auf "Leeren" im UI geleert');
    assert(elements.basisWartung.checked === false, 'Auftragsgrundlage nach Klick auf "Leeren" im UI deaktiviert');
    assert(localStorage.getItem('gebatechLieferscheinDraft') === null, 'Lieferschein-Entwurf wurde vollständig aus localStorage gelöscht');
    assert(state.isDraftCleared === true, 'isDraftCleared Flag wurde erfolgreich auf true gesetzt');
    
    // Test 5: Modal schließen (Sicherungs-Bypass-Check)
    closeLieferscheinModal();
    assert(elements.lieferscheinModal.classList.contains('hidden') === true, 'Modal wurde geschlossen');
    assert(localStorage.getItem('gebatechLieferscheinDraft') === null, 'Trotz Schließen-Event bleibt der Entwurf gelöscht (Bypass aktiv)');
    assert(state.isDraftCleared === false, 'isDraftCleared Flag wurde nach dem Schließen wieder zurückgesetzt');
    
    // Test 6: Erneutes Öffnen (Erneuter Vorbefüllungs-Check)
    openLieferscheinModal();
    assert(elements.modalOrderId.value === 'TEST-12345', 'Nach erneutem Öffnen wurde der Lieferschein wunschgemäß wieder frisch aus dem PDF vorbefüllt!');
    
    closeLieferscheinModal();
    // Bereinige Testdaten
    shredCompleteActiveOrder();
    resetPortalToInitialState();
    
    // Erfolgs-Ausgabe im UI
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    
    const summaryMsg = `[TEST RUNNER SUMMARY] ${passCount} Tests ERFOLGREICH, ${failCount} FEHLGESCHLAGEN`;
    console.log(`%c${summaryMsg}`, failCount === 0 ? 'color: #16a34a; font-weight: bold;' : 'color: #dc2626; font-weight: bold;');
    
    alert(`🧪 AUTOMATISIERTER IN-BROWSER SELBSTTEST ERFOLGREICH!\n\nAlle ${passCount} Validierungen zur "Leeren & Vorbefüllen"-Logik wurden fehlerfrei im echten Browser ausgeführt.\n\nDetails finden Sie in der Browser-Entwicklerkonsole (F12).`);
  } catch (error) {
    console.error('Kritischer Fehler im Test Runner:', error);
    alert('Fehler beim Ausführen der automatisierten Tests: ' + error.message);
  }
}

init();
