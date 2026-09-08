import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let a = 2.5, b = 0.5, c = 0.5, d = 1.5;
  let sliderRefs = {};

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 480).parent('p5canvas');

    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:6px 0;padding:4px 0';

    const names = ['a', 'b', 'c', 'd'];
    const defaults = { a: 2.5, b: 0.5, c: 0.5, d: 1.5 };

    names.forEach((name) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:0.78em;color:#8b949e';
      const label = document.createElement('span');
      label.textContent = name + ':';
      wrap.appendChild(label);

      const valSpan = document.createElement('span');
      valSpan.style.cssText = 'color:#58a6ff;min-width:28px;text-align:right';
      valSpan.textContent = defaults[name].toFixed(0);
      wrap.appendChild(valSpan);

      const sl = document.createElement('input');
      sl.type = 'range';
      sl.min = '-3';
      sl.max = '3';
      sl.step = '0.1';
      sl.value = defaults[name];
      sl.style.cssText = 'width:60px;accent-color:#58a6ff;margin:0;cursor:pointer';
      sl.addEventListener('input', () => {
        const v = parseFloat(sl.value);
        if (name === 'a') a = v;
        if (name === 'b') b = v;
        if (name === 'c') c = v;
        if (name === 'd') d = v;
        valSpan.textContent = v.toFixed(1);
      });
      wrap.appendChild(sl);
      slRow.appendChild(wrap);
      sliderRefs[name] = { slider: sl, display: valSpan };
    });

    document.querySelector('.sketch-col')?.appendChild(slRow);

    const symBtn = document.createElement('button');
    symBtn.textContent = 'Symmetrize (c=b)';
    symBtn.style.cssText =
      'background:#161b22;color:#7ee787;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:4px';
    symBtn.addEventListener('click', () => {
      c = b;
      const ref = sliderRefs['c'];
      if (ref) {
        ref.slider.value = b;
        ref.display.textContent = b.toFixed(1);
      }
    });
    document.querySelector('.sketch-col')?.appendChild(symBtn);

    const normBtn = document.createElement('button');
    normBtn.textContent = '旋转';
    normBtn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:4px';
    normBtn.addEventListener('click', () => {
      const theta = Math.random() * Math.PI;
      a = Math.cos(theta).toFixed(1); b = -Math.sin(theta).toFixed(1);
      c = Math.sin(theta).toFixed(1); d = Math.cos(theta).toFixed(1);
      for (const [key, val] of Object.entries({ a, b, c, d })) {
        const ref = sliderRefs[key];
        if (ref) {
          ref.slider.value = val;
          ref.display.textContent = parseFloat(val).toFixed(1);
        }
      }
    });
    document.querySelector('.sketch-col')?.appendChild(normBtn);

    const scaleBtn = document.createElement('button');
    scaleBtn.textContent = '缩放';
    scaleBtn.style.cssText =
      'background:#161b22;color:#f78166;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:4px';
    scaleBtn.addEventListener('click', () => {
      a = (Math.random() * 4 - 2).toFixed(1);
      d = (Math.random() * 4 - 2).toFixed(1);
      b = 0; c = 0;
      for (const [key, val] of Object.entries({ a, b, c, d })) {
        const ref = sliderRefs[key];
        if (ref) {
          ref.slider.value = val;
          ref.display.textContent = parseFloat(val).toFixed(1);
        }
      }
    });
    document.querySelector('.sketch-col')?.appendChild(scaleBtn);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    p.scale(1, -1);

    const sc = 48;
    const sym = Math.abs(b - c) < 0.01;
    const det = a * d - b * c;
    const tr = a + d;
    const disc = tr * tr - 4 * det;

    // Light grid
    p.stroke('#161b22');
    p.strokeWeight(0.4);
    for (let i = -5; i <= 5; i++) {
      p.line(i * sc, -5 * sc, i * sc, 5 * sc);
      p.line(-5 * sc, i * sc, 5 * sc, i * sc);
    }

    // Axes
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(-5 * sc, 0, 5 * sc, 0);
    p.line(0, -5 * sc, 0, 5 * sc);

    // Unit circle (input)
    p.stroke('#58a6ff');
    p.strokeWeight(1.5);
    p.noFill();
    p.beginShape();
    for (let t = 0; t <= p.TWO_PI; t += 0.03) {
      p.vertex(Math.cos(t) * sc, Math.sin(t) * sc);
    }
    p.endShape(p.CLOSE);

    // Transformed ellipse
    p.stroke('#f78166');
    p.strokeWeight(2.5);
    p.fill(248, 113, 102, 25);
    p.beginShape();
    for (let t = 0; t <= p.TWO_PI; t += 0.03) {
      const x = Math.cos(t);
      const y = Math.sin(t);
      p.vertex((a * x + b * y) * sc, (c * x + d * y) * sc);
    }
    p.endShape(p.CLOSE);

    // Eigenvectors and eigenvalues
    if (disc >= 0) {
      const l1 = (tr + Math.sqrt(disc)) / 2;
      const l2 = (tr - Math.sqrt(disc)) / 2;

      // Compute eigenvectors
      let v1x, v1y, v2x, v2y;
      if (Math.abs(b) > 0.001) {
        v1x = b; v1y = l1 - a;
        v2x = b; v2y = l2 - a;
      } else if (Math.abs(c) > 0.001) {
        v1x = l1 - d; v1y = c;
        v2x = l2 - d; v2y = c;
      } else {
        // Diagonal matrix: eigenvectors are axes
        v1x = 1; v1y = 0;
        v2x = 0; v2y = 1;
      }

      const n1 = Math.sqrt(v1x * v1x + v1y * v1y);
      const n2 = Math.sqrt(v2x * v2x + v2y * v2y);
      if (n1 > 0) { v1x /= n1; v1y /= n1; }
      if (n2 > 0) { v2x /= n2; v2y /= n2; }

      // Draw eigenvector directions (green dashed)
      p.stroke('#7ee787');
      p.strokeWeight(2);
      p.drawingContext.setLineDash([6, 4]);
      p.line(-v1x * 5 * sc, -v1y * 5 * sc, v1x * 5 * sc, v1y * 5 * sc);
      if (Math.abs(l1 - l2) > 0.01) {
        p.line(-v2x * 5 * sc, -v2y * 5 * sc, v2x * 5 * sc, v2y * 5 * sc);
      }
      p.drawingContext.setLineDash([]);

      // Draw transformed eigenvectors (yellow)
      p.stroke('#ffd33d');
      p.strokeWeight(4);
      p.line(0, 0, l1 * v1x * sc, l1 * v1y * sc);
      if (Math.abs(l1 - l2) > 0.01) {
        p.line(0, 0, l2 * v2x * sc, l2 * v2y * sc);
      }

      // Mark eigenvalues on screen
      p.scale(1, -1);
      p.fill('#8b949e');
      p.noStroke();
      p.textSize(14);
      p.textAlign(p.LEFT, p.TOP);
      const xOff = -5 * sc + 8;
      const yBase = -5 * sc + 8;
      p.text(
        `${sym ? 'Symmetric ✓' : 'NOT symmetric'} — λ₁=${l1.toFixed(2)}, λ₂=${l2.toFixed(2)}`,
        xOff, yBase
      );
      p.text(
        `det = ${det.toFixed(2)}, tr = ${tr.toFixed(2)}, disc = ${disc.toFixed(2)}${disc < 0 ? ' (complex!)' : ''}`,
        xOff, yBase + 22
      );
      if (sym) {
        p.fill('#7ee787');
        p.text('Eigenvectors ORTHOGONAL (green lines)', xOff, yBase + 44);
        p.fill('#ffd33d');
        p.text('λ·v = transformed eigenvectors (yellow arrows)', xOff, yBase + 64);
      } else {
        p.fill('#f78166');
        p.text('Drag c ≃ b to symmetrize — then eigenvectors appear', xOff, yBase + 44);
      }
    } else {
      // Complex eigenvalues
      p.scale(1, -1);
      p.fill('#f78166');
      p.noStroke();
      p.textSize(14);
      p.textAlign(p.LEFT, p.TOP);
      const xOff = -5 * sc + 8;
      const yBase = -5 * sc + 8;
      p.text(`Complex eigenvalues! disc = ${disc.toFixed(2)} < 0`, xOff, yBase);
      p.text(
        `λ = ${(tr/2).toFixed(2)} ± ${(Math.sqrt(-disc)/2).toFixed(2)}i (rotation components)`,
        xOff, yBase + 22
      );
      p.text(
        `det = ${det.toFixed(2)}, tr = ${tr.toFixed(2)}`,
        xOff, yBase + 44
      );
      p.fill('#8b949e');
      p.text('For real eigenvectors: make matrix symmetric (c = b)', xOff, yBase + 68);
    }
  };
};

new p5(sketch);
