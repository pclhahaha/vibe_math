import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let sigmaX = 40;
  let dragging = false;
  let dragStartX = 0, dragStartSigma = 40;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 440).parent('p5canvas');
    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const label = document.createElement('span');
    label.style.cssText = 'font-size:0.8em;color:#8b949e';
    label.textContent = 'σₓ (position width):';
    slRow.appendChild(label);
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '15'; sl.max = '65'; sl.step = '0.5'; sl.value = '40';
    sl.style.cssText = 'width:160px;accent-color:#58a6ff';
    sl.addEventListener('input', () => { sigmaX = parseFloat(sl.value); });
    slRow.appendChild(sl);
    document.querySelector('.sketch-col')?.appendChild(slRow);

    p.mousePressed = () => {
      const mx = p.mouseX, my = p.mouseY;
      const w = p.width - 60, h = p.height - 40;
      const cxPos = 30 + w * 0.3;
      const cyLevel = 20 + h * 0.6;
      if (Math.abs(mx - cxPos) < 120 && my > cyLevel - 120 && my < cyLevel + 20) {
        dragging = true;
        dragStartX = mx;
        dragStartSigma = sigmaX;
      }
    };
    p.mouseReleased = () => { dragging = false; };
    p.mouseDragged = () => {
      if (!dragging) return;
      const dx = p.mouseX - dragStartX;
      sigmaX = p.constrain(dragStartSigma + dx * 0.3, 15, 65);
    };
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(30, 20);
    const w = p.width - 60, h = p.height - 40;
    const sigmaP = 1600 / sigmaX;
    const prod = sigmaX * sigmaP / 100;

    const cxPos = w * 0.3;
    const cxMom = w * 0.7;
    const baseY = h * 0.55;

    // Draw axis
    p.stroke('#484f58'); p.strokeWeight(1);
    p.line(0, baseY, w, baseY);

    // Position space Gaussian
    p.stroke('#58a6ff', 180); p.strokeWeight(2); p.noFill();
    p.beginShape();
    for (let x = 0; x < w; x += 2) {
      const gx = Math.exp(-((x - cxPos) ** 2) / (2 * sigmaX * sigmaX));
      p.vertex(x, baseY - gx * h * 0.45);
    }
    p.endShape();

    // Filled bars for position
    for (let x = 0; x < w; x += 2) {
      const gx = Math.exp(-((x - cxPos) ** 2) / (2 * sigmaX * sigmaX));
      p.stroke('#58a6ff', 70); p.strokeWeight(2);
      p.line(x, baseY, x, baseY - gx * h * 0.45);
    }

    // Momentum space Gaussian (Fourier counterpart)
    p.stroke('#f78166', 180); p.strokeWeight(2); p.noFill();
    p.beginShape();
    for (let x = 0; x < w; x += 2) {
      const gp = Math.exp(-((x - cxMom) ** 2) / (2 * sigmaP * sigmaP));
      p.vertex(x, baseY - gp * h * 0.45);
    }
    p.endShape();

    for (let x = 0; x < w; x += 2) {
      const gp = Math.exp(-((x - cxMom) ** 2) / (2 * sigmaP * sigmaP));
      p.stroke('#f78166', 70); p.strokeWeight(2);
      p.line(x, baseY, x, baseY - gp * h * 0.45);
    }

    // Width indicators
    p.stroke('#58a6ff'); p.strokeWeight(2);
    p.line(cxPos - sigmaX, baseY + 12, cxPos + sigmaX, baseY + 12);
    p.line(cxPos - sigmaX, baseY + 8, cxPos - sigmaX, baseY + 16);
    p.line(cxPos + sigmaX, baseY + 8, cxPos + sigmaX, baseY + 16);

    p.stroke('#f78166'); p.strokeWeight(2);
    p.line(cxMom - sigmaP, baseY + 12, cxMom + sigmaP, baseY + 12);
    p.line(cxMom - sigmaP, baseY + 8, cxMom - sigmaP, baseY + 16);
    p.line(cxMom + sigmaP, baseY + 8, cxMom + sigmaP, baseY + 16);

    // Δx·Δp product — large display
    const passes = prod >= 0.5;
    p.fill(passes ? '#7ee787' : '#f78166'); p.noStroke(); p.textSize(16); p.textAlign(p.LEFT, p.TOP);
    const prodText = 'Δx·Δp = ' + prod.toFixed(3) + (passes ? ' ≥ ħ/2 ✓' : ' < ħ/2 (impossible!)');
    p.text(prodText, 20, h - 20);

    // Info panel
    p.fill('#58a6ff'); p.textSize(14); p.textAlign(p.LEFT, p.TOP);
    p.text('Position: σₓ = ' + sigmaX.toFixed(1) + '  |  Δx = ' + sigmaX.toFixed(1), 20, 28);

    p.fill('#f78166');
    p.text('Momentum: σₚ = ' + sigmaP.toFixed(1) + '  |  Δp = ' + sigmaP.toFixed(1), 20, 46);

    p.fill('#8b949e');
    p.text('Fourier transform: narrower position ⇔ wider momentum', 20, 64);
    p.text('Drag mouse near the blue Gaussian to change its width', 20, 82);

    // Drag region indicator
    if (dragging) {
      p.stroke('#ffd33d'); p.strokeWeight(2); p.noFill();
      p.rect(cxPos - sigmaX, baseY - h * 0.45 - 10, sigmaX * 2, h * 0.45 + 30);
    }
  };
};
new p5(sketch);
