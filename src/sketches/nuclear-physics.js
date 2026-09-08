import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let A = 56;
  let dragging = false;
  let curvePts = [];

  function semi(a) {
    const aV = 15.75, aS = 17.8, aC = 0.711, aA = 23.7, aP = 11.18;
    const Z = Math.round(a / (2 + 0.0154 * Math.pow(a, 2 / 3)));
    const d = a % 2 === 0 && Z % 2 === 0 ? aP : (a % 2 === 1 ? 0 : -aP);
    const B = aV * a - aS * Math.pow(a, 2 / 3) - aC * Z * (Z - 1) / Math.pow(a, 1 / 3)
      - aA * (a - 2 * Z) ** 2 / a + d / Math.pow(a, 3 / 4);
    return { B, Z, BE: B / a };
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(540, window.innerWidth - 50), 400).parent('p5canvas');

    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '2'; sl.max = '240'; sl.value = '56'; sl.step = '1';
    sl.style.cssText = 'width:150px;accent-color:#58a6ff;margin:4px 6px';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#c9d1d9;font-size:0.78em';
    sl.id = 'np-slider';
    sl.addEventListener('input', () => { A = parseInt(sl.value); });
    document.querySelector('.sketch-col')?.appendChild(sl);
    document.querySelector('.sketch-col')?.appendChild(lbl);
  };

  p.draw = () => {
    p.background('#0d1117');
    const ox = 45, oy = 25;
    const w = p.width - ox - 15, h = p.height - 155;

    // Axes
    p.stroke('#30363d'); p.strokeWeight(1);
    p.line(ox, oy, ox, oy + h);
    p.line(ox, oy + h, ox + w, oy + h);

    // Y ticks
    for (let v = 0; v <= 10; v += 2) {
      const y = p.map(v, 0, 10, oy + h, oy);
      p.stroke('#21262d'); p.strokeWeight(0.4); p.line(ox - 3, y, ox, y);
      p.noStroke(); p.fill('#484f58'); p.textSize(11); p.textAlign(p.RIGHT, p.CENTER); p.text(v, ox - 6, y);
    }

    // X ticks
    for (let a = 0; a <= 240; a += 50) {
      const x = ox + (w * a) / 240;
      p.stroke('#21262d'); p.strokeWeight(0.4); p.line(x, oy + h, x, oy + h + 3);
      p.noStroke(); p.fill('#484f58'); p.textSize(11); p.textAlign(p.CENTER, p.TOP); p.text(a, x, oy + h + 5);
    }

    // Curve
    curvePts = [];
    p.stroke('#58a6ff'); p.strokeWeight(2.5); p.noFill();
    p.beginShape();
    for (let a = 1; a <= 240; a++) {
      const { BE } = semi(a);
      const x = ox + (w * a) / 240, y = p.map(BE, 0, 10, oy + h, oy);
      curvePts.push({ a, x, y, BE });
      p.vertex(x, y);
    }
    p.endShape();

    // Hover nearest point
    const mx = p.mouseX, my = p.mouseY;
    let bestPt = null, bestD = Infinity;
    for (const pt of curvePts) {
      const d = p.dist(mx, my, pt.x, pt.y);
      if (d < 16 && d < bestD) { bestD = d; bestPt = pt; }
    }

    if (bestPt && !dragging) {
      p.fill('#ffd33d'); p.noStroke(); p.circle(bestPt.x, bestPt.y, 6);
      p.stroke('#ffd33d'); p.strokeWeight(0.8); p.drawingContext.setLineDash([3, 4]);
      p.line(bestPt.x, bestPt.y, bestPt.x, oy + h); p.drawingContext.setLineDash([]);
    }

    // Selected A marker
    const { BE: cBE, Z: cZ } = semi(A);
    const cx = ox + (w * A) / 240, cy = p.map(cBE, 0, 10, oy + h, oy);
    p.fill('#f78166'); p.noStroke(); p.circle(cx, cy, dragging ? 12 : 8);
    if (dragging) { p.fill(248, 113, 102, 30); p.circle(cx, cy, 24); }
    p.stroke('#f78166'); p.strokeWeight(2);
    p.line(cx, cy - 14, cx, oy + h);

    // Fe-56 reference
    const feX = ox + (w * 56) / 240;
    p.stroke('#7ee787'); p.strokeWeight(0.8); p.drawingContext.setLineDash([4, 4]);
    p.line(feX, oy, feX, oy + h); p.drawingContext.setLineDash([]);
    p.fill('#7ee787'); p.textSize(10); p.textAlign(p.LEFT, p.TOP); p.text('Fe-56', feX + 4, oy);

    // Info
    const iy = oy + h + 6;
    p.fill('#c9d1d9'); p.textSize(14); p.textAlign(p.LEFT, p.TOP);
    p.text('A=' + A + '  Z≈' + cZ + '  BE/A=' + cBE.toFixed(2) + ' MeV', 10, iy);
    p.fill('#8b949e'); p.textSize(11);
    p.text('Drag the red dot along curve  |  Peak at Fe-56 (BE/A≈8.8)', 10, iy + 22);
    p.text('Fission (A>56) releases energy  ·  Fusion (A<56) releases energy', 10, iy + 38);

    if (bestPt && !dragging) {
      p.fill('#ffd33d'); p.textSize(11); p.text('A=' + bestPt.a + ' BE/A=' + bestPt.BE.toFixed(2), 10, iy - 16);
    }

    // Update label
    const lbl = document.querySelector('.sketch-col span');
    if (lbl && lbl.textContent !== 'A = ' + A) lbl.textContent = 'A = ' + A;
    const sl = document.getElementById('np-slider');
    if (sl && parseInt(sl.value) !== A) sl.value = A;
  };

  p.mousePressed = () => {
    const mx = p.mouseX, my = p.mouseY;
    for (const pt of curvePts) {
      if (p.dist(mx, my, pt.x, pt.y) < 18) {
        A = pt.a;
        dragging = true;
        return;
      }
    }
  };

  p.mouseReleased = () => { dragging = false; };

  p.mouseDragged = () => {
    if (!dragging) return;
    const mx = p.mouseX, my = p.mouseY;
    let best = null, bestD = Infinity;
    for (const pt of curvePts) {
      const d = p.dist(mx, my, pt.x, pt.y);
      if (d < bestD) { bestD = d; best = pt; }
    }
    if (best) A = best.a;
  };
};

new p5(sketch);
