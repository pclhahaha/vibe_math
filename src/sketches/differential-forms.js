// Differential Forms — line integrals along user-drawn paths: closed vs exact
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const W = 6.4; // world span
  const R = W / 2; // half span
  let field = 'exact'; // exact | vortex | shear
  let path = []; // world points
  let closed = false;

  // field: (P, Q) for omega = P dx + Q dy
  const fieldAt = (x, y) => {
    if (field === 'exact') return { P: x, Q: y }; // d( (x^2+y^2)/2 )
    if (field === 'vortex') {
      const r2 = x * x + y * y;
      return { P: -y / r2, Q: x / r2 }; // dtheta
    }
    return { P: y, Q: 0 }; // y dx
  };
  const fieldName = {
    exact: 'ω = x dx + y dy = d(½(x²+y²))  —— 恰当',
    vortex: 'ω = (x dy − y dx)/(x²+y²) = dθ  —— 闭而不恰当',
    shear: 'ω = y dx  —— 不闭（dω = −dx∧dy）',
  };
  const fieldColor = { exact: '#3fb950', vortex: '#f778ba', shear: '#ffd33d' };

  const sxp = (x) => p.map(x, -R, R, 46, p.width - 24);
  const syp = (y) => p.map(y, R, -R, 26, p.height - 40);
  const ixp = (px) => p.map(px, 46, p.width - 24, -R, R);
  const iyp = (py) => p.map(py, 26, p.height - 40, R, -R);

  // ---------- integration ----------
  function polyArea() {
    let a = 0;
    const n = closed ? path.length : Math.max(0, path.length - 1);
    for (let i = 0; i < n; i++) {
      const q = path[(i + 1) % path.length];
      a += path[i].x * q.y - q.x * path[i].y;
    }
    return a / 2;
  }
  function integrate() {
    let I = 0;
    const n = path.length;
    const count = closed ? n : n - 1;
    for (let i = 0; i < count; i++) {
      const p1 = path[i];
      const p2 = path[(i + 1) % n];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const N = 48;
      for (let s = 0; s < N; s++) {
        const t = (s + 0.5) / N;
        const x = p1.x + t * dx;
        const y = p1.y + t * dy;
        const f = fieldAt(x, y);
        I += (f.P * dx + f.Q * dy) / N;
      }
    }
    return I;
  }
  function winding() {
    let sum = 0;
    const n = path.length;
    for (let i = 0; i < n; i++) {
      const p1 = path[i];
      const p2 = path[(i + 1) % n];
      const a1 = Math.atan2(p1.y, p1.x);
      const a2 = Math.atan2(p2.y, p2.x);
      let d = a2 - a1;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      sum += d;
    }
    return sum / (2 * Math.PI);
  }

  // ---------- setup ----------
  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(580, p.windowWidth - 40), 480).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    Object.keys(fieldName).forEach((k) => {
      const b = document.createElement('button');
      b.textContent = { exact: '恰当场', vortex: '涡旋场 dθ', shear: '切变场 y dx' }[k];
      b.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.76em;margin:2px';
      b.addEventListener('click', () => {
        field = k;
        path = [];
        closed = false;
      });
      ctrl.appendChild(b);
    });
    const mkBtn = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.76em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mkBtn('⭕ 圆', () => loadPath(circlePts(1.9, 48)), '#f78166'));
    ctrl.appendChild(mkBtn('▣ 方块', () => loadPath(squarePts(2.1, true)), '#f78166'));
    ctrl.appendChild(mkBtn('🔺 三角', () => loadPath(trianglePts()), '#f78166'));
    ctrl.appendChild(mkBtn('✕ 清空', () => { path = []; closed = false; }, '#8b949e'));
    ctrl.appendChild(mkBtn('🔗 闭合', () => { if (path.length >= 3) closed = true; }, '#ffd33d'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '在画布上点击添加路径点（沿场画闭合路径），或直接点示例按钮。右下方实时显示 ∮ω：恰当场闭合积分 ≈ 0；dθ 闭合积分 = 2π×绕原点圈数；y dx 满足格林公式（= −面积）。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  function circlePts(r, n) {
    const a = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      a.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
    }
    closed = true;
    return a;
  }
  function squarePts(r, ccw) {
    const a = [];
    const s = ccw ? 1 : -1;
    a.push({ x: r * s, y: -r });
    a.push({ x: r * s, y: r });
    a.push({ x: -r * s, y: r });
    a.push({ x: -r * s, y: -r });
    closed = true;
    return a;
  }
  function trianglePts() {
    const a = [];
    for (let i = 0; i < 3; i++) {
      const t = (i / 3) * Math.PI * 2 - Math.PI / 2;
      a.push({ x: 2.1 * Math.cos(t), y: 2.1 * Math.sin(t) });
    }
    closed = true;
    return a;
  }
  function loadPath(a) {
    path = a;
  }

  p.mousePressed = () => {
    if (p.mouseX < 46 || p.mouseX > p.width - 24 || p.mouseY < 26 || p.mouseY > p.height - 40) return;
    let x = ixp(p.mouseX);
    let y = iyp(p.mouseY);
    // keep vortex safe
    if (field === 'vortex') {
      const r = Math.hypot(x, y);
      if (r < 0.15) {
        x = (x / (r || 1)) * 0.2;
        y = (y / (r || 1)) * 0.2;
      }
    }
    path.push({ x, y });
    closed = false;
  };

  // ---------- draw ----------
  p.draw = () => {
    p.background('#0d1117');
    const col = fieldColor[field];

    // grid + axes
    p.stroke('#1a1f2b');
    p.strokeWeight(0.5);
    for (let g = -3; g <= 3; g++) {
      p.line(sxp(g), syp(-R), sxp(g), syp(R));
      p.line(sxp(-R), syp(g), sxp(R), syp(g));
    }
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(sxp(-R), syp(0), sxp(R), syp(0));
    p.line(sxp(0), syp(-R), sxp(0), syp(R));

    // field arrows
    const step = 0.55;
    for (let gx = -2.8; gx <= 2.8; gx += step) {
      for (let gy = -2.8; gy <= 2.8; gy += step) {
        const f = fieldAt(gx, gy);
        const mag = Math.hypot(f.P, f.Q);
        let dxw = f.P;
        let dyw = f.Q;
        if (field === 'vortex') {
          if (mag < 1e-6) continue;
          dxw /= mag;
          dyw /= mag;
          dxw *= 13;
          dyw *= 13;
        } else {
          if (mag < 1e-4) continue;
          const L = Math.min(22, 7 + 4 * mag);
          dxw = (dxw / mag) * L;
          dyw = (dyw / mag) * L;
        }
        const bx = sxp(gx);
        const by = syp(gy);
        p.stroke(col);
        p.strokeWeight(1.5);
        p.line(bx, by, bx + dxw, by - dyw); // screen y is flipped
      }
    }

    // origin mark
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text('0', sxp(0) - 8, syp(0) + 4);

    // path
    p.noFill();
    if (path.length >= 2) {
      p.stroke('#c9d1d9');
      p.strokeWeight(2);
      p.beginShape();
      for (const pt of path) p.vertex(sxp(pt.x), syp(pt.y));
      if (closed) p.vertex(sxp(path[0].x), syp(path[0].y));
      p.endShape();
    }
    p.noStroke();
    for (const pt of path) {
      p.fill('#c9d1d9');
      p.circle(sxp(pt.x), syp(pt.y), 5);
    }
    if (path.length && !closed) {
      p.fill('#ffd33d');
      p.circle(sxp(path[path.length - 1].x), syp(path[path.length - 1].y), 8);
    }

    // readouts
    const I = path.length >= 2 ? integrate() : 0;
    p.fill('#c9d1d9');
    p.textSize(12.5);
    p.textAlign(p.LEFT, p.TOP);
    p.text(fieldName[field], 14, 6);

    const rx = 14;
    const ry = p.height - 118;
    p.fill('#8b949e');
    p.textSize(12);
    p.text('∮ω = ' + (path.length >= 2 && closed ? I.toFixed(4) : (path.length >= 2 ? '（未闭合）' : '画一条路径…')), rx, ry);
    if (closed && path.length >= 2) {
      if (field === 'exact') {
        p.fill('#3fb950');
        p.text('恰当形式：闭合积分 ≈ 0（路径无关）', rx, ry + 22);
      } else if (field === 'vortex') {
        const w = winding();
        p.fill('#f778ba');
        p.text('winding = ' + w.toFixed(2) + '，2π·w = ' + (2 * Math.PI * w).toFixed(3), rx, ry + 22);
        p.text('dω = 0 但 ω ≠ dα：闭合≠恰当！', rx, ry + 44);
      } else {
        const A = polyArea();
        p.fill('#ffd33d');
        p.text('∮y dx = ' + I.toFixed(3) + '  格林预测 −面积 = ' + (-A).toFixed(3), rx, ry + 22);
        p.text('d(y dx) = −dx∧dy ⟹ Stokes/Green 吻合', rx, ry + 44);
      }
    }
    p.fill('#484f58');
    p.textSize(10.5);
    p.text('左键点击加点 · 示例按钮自动闭合', rx, ry + 64);
  };
};

new p5(sketch);
