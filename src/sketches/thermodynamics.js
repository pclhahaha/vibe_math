import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const N = 200;
  let nLeft = 100;
  let particles = [];
  let released = false;
  let H = 0, lnW = 0;
  let SHistory = [];

  function lnFact(n) { return n <= 1 ? 0 : n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n); }

  function reset() {
    particles = [];
    for (let i = 0; i < N; i++) particles.push(i < nLeft ? 0 : 1);
    released = false;
    SHistory = [];
    updateStats();
  }

  function updateStats() {
    let L = 0;
    for (let i = 0; i < N; i++) if (particles[i] === 0) L++;
    const pL = L / N, pR = 1 - pL;
    H = (pL > 0 && pR > 0) ? -(pL * Math.log(pL) + pR * Math.log(pR)) : 0;
    lnW = lnFact(N) - lnFact(L) - lnFact(N - L);
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 420).parent('p5canvas');
    reset();

    const col = document.querySelector('.sketch-col');

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const lbl = document.createElement('span');
    lbl.textContent = 'Particles on left:';
    lbl.style.cssText = 'font-size:0.75em;color:#8b949e';
    row.appendChild(lbl);
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0'; sl.max = String(N); sl.step = '10'; sl.value = '150';
    sl.style.cssText = 'width:160px;accent-color:#58a6ff';
    const sval = document.createElement('span');
    sval.style.cssText = 'font-size:0.75em;color:#58a6ff;min-width:24px';
    sval.textContent = '150';
    sl.addEventListener('input', () => { nLeft = parseInt(sl.value); sval.textContent = nLeft; reset(); });
    row.appendChild(sl);
    row.appendChild(sval);
    col?.appendChild(row);

    const row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:4px 0';
    const rel = document.createElement('button');
    rel.textContent = '释放隔板';
    rel.style.cssText = 'background:#21262d;color:#58a6ff;border:1px solid #30363d;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:0.75em';
    rel.addEventListener('click', () => { if (!released) { released = true; } });
    row2.appendChild(rel);
    const rst = document.createElement('button');
    rst.textContent = 'Reset to Non-Equilibrium';
    rst.style.cssText = 'background:#21262d;color:#f78166;border:1px solid #30363d;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:0.75em';
    rst.addEventListener('click', () => reset());
    row2.appendChild(rst);
    col?.appendChild(row2);
  };

  p.draw = () => {
    p.background('#0d1117');

    if (released) {
      let L = 0;
      for (let i = 0; i < N; i++) if (particles[i] === 0) L++;
      const imbalance = (L - N / 2) / (N / 2);
      for (let i = 0; i < N; i++) {
        const onLeft = particles[i] === 0;
        const bias = onLeft ? Math.max(0, imbalance) : Math.max(0, -imbalance);
        const prob = 0.06 + 0.10 * bias;
        if (Math.random() < prob) particles[i] = onLeft ? 1 : 0;
      }
      updateStats();
      SHistory.push(H);
      if (SHistory.length > 400) SHistory.shift();
    }

    let L = 0;
    for (let i = 0; i < N; i++) if (particles[i] === 0) L++;
    const Rc = N - L;

    const bx = 30, by = 18, bw = 440, bh = 190, midX = bx + bw / 2;
    p.stroke('#30363d'); p.strokeWeight(2); p.noFill();
    p.rect(bx, by, bw, bh);
    p.stroke('#8b949e');
    p.line(midX, by, midX, by + bh);

    p.noStroke();
    for (let i = 0; i < N; i++) {
      const onLeft = particles[i] === 0;
      const col = onLeft ? '#58a6ff' : '#f78166';
      const r = onLeft ? Math.random() * (midX - bx - 14) + 7 : Math.random() * (bx + bw - midX - 14) + 7;
      const c = onLeft ? Math.random() * (bh - 14) + 7 : Math.random() * (bh - 14) + 7;
      p.fill(col, 150);
      p.circle(bx + r + (onLeft ? 0 : midX - bx), by + c, 4);
    }

    if (!released) {
      p.noStroke(); p.fill('#f78166'); p.textSize(12); p.textAlign(p.CENTER, p.CENTER);
      p.text('WALL', midX, by + bh / 2);
    }
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#58a6ff'); p.textSize(13);
    p.text('N_L = ' + L, bx + 6, by + 6);
    p.fill('#f78166');
    p.text('N_R = ' + Rc, midX + 6, by + 6);

    const gx = 30, gy = 245, gw = 440, gh = 150;
    p.stroke('#30363d'); p.strokeWeight(1); p.noFill();
    p.rect(gx, gy, gw, gh);
    p.stroke('#30363d'); p.strokeWeight(0.5);
    p.line(gx, gy + gh / 2, gx + gw, gy + gh / 2);

    const yMax = 0.75;
    const yOf = (v) => gy + gh - 8 - (v / yMax) * (gh - 14);
    if (SHistory.length >= 2) {
      p.stroke('#7ee787'); p.strokeWeight(1.5); p.noFill();
      p.beginShape();
      for (let i = 0; i < SHistory.length; i++) {
        const px = p.map(i, 0, 399, gx + 4, gx + gw - 4);
        p.vertex(px, yOf(SHistory[i]));
      }
      p.endShape();
    }

    p.noStroke(); p.fill('#7ee787'); p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Entropy H(t) = −Σ p ln p   (0 … ln 2 ≈ 0.693 nats)', gx + 4, gy + 2);
    p.text('ln 2', gx + 4, yOf(Math.LN2));

    const pL = L / N;
    p.fill('#8b949e'); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
    p.text('p_L = ' + pL.toFixed(3) + '   p_R = ' + (1 - pL).toFixed(3), gx, gy + gh + 8);
    p.fill('#c9d1d9');
    p.text('H = −Σ p ln p = ' + H.toFixed(4) + ' nats', gx, gy + gh + 26);
    p.text('microstates  W = C(' + N + ', N_L)  →  ln W = ' + lnW.toFixed(3), gx, gy + gh + 44);
    p.fill('#f78166');
    p.text('S = k ln W  = ' + lnW.toFixed(3) + ' · k   (k = 1 here)', gx, gy + gh + 62);
    p.fill('#8b949e');
    p.text(released ? 'Second law: dS ≥ 0 — entropy rises to its maximum' : 'Press "释放隔板" to let the gas diffuse',
      gx, gy + gh + 80);
  };
};
new p5(sketch);
