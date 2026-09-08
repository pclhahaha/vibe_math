import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let grid = [], N = 20, T = 2.0;
  let energyHistory = [], magHistory = [];
  const Tc = 2.27;
  let pg;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    const c = p.createCanvas(440, 440);
    c.parent('p5canvas');
    pg = p.createGraphics(120, 80);

    for (let i = 0; i < N; i++) {
      grid[i] = [];
      for (let j = 0; j < N; j++) grid[i][j] = Math.random() > 0.5 ? 1 : -1;
    }

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0.5';
    sl.max = '5';
    sl.step = '0.1';
    sl.value = '2';
    sl.style.cssText = 'width:200px;accent-color:#58a6ff;margin:4px';
    sl.addEventListener('input', () => { T = parseFloat(sl.value); });
    const lbl = document.createElement('span');
    lbl.textContent = ' T=2.0';
    lbl.style.cssText = 'color:#8b949e;font-size:13px;margin:4px';
    sl.addEventListener('input', () => { lbl.textContent = ' T=' + parseFloat(sl.value).toFixed(1); });
    document.querySelector('.sketch-col')?.appendChild(sl);
    document.querySelector('.sketch-col')?.appendChild(lbl);

    const quenchBtn = document.createElement('button');
    quenchBtn.textContent = 'Quench (T=0.5)';
    quenchBtn.style.cssText = 'background:#161b22;color:#f78166;border:1px solid #30363d;padding:4px 8px;border-radius:4px;margin:4px;cursor:pointer';
    quenchBtn.addEventListener('click', () => {
      T = 0.5;
      sl.value = '0.5';
      lbl.textContent = ' T=0.5';
    });
    document.querySelector('.sketch-col')?.appendChild(quenchBtn);

    c.elt.addEventListener('click', (e) => {
      const rect = c.elt.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const i = Math.floor(mx / 22), j = Math.floor(my / 22);
      if (i >= 0 && i < N && j >= 0 && j < N) grid[i][j] *= -1;
    });
  };

  function computeEnergy() {
    let E = 0;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        E -= grid[i][j] * (grid[(i + 1) % N][j] + grid[i][(j + 1) % N]);
    return E;
  }

  p.draw = () => {
    p.background('#0d1117');
    const cw = 22;

    for (let step = 0; step < 50; step++) {
      const i = Math.floor(Math.random() * N);
      const j = Math.floor(Math.random() * N);
      const nb = grid[(i - 1 + N) % N][j] + grid[(i + 1) % N][j] + grid[i][(j - 1 + N) % N] + grid[i][(j + 1) % N];
      const dE = 2 * grid[i][j] * nb;
      if (dE <= 0 || Math.random() < Math.exp(-dE / T)) grid[i][j] *= -1;
    }

    let mag = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        p.noStroke();
        p.fill(grid[i][j] === 1 ? '#58a6ff' : '#f78166');
        p.rect(i * cw, j * cw, cw - 1, cw - 1);
        mag += grid[i][j];
      }
    }
    mag /= N * N;

    const energy = computeEnergy();
    energyHistory.push(energy);
    magHistory.push(mag);
    if (energyHistory.length > 100) { energyHistory.shift(); magHistory.shift(); }

    drawHistoryGraphs();

    const ratio = T / Tc;
    const phase = T < Tc ? 'ORDERED (ferromagnetic)' : 'DISORDERED (paramagnetic)';
    const phaseCol = T < Tc ? '#58a6ff' : '#f78166';

    p.fill('#8b949e');
    p.textSize(13);
    p.text('T=' + T.toFixed(1) + '  |M|=' + Math.abs(mag).toFixed(3) + '  E=' + energy, 10, 430);

    p.fill(phaseCol);
    p.textSize(12);
    p.text('T/Tc=' + ratio.toFixed(3) + ' → ' + phase, 10, 414);
  };

  function drawHistoryGraphs() {
    pg.clear();
    pg.fill(0, 0, 0, 60);
    pg.noStroke();
    pg.rect(0, 0, pg.width, pg.height);

    pg.stroke('#30363d');
    pg.strokeWeight(1);
    pg.noFill();
    pg.rect(0, 0, pg.width, pg.height);

    const w = pg.width, h = pg.height;
    const pad = 6;

    pg.textSize(10);
    pg.fill('#58a6ff');
    pg.text('E', pad + 2, pad + 8);
    pg.fill('#f78166');
    pg.text('M', pad + 2, h / 2 + 8);

    pg.stroke('#30363d');
    pg.strokeWeight(0.5);
    pg.line(pad, h / 2, w - pad, h / 2);

    if (energyHistory.length < 2) return;
    const eMin = Math.min(...energyHistory), eMax = Math.max(...energyHistory);
    const eRange = eMax - eMin || 1;

    pg.stroke('#58a6ff');
    pg.strokeWeight(1);
    pg.noFill();
    pg.beginShape();
    for (let i = 0; i < energyHistory.length; i++) {
      const x = p.map(i, 0, energyHistory.length - 1, pad, w - pad);
      const y = p.map(energyHistory[i], eMin, eMax, h / 2 - 2, pad + 2);
      pg.vertex(x, y);
    }
    pg.endShape();

    pg.stroke('#f78166');
    pg.strokeWeight(1);
    pg.noFill();
    pg.beginShape();
    for (let i = 0; i < magHistory.length; i++) {
      const x = p.map(i, 0, magHistory.length - 1, pad, w - pad);
      const y = p.map(magHistory[i], -1, 1, h - pad, h / 2 + 2);
      pg.vertex(x, y);
    }
    pg.endShape();

    p.image(pg, 444, 4);
  }
};
new p5(sketch);
