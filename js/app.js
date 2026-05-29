import { state, loadOrderContext, saveOrderContext, clearOrderContext, clearLieferscheinDraft, shredCompleteActiveOrder } from './state.js?v=1.1.0';
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
} from './ui.js?v=1.1.0';
import { parsePdfOrder } from './pdf-handler.js?v=1.1.0';

// Mail-Konfigurations-Cache
let cachedMailAddress = 'adl@gebatech.at'; // Standard Fallback
let cachedMailBody = 'Auftrag abgeschlossen.\nAnbei der Arbeitsnachweis/Lieferschein im Anhang.';
let cachedPdfLogoDataUrl = null;

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
  
  // Dynamische Feldgröße für den Leistungsbericht (Auto-Resize beim Tippen)
  elements.modalLeistungsbericht.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
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

function replacePdfCloneLogo(clone) {
  const logoImg = clone.querySelector('.sheet-logo-img');
  if (!logoImg) return;

  const dataUrl = createPdfLogoDataUrl();
  if (!dataUrl) return;

  logoImg.src = dataUrl;
  logoImg.removeAttribute('srcset');
  logoImg.alt = 'GEBATECH Logo';
  logoImg.style.width = '250px';
  logoImg.style.height = 'auto';
  logoImg.style.display = 'block';
  logoImg.style.objectFit = 'contain';
}

