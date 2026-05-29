'use strict';

/**
 * Leichtgewichtiger, Touch-kompatibler Signatur-Controller (ES5-kompatibel)
 * Unterstützt hochauflösende DPI-Bildschirme und verhindert Scroll-Interferenzen bei Touch.
 */
export function SignaturePad(canvas) {
  if (!canvas) throw new Error('Canvas-Element ist erforderlich');
  
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.isDrawing = false;
  this.lastX = 0;
  this.lastY = 0;
  this.pointsCount = 0; // Zähler, um festzustellen, ob tatsächlich gezeichnet wurde
  
  this.init();
}

SignaturePad.prototype.init = function() {
  var self = this;
  
  // Linien-Stil einrichten
  this.ctx.strokeStyle = '#1e3a8a'; // Dunkelblau für authentischen Tinten-Look
  this.ctx.lineWidth = 2.5;
  this.ctx.lineCap = 'round';
  this.ctx.lineJoin = 'round';
  
  // Touch-Action via CSS unterdrücken, um Browser-Scrolling beim Zeichnen zu verhindern
  this.canvas.style.touchAction = 'none';
  
  // Canvas-Auflösung anpassen (DPI-Handling)
  this.resizeCanvas();
  
  // Event-Listener binden
  
  // Maus-Events
  this.canvas.addEventListener('mousedown', function(e) {
    self.startDrawing(e.clientX, e.clientY);
  });
  
  this.canvas.addEventListener('mousemove', function(e) {
    self.draw(e.clientX, e.clientY);
  });
  
  window.addEventListener('mouseup', function() {
    self.stopDrawing();
  });
  
  // Touch-Events (für Tablets und Smartphones)
  this.canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      var touch = e.touches[0];
      self.startDrawing(touch.clientX, touch.clientY);
      e.preventDefault();
    }
  }, { passive: false });
  
  this.canvas.addEventListener('touchmove', function(e) {
    if (e.touches.length === 1) {
      var touch = e.touches[0];
      self.draw(touch.clientX, touch.clientY);
      e.preventDefault();
    }
  }, { passive: false });
  
  this.canvas.addEventListener('touchend', function(e) {
    self.stopDrawing();
    e.preventDefault();
  }, { passive: false });
  
  // Automatischer Resize-Listener
  window.addEventListener('resize', function() {
    self.resizeCanvas();
  });
};

SignaturePad.prototype.resizeCanvas = function() {
  // Breite und Höhe basierend auf CSS-Größe festlegen
  var rect = this.canvas.getBoundingClientRect();
  
  // Nur anpassen, wenn der Canvas tatsächlich im DOM sichtbar ist und Breite/Höhe > 0 hat
  if (rect.width > 0 && rect.height > 0) {
    // Falls das Canvas bereits Inhalt hat, sichern wir diesen kurz ab
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    var tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.canvas, 0, 0);
    
    // Pixel-Verhältnis (DPI) ermitteln
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Kontext skalieren, damit Zeichenlogik in CSS-Pixeln arbeiten kann
    this.ctx.scale(dpr, dpr);
    
    // Linienstil wiederherstellen (geht beim Resize verloren)
    this.ctx.strokeStyle = '#1e3a8a';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Gesicherten Inhalt wieder einzeichnen (skaliert)
    this.ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
  }
};

SignaturePad.prototype.getCoordinates = function(clientX, clientY) {
  var rect = this.canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
};

SignaturePad.prototype.startDrawing = function(clientX, clientY) {
  this.isDrawing = true;
  var coords = this.getCoordinates(clientX, clientY);
  this.lastX = coords.x;
  this.lastY = coords.y;
  
  // Einen kleinen Punkt malen (falls nur geklickt/getippt wird)
  this.ctx.beginPath();
  this.ctx.arc(this.lastX, this.lastY, this.ctx.lineWidth / 2, 0, Math.PI * 2);
  this.ctx.fillStyle = this.ctx.strokeStyle;
  this.ctx.fill();
  this.pointsCount++;
};

SignaturePad.prototype.draw = function(clientX, clientY) {
  if (!this.isDrawing) return;
  
  var coords = this.getCoordinates(clientX, clientY);
  
  this.ctx.beginPath();
  this.ctx.moveTo(this.lastX, this.lastY);
  this.ctx.lineTo(coords.x, coords.y);
  this.ctx.stroke();
  
  this.lastX = coords.x;
  this.lastY = coords.y;
  this.pointsCount++;
};

SignaturePad.prototype.stopDrawing = function() {
  this.isDrawing = false;
};

SignaturePad.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.pointsCount = 0;
};

SignaturePad.prototype.isEmpty = function() {
  return this.pointsCount === 0;
};

SignaturePad.prototype.getDataUrl = function() {
  if (this.isEmpty()) return '';
  return this.canvas.toDataURL('image/png');
};
