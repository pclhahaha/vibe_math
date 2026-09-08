// High-Dimensional Geometry — three laws: cube shell, ball shell, orthogonal random vectors
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let d = 100;
  const EPS = 0.01;

  // empirical results (recomputed on d change)
  let cubeShell = null; // fraction in 1% shell
  let ballHist = [];
  let ballGT = null; // fraction with r > 1 - 0.01
  let cosHist = [];
  let cosStd = null;
  let distRel = null; // relative fluctuation sqrt(2)/ (2*sqrt(d)) approx for sums of 2 chi-square-ish
  let maxD = 600;

  function recompute() {
    // ---- cube shell: sample points in [0,1]^d, check min coord vs eps ----
    if (d <= maxD) {
      const N = 4000;
      let shell = 0;
      for (let s = 0; s < N; s++) {
        let inside = true;
        for (let i = 0; i < d; i++) {
          const u = Math.random();
          if (u < EPS || u > 1 - EPS) { inside = false; break; }
        }
        if (!inside) shell++;
      }
      cubeShell = shell / N;
    } else cubeShell = null;

    // ---- ball shell: r = u^{1/d} ----
    if (d <= maxD) {
      const M = 20000;
      ballHist = new Array(60).fill(0);
      let gt = 0;
      for (let s = 0; s < M; s++) {
        const r = Math.pow(Math.random(), 1 / d);
        if (r > 1 - 0.01) gt++;
        const b = Math.floor(r * 60);
        ballHist[Math.min(59, b)]++;
      }
      ballGT = gt / M;
    } else ballHist = [];

    // ---- angle between two random gaussian vectors ----
    if (d <= maxD) {
      const P = 5000;
      const angles = [];
      let sum = 0;
      for (let s = 0; s < P; s++) {
        let g1 = 0;
        let g2 = 0;
        let dot = 0;
        for (let i = 0; i < d; i++) {
          const a = gauss();
          const b = gauss();
          g1 += a * a;
          g2 += b * b;
          dot += a * b;
        }
        const c = dot / (Math.sqrt(g1 * g2) + 1e-12);
        const th = Math.acos(Math.max(-1, Math.min(1, c)));
        angles.push(th);
        sum += th;
      }
      const mean = sum / P;
      let varr = 0;
      cosHist = new Array(50).fill(0);
      for (const th of angles) {
        varr += (th - mean) * (th - mean);
        const b = Math.floor((th / Math.PI) * 50);
        cosHist[Math.min(49, b)]++;
      }
      cosStd = Math.sqrt(varr / P);
    } else cosHist = [];
    distRel = Math.sqrt(2) / (2 * Math.sqrt(d)); // ~ relative fluctuation of distances
  }

  let z2 = null;
  function gauss() {
    if (z2 !== null) {
      const v = z2;
      z2 = null;
      return v;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const m = Math.sqrt(-2 * Math.log(u));
    z2 = m * Math.sin(p.TWO_PI * v);
    return m * Math.cos(p.TWO_PI * v);
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(600, p.windowWidth - 40), 600).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    [2, 10, 100, 300, 600, 2000, 10 ** 4].forEach((dd) => {
      const b = document.createElement('button');
      b.textContent = 'd=' + dd;
      b.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:3px 9px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', () => {
        setD(dd);
      });
      ctrl.appendChild(b);
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.75em';
    lab.textContent = '维度 d（滑杆 ≤600 有蒙特卡洛，更大按钮看解析值）：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '2';
    sl.max = String(maxD);
    sl.step = '1';
    sl.value = String(d);
    sl.style.cssText = 'width:200px;accent-color:#58a6ff;cursor:pointer';
    sl.addEventListener('input', () => { d = parseInt(sl.value); });
    sl.addEventListener('change', () => { recompute(); });
    row.appendChild(sl);
    const val = document.createElement('span');
    val.style.cssText = 'color:#ffd33d;font-size:0.78em;width:50px';
    row.appendChild(val);
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '三条定律随 d 增大：① 立方体 1% 壳内的点占比 → 1−(1−2ε)^d；② 球内随机点半径直方图贴向 1（体积贴壳）；③ 两随机向量夹角 → 90°，标准差 ~1/√d。蓝条 = 蒙特卡洛；黄色数字 = 解析预测。';
    document.querySelector('.sketch-col')?.appendChild(hint);
    setD(100);
  };

  function setD(dd) {
    d = dd;
    recompute();
    const v = document.querySelector('input[type=range]');
    if (v) v.value = String(Math.min(dd, maxD));
    const sp = document.querySelector('.sketch-col span');
    // update value span (last span in row) - simpler: find by css later
    document.querySelectorAll('.sketch-col span').forEach((el) => {
      if (el.style.width === '50px') el.textContent = 'd=' + d;
    });
  }

  function drawHist(hist, lo, hi, x, y, w, h, col, maxOverride) {
    const bins = hist.length;
    const maxc = maxOverride || Math.max(...hist, 1);
    p.noStroke();
    for (let i = 0; i < bins; i++) {
      const bh = (hist[i] / maxc) * (h - 8);
      p.fill(col);
      p.rect(x + (w / bins) * i, y + h - bh, Math.max(1, w / bins - 1), bh);
    }
  }

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);
    const W = p.width;

    // ---------- panel 1: cube shell ----------
    const y1 = 16;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('① 立方体 [0,1]^d：点在 1% 表面壳内的占比', 14, y1);
    const cubeAnalytic = 1 - Math.pow(1 - 2 * EPS, d);
    // bar
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(30, y1 + 26, W - 40, y1 + 26);
    p.stroke('#58a6ff');
    p.strokeWeight(14);
    p.line(30, y1 + 26, 30 + (W - 70) * Math.min(1, cubeAnalytic), y1 + 26);
    p.strokeWeight(1);
    p.noStroke();
    p.fill('#ffd33d');
    p.textSize(12);
    p.text('解析：' + (cubeAnalytic * 100).toFixed(2) + '%', W - 230, y1 + 40);
    p.fill(cubeShell !== null ? '#3fb950' : '#484f58');
    p.text('蒙特卡洛：' + (cubeShell !== null ? (cubeShell * 100).toFixed(2) + '%' : '—（d 太大）'), 30, y1 + 40);
    p.fill('#8b949e');
    p.textSize(11);
    p.text('公式：1−(1−2ε)^d ≈ 1−e^{−2εd}', 30, y1 + 60);

    // ---------- panel 2: ball shell ----------
    const y2 = y1 + 96;
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('② 单位球：随机点半径分布（贴向 1 ⟹ 体积在壳）', 14, y2);
    if (ballHist.length) {
      drawHist(ballHist, 0, 1, 40, y2 + 20, W - 90, 60, '#58a6ff');
    }
    p.fill('#ffd33d');
    p.textSize(12);
    p.text('P(r>0.99)：解析 ' + ((1 - Math.pow(0.99, d)) * 100).toFixed(2) + '%', W - 250, y2 + 86);
    p.fill(ballGT !== null ? '#3fb950' : '#484f58');
    p.text('实测 ' + (ballGT !== null ? (ballGT * 100).toFixed(2) + '%' : '—'), W - 250, y2 + 104);

    // ---------- panel 3: angle ----------
    const y3 = y2 + 128;
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('③ 两个随机向量（高斯方向）的夹角分布 → 90°', 14, y3);
    if (cosHist.length) {
      drawHist(cosHist, 0, Math.PI, 40, y3 + 20, W - 90, 60, '#f778ba');
    }
    p.fill('#8b949e');
    p.textSize(11);
    p.text('0°', 40, y3 + 86);
    p.text('90°', W / 2 - 12, y3 + 86);
    p.text('180°', W - 70, y3 + 86);
    const thStd = (Math.PI / 2) / Math.sqrt(d);
    p.fill('#ffd33d');
    p.textSize(12);
    p.text('理论 σ ≈ π/(2√d) = ' + thStd.toFixed(3), W - 250, y3 + 104);
    p.fill(cosStd !== null ? '#3fb950' : '#484f58');
    p.text('实测 σ = ' + (cosStd !== null ? cosStd.toFixed(3) : '—'), W - 250, y3 + 122);

    // ---------- bottom: distance concentration ----------
    const y4 = y3 + 150;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('④ 距离集中：‖x−y‖² ≈ 2d ± O(√d) ⟹ 最近邻相对波动 ~ ' + distRel.toFixed(4), 14, y4);
    p.fill('#f78166');
    p.textSize(12);
    p.text('d = ' + d + '：两两距离几乎相同，最近邻 ≈ 最远邻（维数灾难）', 14, y4 + 22);
  };
};

new p5(sketch);
