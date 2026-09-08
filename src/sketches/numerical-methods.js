import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const EQS = {
    logistic: { label: 'Logistic dx/dt = r·x(1−x/K)', T: 10 },
    decay: { label: 'Exponential decay dx/dt = −x', T: 6 },
    oscillator: { label: 'Oscillator x′ = y, y′ = −x', T: 10 }
  };
  let eq = 'logistic';
  let h = 0.25;
  let method = 'rk4';
  let hist = null;

  function dim() { return eq === 'oscillator' ? 2 : 1; }

  function deriv(t, x, out) {
    if (eq === 'logistic') { const r = 1, K = 10; out[0] = r * x[0] * (1 - x[0] / K); }
    else if (eq === 'decay') { out[0] = -x[0]; }
    else { out[0] = x[1]; out[1] = -x[0]; }
  }

  function exact(t, out) {
    if (eq === 'logistic') { const x0 = 0.5, K = 10, r = 1, e = Math.exp(r * t); out[0] = K * x0 * e / (K + x0 * (e - 1)); }
    else if (eq === 'decay') { out[0] = Math.exp(-t); }
    else { out[0] = Math.cos(t); out[1] = -Math.sin(t); }
  }

  function stepEuler(x, t, hh) {
    const k = new Array(dim()).fill(0);
    deriv(t, x, k);
    for (let i = 0; i < dim(); i++) x[i] += hh * k[i];
  }

  function stepMid(x, t, hh) {
    const d = dim(), k1 = new Array(d).fill(0), tmp = new Array(d);
    deriv(t, x, k1);
    for (let i = 0; i < d; i++) tmp[i] = x[i] + (hh / 2) * k1[i];
    const k2 = new Array(d).fill(0);
    deriv(t + hh / 2, tmp, k2);
    for (let i = 0; i < d; i++) x[i] += hh * k2[i];
  }

  function stepRK4(x, t, hh) {
    const d = dim(), k1 = new Array(d).fill(0), k2 = new Array(d).fill(0),
      k3 = new Array(d).fill(0), k4 = new Array(d).fill(0), tmp = new Array(d);
    deriv(t, x, k1);
    for (let i = 0; i < d; i++) tmp[i] = x[i] + (hh / 2) * k1[i];
    deriv(t + hh / 2, tmp, k2);
    for (let i = 0; i < d; i++) tmp[i] = x[i] + (hh / 2) * k2[i];
    deriv(t + hh / 2, tmp, k3);
    for (let i = 0; i < d; i++) tmp[i] = x[i] + hh * k3[i];
    deriv(t + hh, tmp, k4);
    for (let i = 0; i < d; i++) x[i] += (hh / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }

  function solve(hh) {
    const d = dim(), T = EQS[eq].T;
    const steps = Math.max(1, Math.round(T / hh));
    const x = new Array(d).fill(0);
    exact(0, x);
    const ts = [], xs = [], es = [];
    ts.push(0); xs.push(x[0]);
    const e = new Array(d).fill(0);
    exact(0, e); es.push(Math.abs(x[0] - e[0]));
    let maxErr = 0;
    for (let s = 1; s <= steps; s++) {
      const t = s * hh;
      if (method === 'euler') stepEuler(x, t - hh, hh);
      else if (method === 'midpoint') stepMid(x, t - hh, hh);
      else stepRK4(x, t - hh, hh);
      exact(t, e);
      const err = Math.abs(x[0] - e[0]);
      if (err > maxErr) maxErr = err;
      ts.push(t); xs.push(x[0]); es.push(err);
    }
    return { ts, xs, es, maxErr };
  }

  function recompute() { hist = solve(h); }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 420).parent('p5canvas');
    recompute();

    const col = document.querySelector('.sketch-col');

    const row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const lbl = document.createElement('span');
    lbl.textContent = 'Equation:';
    lbl.style.cssText = 'font-size:0.75em;color:#8b949e';
    row1.appendChild(lbl);
    const sel = document.createElement('select');
    Object.keys(EQS).forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = EQS[k].label;
      sel.appendChild(o);
    });
    sel.style.cssText = 'background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:2px 6px;font-size:0.75em';
    sel.addEventListener('change', () => { eq = sel.value; recompute(); });
    row1.appendChild(sel);
    col?.appendChild(row1);

    const row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const hl = document.createElement('span');
    hl.textContent = 'Step size h:';
    hl.style.cssText = 'font-size:0.75em;color:#8b949e';
    row2.appendChild(hl);
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0.01'; sl.max = '0.5'; sl.step = '0.01'; sl.value = '0.25';
    sl.style.cssText = 'width:160px;accent-color:#58a6ff';
    const hval = document.createElement('span');
    hval.style.cssText = 'font-size:0.75em;color:#58a6ff;min-width:36px';
    hval.textContent = '0.25';
    sl.addEventListener('input', () => { h = parseFloat(sl.value); hval.textContent = h.toFixed(2); recompute(); });
    row2.appendChild(sl);
    row2.appendChild(hval);
    col?.appendChild(row2);

    const row3 = document.createElement('div');
    row3.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:4px 0';
    const methods = [
      ['euler', 'Euler', '#58a6ff'],
      ['midpoint', 'Midpoint', '#7ee787'],
      ['rk4', 'RK4', '#f78166']
    ];
    methods.forEach(([key, name, colr]) => {
      const b = document.createElement('button');
      b.textContent = name;
      b.dataset.m = key;
      b.style.cssText = 'background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:0.75em';
      b.addEventListener('click', () => {
        method = key;
        methods.forEach(([k2]) => {
          const bb = col?.querySelector('button[data-m="' + k2 + '"]');
          if (bb) bb.style.color = '#c9d1d9';
        });
        b.style.color = colr;
        recompute();
      });
      row3.appendChild(b);
    });
    const rst = document.createElement('button');
    rst.textContent = '重置';
    rst.style.cssText = 'background:#21262d;color:#f78166;border:1px solid #30363d;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:0.75em;margin-left:8px';
    rst.addEventListener('click', () => recompute());
    row3.appendChild(rst);
    col?.appendChild(row3);
  };

  p.draw = () => {
    p.background('#0d1117');
    if (!hist) return;
    const T = EQS[eq].T;

    let yMin = Infinity, yMax = -Infinity;
    const ef = new Array(dim()).fill(0);
    for (let t = 0; t <= T; t += 0.01) { exact(t, ef); if (ef[0] < yMin) yMin = ef[0]; if (ef[0] > yMax) yMax = ef[0]; }
    for (const v of hist.xs) { if (v < yMin) yMin = v; if (v > yMax) yMax = v; }
    const pad = (yMax - yMin) * 0.12 || 0.5;
    yMin -= pad; yMax += pad;

    const ax = 55, ay = 15, aw = 440, ah = 235;
    p.stroke('#30363d'); p.strokeWeight(1); p.noFill();
    p.rect(ax, ay, aw, ah);
    p.stroke('#30363d'); p.strokeWeight(0.5);
    p.line(ax, ay + ah / 2, ax + aw, ay + ah / 2);

    const X = (t) => p.map(t, 0, T, ax + 6, ax + aw - 6);
    const Y = (v) => p.map(v, yMin, yMax, ay + ah - 8, ay + 8);

    p.stroke('#f78166'); p.strokeWeight(2); p.noFill();
    p.beginShape();
    for (let t = 0; t <= T; t += T / 400) { exact(t, ef); p.vertex(X(t), Y(ef[0])); }
    p.endShape();

    const colr = method === 'euler' ? '#58a6ff' : method === 'midpoint' ? '#7ee787' : '#f78166';
    p.stroke(colr); p.strokeWeight(1.5); p.noFill();
    p.beginShape();
    for (let i = 0; i < hist.ts.length; i++) p.vertex(X(hist.ts[i]), Y(hist.xs[i]));
    p.endShape();
    p.noStroke(); p.fill(colr);
    for (let i = 0; i < hist.ts.length; i += Math.max(1, Math.floor(hist.ts.length / 40))) {
      p.circle(X(hist.ts[i]), Y(hist.xs[i]), 3.5);
    }

    p.noStroke(); p.textAlign(p.LEFT, p.TOP); p.textSize(12);
    p.fill('#f78166'); p.text('exact', ax + 6, ay + 2);
    p.fill(colr); p.text(method.toUpperCase(), ax + 6, ay + 16);
    p.fill('#8b949e');
    p.text('t ∈ [0, ' + T + ']   h = ' + h.toFixed(3) + '   steps = ' + hist.ts.length, ax + 6, ay + 32);

    const gx = 55, gy = 275, gw = 250, gh = 130;
    p.stroke('#30363d'); p.strokeWeight(1); p.noFill();
    p.rect(gx, gy, gw, gh);
    p.noStroke(); p.fill('#8b949e'); p.textSize(11); p.textAlign(p.LEFT, p.TOP);
    p.text('error vs h  (log-log)', gx + 4, gy + 2);

    const hvals = [];
    let hh = h;
    for (let i = 0; i < 5; i++) { hvals.push(hh); hh /= 2; }
    const errs = hvals.map(hh => { const m = method; const t0 = method; const saved = method; method = t0; const r = solve(hh); method = saved; return Math.max(r.maxErr, 1e-12); });

    let xmin = Math.log(Math.min(...hvals)), xmax = Math.log(Math.max(...hvals));
    let ymin = Math.log(Math.min(...errs)), ymax = Math.log(Math.max(...errs));
    if (ymin === ymax) { ymin -= 1; ymax += 1; }
    const LX = (v) => p.map(v, xmin, xmax, gx + 6, gx + gw - 6);
    const LY = (v) => p.map(v, ymin, ymax, gy + gh - 10, gy + 16);

    p.stroke(colr); p.strokeWeight(2); p.noFill();
    p.beginShape();
    for (let i = 0; i < hvals.length; i++) p.vertex(LX(Math.log(hvals[i])), LY(Math.log(errs[i])));
    p.endShape();
    p.noStroke(); p.fill(colr);
    for (let i = 0; i < hvals.length; i++) p.circle(LX(Math.log(hvals[i])), LY(Math.log(errs[i])), 4);

    let sx = 0, sy = 0, sxx = 0, sxy = 0, cnt = 0;
    for (let i = 0; i < hvals.length; i++) {
      const lx = Math.log(hvals[i]), ly = Math.log(errs[i]);
      sx += lx; sy += ly; sxx += lx * lx; sxy += lx * ly; cnt++;
    }
    const slope = (cnt * sxy - sx * sy) / (cnt * sxx - sx * sx);
    p.noStroke(); p.fill('#c9d1d9'); p.textSize(12);
    p.text('observed order ≈ ' + slope.toFixed(2), gx + 4, gy + gh - 24);

    const tx = 320, ty = 285;
    p.textAlign(p.LEFT, p.TOP); p.textSize(12);
    p.fill('#8b949e');
    p.text('accumulated error = max |x_exact − x_num|', tx, ty);
    p.fill('#f78166');
    p.text('max error = ' + hist.maxErr.toExponential(2), tx, ty + 20);
    p.fill(colr);
    p.text('at t = ' + T.toFixed(1) + ': |exact−num| = ' + hist.es[hist.es.length - 1].toExponential(2), tx, ty + 40);
    p.fill('#8b949e');
    p.text('Euler O(h) · Midpoint O(h²) · RK4 O(h⁴)', tx, ty + 62);
    p.text('coarser h → larger accumulated error', tx, ty + 80);
  };
};
new p5(sketch);
