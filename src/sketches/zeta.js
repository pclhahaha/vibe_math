import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let sigma = 0.5, t = 14.13;
  let dragging = false;
  const zeros = [14.13, 21.02, 25.01, 30.42, 32.93, 37.58, 40.91, 43.32, 48.00, 49.77];

  function zeta(s, ti) {
    let zr = 0, zi = 0;
    for (let n = 1; n < 400; n++) {
      const mag = Math.pow(n, -s);
      const ang = ti * Math.log(n);
      zr += mag * Math.cos(ang);
      zi -= mag * Math.sin(ang);
    }
    return { zr, zi };
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(560, p.windowWidth - 40), 480).parent('p5canvas');

    const labels = document.createElement('div');
    labels.style.cssText = 'display:flex;gap:20px;margin:4px 0;font-size:13px';
    const sl = document.createElement('span');
    sl.id = 'zeta-sigma';
    sl.style.color = '#58a6ff';
    sl.textContent = 'Re(s) = 0.50';
    labels.appendChild(sl);
    const tl = document.createElement('span');
    tl.id = 'zeta-t';
    tl.style.color = '#f78166';
    tl.textContent = 'Im(s) = 14.13';
    labels.appendChild(tl);
    document.querySelector('.sketch-col')?.appendChild(labels);
  };

  p.draw = () => {
    p.background('#0d1117');

    // Layout: left = critical strip panel, right = complex plane panel
    const leftW = p.width - 160;
    const ox = 55, oy = 40;
    const pw = leftW - ox, ph = p.height - 100;

    // Handle drag in critical strip
    if (dragging) {
      const mx = p.mouseX - ox, my = p.mouseY - oy;
      sigma = p.constrain(p.map(mx, 0, pw, 0, 1), 0.01, 0.99);
      t = p.constrain(p.map(my, 0, ph, 50, 0), 0.05, 50);
      const sl = document.getElementById('zeta-sigma');
      const tl = document.getElementById('zeta-t');
      if (sl) sl.textContent = 'Re(s) = ' + sigma.toFixed(2);
      if (tl) tl.textContent = 'Im(s) = ' + t.toFixed(2);
    }

    p.translate(ox, oy);

    // === Critical strip panel ===
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.noFill();
    p.rect(0, 0, pw, ph, 4);

    // Axis labels
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Re(s) — σ', pw / 2, ph + 6);
    p.push();
    p.translate(-22, ph / 2);
    p.rotate(-p.HALF_PI);
    p.text('Im(s) — t', 0, 0);
    p.pop();

    // Tick marks on σ axis
    p.stroke('#30363d');
    p.strokeWeight(0.5);
    p.fill('#484f58');
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    for (let v = 0; v <= 1; v += 0.2) {
      const x = p.map(v, 0, 1, 0, pw);
      p.line(x, ph, x, ph + 4);
      p.text(v.toFixed(1), x, ph + 6);
    }

    // Tick marks on t axis
    p.textAlign(p.RIGHT, p.CENTER);
    for (let v = 0; v <= 50; v += 10) {
      const y = p.map(v, 0, 50, ph, 0);
      p.line(0, y, -4, y);
      p.text(v, -6, y);
    }

    // Critical line (Re(s) = 1/2)
    const cx = p.map(0.5, 0, 1, 0, pw);
    p.stroke('#f78166');
    p.strokeWeight(1.5);
    p.drawingContext.setLineDash([6, 4]);
    p.line(cx, 0, cx, ph);
    p.drawingContext.setLineDash([]);
    p.fill('#f78166');
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text('critical line Re(s)=1/2', cx + 4, 4);

    // Mark zero points on critical line
    for (const zt of zeros) {
      const zy = p.map(zt, 0, 50, ph, 0);
      p.fill('#7ee787');
      p.noStroke();
      p.circle(cx, zy, 4);
      p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(zt.toFixed(1), cx + 6, zy);
    }

    // Cursor position
    const sx = p.map(sigma, 0, 1, 0, pw);
    const sy = p.map(t, 0, 50, ph, 0);
    p.fill('#f78166');
    p.noStroke();
    p.circle(sx, sy, 7);
    p.stroke('#0d1117');
    p.strokeWeight(2);
    p.circle(sx, sy, 7);

    // Critical strip label
    if (sigma > 0 && sigma < 1) {
      p.fill(88, 166, 255, 15);
      p.noStroke();
      p.rect(cx, 0, sx - cx, ph);
    }

    // === Right panel: complex plane of zeta values ===
    const rx = pw + 25;
    const ry = 40;
    const rw = 100, rh = 100;

    // Axes
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.line(rx, ry + rh / 2, rx + rw, ry + rh / 2);
    p.line(rx + rw / 2, ry, rx + rw / 2, ry + rh);

    // Label
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text('ζ(s)', rx + rw / 2, ry - 14);

    // Zeta value as vector
    const Z = zeta(sigma, t);
    const scale = 18;
    const vzx = p.constrain(Z.zr, -3, 3) * scale;
    const vzy = p.constrain(Z.zi, -3, 3) * scale;
    p.stroke('#f78166');
    p.strokeWeight(2);
    p.line(rx + rw / 2, ry + rh / 2, rx + rw / 2 + vzx, ry + rh / 2 - vzy);
    p.fill('#f78166');
    p.noStroke();
    p.circle(rx + rw / 2 + vzx, ry + rh / 2 - vzy, 4);

    // Zeta value text
    p.fill('#f78166');
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      'ζ(s) = ' + Z.zr.toFixed(3) + (Z.zi >= 0 ? '+' : '') + Z.zi.toFixed(3) + 'i',
      rx, ry + rh + 8
    );
    p.text('|ζ| = ' + Math.sqrt(Z.zr * Z.zr + Z.zi * Z.zi).toFixed(3), rx, ry + rh + 22);

    // Info bar
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    const infoY = ph + 30;
    p.text(
      'Drag in critical strip (0<σ<1, 0<t<50) | Green dots = non-trivial zeros on Re(s)=1/2',
      -ox + 10,
      infoY
    );
    p.text(
      'Riemann Hypothesis: ALL non-trivial zeros lie on the critical line',
      -ox + 10,
      infoY + 20
    );
  };

  p.mousePressed = () => {
    const ox = 55, oy = 40;
    const mx = p.mouseX - ox, my = p.mouseY - oy;
    const pw = p.width - 160 - ox, ph = p.height - 100;
    if (mx >= 0 && mx <= pw && my >= 0 && my <= ph) dragging = true;
  };

  p.mouseReleased = () => { dragging = false; };

  p.mouseDragged = () => { /* handled in draw */ };
};

new p5(sketch);
