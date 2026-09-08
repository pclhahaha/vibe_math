import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let t = 1;
  let latticeType = '1d';
  let fermiEnergy = 0.5;
  let pg;
  let contourDirty = true;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(540, 460).parent('p5canvas');

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0.1';
    sl.max = '3';
    sl.step = '0.1';
    sl.value = '1';
    sl.style.cssText = 'width:200px;accent-color:#58a6ff;margin:4px';
    sl.addEventListener('input', () => { t = parseFloat(sl.value); contourDirty = true; });
    document.querySelector('.sketch-col')?.appendChild(sl);

    const btn = document.createElement('button');
    btn.textContent = '1D Chain';
    btn.style.cssText = 'background:#161b22;color:#c9d1d9;border:1px solid #30363d;padding:4px 8px;border-radius:4px;margin:4px;cursor:pointer';
    btn.addEventListener('click', () => {
      latticeType = latticeType === '1d' ? '2d' : '1d';
      btn.textContent = latticeType === '1d' ? '1D Chain' : 'Square Lattice';
      contourDirty = true;
    });
    document.querySelector('.sketch-col')?.appendChild(btn);

    fermiEnergy = t * 0.5;
  };

  function buildContour() {
    const sz = Math.min(p.width - 90, p.height - 100);
    pg = p.createGraphics(sz, sz);
    const res = 100;
    const cw = sz / res, ch = sz / res;
    for (let ix = 0; ix < res; ix++) {
      for (let iy = 0; iy < res; iy++) {
        const kx = p.map(ix, 0, res - 1, -Math.PI, Math.PI);
        const ky = p.map(iy, 0, res - 1, Math.PI, -Math.PI);
        const val = Math.cos(kx) + Math.cos(ky);
        const E = -2 * t * val;
        const norm = p.constrain(p.map(E, -4 * t, 4 * t, 0, 1), 0, 1);
        pg.fill(p.lerpColor(p.color('#0d1117'), p.color('#58a6ff'), norm));
        pg.noStroke();
        pg.rect(ix * cw, iy * ch, cw + 1, ch + 1);
      }
    }
    contourDirty = false;
  }

  p.mousePressed = () => {
    if (latticeType === '1d') {
      const ox = 45, oy = 60;
      const w = p.width - 90, h = p.height - 120;
      const mx = p.mouseX - ox, my = p.mouseY - oy;
      if (mx >= 0 && mx <= w && my >= 0 && my <= h) {
        fermiEnergy = p.map(my, h, 0, -0.5, 3.5);
      }
    }
  };

  p.draw = () => {
    p.background('#0d1117');

    if (latticeType === '1d') draw1D();
    else draw2D();
  };

  function draw1D() {
    const ox = 45, oy = 60;
    const w = p.width - 90, h = p.height - 120;
    p.translate(ox, oy);

    p.stroke('#30363d');
    p.strokeWeight(1);
    p.noFill();
    p.rect(0, 0, w, h);

    p.stroke('#30363d');
    p.strokeWeight(0.5);
    p.line(0, h / 2, w, h / 2);

    p.fill('#8b949e');
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    p.text('−π', 8, h / 2 + 4);
    p.text('0', w / 2, h / 2 + 4);
    p.text('π', w - 8, h / 2 + 4);
    p.text('k →', w - 10, h / 2 - 10);
    p.textAlign(p.LEFT);

    const fy = p.map(fermiEnergy, -0.5, 3.5, h, 0);
    const bandColors = ['#58a6ff', '#f78166', '#7ee787', '#ffd33d'];

    for (let b = 0; b < 4; b++) {
      const offset = 0.5 + b * 0.7;
      const amp = 0.3 * t;

      p.fill(p.lerpColor(p.color(bandColors[b]), p.color('#0d1117'), 0.55));
      p.noStroke();
      p.beginShape();
      for (let kx = 0; kx <= w; kx += 2) {
        const k = p.map(kx, 0, w, -Math.PI, Math.PI);
        const E = offset + amp * (0.5 - 0.5 * Math.cos(k));
        const ey = p.map(E, -0.5, 3.5, h, 0);
        p.vertex(kx, Math.min(ey, fy));
      }
      for (let kx = w; kx >= 0; kx -= 2) p.vertex(kx, fy);
      p.endShape(p.CLOSE);

      p.stroke(bandColors[b]);
      p.strokeWeight(2);
      p.noFill();
      p.beginShape();
      for (let kx = 0; kx <= w; kx += 2) {
        const k = p.map(kx, 0, w, -Math.PI, Math.PI);
        const E = offset + amp * (0.5 - 0.5 * Math.cos(k));
        p.vertex(kx, p.map(E, -0.5, 3.5, h, 0));
      }
      p.endShape();
    }

    p.stroke('#f78166');
    p.strokeWeight(1.5);
    p.drawingContext.setLineDash([6, 4]);
    p.line(0, fy, w, fy);
    p.drawingContext.setLineDash([]);
    p.fill('#f78166');
    p.noStroke();
    p.textSize(11);
    p.text('E_F=' + fermiEnergy.toFixed(2), w - 72, fy - 5);

    const bands = [];
    for (let b = 0; b < 4; b++) {
      bands.push({ min: 0.5 + b * 0.7, max: 0.5 + b * 0.7 + 0.3 * t });
    }
    let gaps = '';
    for (let b = 0; b < 3; b++) {
      const g = bands[b + 1].min - bands[b].max;
      gaps += ' Δ' + (b + 1) + (b + 2) + '=' + g.toFixed(2);
    }

    p.fill('#8b949e');
    p.textSize(12);
    p.text('t=' + t.toFixed(2) + ' | 1D tight-binding: E(k) = −2t cos(k) + ε_b', 10, -45);
    p.text('Click to set Fermi level | Band gaps:' + gaps, 10, -25);
  }

  function draw2D() {
    const ox = 45, oy = 60;
    const sz = Math.min(p.width - 90, p.height - 90);
    p.translate(ox, oy);

    if (contourDirty) buildContour();
    p.image(pg, 0, 0, sz, sz);

    p.stroke('#30363d');
    p.strokeWeight(1);
    p.noFill();
    p.rect(0, 0, sz, sz);

    p.fill('#8b949e');
    p.textSize(10);
    p.textAlign(p.CENTER);
    p.text('Γ', -8, sz + 13);
    p.text('X(π,0)', sz / 2, sz + 13);
    p.text('M(π,π)', sz + 12, sz / 2);
    p.textAlign(p.LEFT);

    p.fill('#8b949e');
    p.textSize(12);
    p.text('t=' + t.toFixed(2) + ' | Square lattice: E = −2t[cos(kx) + cos(ky)]', 10, -45);
    p.text('−π ≤ kx, ky ≤ π     Bandwidth = ' + (8 * t).toFixed(2), 10, -25);
  }
};
new p5(s);