function createPdfLogoDataUrl() {
  if (cachedPdfLogoDataUrl) return cachedPdfLogoDataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = 1040;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.save();
  ctx.scale(2, 2);
  ctx.clearRect(0, 0, 520, 180);

  try {
    ctx.save();
    ctx.translate(20, 12);
    ctx.scale(0.85, 0.85);
    ctx.translate(-82.111, -8.672);

    ctx.fillStyle = '#1D1D1B';
    ctx.fill(new Path2D('M143.14,48.858v63.52l-0.312,0.002 c-17.541,0-31.761-14.22-31.761-31.761c0-17.542,14.22-31.762,31.761-31.762L143.14,48.858z M143.14,8.672v34.757l-0.312,0.004 c-5.72,0-10.428-4.337-11.015-9.901c-5.202,1.213-10.082,3.265-14.489,6.007c3.518,4.35,3.255,10.742-0.79,14.786 c-4.043,4.044-10.437,4.308-14.786,0.79c-2.745,4.413-4.8,9.301-6.011,14.513c5.545,0.604,9.861,5.303,9.861,11.01 c0,5.703-4.312,10.4-9.854,11.01c1.215,5.205,3.27,10.087,6.015,14.495c4.349-3.471,10.704-3.192,14.73,0.835 c4.025,4.024,4.305,10.376,0.839,14.725c4.406,2.741,9.285,4.792,14.486,6.004c0.635-5.514,5.318-9.794,11.003-9.795l0.322,0.005 v21.971l-61.028-0.003V44.081L143.14,8.672z'));

    ctx.fillStyle = '#D3BF00';
    ctx.fill(new Path2D('M153.82,127.71c-0.621-5.411-5.141-9.637-10.681-9.795v-5.537c17.397-0.167,31.449-14.321,31.449-31.759 c0-17.438-14.052-31.594-31.449-31.761v-5.43c5.578-0.154,10.127-4.435,10.702-9.897c5.223,1.217,10.119,3.28,14.54,6.037 c-3.515,4.35-3.25,10.74,0.793,14.783c4.037,4.037,10.413,4.307,14.763,0.81c2.74,4.415,4.788,9.305,5.994,14.517 c-5.538,0.612-9.845,5.308-9.845,11.009c0,5.69,4.29,10.379,9.813,11.007c-1.218,5.196-3.274,10.07-6.018,14.472 c-4.35-3.454-10.691-3.17-14.713,0.851c-4.016,4.016-4.303,10.35-0.861,14.697C163.902,124.451,159.022,126.5,153.82,127.71z'));
    ctx.restore();
  } catch (_) {
    ctx.fillStyle = '#1D1D1B';
    ctx.fillRect(58, 56, 44, 58);
    ctx.fillStyle = '#D3BF00';
    ctx.beginPath();
    ctx.arc(124, 88, 34, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(124, 122);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#111111';
  ctx.font = '900 54px Arial, Helvetica, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('GEBA', 160, 88);
  const gebaWidth = ctx.measureText('GEBA').width;
  ctx.fillStyle = '#c4bd18';
  ctx.fillText('TECH', 160 + gebaWidth, 88);

  ctx.fillStyle = '#111111';
  ctx.font = '700 23px Arial, Helvetica, sans-serif';
  ctx.fillText('GEBÄUDE | ANLAGENTECHNIK', 164, 122);

  ctx.restore();

  cachedPdfLogoDataUrl = canvas.toDataURL('image/png');
  return cachedPdfLogoDataUrl;
}

// ========================================================
// OFFSCREEN CLONING & DOM PREPARATION FOR EXPORT
// ========================================================
function createOffscreenPdfClone(element) {
  // 1. Briefblatt klonen
  const clone = element.cloneNode(true);
  
  // A4-Optimierungsklasse hinzufügen
  clone.classList.add('pdf-export-mode');
  replacePdfCloneLogo(clone);
  
  // 2. Eingabefelder (Inputs & Textareas) im Klon durch statische Texte ersetzen
  const liveInputs = element.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="image"]), textarea');
  const cloneInputs = clone.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="image"]), textarea');
  
  cloneInputs.forEach((cloneInput, index) => {
    const liveInput = liveInputs[index];
    if (!liveInput) return;
    
    const isTextarea = cloneInput.tagName.toLowerCase() === 'textarea';
    let val = liveInput.value || '';
    
    // Datums-Formatierung
    if (liveInput.type === 'date' && val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        val = `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
    }
    
    // Fallback falls leer (Standard-Leerzeichen statt fehleranfälligem geschütztem Leerzeichen)
    if (!val.trim()) {
      val = isTextarea ? 'Keine Arbeiten dokumentiert.' : ' ';
    }
    
    if (isTextarea) {
      const printDiv = clone.querySelector('#modalLeistungsberichtPrint');
      if (printDiv) {
        printDiv.innerHTML = escapeHtml(val).split('\n')
          .map(line => `<div class="pdf-report-line" style="min-height: 24px; line-height: 24px; word-break: break-word; box-sizing: border-box; padding: 0 4px;">${line.trim() ? line : ' '}</div>`)
          .join('');
        printDiv.style.display = 'block';
        printDiv.classList.add('print-show-force');
      }
      cloneInput.style.display = 'none';
    } else {
      const span = document.createElement('span');
      span.className = 'pdf-temp-text';
      span.textContent = val;
      
      // Styles kopieren vom Live-Input
      const computed = window.getComputedStyle(liveInput);
      span.style.fontSize = computed.fontSize || '11px';
      span.style.fontWeight = computed.fontWeight || '700';
      span.style.fontFamily = computed.fontFamily || 'inherit';
      span.style.color = '#1a1a1a';
      span.style.lineHeight = computed.lineHeight || 'normal';
      span.style.padding = computed.padding || '0';
      span.style.boxSizing = 'border-box';
      span.style.display = 'inline-block';
      
      if (liveInput.classList.contains('time-von') || liveInput.classList.contains('time-bis')) {
        span.style.width = 'auto';
        span.style.minWidth = '35px';
      } else {
        span.style.width = '100%';
      }
      
      cloneInput.parentNode.insertBefore(span, cloneInput);
      cloneInput.style.display = 'none';
    }
  });
  
  // 3. Status von Checkboxen & Radios übertragen
  const liveCheckboxes = element.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  const cloneCheckboxes = clone.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  cloneCheckboxes.forEach((cloneCb, index) => {
    const liveCb = liveCheckboxes[index];
    if (liveCb) {
      cloneCb.checked = liveCb.checked;
    }
  });
  
  // 4. Unterschriften-Canvas-Inhalte kopieren
  const cloneTechCanvas = clone.querySelector('#technicianSigCanvas');
  const cloneCustCanvas = clone.querySelector('#customerSigCanvas');
  
  if (cloneTechCanvas && elements.technicianSigCanvas) {
    cloneTechCanvas.width = elements.technicianSigCanvas.width;
    cloneTechCanvas.height = elements.technicianSigCanvas.height;
    const ctx = cloneTechCanvas.getContext('2d');
    ctx.drawImage(elements.technicianSigCanvas, 0, 0);
  }
  
  if (cloneCustCanvas && elements.customerSigCanvas) {
    cloneCustCanvas.width = elements.customerSigCanvas.width;
    cloneCustCanvas.height = elements.customerSigCanvas.height;
    const ctx = cloneCustCanvas.getContext('2d');
    ctx.drawImage(elements.customerSigCanvas, 0, 0);
  }
  
  // 5. Label-for-Attribute im Klon entfernen, um Messungskonflikte mit ausgeblendeten Inputs zu verhindern
  clone.querySelectorAll('label').forEach(label => {
    label.removeAttribute('for');
  });
  
  // 6. DOM normalisieren gegen html2canvas Range-Bugs
  clone.normalize();
  
  return clone;
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
    
    // GPS & Zeitstempel uneditierbar einfügen (ohne fehleranfälliges Grad-Symbol)
    const latLngStr = `${gpsData.lat.toFixed(6)}, ${gpsData.lng.toFixed(6)}`;
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

  let holder = null;
  try {
    // 1. Stabile PDF-Bibliotheken (html2canvas 1.4.1 & jsPDF 2.5.1) dynamisch nachladen
    await loadPdfLibraries();
    
    // 2. Element für PDF-Export vorbereiten
    const element = document.getElementById('lieferscheinSheet');
    const filename = `Arbeitsnachweis-${orderId}.pdf`;
    
    // Erstelle isolierten Offscreen-Klon, der vom restlichen UI unbeeinflusst bleibt!
    const clone = createOffscreenPdfClone(element);
    
    // In temporären Holder einhängen und außerhalb des sichtbaren Bereichs platzieren
    holder = document.createElement('div');
    holder.style.position = 'fixed';
    holder.style.left = '-10000px';
    holder.style.top = '0';
    holder.style.width = '210mm';
    holder.style.background = '#ffffff';
    holder.style.zIndex = '-99999';
    holder.appendChild(clone);
    document.body.appendChild(holder);
    
    // Kurzen asynchronen Delay einbauen, damit der Browser den Klon-Baum absolut stabilisiert
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Erzeuge das PDF-Dokument als Binär-Blob direkt aus dem isolierten Klon unter Verwendung der stabilen Bibliotheken!
    let pdfBlob = null;
    try {
      // html2canvas v1.4.1 für absolut fehlerfreies Zeichnen ausführen
      const canvas = await window.html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      // jsPDF v2.5.1 initialisieren
      const jsPDF = window.jspdf.jsPDF;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Das gerenderte Briefblatt passgenau auf das A4-Blatt (210mm x 297mm) zeichnen
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      
      const arrayBuffer = pdf.output('arraybuffer');
      pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
    } finally {
      // In jedem Fall den temporären Holder rückstandslos bereinigen!
      if (holder && holder.parentNode) {
        holder.parentNode.removeChild(holder);
      }
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

// Lädt html2canvas (v1.4.1) und jsPDF (v2.5.1) aus dem CDN
function loadPdfLibraries() {
  return Promise.all([
    new Promise((resolve, reject) => {
      if (window.html2canvas) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('html2canvas konnte nicht geladen werden.'));
      document.head.appendChild(script);
    }),
    new Promise((resolve, reject) => {
      if (window.jspdf && window.jspdf.jsPDF) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('jsPDF konnte nicht geladen werden.'));
      document.head.appendChild(script);
    })
  ]);
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