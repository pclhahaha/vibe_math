import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let E = 1.0;
  const m = 1;
  const omega = 0.6;
  let phase = 0;
  let dragging = false;
  let trail = [];

  const pl = 48, pr = 348, pt = 34, pb = 314;
  const cx = 198, cy = 174;
  const qScale = 34;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 420).parent('p5canvas');
    p.textAlign(p.LEFT, p.TOP);

    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0';
    const label = document.createElement('span');
    label.style.cssText = 'font-size:0.8em;color:#8b949e';
    label.textContent = 'Total energy E:';
    slRow.appendChild(label);

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0.15';
    sl.max = '3';
    sl.step = '0.05';
    sl.value = '1';
    sl.style.cssText = 'width:150px;accent-color:#58a6ff';
    sl.addEventListener('input', () => { E = parseFloat(sl.value); });
    slRow.appendChild(sl);

    const val = document.createElement('span');
    val.style.cssText = 'font-size:0.8em;color:#f78166';
    sl.addEventListener('input', () => { val.textContent = E.toFixed(2); });
    val.textContent = E.toFixed(2);
    slRow.appendChild(val);
    document.querySelector('.sketch-col')?.appendChild(slRow);
  };

  const aPx = () => (Math.sqrt(2 * E) / omega) * qScale;
  const bPx = () => Math.sqrt(2 * E) * qScale;

  const particle = () => {
    const a = aPx(), b = bPx();
    const q = a * Math.cos(phase);
    const p = -b * Math.sin(phase);
    return { q, p };
  };

  const physValues = () => {
    const qPhys = (Math.sqrt(2 * E) / omega) * Math.cos(phase);
    const pPhys = -Math.sqrt(2 * E) * Math.sin(phase);
    const T = (pPhys * pPhys) / (2 * m);
    const V = 0.5 * m * omega * omega * qPhys * qPhys;
    return { qPhys, pPhys, T, V };
  };

  p.draw = () => {
    p.background('#0d1117');
    if (!dragging) {
      phase += omega * (p.deltaTime / 1000);
    } else {
      const mx = p.mouseX - cx, my = p.mouseY - cy;
      const a = aPx(), b = bPx();
      const qn = mx / a, pn = my / b;
      phase = Math.atan2(-pn, qn);
    }

    // Grid
    p.stroke('#161b22');
    p.strokeWeight(1);
    for (let i = -4; i <= 4; i++) {
      p.line(cx + i * 40, pt, cx + i * 40, pb);
      p.line(pl, cy + i * 40, pr, cy + i * 40);
    }

    // Axes
    p.stroke('#30363d');
    p.strokeWeight(1.5);
    p.line(pl, cy, pr, cy);
    p.line(cx, pt, cx, pb);
    p.fill('#8b949e');
    p.noStroke();
    p.textSize(12);
    p.text('q', pr + 6, cy - 4);
    p.text('p', cx + 6, pt - 2);

    // Reference ellipses
    const levels = [0.5, 1, 1.5, 2, 2.5];
    for (const e of levels) {
      if (e === E) continue;
      const a = (Math.sqrt(2 * e) / omega) * qScale;
      const b = Math.sqrt(2 * e) * qScale;
      p.noFill();
      p.stroke('#21262d');
      p.strokeWeight(1.2);
      p.ellipse(cx, cy, a * 2, b * 2);
    }

    // Current orbit ellipse
    const a = aPx(), b = bPx();
    p.noFill();
    p.stroke('#58a6ff');
    p.strokeWeight(2.2);
    p.ellipse(cx, cy, a * 2, b * 2);

    // Trail
    const pos = particle();
    trail.push({ x: cx + pos.q, y: cy + pos.p });
    if (trail.length > 90) trail.shift();
    for (let i = 0; i < trail.length - 1; i++) {
      const t0 = trail[i], t1 = trail[i + 1];
      const alpha = (i / trail.length) * 160;
      p.stroke(247, 129, 102, alpha);
      p.strokeWeight(1.6);
      p.line(t0.x, t0.y, t1.x, t1.y);
    }

    // Particle
    p.noStroke();
    p.fill('#f78166');
    p.circle(cx + pos.q, cy + pos.p, 9);
    p.fill(247, 129, 102, 40);
    p.circle(cx + pos.q, cy + pos.p, 22);

    // Draggable handle hint — radius guide from origin
    if (dragging) {
      p.stroke('#f78166');
      p.strokeWeight(1);
      p.line(cx, cy, cx + pos.q, cy + pos.p);
    }

    // Phase-space labels
    p.fill('#58a6ff');
    p.textSize(12);
    p.text('q²/a² + p²/b² = 1,  a = √(2E)/ω,  b = √(2E)', pl, pb + 10);
    p.fill('#8b949e');
    p.text('Area = πab = 2πE/ω = ' + ((2 * Math.PI * E) / omega).toFixed(2), pl, pb + 26);
    p.fill('#484f58');
    p.textSize(11);
    p.text('Drag the orange particle to set initial conditions', pl, pb + 42);

    // Energy panel
    const v = physValues();
    const px0 = 362, py0 = 40;
    p.fill('#58a6ff');
    p.textSize(14);
    p.text('H = T + V = E', px0, py0);
    p.fill('#8b949e');
    p.textSize(11);
    p.text('m = 1,  ω = ' + omega.toFixed(1), px0, py0 + 18);

    // Stacked energy bar (V blue bottom, T orange top)
    const bw = 118, bh = 14;
    const vw = bw * (v.V / E);
    p.noStroke();
    p.fill('#58a6ff');
    p.rect(px0, py0 + 34, vw, bh);
    p.fill('#f78166');
    p.rect(px0 + vw, py0 + 34, bw - vw, bh);
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.noFill();
    p.rect(px0, py0 + 34, bw, bh);

    p.noStroke();
    p.fill('#58a6ff');
    p.textSize(12);
    p.text('V = ' + v.V.toFixed(3), px0, py0 + 56);
    p.fill('#f78166');
    p.text('T = ' + v.T.toFixed(3), px0, py0 + 72);
    p.fill('#7ee787');
    p.textSize(13);
    p.text('E = ' + (v.T + v.V).toFixed(3) + '  (const)', px0, py0 + 92);

    p.fill('#8b949e');
    p.textSize(11);
    p.text('q = ' + v.qPhys.toFixed(2), px0, py0 + 116);
    p.text('p = ' + v.pPhys.toFixed(2), px0, py0 + 132);
    p.text('H = T + V = E', px0, py0 + 152);

    p.fill('#484f58');
    p.textSize(10.5);
    p.text('Frequency ω is independent of E', px0, py0 + 176);
    p.text('— amplitude changes, period does not', px0, py0 + 190);

    p.fill('#7ee787');
    p.textSize(11);
    p.text('T = ½p²/m', px0, pb - 8);
    p.fill('#58a6ff');
    p.text('V = ½mω²q²', px0, pb - 26);
  };

  const inPlot = (x, y) => x >= pl - 12 && x <= pr + 12 && y >= pt - 12 && y <= pb + 12;

  p.mousePressed = () => {
    if (inPlot(p.mouseX, p.mouseY)) {
      dragging = true;
      trail = [];
    }
  };

  p.mouseReleased = () => { dragging = false; };

  p.mouseDragged = () => {
    if (!dragging) return;
    const mx = p.mouseX - cx, my = p.mouseY - cy;
    const a = aPx(), b = bPx();
    const qn = mx / a, pn = my / b;
    phase = Math.atan2(-pn, qn);
  };
};

new p5(sketch);
