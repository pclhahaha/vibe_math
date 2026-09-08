import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let v = 0;
  let worldlineX = 0, worldlineY = 0;
  let dragging = false;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 520).parent('p5canvas');
    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const label = document.createElement('span');
    label.style.cssText = 'font-size:0.8em;color:#8b949e';
    label.textContent = 'v/c:';
    slRow.appendChild(label);
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0'; sl.max = '0.95'; sl.step = '0.01'; sl.value = '0';
    sl.style.cssText = 'width:180px;accent-color:#58a6ff';
    sl.addEventListener('input', () => { v = parseFloat(sl.value); });
    slRow.appendChild(sl);
    document.querySelector('.sketch-col')?.appendChild(slRow);

    p.mousePressed = () => {
      const cx = p.mouseX - p.width / 2, cy = -(p.mouseY - p.height / 2);
      if (Math.abs(cy) < 200 && Math.abs(cx) < Math.abs(cy)) {
        worldlineX = cx; worldlineY = cy; dragging = true;
      }
    };
    p.mouseReleased = () => { dragging = false; };
    p.mouseDragged = () => {
      if (!dragging) return;
      const cx = p.mouseX - p.width / 2, cy = -(p.mouseY - p.height / 2);
      if (Math.abs(cx) < Math.abs(cy) && cy > 0) { worldlineX = cx; worldlineY = cy; }
      else if (cy > 0 && Math.abs(cx) < cy) { worldlineX = cx; worldlineY = Math.max(0, Math.min(200, Math.abs(cx) + 5)); }
    };
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    const gamma = 1 / Math.sqrt(1 - v * v);

    // Light cone lines
    p.strokeWeight(2); p.stroke('#f78166');
    p.line(-220, -220, 0, 0); p.line(220, -220, 0, 0);
    p.line(-220, 220, 0, 0); p.line(220, 220, 0, 0);

    // Future light cone fill
    p.noStroke(); p.fill(88, 166, 255, 25);
    p.beginShape(); p.vertex(0, -220); p.vertex(-220, 0); p.vertex(0, 220); p.vertex(220, 0); p.endShape(p.CLOSE);

    // Worldline point from slider
    const sx = 150 * v, sy = 150 * gamma;
    p.fill('#58a6ff'); p.noStroke(); p.circle(sx, -sy, 10);

    // Draggable worldline point
    if (dragging || worldlineY > 0) {
      const wx = worldlineX, wy = -Math.abs(worldlineY);
      p.stroke('#ffd33d'); p.strokeWeight(2); p.noFill();
      p.line(0, wx > 0 ? -220 : 220, wx, wy);
      p.fill('#ffd33d'); p.noStroke(); p.circle(wx, wy, 12);
      p.fill('#8b949e'); p.textSize(14); p.textAlign(p.LEFT, p.TOP);

      const properTau = Math.sqrt(Math.max(0, wy * wy - wx * wx));
      const propLabel = properTau / p.max(wy, 1);
      p.fill('#ffd33d');
      p.text('Proper time τ = ' + properTau.toFixed(1) + '  (coordinate t = ' + Math.abs(wy).toFixed(0) + ')', -220, 140);
      p.text('Invariant: ds² = -c²t² + x² = ' + ((-wy * wy + wx * wx) / 100).toFixed(0) + '  (same in all frames!)', -220, 160);
    }

    // Invariant hyperbola
    p.stroke('#484f58'); p.strokeWeight(1.5);
    p.noFill();
    p.beginShape();
    for (let t = -80; t <= 80; t += 2) {
      const ht = 60 + t;
      if (Math.abs(ht) < 20) continue;
      const hx = Math.sqrt(Math.max(0, ht * ht - 60 * 60));
      p.vertex(hx, -ht);
    }
    p.endShape();
    p.beginShape();
    for (let t = -80; t <= 80; t += 2) {
      const ht = 60 + t;
      if (Math.abs(ht) < 20) continue;
      const hx = Math.sqrt(Math.max(0, ht * ht - 60 * 60));
      p.vertex(-hx, -ht);
    }
    p.endShape();

    // Axes
    p.stroke('#555'); p.strokeWeight(1);
    p.line(-250, 0, 250, 0); p.line(0, -230, 0, 230);
    p.fill('#8b949e'); p.textSize(14); p.textAlign(p.LEFT, p.TOP);
    p.text('x', 245, 10); p.text('ct', 10, -225);

    // Slider info
    p.fill('#58a6ff');
    p.text('v=' + v.toFixed(2) + 'c  γ=' + gamma.toFixed(2), -220, -190);
    p.fill('#8b949e');
    p.text('Drag yellow point in future cone to explore', -220, -168);
    p.text('proper time  |  Dashed curves = invariant hyperbolas', -220, -150);
  };
};
new p5(sketch);
