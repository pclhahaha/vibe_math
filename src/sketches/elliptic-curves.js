// Elliptic Curves — drag a,b; chord-and-tangent group law on y^2 = x^3 + ax + b
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let a = 0;
  let b = 1;
  let P = null; // {x, y}
  let Q = null;
  let target = 'P'; // which point the next click sets
  const XMIN = -4.2;
  const XMAX = 4.2;
  const YMAX = 6.2;
  const EPS = 1e-6;

  // screen mapping
  const sx = (x) => p.map(x, XMIN, XMAX, 52, p.width - 30);
  const sy = (y) => p.map(y, YMAX, -YMAX, 26, p.height - 34);
  const invX = (px) => p.map(px, 52, p.width - 30, XMIN, XMAX);
  const invY = (py) => p.map(py, 26, p.height - 34, YMAX, -YMAX);

  const f = (x) => x * x * x + a * x + b;
  const disc = () => 4 * a * a * a + 27 * b * b; // sign of Delta = -16 * this
  const singular = () => Math.abs(disc()) < 0.02;

  // ---------- group law ----------
  function groupSum() {
    if (!P || !Q) return null;
    // vertical pair -> O
    if (Math.abs(P.x - Q.x) < EPS && Math.abs(P.y + Q.y) < EPS) return { o: true };
    let m, x3, yR;
    const same = Math.abs(P.x - Q.x) < EPS && Math.abs(P.y - Q.y) < EPS;
    if (same) {
      if (Math.abs(P.y) < EPS) return { o: true }; // vertical tangent -> O
      m = (3 * P.x * P.x + a) / (2 * P.y);
      x3 = m * m - 2 * P.x;
      yR = m * (P.x - x3) - P.y;
    } else {
      m = (Q.y - P.y) / (Q.x - P.x);
      x3 = m * m - P.x - Q.x;
      yR = m * (P.x - x3) - P.y;
    }
    if (Math.abs(x3) > 30) return { o: true };
    return { o: false, x: x3, y: -yR, m, x3 };
  }

  function pickOnCurve(mx, my) {
    const xc = invX(mx);
    const yc = invY(my);
    let best = null;
    let bd = 1e9;
    for (let x = Math.max(XMIN, xc - 0.9); x <= Math.min(XMAX, xc + 0.9); x += 0.012) {
      const ff = f(x);
      if (ff < -1e-4) continue;
      const r = Math.sqrt(Math.max(0, ff));
      for (const yy of [r, -r]) {
        const d = p.dist(mx, my, sx(x), sy(yy));
        if (d < bd) {
          bd = d;
          best = { x, y: yy };
        }
      }
    }
    return bd < (p.__touch ? 44 : 26) ? best : null;
  }

  // ---------- setup ----------
  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(580, p.windowWidth - 40), 470).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    [
      [0, 1, 'y²=x³+1'],
      [-1, 0, 'y²=x³−x'],
      [1, 0, 'y²=x³+x'],
      [0, -1, 'y²=x³−1'],
    ].forEach(([aa, bb, lab]) => {
      const btn = document.createElement('button');
      btn.textContent = lab;
      btn.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:3px 9px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      btn.addEventListener('click', () => {
        setAB(aa, bb);
        P = Q = null;
      });
      ctrl.appendChild(btn);
    });
    ctrl.appendChild(document.createTextNode('  '));
    const pk = document.createElement('button');
    pk.textContent = '▸ 放置 P';
    pk.style.cssText = 'background:#161b22;color:#f78166;border:1px solid #f78166;padding:3px 9px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
    const qk = document.createElement('button');
    qk.textContent = '▸ 放置 Q';
    qk.style.cssText = 'background:#161b22;color:#58a6ff;border:1px solid #58a6ff;padding:3px 9px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
    const setTarget = (t) => {
      target = t;
      pk.style.borderColor = target === 'P' ? '#f78166' : '#30363d';
      qk.style.borderColor = target === 'Q' ? '#58a6ff' : '#30363d';
    };
    pk.addEventListener('click', () => setTarget('P'));
    qk.addEventListener('click', () => setTarget('Q'));
    ctrl.appendChild(pk);
    ctrl.appendChild(qk);
    const clr = document.createElement('button');
    clr.textContent = '✕ 清除点';
    clr.style.cssText = 'background:#161b22;color:#8b949e;border:1px solid #30363d;padding:3px 9px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
    clr.addEventListener('click', () => {
      P = Q = null;
    });
    ctrl.appendChild(clr);
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    // sliders
    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:4px 2px';
    [['a', 'a', -3, 3], ['b', 'b', -3, 3]].forEach(([id, lab, mn, mx]) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:0.78em;color:#8b949e';
      wrap.textContent = lab + '=';
      const val = document.createElement('span');
      val.id = 'v' + id;
      val.style.cssText = 'color:#58a6ff;width:34px';
      wrap.appendChild(val);
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.id = 's' + id;
      sl.min = String(mn);
      sl.max = String(mx);
      sl.step = '0.05';
      sl.value = String(id === 'a' ? a : b);
      sl.style.cssText = 'width:130px;accent-color:#58a6ff;cursor:pointer';
      sl.addEventListener('input', () => {
        const v = parseFloat(sl.value);
        if (id === 'a') a = v;
        else b = v;
        val.textContent = v.toFixed(2);
        // points may leave the curve after the change -> clear for safety
        P = Q = null;
      });
      wrap.appendChild(sl);
      slRow.appendChild(wrap);
    });
    document.querySelector('.sketch-col')?.appendChild(slRow);
    setAB(a, b);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '先点"放置 P / Q"再在曲线上点击取点；程序自动完成弦切法：连线找第三交点 R，翻折得 P+Q=−R。试试把 P、Q 放同一处（倍点）或关于 x 轴对称的位置（和为 O）。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  function setAB(na, nb) {
    a = na;
    b = nb;
    const sa = document.getElementById('sa');
    const sb = document.getElementById('sb');
    if (sa) sa.value = String(na);
    if (sb) sb.value = String(nb);
    const va = document.getElementById('va');
    const vb = document.getElementById('vb');
    if (va) va.textContent = na.toFixed(2);
    if (vb) vb.textContent = nb.toFixed(2);
  }

  p.mousePressed = () => {
    const pt = pickOnCurve(p.mouseX, p.mouseY);
    if (!pt) return;
    if (target === 'P') P = pt;
    else Q = pt;
  };

  // ---------- drawing ----------
  p.draw = () => {
    p.background('#0d1117');

    // grid + axes
    p.stroke('#1a1f2b');
    p.strokeWeight(0.5);
    for (let gx = Math.ceil(XMIN); gx <= XMAX; gx++) {
      p.line(sx(gx), sy(-YMAX), sx(gx), sy(YMAX));
    }
    for (let gy = -5; gy <= 5; gy++) {
      p.line(sx(XMIN), sy(gy), sx(XMAX), sy(gy));
    }
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.line(sx(XMIN), sy(0), sx(XMAX), sy(0));
    p.line(sx(0), sy(YMAX), sx(0), sy(-YMAX));
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    for (let gx = -4; gx <= 4; gx++) {
      if (gx === 0) continue;
      p.text(String(gx), sx(gx) + 2, sy(0) + 4);
    }

    // the curve y^2 = f(x)
    const curveCol = singular() ? '#8b949e' : '#58a6ff';
    const step = (XMAX - XMIN) / 640;
    for (const sign of [1, -1]) {
      p.stroke(curveCol);
      p.strokeWeight(singular() ? 2.2 : 2.6);
      let pen = false;
      let lx = 0;
      let ly = 0;
      for (let x = XMIN; x <= XMAX; x += step) {
        const ff = f(x);
        const ok = ff >= 0 && ff <= YMAX * YMAX && Math.abs(x) <= 4.1;
        if (ok) {
          const y = sign * Math.sqrt(ff);
          if (pen) p.line(sx(lx), sy(ly), sx(x), sy(y));
          pen = true;
          lx = x;
          ly = y;
        } else {
          pen = false;
        }
      }
    }

    // chord / tangent line
    const sum = groupSum();
    if (P && Q && sum && !sum.o) {
      // line y = m x + c through P (and Q or tangent)
      const m = sum.m;
      const c = P.y - m * P.x;
      p.stroke('#ffd33d');
      p.strokeWeight(1.4);
      p.setLineDash([6, 4]);
      const ax1 = Math.max(XMIN, Math.min(XMAX, P.x - 3.2));
      const ax2 = Math.max(XMIN, Math.min(XMAX, P.x + 3.2));
      const y1 = m * ax1 + c;
      const y2 = m * ax2 + c;
      if (y1 > -YMAX && y1 < YMAX && y2 > -YMAX && y2 < YMAX) {
        p.line(sx(ax1), sy(y1), sx(ax2), sy(y2));
      }
      p.setLineDash([]);
    }

    // markers
    const dot = (pt, col, r, label, lcol) => {
      if (!pt) return;
      p.noStroke();
      p.fill(col);
      p.circle(sx(pt.x), sy(pt.y), r * 2);
      p.fill(lcol || '#0d1117');
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(label, sx(pt.x), sy(pt.y) + 0.6);
    };
    dot(P, '#f78166', 9, 'P', '#0d1117');
    dot(Q, '#58a6ff', 9, 'Q', '#0d1117');
    if (sum && !sum.o) {
      dot({ x: sum.x3, y: sum.m * (sum.x3 - P.x) + (P.y - sum.m * P.x) }, '#484f58', 6, 'R');
      dot({ x: sum.x, y: sum.y }, '#3fb950', 11, 'P+Q', '#0d1117');
    }

    // readouts
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`E: y² = x³ + ${a.toFixed(2)}x + ${b.toFixed(2)}`, 14, 8);
    p.fill('#8b949e');
    p.textSize(11);
    p.text(`Δ ∝ 4a³+27b² = ${disc().toFixed(2)}  ${singular() ? '— 奇异！群律失效' : '— 光滑（亏格 1）'}`, 14, 26);
    if (P) p.text(`P = (${P.x.toFixed(3)}, ${P.y.toFixed(3)})`, 14, p.height - 44);
    if (Q) p.text(`Q = (${Q.x.toFixed(3)}, ${Q.y.toFixed(3)})`, 14, p.height - 26);
    if (P && Q) {
      p.fill('#3fb950');
      p.textSize(13);
      if (sum && sum.o) p.text('P + Q = O（无穷远点）', 330, p.height - 30);
      else if (sum)
        p.text(`P + Q = (${sum.x.toFixed(3)}, ${sum.y.toFixed(3)})`, 330, p.height - 30);
    } else if (P) {
      p.fill('#8b949e');
      p.textSize(12);
      p.text('再放一个 Q，或把 P、Q 放同一点做倍点', 330, p.height - 30);
    }
    p.textAlign(p.RIGHT, p.TOP);
    p.fill('#484f58');
    p.textSize(11);
    p.text('O（无穷远点）↑', p.width - 16, 30);
    p.textAlign(p.LEFT, p.TOP);
  };
};

new p5(sketch);
