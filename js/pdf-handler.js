let pdfjsLoaded = null;

function loadPdfjs() {
  if (pdfjsLoaded) return pdfjsLoaded;

  pdfjsLoaded = new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => {
      reject(new Error('PDF.js Bibliothek konnte nicht vom CDN geladen werden. Bitte Internetverbindung prüfen.'));
    };
    document.head.appendChild(script);
  });

  return pdfjsLoaded;
}

export async function parsePdfOrder(file) {
  const pdfjs = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  if (pdf.numPages === 0) {
    throw new Error('Die hochgeladene PDF-Datei enthält keine Seiten.');
  }

  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  
  // Zeilenumbrüche anhand von Y-Koordinaten-Änderungen rekonstruieren!
  let lastY = null;
  let text = '';
  for (const item of textContent.items) {
    if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
      text += '\n';
    }
    text += item.str + ' ';
    lastY = item.transform[5];
  }

  return parseOrderText(text);
}

function parseAddressBlock(blockText) {
  const result = { name: '', street: '', zip: '', city: '' };
  if (!blockText) return result;

  // Falls der Block keine Zeilenumbrüche hat, aber Kommas besitzt, splitten wir nach Kommas!
  let preparedText = blockText;
  if (preparedText.indexOf('\n') === -1 && preparedText.indexOf(',') !== -1) {
    preparedText = preparedText.split(',').join('\n');
  }

  // Split by newlines and clean lines
  const lines = preparedText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.toLowerCase().startsWith('ansprechperson:'));

  if (lines.length === 0) return result;

  // 1. Finde die PLZ/Ort-Zeile (enthält typischerweise 4-5 Ziffern gefolgt von Leerzeichen)
  let cityLineIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].match(/^\d{4,5}\s+/)) {
      cityLineIndex = i;
      break;
    }
  }

  // Fallback auf die letzte Zeile, falls kein ZIP-Muster matcht
  if (cityLineIndex === -1) {
    cityLineIndex = lines.length - 1;
  }

  const cityLine = lines[cityLineIndex];
  const cityMatch = cityLine.match(/^(\d{4,5})\s+(.+)$/);
  if (cityMatch) {
    result.zip = cityMatch[1];
    result.city = cityMatch[2];
  } else {
    result.city = cityLine;
  }

  // 2. Die Zeile direkt vor PLZ/Ort ist die Straße
  let streetLineIndex = cityLineIndex - 1;
  if (streetLineIndex >= 0) {
    result.street = lines[streetLineIndex];
  }

  // 3. Alle Zeilen vor der Straße sind der Firmenname/Name
  const nameLines = [];
  for (let i = 0; i < Math.max(0, streetLineIndex); i++) {
    nameLines.push(lines[i]);
  }
  
  if (nameLines.length > 0) {
    result.name = nameLines.join(' ');
  } else if (streetLineIndex === -1 && cityLineIndex > 0) {
    result.name = lines.slice(0, cityLineIndex).join(' ');
  } else if (lines.length === 1) {
    result.name = lines[0];
  }

  return result;
}

function parseOrderText(text) {
  // 1. Primäre Auftragsnummer (Referenzauftrag aus Pos. 1) extrahieren
  let orderId = '';
  const refMatch = text.match(/Auftragsvergabe\s+zu\s+Auftrag\s+Nr\.\s*(\d{4}-\d{4})/i);
  if (refMatch) {
    orderId = refMatch[1];
  } else {
    // Fallback auf die Kundendienstauftragsnummer im Kopf
    const mainMatch = text.match(/Kundendienstauftrag\s+Nr\.\s*(\d{4}-\d{4})/i);
    if (mainMatch) {
      orderId = mainMatch[1];
    }
  }

  // 2. Auftraggeber
  const clientMatch = text.match(/Auftraggeber:\s*([\s\S]*?)(?=Ansprechperson:|Kundenadresse|Rechnungsadresse|$)/i);
  const clientInfoRaw = clientMatch ? cleanTextKeepNewlines(clientMatch[1]) : '';
  const client = parseAddressBlock(clientInfoRaw);

  // 3. Kundenadresse & Kontaktdaten (Baustelle)
  const customerMatch = text.match(/Kundenadresse und Kontaktdaten:\s*([\s\S]*?)(?=Ansprechperson:|Rechnungsadresse|Auftragsgrundlage|$)/i);
  const customerAddressRaw = customerMatch ? cleanTextKeepNewlines(customerMatch[1]) : '';
  const customer = parseAddressBlock(customerAddressRaw);

  // 4. Rechnungsadresse
  const billingMatch = text.match(/Rechnungsadresse für Lieferschein:\s*([\s\S]*?)(?=Auftragsgrundlage|Zusatzinformationen|Termin|$)/i);
  const billingAddressRaw = billingMatch ? cleanTextKeepNewlines(billingMatch[1]) : '';
  const billing = parseAddressBlock(billingAddressRaw);

  // 5. Auftragsgrundlage
  const basisMatch = text.match(/Auftragsgrundlage:\s*([\s\S]*?)(?=Zusatzinformationen|Termin|$)/i);
  const orderBasis = basisMatch ? cleanText(basisMatch[1]) : '';

  // 6. Zusatzinformationen (Polier etc.)
  const additionalMatch = text.match(/Zusatzinformationen:\s*([\s\S]*?)(?=Termin|Verrechnungsgrundlage|$)/i);
  const additionalInfo = additionalMatch ? cleanText(additionalMatch[1]) : '';

  // Sachbearbeiter
  const clerkMatch = text.match(/Sachbearbeiter\s+([A-Za-z ]+?)(?=Kst\.|Komm\.|\r|\n|$)/i);
  const sachbearbeiter = clerkMatch ? cleanText(clerkMatch[1]) : '';

  // Datum und Termin als nette Zusatzinformationen
  const dateMatch = text.match(/Datum\s+(\d{2}\.\d{2}\.\d{4})/i);
  const orderDate = dateMatch ? dateMatch[1] : '';

  const terminMatch = text.match(/Termin:\s*(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{4})/i);
  const orderTermin = terminMatch ? terminMatch[1].replaceAll('/', '.') : '';

  return {
    orderId,
    clientInfo: clientInfoRaw.replace(/\n/g, ', '),
    clientName: client.name,
    clientStreet: client.street,
    clientZip: client.zip,
    clientCity: client.city,
    
    customerAddress: customerAddressRaw.replace(/\n/g, ', '),
    customerName: customer.name,
    customerStreet: customer.street,
    customerZip: customer.zip,
    customerCity: customer.city,
    
    billingAddress: billingAddressRaw.replace(/\n/g, ', '),
    billingName: billing.name,
    billingStreet: billing.street,
    billingZip: billing.zip,
    billingCity: billing.city,
    
    orderBasis,
    additionalInfo,
    orderDate,
    orderTermin,
    sachbearbeiter
  };
}

function cleanText(val) {
  if (!val) return '';
  return val
    .replace(/\s+/g, ' ') // Mehrere Leerzeichen auf eins reduzieren
    .replace(/\s*Ansprechperson:\s*$/i, '') // Ansprechperson-Reste am Ende entfernen
    .trim();
}

function cleanTextKeepNewlines(val) {
  if (!val) return '';
  return val
    .replace(/[ \t]+/g, ' ') // Nur horizontale Leerzeichen kollabieren
    .replace(/\r?\n/g, '\n') // Newlines standardisieren
    .replace(/\s*Ansprechperson:\s*$/i, '')
    .trim();
}
