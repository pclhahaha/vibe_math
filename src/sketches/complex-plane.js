import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let n = 2;
  let funcMode = 'pow';
  let mx = 0, my = 0;

  const mapFunc = (x, y) => {
    if (funcMode === 'pow') {
      const r = Math.pow(x * x + y * y, n / 2);
      const th = n * Math.atan2(y, x);
      return { u: r * Math.cos(th), v: r * Math.sin(th) };
    } else if (funcMode === 'exp') {
      const e = Math.exp(x);
      return { u: e * Math.cos(y), v: e * Math.sin(y) };
    } else {
      const d = x * x + y * y;
      if (d < 1e-9) return { u: 999, v: 999 };
      return { u: x / d, v: -y / d };
    }
  };

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(620, p.windowWidth - 40), 540).parent('p5canvas');

    const wrap = document.querySelector('.sketch-col');
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:4px;margin:6px 0;';
    const modes = [
      { id: 'pow', label: 'f(z)=z^n' },
      { id: 'exp', label: 'f(z)=e^z' },
      { id: 'inv', label: 'f(z)=1/z' },
    ];
    modes.forEach(m => {
      const b = document.createElement('button');
      b.textContent = m.label;
      b.style.cssText =
        'padding:5px 14px;border:1px solid #30363d;border-radius:6px;background:' +
        (funcMode === m.id ? '#1a2a3a' : '#161b22') +
        ';color:#58a6ff;cursor:pointer;font-size:0.82em;margin:2px';
      b.addEventListener('click', () => {
        funcMode = m.id;
        btnRow.querySelectorAll('button').forEach(bb => {
          bb.style.background = bb._fmode === funcMode ? '#1a2a3a' : '#161b22';
        });
      });
      b._fmode = m.id;
      btnRow.appendChild(b);
    });
    wrap?.appendChild(btnRow);

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '2';
    sl.max = '5';
    sl.step = '1';
    sl.value = '2';
    sl.style.cssText = 'width:120px;accent-color:#58a6ff;margin:4px;';
    sl.addEventListener('input', () => { n = parseInt(sl.value); });
    wrap?.appendChild(sl);
    const slLabel = document.createElement('span');
    slLabel.style.cssText = 'color:#8b949e;font-size:0.75em;margin-left:4px';
    slLabel.textContent = '次数 n';
    wrap?.appendChild(slLabel);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    const sc = 42;

    // Original grid — thick blue
    p.stroke('#58a6ff');
    p.strokeWeight(1.5);
    const R = 2.2;
    for (let i = -2; i <= 2; i++) {
      p.line(i * sc, -R * sc, i * sc, R * sc);
      p.line(-R * sc, i * sc, R * sc, i * sc);
    }

    // Transformed grid — thick red with fill between lines for visibility
    p.stroke('#f78166');
    p.strokeWeight(1.8);
    const step = 0.3;
    for (let y0 = -2; y0 <= 2; y0 += step) {
      p.beginShape();
      for (let x = -2; x <= 2; x += 0.03) {
        const { u, v } = mapFunc(x, y0);
        if (Math.abs(u) < 8 && Math.abs(v) < 7) p.vertex(u * sc, v * sc);
      }
      p.endShape();
    }
    for (let x0 = -2; x0 <= 2; x0 += step) {
      p.beginShape();
      for (let y = -2; y <= 2; y += 0.03) {
        const { u, v } = mapFunc(x0, y);
        if (Math.abs(u) < 8 && Math.abs(v) < 7) p.vertex(u * sc, v * sc);
      }
      p.endShape();
    }

    // Mouse tracking
    const cx = mx, cy = my;
    const { u: tu, v: tv } = mapFunc(cx, cy);
    const clip = Math.abs(tu) < 7 && Math.abs(tv) < 6;

    // Dashed connecting line
    if (clip) {
      p.stroke('#7ee787');
      p.strokeWeight(1.5);
      p.drawingContext.setLineDash([5, 5]);
      p.line(cx * sc, cy * sc, tu * sc, tv * sc);
      p.drawingContext.setLineDash([]);
    }

    // Source point (blue dot)
    p.fill('#58a6ff');
    p.noStroke();
    p.circle(cx * sc, cy * sc, 9);
    p.stroke('#0d1117');
    p.strokeWeight(1.5);
    p.circle(cx * sc, cy * sc, 9);

    // Image point (red dot)
    if (clip) {
      p.fill('#f78166');
      p.noStroke();
      p.circle(tu * sc, tv * sc, 9);
      p.stroke('#0d1117');
      p.strokeWeight(1.5);
      p.circle(tu * sc, tv * sc, 9);
    }

    // Right-angle marker at origin (conformal!)
    p.stroke('#ffd33d');
    p.strokeWeight(2);
    p.noFill();
    const sq = 16;
    p.line(0, -sq, 0, sq);
    p.line(-sq, 0, sq, 0);
    p.fill('#ffd33d');
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('90° → 90°', 0, sq + 16);

    // Info panel
    p.fill('#0d1117');
    p.stroke('#30363d');
    p.strokeWeight(1);
    const px = -p.width / 2 + 8, py = -p.height / 2 + 6;
    p.rect(px, py, 260, 56, 6);
    p.fill('#58a6ff');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`z = ${cx.toFixed(2)} + ${cy.toFixed(2)}i`, px + 10, py + 8);
    const fn = funcMode === 'pow' ? `z^${n}` : funcMode === 'exp' ? 'e^z' : '1/z';
    p.fill('#f78166');
    p.text(`f(z)=${fn} ⇒ ${clip ? tu.toFixed(2) + ' + ' + tv.toFixed(2) + 'i' : '(outside view)'}`, px + 10, py + 28);
    p.fill('#ffd33d');
    p.textSize(11);
    p.text('⊥ preserved: conformal mapping!', px + 10, py + 44);
  };

  p.mouseMoved = () => {
    mx = p.map(p.mouseX, 0, p.width, -2.8, 2.8);
    my = p.map(p.mouseY, 0, p.height, 2.8, -2.8);
  };
  p.mouseDragged = () => {
    mx = p.map(p.mouseX, 0, p.width, -2.8, 2.8);
    my = p.map(p.mouseY, 0, p.height, 2.8, -2.8);
  };
};
new p5(sketch);
