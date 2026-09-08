import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let tangentX = 0;
  let tangentSet = false;
  let funcType = 'sin';
  const history = [];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 460).parent('p5canvas');

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:4px 0';

    ['sin', 'x³', 'x²'].forEach((name) => {
      const label = document.createElement('label');
      label.style.cssText = 'font-size:0.8em;color:#8b949e;cursor:pointer';
      const rb = document.createElement('input');
      rb.type = 'radio';
      rb.name = 'func';
      rb.value = name;
      rb.checked = name === 'sin';
      rb.style.cssText = 'accent-color:#58a6ff;margin-right:3px;cursor:pointer';
      rb.addEventListener('change', () => { if (rb.checked) funcType = name; });
      label.appendChild(rb);
      label.appendChild(document.createTextNode(name));
      row.appendChild(label);
    });

    const btn = document.createElement('button');
    btn.textContent = '清除切点';
    btn.style.cssText = 'font-size:0.75em;background:#21262d;color:#8b949e;border:1px solid #30363d;border-radius:4px;padding:2px 8px;cursor:pointer';
    btn.addEventListener('click', () => { tangentSet = false; history.length = 0; });
    row.appendChild(btn);

    document.querySelector('.sketch-col')?.appendChild(row);
    p.mousePressed = () => { tangentSet = true; tangentX = p.constrain(p.mouseX, 40, p.width - 40); };
    p.mouseDragged = () => { if (tangentSet) { tangentX = p.constrain(p.mouseX, 40, p.width - 40); } };
  };

  const fVal = (x) => {
    if (funcType === 'x³') return x * x * x * 0.15;
    if (funcType === 'x²') return x * x * 0.3;
    return Math.sin(x) + 0.3 * Math.sin(3 * x);
  };
  const fDeriv = (x) => {
    if (funcType === 'x³') return 3 * x * x * 0.15;
    if (funcType === 'x²') return 2 * x * 0.3;
    return Math.cos(x) + 0.9 * Math.cos(3 * x);
  };
  const fLabel = () => { if (funcType === 'x³') return 'x³·0.15'; if (funcType === 'x²') return 'x²·0.3'; return 'sin(x)+0.3sin(3x)'; };

  p.draw = () => {
    p.background('#0d1117');
    const xRange = 2.8;
    p.translate(40, p.height / 2);
    p.scale(1, -1);
    const w = p.width - 80;

    // Grid
    p.stroke('#1a1f2b'); p.strokeWeight(0.5);
    for (let i = -xRange; i <= xRange; i += 0.5) {
      const gx = p.map(i, -xRange, xRange, 0, w);
      p.line(gx, -180, gx, 180);
    }
    for (let j = -3; j <= 3; j++) {
      const gy = j * 60;
      p.line(0, gy, w, gy);
    }
    p.stroke('#484f58'); p.strokeWeight(1.5); p.line(0, 0, w, 0); p.line(p.map(0, -xRange, xRange, 0, w), -200, p.map(0, -xRange, xRange, 0, w), 200);

    // Curve
    p.stroke('#58a6ff'); p.strokeWeight(2.5); p.noFill();
    p.beginShape();
    for (let px = 0; px <= w; px += 2) {
      const x = p.map(px, 0, w, -xRange, xRange);
      p.vertex(px, fVal(x) * 60);
    }
    p.endShape();

    // Tangent
    const sx = tangentSet ? p.constrain(tangentX, 47, w - 3) : p.constrain(p.mouseX, 47, w - 3);
    const x0 = p.map(sx, 40, p.width - 40, -xRange, xRange);
    const y0 = fVal(x0) * 60;
    const deriv = fDeriv(x0);
    const px0 = p.map(x0, -xRange, xRange, 40, p.width - 40) - 40;
    p.stroke('#f78166'); p.strokeWeight(2.5);
    p.line(px0 - 120, y0 - deriv * 120, px0 + 120, y0 + deriv * 120);
    p.stroke('#f78166'); p.fill('#f78166'); p.circle(px0, y0, 8);

    if (tangentSet) {
      history.push(deriv);
      if (history.length > 30) history.shift();
    }

    p.scale(1, -1);
    p.textSize(13); p.noStroke();

    // Function label
    p.fill('#58a6ff'); p.textAlign(p.LEFT, p.TOP);
    p.text('f(x) = ' + fLabel(), 20, 20);

    // Derivative info
    p.fill('#f78166');
    p.text("f'(" + x0.toFixed(2) + ') = ' + deriv.toFixed(3) + '  |  ' + (deriv > 0.05 ? 'rising  f\'>0' : deriv < -0.05 ? 'falling  f\'<0' : 'critical point  f\'≈0'), 20, 38);

    // History mini-plot
    if (history.length > 1) {
      p.stroke('#f78166'); p.strokeWeight(1.2); p.noFill();
      const hx = 140, hy = 60, hw = 200, hh = 40;
      p.stroke('#30363d'); p.strokeWeight(0.5); p.rect(hx, hy, hw, hh);
      let hmin = Infinity, hmax = -Infinity;
      for (const v of history) { if (v < hmin) hmin = v; if (v > hmax) hmax = v; }
      const hrange = Math.max(Math.abs(hmax - hmin), 0.5);
      const hmid = (hmin + hmax) / 2;
      p.stroke('#f78166'); p.strokeWeight(1.2);
      p.beginShape();
      for (let i = 0; i < history.length; i++) {
        const px = hx + (i / (history.length - 1)) * hw;
        const py = hy + hh / 2 - ((history[i] - hmid) / hrange) * (hh - 4);
        p.vertex(px, py);
      }
      p.endShape();
      p.noStroke(); p.fill('#8b949e'); p.textSize(10);
      p.text("f' history", hx, hy - 14);
    }

    p.fill('#8b949e'); p.textSize(12);
    const instruction = tangentSet ? 'Click/drag to move tangent point  |  "Clear point" to follow mouse again' : 'Click on canvas to pin a tangent point (drag to move it)';
    p.text(instruction, 20, p.height / 2 + 18);
  };
};
new p5(sketch);
