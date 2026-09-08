// Geometric Measure Theory — fractal dimension: H^s estimate flips at dim
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let kind = 'cantor';
  let level = 4;
  const X0 = 70;
  const Y0 = 300;

  function dimInfo() {
    if (kind === 'cantor') return { m: 2, unit: 3, name: '康托尔三分集', dim: Math.log(2) / Math.log(3) };
    if (kind === 'koch') return { m: 4, unit: 3, name: 'Koch 曲线', dim: Math.log(4) / Math.log(3) };
    return { m: 8, unit: 3, name: 'Sierpiński 地毯', dim: Math.log(8) / Math.log(3) };
  }

  // ---- drawing routines ----
  function drawCantor(x, y, len, k) {
    if (k === 0) {
      p.rect(x, y, len, 3);
      return;
    }
    const third = len / 3;
    drawCantor(x, y, third, k - 1);
    drawCantor(x + 2 * third, y, third, k - 1);
  }
  function drawKoch(pts, k) {
    if (k === 0) {
      p.noFill();
      p.stroke('#58a6ff');
      p.strokeWeight(2);
      p.beginShape();
      for (const pt of pts) p.vertex(pt.x, pt.y);
      p.endShape();
      return;
    }
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = (b.x - a.x) / 3;
      const dy = (b.y - a.y) / 3;
      const p1 = { x: a.x + dx, y: a.y + dy };
      const p3 = { x: a.x + 2 * dx, y: a.y + 2 * dy };
      // apex of equilateral triangle pointing outward (up for horizontal)
      const mx = (p1.x + p3.x) / 2;
      const my = (p1.y + p3.y) / 2;
      const nx = -(p3.y - p1.y) * (Math.sqrt(3) / 6);
      const ny = (p3.x - p1.x) * (Math.sqrt(3) / 6);
      const p2 = { x: mx + nx, y: my + ny };
      out.push(a, p1, p2, p3);
    }
    out.push(pts[pts.length - 1]);
    drawKoch(out, k - 1);
  }
  function drawCarpet(x, y, s, k) {
    if (k === 0) {
      p.rect(x, y, s, s);
      return;
    }
    const t = s / 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === 1 && j === 1) continue;
        drawCarpet(x + i * t, y + j * t, t, k - 1);
      }
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(820, p.windowWidth - 40), 600).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('康托尔三分集', () => { kind = 'cantor'; }, '#58a6ff'));
    ctrl.appendChild(mk('Koch 曲线', () => { kind = 'koch'; }, '#58a6ff'));
    ctrl.appendChild(mk('Sierpiński 地毯', () => { kind = 'carpet'; }, '#58a6ff'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.75em';
    lab.textContent = '递归层数 k：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0';
    sl.max = '6';
    sl.step = '1';
    sl.value = String(level);
    sl.style.cssText = 'width:200px;accent-color:#f7c948;cursor:pointer';
    sl.addEventListener('input', () => {
      level = parseInt(sl.value);
    });
    row.appendChild(sl);
    const val = document.createElement('span');
    val.style.cssText = 'color:#f7c948;font-size:0.8em;width:40px';
    row.appendChild(val);
    sl.addEventListener('input', () => {
      val.textContent = String(level);
    });
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '左上：递归造形到第 k 层（m^k 个拷贝、尺度 unit^{-k}）。下方：第 k 层覆盖估计 Ĥ(s) = (m^k)·ε^s 的 log10——s<dim 时随 k 爆炸、s>dim 时塌缩，临界线 = Hausdorff 维数（Frostman/覆盖双方向）。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);
    const info = dimInfo();
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(16);
    p.text(info.name + '：m=' + info.m + '，尺度=' + info.unit + ' ⟹ dim = ln' + info.m + '/ln' + info.unit + ' ≈ ' + info.dim.toFixed(4), 40, 16);

    p.fill('#8b949e');
    p.textSize(13);
    p.text('第 ' + level + ' 层：拷贝数 N=' + Math.pow(info.m, level) + '，ε = ' + info.unit + '^−' + level, 40, 44);

    // draw fractal
    p.noStroke();
    p.fill('#58a6ff');
    if (kind === 'cantor') {
      drawCantor(60, 90, 560, level);
    } else if (kind === 'koch') {
      const a = { x: 80, y: 150 };
      const b = { x: 680, y: 150 };
      drawKoch([a, b], level);
    } else {
      drawCarpet(90, 90, 243, Math.min(level, 3));
    }

    // plot H^s estimate: log10 of (m^k)*(unit^{-k})^s
    const px0 = 70;
    const py0 = 400;
    const pw = p.width - 140;
    const ph = 150;
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(px0, py0, pw, ph);
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('log₁₀ Ĥ(s) = k·(ln m − s·ln unit)/ln10（第 ' + level + ' 层估计）', px0, py0 - 18);
    p.text('s →', px0 + pw - 18, py0 + ph + 2);
    p.text('0', px0 - 10, py0 + ph + 2);

    const smin = 0;
    const smax = 2.6;
    // zero crossing at dim: log estimate = k(ln m - s ln unit)
    const maxAbs = 30;
    p.stroke('#3fb950');
    p.strokeWeight(2);
    for (let i = 0; i <= pw; i += 1) {
      const s = smin + (i / pw) * (smax - smin);
      const v = level * (Math.log(info.m) - s * Math.log(info.unit)) / Math.LN10;
      const vv = Math.max(-maxAbs, Math.min(maxAbs, v));
      const yv = py0 + ph / 2 - (vv / maxAbs) * (ph / 2 - 6);
      const x = px0 + i;
      if (i > 0) p.line(x - 1, prevY, x, yv);
      prevY = yv;
    }
    // dimension line
    const xd = px0 + ((info.dim - smin) / (smax - smin)) * pw;
    p.stroke('#f7c948');
    p.strokeWeight(1.6);
    p.setLineDash([5, 4]);
    p.line(xd, py0, xd, py0 + ph);
    p.setLineDash([]);
    p.noStroke();
    p.fill('#f7c948');
    p.textSize(12);
    p.text('dim≈' + info.dim.toFixed(3), xd + 4, py0 + ph + 6);
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('s < dim：Ĥ→∞（覆盖太细）        s > dim：Ĥ→0（H^s=0）', px0, py0 + ph - 14);

    // footer
    p.fill('#8b949e');
    p.textSize(12);
    p.text('Hausdorff：维数是"测量成本"的临界指数；Frostman 引理给下界（放质量分布）。', 40, 560);
    p.fill('#484f58');
    p.textSize(11.5);
    p.text('注：盒维 ≥ Hausdorff 维（ℚ∩[0,1]：盒 1、Hausdorff 0）；面积 0 ≠ 维数低（Besicovitch 集）。', 40, 580);
  };
  let prevY = 0;
};

new p5(sketch);
