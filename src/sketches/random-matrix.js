// Random Matrix Theory — Wigner semicircle & Marchenko–Pastur via Jacobi eigen
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let mode = 'wigner'; // wigner | mp
  let N = 120;
  let dist = 'gauss'; // gauss | sign | uniform
  let gamma = 0.25;
  let eig = [];

  // ---------- Jacobi eigenvalue solver (real symmetric) ----------
  function jacobi(A, n) {
    const a = A.map((row) => row.slice());
    const maxSweep = 60;
    for (let sweep = 0; sweep < maxSweep; sweep++) {
      let off = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
      if (off < 1e-24) break;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const apq = a[i][j];
          if (Math.abs(apq) < 1e-13) continue;
          const app = a[i][i];
          const aqq = a[j][j];
          const tau = (aqq - app) / (2 * apq);
          const t = Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
          const c = 1 / Math.sqrt(1 + t * t);
          const s = t * c;
          for (let k = 0; k < n; k++) {
            if (k !== i && k !== j) {
              const aik = a[k][i];
              const ajk = a[k][j];
              a[k][i] = a[i][k] = c * aik - s * ajk;
              a[k][j] = a[j][k] = s * aik + c * ajk;
            }
          }
          a[i][i] = app - t * apq;
          a[j][j] = aqq + t * apq;
          a[i][j] = a[j][i] = 0;
        }
      }
    }
    const out = [];
    for (let i = 0; i < n; i++) out.push(a[i][i]);
    return out.sort((x, y) => y - x);
  }
  const gauss = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(p.TWO_PI * v);
  };

  function genWigner() {
    const n = N;
    const A = Array.from({ length: n }, () => new Array(n).fill(0));
    const sd = Math.sqrt(1 / n);
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        let v;
        if (dist === 'gauss') v = gauss() * sd;
        else if (dist === 'sign') v = (Math.random() < 0.5 ? -1 : 1) * sd;
        else v = (Math.random() * 2 - 1) * Math.sqrt(3) * sd;
        A[i][j] = v;
        A[j][i] = v;
      }
    }
    eig = jacobi(A, n);
  }
  function genMP() {
    const p = Math.round(Math.min(90, 40 + 50 * gamma));
    const n = Math.round(p / gamma);
    const X = Array.from({ length: p }, () => new Array(n).fill(0));
    for (let i = 0; i < p; i++) for (let j = 0; j < n; j++) X[i][j] = gauss();
    const W = Array.from({ length: p }, () => new Array(p).fill(0));
    for (let i = 0; i < p; i++) {
      for (let j = i; j < p; j++) {
        let s = 0;
        for (let k = 0; k < n; k++) s += X[i][k] * X[j][k];
        s /= n;
        W[i][j] = s;
        W[j][i] = s;
      }
    }
    eig = jacobi(W, p);
  }
  function regenerate() {
    if (mode === 'wigner') genWigner();
    else genMP();
  }

  // ---------- helpers for curves ----------
  function histOf(vals, lo, hi, bins) {
    const h = new Array(bins).fill(0);
    for (const v of vals) {
      const b = Math.floor(((v - lo) / (hi - lo)) * bins);
      if (b >= 0 && b < bins) h[b]++;
    }
    return h;
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(760, p.windowWidth - 40), 580).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('⭕ Wigner（半圆）', () => { mode = 'wigner'; regenerate(); }, '#58a6ff'));
    ctrl.appendChild(mk('🧮 Marchenko–Pastur', () => { mode = 'mp'; regenerate(); }, '#f7c948'));
    ctrl.appendChild(mk('🎲 重新采样', regenerate, '#3fb950'));
    ctrl.appendChild(mk('高斯', () => { dist = 'gauss'; regenerate(); }, '#8b949e'));
    ctrl.appendChild(mk('±1', () => { dist = 'sign'; regenerate(); }, '#8b949e'));
    ctrl.appendChild(mk('均匀', () => { dist = 'uniform'; regenerate(); }, '#8b949e'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin:4px 2px';
    const mkSl = (lab, mn, mx, val, cb) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:0.74em;color:#8b949e';
      wrap.textContent = lab;
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.min = String(mn);
      sl.max = String(mx);
      sl.step = '1';
      sl.value = String(val);
      sl.style.cssText = 'width:150px;accent-color:#58a6ff;cursor:pointer';
      sl.addEventListener('change', () => {
        cb(parseInt(sl.value));
        regenerate();
      });
      wrap.appendChild(sl);
      return wrap;
    };
    const slN = mkSl('N（矩阵尺寸）', 20, 240, N, (v) => { N = v; });
    const slG = mkSl('γ=p/N（MP）', 0.05, 1.0, gamma * 100, (v) => { gamma = v / 100; });
    row.appendChild(slN);
    row.appendChild(slG);
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '直方图 = 真实特征值（Jacobi 求解）；橙线 = 理论谱密度。Wigner 模式换分布谱不变（普适性）；拖 N 看收敛。MP 模式 γ=p/N 滑杆改变支撑 [a₋,a₊]。滑块松手后重算。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    regenerate();
  };

  p.draw = () => {
    p.background('#0d1117');
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    if (!eig.length) return;
    const lo = mode === 'wigner' ? -2.5 : 0;
    const hi = mode === 'wigner' ? 2.5 : Math.max(0.1, Math.pow(1 + Math.sqrt(gamma), 2) * 1.15);
    const bins = 80;
    const h = histOf(eig, lo, hi, bins);
    const maxH = Math.max(...h, 1);
    const px0 = 70;
    const py0 = 40;
    const pw = p.width - px0 - 90;
    const ph = 360;
    const barW = pw / bins;
    for (let i = 0; i < bins; i++) {
      const bh = (h[i] / maxH) * (ph - 10);
      p.fill(mode === 'wigner' ? '#58a6ff' : '#f7c948');
      p.rect(px0 + i * barW, py0 + ph - bh, barW - 1, bh);
    }
    // axis
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(px0, py0 + ph, px0 + pw, py0 + ph);

    // theory curve (scaled to same max count)
    p.noFill();
    p.stroke('#f78166');
    p.strokeWeight(2.2);
    p.beginShape();
    const Nk = eig.length;
    for (let i = 0; i <= bins; i++) {
      const x = lo + (i / bins) * (hi - lo);
      let dens = 0;
      if (mode === 'wigner') {
        if (Math.abs(x) <= 2) dens = Math.sqrt(4 - x * x) / (2 * Math.PI);
      } else {
        const a = Math.pow(1 - Math.sqrt(gamma), 2);
        const b = Math.pow(1 + Math.sqrt(gamma), 2);
        if (x > a && x < b) dens = Math.sqrt((b - x) * (x - a)) / (2 * Math.PI * gamma * x);
      }
      const count = dens * ((hi - lo) / bins) * Nk;
      const yv = py0 + ph - (count / maxH) * (ph - 10);
      p.vertex(px0 + i * barW, yv);
    }
    p.endShape();

    // labels
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.text('−2', px0 + ((0 + 2.5) / 5) * pw - 4, py0 + ph + 12);
    p.text('2', px0 + ((2 + 2.5) / 5) * pw - 4, py0 + ph + 12);
    p.text('0', px0, py0 + ph + 12);

    if (mode === 'wigner') {
      const lmax = eig.length ? eig[0] : 0;
      let m2 = 0;
      let m4 = 0;
      for (const v of eig) {
        m2 += v * v;
        m4 += v * v * v * v;
      }
      m2 /= eig.length;
      m4 /= eig.length;
      p.fill('#c9d1d9');
      p.textSize(13);
      p.text('Wigner：N=' + N + '，谱经验矩 m₂=' + m2.toFixed(3) + '（理论 1）、m₄=' + m4.toFixed(2) + '（理论 2）', px0, py0 + ph + 36);
      p.fill('#3fb950');
      p.text('λ_max = ' + lmax.toFixed(3) + '（边缘 → 2，波动尺度 N^{−2/3}）', px0, py0 + ph + 58);
    } else {
      const pDim = Math.round(Math.min(90, 40 + 50 * gamma));
      const a = Math.pow(1 - Math.sqrt(gamma), 2);
      const b = Math.pow(1 + Math.sqrt(gamma), 2);
      p.fill('#c9d1d9');
      p.textSize(13);
      p.text('MP：γ=' + gamma.toFixed(2) + '（p=' + pDim + '），支撑 [' + a.toFixed(3) + ', ' + b.toFixed(3) + ']', px0, py0 + ph + 36);
      p.fill('#8b949e');
      p.text('高维统计：样本谱 ≠ 总体谱；尖峰信号在 θ=√γ 处相变（BBP）', px0, py0 + ph + 58);
    }
    p.fill('#484f58');
    p.textSize(11);
    p.text('橙线 = 半圆 / MP 理论密度（按直方图最大柱缩放）', px0, py0 + ph + 80);
  };
};

new p5(sketch);
