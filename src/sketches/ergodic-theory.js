// Ergodic Theory — circle rotation vs doubling map: equidistribution, mixing
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let mode = 'rotate'; // rotate | double | mixing
  let alpha = 0.618033988749895; // golden ratio conjugate
  let N = 2000; // steps
  const MAXN = 20000;

  // ---------- rotation helpers ----------
  function orbit() {
    const o = [];
    let x = 0;
    for (let i = 0; i < Math.min(N, 600); i++) {
      x = (x + alpha) % 1;
      o.push(x);
    }
    return o;
  }
  function histOf(seq, bins) {
    const h = new Array(bins).fill(0);
    for (const x of seq) {
      const b = Math.floor(x * bins);
      h[Math.min(bins - 1, b)]++;
    }
    return h;
  }
  function freqIn(seq, lo, hi) {
    let c = 0;
    for (const x of seq) if (x >= lo && x < hi) c++;
    return seq.length ? c / seq.length : 0;
  }

  // mixing correlation via MC: c(n)= E[1_A(x)1_A(T^n x)] - mu(A)^2
  let corrRot = [];
  let corrDbl = [];
  function computeCorrelations() {
    const A = 0.2;
    const mA = A;
    const M = 30000;
    const X0 = [];
    for (let i = 0; i < M; i++) X0.push(Math.random());
    const est = (cur) => {
      let s = 0;
      for (let i = 0; i < M; i++) if (X0[i] < A && cur[i] < A) s++;
      return s / M - mA * mA;
    };
    const curve = (stepFn) => {
      const c = [];
      let cur = X0.slice();
      c.push(est(cur));
      for (let n = 1; n <= 120; n++) {
        for (let i = 0; i < M; i++) cur[i] = stepFn(cur[i]);
        c.push(est(cur));
      }
      return c;
    };
    corrDbl = curve((x) => (2 * x) % 1);
    corrRot = curve((x) => (x + alpha) % 1);
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(580, p.windowWidth - 40), 500).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mkBtn = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.75em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mkBtn('🔄 圆周旋转', () => (mode = 'rotate'), '#58a6ff'));
    ctrl.appendChild(mkBtn('×2 倍角映射', () => (mode = 'double'), '#f78166'));
    ctrl.appendChild(mkBtn('搅拌 混合相关', () => { mode = 'mixing'; computeCorrelations(); }, '#3fb950'));
    ctrl.appendChild(document.createTextNode(' α：'));
    [
      ['黄金比 0.618', 0.618033988749895],
      ['√2−1 0.414', 0.4142135623730951],
      ['1/3（有理）', 1 / 3],
      ['1/2（有理）', 0.5],
    ].forEach(([lab, v]) => {
      ctrl.appendChild(mkBtn(lab, () => { alpha = v; }, '#8b949e'));
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.75em';
    lab.textContent = '步数 N：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '10';
    sl.max = String(MAXN);
    sl.step = '10';
    sl.value = String(N);
    sl.style.cssText = 'width:200px;accent-color:#58a6ff;cursor:pointer';
    sl.addEventListener('input', () => {
      N = parseInt(sl.value);
    });
    row.appendChild(sl);
    const val = document.createElement('span');
    val.id = 'nv2';
    val.style.cssText = 'color:#58a6ff;font-size:0.75em;width:60px';
    val.textContent = String(N);
    row.appendChild(val);
    sl.addEventListener('input', () => {
      val.textContent = String(N);
    });
    document.querySelector('.sketch-col')?.appendChild(row);
  };

  p.draw = () => {
    p.background('#0d1117');

    if (mode === 'rotate') {
      drawRotation();
    } else if (mode === 'double') {
      drawDouble();
    } else {
      drawMixing();
    }
  };

  // =============== rotate ===============
  function drawRotation() {
    const seq = orbit();
    const cx = 175;
    const cy = 240;
    const R = 155;

    p.noFill();
    p.stroke('#30363d');
    p.strokeWeight(2);
    p.circle(cx, cy, R * 2);
    // orbit dots (fade)
    const m = seq.length;
    for (let i = 0; i < m; i++) {
      const a = seq[i] * p.TWO_PI;
      const t = i / m;
      p.noStroke();
      p.fill(88, 166, 255, 40 + 120 * t);
      p.circle(cx + R * p.cos(a), cy + R * p.sin(a), 3);
    }
    // current point
    const xa = seq.length ? seq[seq.length - 1] : 0;
    const ca = xa * p.TWO_PI;
    p.fill('#f78166');
    p.noStroke();
    p.circle(cx + R * p.cos(ca), cy + R * p.sin(ca), 12);
    p.fill('#0d1117');
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('x', cx + R * p.cos(ca), cy + R * p.sin(ca) + 1);

    // histogram panel
    drawHist(seq);

    // readouts
    const f = freqIn(seq, 0, 0.5);
    const irr = !Number.isInteger(alpha * 1e12) && Math.abs(alpha - Math.round(alpha)) > 1e-9 && Math.abs(alpha * 3 - Math.round(alpha * 3)) > 1e-9;
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text(`圆周旋转 R_α，α = ${alpha.toFixed(6)}`, 18, 8);
    p.fill('#8b949e');
    p.textSize(12);
    p.text(`频率（x<0.5）= ${f.toFixed(4)}   （区间长 0.5 → 等分布时趋近）`, 18, 26);
    const periodic = Math.abs(alpha - 1 / 2) < 1e-9 || Math.abs(alpha - 1 / 3) < 1e-9;
    p.fill(periodic ? '#f85149' : '#3fb950');
    p.text(periodic ? '有理旋转：轨道是周期点，直方图只亮几根柱子' : '无理旋转：轨道稠密且等分布（Birkhoff/Weyl）', 18, p.height - 96);
  }

  function drawHist(seq) {
    const hx0 = 370;
    const hb = 40;
    const hH = 300;
    const bins = 40;
    const h = histOf(seq, bins);
    const maxc = Math.max(...h, 1);
    p.noStroke();
    p.fill('#2d333b');
    p.rect(hx0 - 8, 60 - 8, hb * bins + 16, hH + 30);
    for (let i = 0; i < bins; i++) {
      const bh = (h[i] / Math.max(1, seq.length)) * hH * (1 / (1 / bins));
      // scale: freq per bin ~ (count/N); bar proportional to count/max
      const bh2 = (h[i] / maxc) * (hH - 20);
      p.fill(88, 166, 255, 230);
      p.rect(hx0 + i * hb, 60 + (hH - 20) - bh2, hb - 2, bh2);
    }
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('直方图：落点分布（N=' + N + '）', hx0 - 4, 22);
    p.text('0', hx0, 60 + hH - 4);
    p.text('0.5', hx0 + bins / 2 * hb, 60 + hH - 4);
    p.text('1', hx0 + bins * hb - 14, 60 + hH - 4);
    // expectation line for uniform 1/bins
    const uni = seq.length / bins;
    p.stroke('#3fb950');
    p.strokeWeight(1.2);
    p.setLineDash([4, 4]);
    const uy = 60 + (hH - 20) - (uni / maxc) * (hH - 20);
    p.line(hx0, uy, hx0 + bins * hb, uy);
    p.setLineDash([]);
    p.noStroke();
    p.fill('#3fb950');
    p.textSize(10.5);
    p.text('均匀', hx0 + bins * hb + 4, uy - 4);
  }

  // =============== double ===============
  function drawDouble() {
    // orbit on [0,1]
    const nShow = Math.min(N, 200);
    const pts = [];
    let x = 0.13; // 0.0010000101...
    for (let i = 0; i < nShow; i++) {
      x = (2 * x) % 1;
      pts.push(x);
    }
    drawHist(pts);

    // left: orbit on the unit segment
    const x0 = 60;
    const w = 300;
    const y = 130;
    p.noFill();
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(x0, y, x0 + w, y);
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('x₀ = 0.0010000101…（二进制），轨道 x_{n+1} = {2x_n}', x0, y - 30);
    for (let i = 0; i < pts.length; i++) {
      const t = i / pts.length;
      p.noStroke();
      p.fill(247, 120, 186, 50 + 160 * t);
      p.circle(x0 + pts[i] * w, y, 4);
    }
    const last = pts.length ? pts[pts.length - 1] : 0;
    p.fill('#f78166');
    p.circle(x0 + last * w, y, 11);
    p.fill('#0d1117');
    p.textSize(10);
    p.text('x', x0 + last * w, y + 1);

    // sensitivity: two nearby seeds
    const eps = Math.pow(2, -14);
    let a = 0.13;
    let b = (0.13 + eps) % 1;
    p.textSize(12);
    p.fill('#8b949e');
    p.text('误差放大演示：x 与 x+2⁻¹⁴ 的距离（每步 ×2）', x0, y + 40);
    let vals = [];
    for (let i = 0; i < 16; i++) {
      a = (2 * a) % 1;
      b = (2 * b) % 1;
      let d = Math.abs(a - b);
      if (d > 0.5) d = 1 - d;
      vals.push(d);
    }
    p.textSize(10.5);
    for (let i = 0; i < vals.length; i++) {
      p.fill(vals[i] > 0.4 ? '#f85149' : '#8b949e');
      p.text('步' + (i + 1) + ': ' + vals[i].toFixed(3), x0 + (i % 8) * 76, y + 58 + Math.floor(i / 8) * 18);
    }
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('倍角映射 = 二进制左移：每步丢 1 bit，熵 = ln 2', x0, y + 96);
  }

  // =============== mixing ===============
  function drawMixing() {
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('相关性 |μ(A ∩ T⁻ⁿB) − μ(A)μ(B)|，A=B=[0,0.2]', 20, 10);
    const plotX = 60;
    const plotY = 60;
    const plotW = 470;
    const plotH = 280;
    p.stroke('#2d333b');
    p.strokeWeight(1);
    p.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);
    p.line(plotX, plotY, plotX, plotY + plotH);
    // axes labels
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.text('n', plotX + plotW + 4, plotY + plotH);
    p.text('0', plotX - 16, plotY + plotH + 3);

    const maxV = 0.2;
    const toY = (v) => plotY + plotH - (Math.min(maxV, v) / maxV) * plotH;
    // doubling: decay
    p.stroke('#3fb950');
    p.strokeWeight(2);
    for (let n = 1; n < corrDbl.length; n++) {
      const x1 = plotX + ((n - 1) / (corrDbl.length - 1)) * plotW;
      const x2 = plotX + (n / (corrDbl.length - 1)) * plotW;
      p.line(x1, toY(Math.abs(corrDbl[n - 1])), x2, toY(Math.abs(corrDbl[n])));
    }
    // rotation: oscillation
    p.stroke('#58a6ff');
    p.strokeWeight(1.6);
    for (let n = 1; n < corrRot.length; n++) {
      const x1 = plotX + ((n - 1) / (corrRot.length - 1)) * plotW;
      const x2 = plotX + (n / (corrRot.length - 1)) * plotW;
      p.line(x1, toY(Math.abs(corrRot[n - 1])), x2, toY(Math.abs(corrRot[n])));
    }
    // legend
    p.noStroke();
    p.fill('#3fb950');
    p.textSize(12);
    p.text('倍角映射（混合 ⟹ 衰减到 0）', plotX, plotY + plotH + 24);
    p.fill('#58a6ff');
    p.text('无理旋转（遍历但不混合 ⟹ 不衰减）', plotX, plotY + plotH + 44);
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('旋转把 A 整块搬走再搬回来，相关性"赖着不走"；揉面式映射才真正搅拌。', plotX, plotY + plotH + 70);
  }

  // correlation calculator (placeholder replaced)
};

new p5(sketch);
