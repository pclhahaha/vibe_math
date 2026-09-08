import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const maxN = 400;
  const NB = 64;
  const xMin = -4.2, xMax = 4.2, binW = (xMax - xMin) / NB;

  const DISTS = {
    uniform: { label: 'Uniform(−1,1)', mu: 0, sigma: Math.sqrt(1 / 3), draw: () => 2 * Math.random() - 1 },
    exponential: { label: 'Exponential(1)', mu: 1, sigma: 1, draw: () => -Math.log(1 - Math.random()) },
    coin: { label: 'Coin flip {0,1}', mu: 0.5, sigma: 0.5, draw: () => (Math.random() < 0.5 ? 0 : 1) },
    rademacher: { label: 'Rademacher {±1}', mu: 0, sigma: 1, draw: () => (Math.random() < 0.5 ? -1 : 1) },
    chisq: { label: 'Skew χ²₁ (std)', mu: 0, sigma: 1, draw: () => { const u = Math.random(), c = -Math.log(1 - u); return (c - 1) / Math.sqrt(2); } },
    bimodal: { label: 'Bimodal (2·N(±2))', mu: 0, sigma: 2, draw: () => (Math.random() < 0.5 ? -1 : 1) * (2 + gaussian()) }
  };

  let distKey = 'uniform';
  let n = 25;
  let R = 5000;
  let cum;

  function gaussian() {
    let s = 0;
    for (let i = 0; i < 6; i++) s += Math.random();
    return (s - 3) / Math.sqrt(6 * (1 / 12));
  }

  function genRow(offset) {
    const d = DISTS[distKey];
    let s = 0;
    cum[offset] = 0;
    for (let k = 1; k <= maxN; k++) { s += d.draw(); cum[offset + k] = s; }
  }

  function regenerate() {
    cum = new Float32Array(R * (maxN + 1));
    for (let r = 0; r < R; r++) genRow(r * (maxN + 1));
  }

  function addSamples(addR) {
    const oldR = R;
    const nc = new Float32Array((R + addR) * (maxN + 1));
    nc.set(cum);
    cum = nc;
    R += addR;
    for (let r = oldR; r < R; r++) genRow(r * (maxN + 1));
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 420).parent('p5canvas');
    regenerate();

    const col = document.querySelector('.sketch-col');

    const row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const dl = document.createElement('span');
    dl.textContent = 'Distribution:';
    dl.style.cssText = 'font-size:0.75em;color:#8b949e';
    row1.appendChild(dl);
    const sel = document.createElement('select');
    Object.keys(DISTS).forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = DISTS[k].label;
      sel.appendChild(o);
    });
    sel.style.cssText = 'background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:2px 6px;font-size:0.75em';
    sel.addEventListener('change', () => { distKey = sel.value; regenerate(); });
    row1.appendChild(sel);
    col?.appendChild(row1);

    const row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const nl = document.createElement('span');
    nl.textContent = 'Sample size n:';
    nl.style.cssText = 'font-size:0.75em;color:#8b949e';
    row2.appendChild(nl);
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '1'; sl.max = String(maxN); sl.step = '1'; sl.value = '25';
    sl.style.cssText = 'width:160px;accent-color:#58a6ff';
    const sval = document.createElement('span');
    sval.style.cssText = 'font-size:0.75em;color:#58a6ff;min-width:24px';
    sval.textContent = '25';
    sl.addEventListener('input', () => { n = parseInt(sl.value); sval.textContent = n; });
    row2.appendChild(sl);
    row2.appendChild(sval);
    col?.appendChild(row2);

    const row3 = document.createElement('div');
    row3.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const add = document.createElement('button');
    add.textContent = '＋ Add 5000 samples';
    add.style.cssText = 'background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:0.75em';
    add.addEventListener('click', () => addSamples(5000));
    row3.appendChild(add);
    const rst = document.createElement('button');
    rst.textContent = '重置样本';
    rst.style.cssText = 'background:#21262d;color:#f78166;border:1px solid #30363d;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:0.75em';
    rst.addEventListener('click', () => regenerate());
    row3.appendChild(rst);
    col?.appendChild(row3);
  };

  function normalPdf(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }

  p.draw = () => {
    p.background('#0d1117');
    const d = DISTS[distKey];
    const mu = d.mu, sigma = d.sigma;
    const sqrtn = Math.sqrt(n);

    const counts = new Float64Array(NB);
    let sMean = 0, s2 = 0, outside = 0;
    for (let r = 0; r < R; r++) {
      const Sn = cum[r * (maxN + 1) + n];
      const z = (Sn - n * mu) / (sigma * sqrtn);
      sMean += z; s2 += z * z;
      let idx = Math.floor((z - xMin) / binW);
      if (idx < 0 || idx >= NB) { outside++; idx = idx < 0 ? 0 : NB - 1; }
      counts[idx]++;
    }
    sMean /= R;
    const sStd = Math.sqrt(s2 / R - sMean * sMean);

    const plotX0 = 42, plotW = 448, baseY = 332, plotH = 300;
    let maxD = 0;
    for (let i = 0; i < NB; i++) {
      const dens = counts[i] / (R * binW);
      if (dens > maxD) maxD = dens;
    }
    const scaleY = (plotH - 8) / Math.max(maxD, normalPdf(0));

    p.stroke('#30363d'); p.strokeWeight(1);
    p.line(plotX0, baseY, plotX0 + plotW, baseY);
    for (let xv = -4; xv <= 4; xv += 1) {
      const px = p.map(xv, xMin, xMax, plotX0, plotX0 + plotW);
      p.line(px, baseY, px, baseY + 5);
      p.fill('#8b949e'); p.noStroke(); p.textSize(11); p.textAlign(p.CENTER, p.TOP);
      p.text(xv, px, baseY + 6);
    }
    p.textAlign(p.RIGHT, p.TOP);
    p.text('z = (Sₙ − nμ)/(σ√n)', plotX0 + plotW, 20);

    const barX = (i) => plotX0 + i * (plotW / NB);
    const barW = plotW / NB;
    p.noStroke();
    for (let i = 0; i < NB; i++) {
      const dens = counts[i] / (R * binW);
      const bh = dens * scaleY;
      p.fill('#58a6ff', 130);
      p.rect(barX(i) + 0.5, baseY - bh, barW - 1, bh);
    }

    p.stroke('#f78166'); p.strokeWeight(2); p.noFill();
    p.beginShape();
    for (let px = plotX0; px <= plotX0 + plotW; px += 1) {
      const xv = p.map(px, plotX0, plotX0 + plotW, xMin, xMax);
      p.vertex(px, baseY - normalPdf(xv) * scaleY);
    }
    p.endShape();

    p.noStroke(); p.fill('#f78166'); p.textSize(12); p.textAlign(p.RIGHT, p.BASELINE);
    p.text('N(0,1)', plotX0 + plotW, baseY - normalPdf(0) * scaleY - 4);

    p.textAlign(p.LEFT, p.TOP); p.textSize(13);
    p.fill('#8b949e');
    p.text('Histogram of (Sₙ − nμ)/(σ√n)   —   R = ' + R + ' replicas, n = ' + n, plotX0, baseY + 22);
    p.fill('#c9d1d9');
    p.text('empirical mean = ' + sMean.toFixed(4) + '   (theoretical 0)', plotX0, baseY + 40);
    p.text('empirical std  = ' + sStd.toFixed(4) + '   (theoretical 1)', plotX0, baseY + 58);
    p.fill('#8b949e');
    p.text('Sₙ: empirical mean ' + (sMean * sigma * sqrtn + n * mu).toFixed(2) +
      ' ≈ nμ = ' + (n * mu).toFixed(2) + '   |  std ' + (sStd * sigma * sqrtn).toFixed(2) +
      ' ≈ σ√n = ' + (sigma * sqrtn).toFixed(2), plotX0, baseY + 76);
    p.fill('#f78166');
    p.text('outside [−4,4]: ' + (100 * outside / R).toFixed(1) + '%  (as n grows, histogram → N(0,1))', plotX0, baseY + 94);
  };
};
new p5(sketch);
