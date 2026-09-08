// Eigenvectors — native p5 sliders, see directions that stay on same line
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let a = 2.5, b = 0.8, c = 0.8, d = 1.5;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 480).parent('p5canvas');

    // Use p5's NATIVE createSlider — integrated with p5 event system
    const names = ['a', 'b', 'c', 'd'];
    const defaults = { a: 2.5, b: 0.8, c: 0.8, d: 1.5 };
    const sliders = {};

    names.forEach((name) => {
      const sl = p.createSlider(-3, 3, defaults[name], 0.1);
      sl.style('width', '70px');
      sl.style('accent-color', '#58a6ff');
      sl.style('margin', '0 4px');
      sl.input(() => {
        const v = sl.value();
        if (name === 'a') a = v;
        if (name === 'b') b = v;
        if (name === 'c') c = v;
        if (name === 'd') d = v;
      });
      sl.parent('p5canvas');
      // Add label + value readout via plain DOM next to it
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:0.78em;color:#8b949e;margin:4px 6px 0 0';
      wrap.textContent = name + ': ';
      const valSpan = document.createElement('span');
      valSpan.id = 'ev_' + name;
      valSpan.style.cssText = 'color:#58a6ff;min-width:26px;text-align:right';
      valSpan.textContent = defaults[name].toFixed(1);
      wrap.appendChild(valSpan);
      document.querySelector('.sketch-col')?.appendChild(wrap);
      sliders[name] = { sl, valSpan };
      // Keep slider and its label together
      sl.elt.parentNode.insertBefore(wrap, sl.elt);
    });

    // Symmetric button
    const symBtn = p.createButton('Symmetric (c=b)');
    symBtn.style('background', '#161b22');
    symBtn.style('color', '#7ee787');
    symBtn.style('border', '1px solid #30363d');
    symBtn.style('padding', '5px 12px');
    symBtn.style('border-radius', '6px');
    symBtn.style('cursor', 'pointer');
    symBtn.style('font-size', '0.78em');
    symBtn.style('margin', '4px');
    symBtn.mousePressed(() => {
      c = b;
      sliders.c.sl.value(b);
      sliders.c.valSpan.textContent = b.toFixed(1);
    });
    symBtn.parent('p5canvas');

    const rotBtn = p.createButton('旋转');
    rotBtn.style('background', '#161b22');
    rotBtn.style('color', '#58a6ff');
    rotBtn.style('border', '1px solid #30363d');
    rotBtn.style('padding', '5px 12px');
    rotBtn.style('border-radius', '6px');
    rotBtn.style('cursor', 'pointer');
    rotBtn.style('font-size', '0.78em');
    rotBtn.style('margin', '4px');
    rotBtn.mousePressed(() => {
      const th = Math.random() * Math.PI;
      a = Math.cos(th); b = -Math.sin(th);
      c = Math.sin(th); d = Math.cos(th);
      [['a', a], ['b', b], ['c', c], ['d', d]].forEach(([k, v]) => {
        sliders[k].sl.value(v);
        sliders[k].valSpan.textContent = parseFloat(v.toFixed(1)).toFixed(1);
      });
    });
    rotBtn.parent('p5canvas');
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    p.scale(1, -1);
    const sc = 48;

    // Grid
    p.stroke('#141920'); p.strokeWeight(0.5);
    for (let i = -5; i <= 5; i++) {
      p.line(i * sc, -5 * sc, i * sc, 5 * sc);
      p.line(-5 * sc, i * sc, 5 * sc, i * sc);
    }
    p.stroke('#30363d'); p.strokeWeight(1);
    p.line(-5 * sc, 0, 5 * sc, 0);
    p.line(0, -5 * sc, 0, 5 * sc);

    const det = a * d - b * c;
    const tr = a + d;
    const disc = tr * tr - 4 * det;
    const isSym = Math.abs(b - c) < 0.01;

    // Vector pairs
    const nVecs = 32;
    for (let i = 0; i < nVecs; i++) {
      const th = (p.TWO_PI * i) / nVecs;
      const x = Math.cos(th), y = Math.sin(th);
      const tx = a * x + b * y, ty = c * x + d * y;
      p.stroke('#58a6ff', 90); p.strokeWeight(1.5); p.line(0, 0, x * sc, y * sc);
      p.stroke('#f78166', 90); p.strokeWeight(1.5); p.line(0, 0, tx * sc, ty * sc);
      p.fill('#58a6ff'); p.noStroke(); p.circle(x * sc, y * sc, 3);
      p.fill('#f78166'); p.circle(tx * sc, ty * sc, 3);
    }

    // Eigenvectors
    let l1 = 0, l2 = 0, v1x = 0, v1y = 0, v2x = 0, v2y = 0;
    if (disc >= 0) {
      l1 = (tr + Math.sqrt(disc)) / 2;
      l2 = (tr - Math.sqrt(disc)) / 2;
      if (Math.abs(b) > 0.001) {
        v1x = b; v1y = l1 - a; v2x = b; v2y = l2 - a;
      } else if (Math.abs(c) > 0.001) {
        v1x = l1 - d; v1y = c; v2x = l2 - d; v2y = c;
      } else { v1x = 1; v1y = 0; v2x = 0; v2y = 1; }
      const n1 = Math.sqrt(v1x * v1x + v1y * v1y);
      const n2 = Math.sqrt(v2x * v2x + v2y * v2y);
      if (n1 > 0) { v1x /= n1; v1y /= n1; }
      if (n2 > 0) { v2x /= n2; v2y /= n2; }

      p.stroke('#7ee787'); p.strokeWeight(2.5); p.drawingContext.setLineDash([6, 4]);
      p.line(-v1x * 5 * sc, -v1y * 5 * sc, v1x * 5 * sc, v1y * 5 * sc);
      if (Math.abs(l1 - l2) > 0.01) p.line(-v2x * 5 * sc, -v2y * 5 * sc, v2x * 5 * sc, v2y * 5 * sc);
      p.drawingContext.setLineDash([]);

      p.stroke('#ffd33d'); p.strokeWeight(4);
      p.line(0, 0, l1 * v1x * sc, l1 * v1y * sc);
      if (Math.abs(l1 - l2) > 0.01) p.line(0, 0, l2 * v2x * sc, l2 * v2y * sc);
    }

    // Info
    p.scale(1, -1);
    const x0 = -5 * sc + 8, y0 = -5 * sc + 8;
    p.fill('#c9d1d9'); p.textSize(15); p.noStroke(); p.textAlign(p.LEFT, p.TOP);
    p.text(`Matrix A = [[${a.toFixed(1)}, ${b.toFixed(1)}], [${c.toFixed(1)}, ${d.toFixed(1)}]]`, x0, y0);
    if (disc >= 0) {
      p.fill('#7ee787'); p.textSize(13);
      p.text(`λ₁=${l1.toFixed(2)} λ₂=${l2.toFixed(2)}   det=${det.toFixed(2)}`, x0, y0 + 24);
      p.fill('#8b949e'); p.textSize(11);
      p.text('Green=eigenvectors  Yellow=λ·v', x0, y0 + 46);
    } else {
      p.fill('#f78166'); p.textSize(13);
      p.text(`λ=${(tr/2).toFixed(2)} ± ${(Math.sqrt(-disc)/2).toFixed(2)}i`, x0, y0 + 24);
      p.fill('#8b949e'); p.textSize(11);
      p.text('Complex — drag c ≈ b to see real eigenvectors', x0, y0 + 46);
    }
  };
};

new p5(sketch);
