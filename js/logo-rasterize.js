/*
 * Rastert das bestehende App-Logo einmal im Browser in ein PNG.
 * Zweck: html2canvas rendert SVG-Text auf einigen mobilen Browsern im PDF fehlerhaft.
 * Die sichtbare Vorlage bleibt assets/logo.svg; die gerasterte PNG-Quelle entspricht der Browser-Darstellung.
 */

const LOGO_SELECTOR = '.sheet-logo-img';
const LOGO_WIDTH = 520;
const LOGO_HEIGHT = 180;
const SCALE = 4;

async function rasterizeLogoImage(img) {
  if (!img || img.dataset.logoRasterized === '1') return;

  const source = img.getAttribute('src') || '';
  if (!source.includes('assets/logo.svg')) return;

  try {
    const svgImage = new Image();
    svgImage.decoding = 'async';
    svgImage.src = source;

    await new Promise((resolve, reject) => {
      svgImage.onload = resolve;
      svgImage.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = LOGO_WIDTH * SCALE;
    canvas.height = LOGO_HEIGHT * SCALE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height);

    img.src = canvas.toDataURL('image/png');
    img.dataset.logoRasterized = '1';
  } catch (error) {
    console.warn('[LogoRasterize] Logo konnte nicht gerastert werden, SVG bleibt aktiv:', error);
  }
}

function rasterizeAllLogos() {
  document.querySelectorAll(LOGO_SELECTOR).forEach((img) => {
    rasterizeLogoImage(img);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', rasterizeAllLogos);
} else {
  rasterizeAllLogos();
}
