import { state, loadOrderContext, saveOrderContext, clearOrderContext, shredCompleteActiveOrder } from './state.js';
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
  techSigPad,
  custSigPad
} from './ui.js';
import { parsePdfOrder } from './pdf-handler.js';

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

  // Haupt-Button "Auftrag abschließen" (PDF-Erstellung + Mail + Shredder + Reset)
  elements.btnCompleteOrder.addEventListener('click', async () => {
    await handleOrderCompletion();
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
// ORDER COMPLETION & EMAIL FORWARDING WORKFLOW
// ========================================================
async function handleOrderCompletion() {
  const orderId = elements.modalOrderId.value.trim() || 'Unbekannt';
  
  // Validierung: Unterschriften vorhanden?
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
    const pdfBlob = await window.html2pdf().set(opt).from(element).output('blob');
    
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
      // PDF-Download im Browser triggern
      await window.html2pdf().set(opt).from(element).save();
      
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

init();
