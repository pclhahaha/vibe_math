// Hyperbolic Geometry — Poincaré disk: geodesic triangle, angles < 180°, area = π − Σangles
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const cx0 = 250; // disk centre (x in model space of width ~ 0.84*canvas)
  let RAD = 210;
  let mode = 'tri'; // tri | parallel
  let pts = [
    { x: 0.02, y: -0.05 },
    { x: 0.68, y: 0.02 },
    { x: 0.34, y: 0.62 },
  ];
  let drag = -1;

  const toSX = (mx) => p.width / 2 + mx * RAD;
  const toSY = (my) => p.height / 2 - 10 + my * RAD;
  const fromSX = (px) => (px - p.width / 2) / RAD;
  const fromSY = (py) => (py - (p.height / 2 - 10)) / RAD;

  // ---------- geodesic arc from u to v (model coords, |.|<1) ----------
  function arc(u, v, steps = 46) {
    if (Math.hypot(u.x - v.x, u.y - v.y) < 1e-9) return [];
    const cross = u.x * v.y - u.y * v.x;
    // collinear with origin -> diameter
    if (Math.abs(cross) < 1e-7) {
      const out = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        out.push({ x: u.x + t * (v.x - u.x), y: u.y + t * (v.y - u.y) });
      }
      return out;
    }
    // centre m solves m·u=(1+|u|^2)/2, m·v=(1+|v|^2)/2
    const A = u.x;
    const B = u.y;
    const C = v.x;
    const D = v.y;
    const b1 = (1 + u.x * u.x + u.y * u.y) / 2;
    const b2 = (1 + v.x * v.x + v.y * v.y) / 2;
    const det = A * D - B * C;
    if (Math.abs(det) < 1e-9) return [];
    const mx = (b1 * D - B * b2) / det;
    const my = (A * b2 - b1 * C) / det;
    const R2 = mx * mx + my * my - 1;
    if (R2 < 1e-8) return [];
    const R = Math.sqrt(R2);
    const fp = Math.atan2(u.y - my, u.x - mx);
    const fq = Math.atan2(v.y - my, v.x - mx);
    // two arcs: CCW delta in [0,2pi), CW = delta-2pi
    let dCCW = (fq - fp + 2 * Math.PI) % (2 * Math.PI);
    const cand = [
      { d: dCCW, mid: fp + dCCW / 2 },
      { d: dCCW - 2 * Math.PI, mid: fp + (dCCW - 2 * Math.PI) / 2 },
    ];
    let chosen = cand[0];
    let best = 1e9;
    for (const c of cand) {
      const px = mx + R * Math.cos(c.mid);
      const py = my + R * Math.sin(c.mid);
      const inside = px * px + py * py - 1;
      if (Math.abs(inside) < best) {
        best = Math.abs(inside);
        chosen = c;
      }
    }
    const out = [];
    for (let i = 0; i <= steps; i++) {
      const a = fp + chosen.d * (i / steps);
      out.push({ x: mx + R * Math.cos(a), y: my + R * Math.sin(a) });
    }
    return out;
  }

  // boundary points of the geodesic whose circle has centre m
  function boundaryEnds(mx, my) {
    const norm = Math.hypot(mx, my);
    if (norm < 1.001) return null;
    const ux = mx / norm;
    const uy = my / norm;
    const h = Math.sqrt(norm * norm - 1) / norm;
    const perp = { x: -uy, y: ux };
    const mk = (sgn) => {
      const bx = ux + sgn * h * perp.x;
      const by = uy + sgn * h * perp.y;
      const n = Math.hypot(bx, by);
      return { x: bx / n, y: by / n };
    };
    return [mk(1), mk(-1)];
  }

  function arcToBoundary(p, b) {
    return arc(p, b, 60);
  }

  // interior angle at vertex a of triangle (a->b, a->c)
  function angleAt(a, b, c) {
    const ab = arc(a, b);
    const ac = arc(a, c);
    if (ab.length < 3 || ac.length < 3) return 0;
    const t1 = norm(sub(ab[2], ab[0]));
    const t2 = norm(sub(ac[2], ac[0]));
    const d = Math.max(-1, Math.min(1, t1.x * t2.x + t1.y * t2.y));
    return Math.acos(d);
  }
  const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
  const norm = (v) => {
    const l = Math.hypot(v.x, v.y) || 1e-9;
    return { x: v.x / l, y: v.y / l };
  };

  function drawArcPts(list, col, w) {
    if (list.length < 2) return;
    p.stroke(col);
    p.strokeWeight(w);
    p.noFill();
    p.beginShape();
    for (const pt of list) p.vertex(toSX(pt.x), toSY(pt.y));
    p.endShape();
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(560, p.windowWidth - 40), 500).parent('p5canvas');
    RAD = Math.min(210, p.height / 2 - 120);

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, m, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.76em;margin:2px';
      b.addEventListener('click', () => {
        mode = m;
      });
      return b;
    };
    ctrl.appendChild(mk('△ 三角形（可拖顶点）', 'tri', '#58a6ff'));
    ctrl.appendChild(mk('∥ 平行线演示', 'parallel', '#f78166'));
    ctrl.appendChild(
      mk('↺ 复位', 'tri', '#8b949e')
    );
    const resetBtn = ctrl.lastChild;
    resetBtn.addEventListener('click', () => {
      pts = [
        { x: 0.02, y: -0.05 },
        { x: 0.68, y: 0.02 },
        { x: 0.34, y: 0.62 },
      ];
      mode = 'tri';
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '拖三个顶点：蓝色圆弧是双曲"直线"（测地线）。圆盘保角 ⟹ 可直接量角。内角和恒 <180°；面积 = π−内角和（高斯–博内，曲率 −1）。把顶点往边界拖：三角形"瘦"向理想三角形。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mousePressed = () => {
    if (mode !== 'tri') return;
    for (let i = 0; i < 3; i++) {
      if (p.dist(p.mouseX, p.mouseY, toSX(pts[i].x), toSY(pts[i].y)) < 18) {
        drag = i;
        return;
      }
    }
  };
  p.mouseDragged = () => {
    if (drag < 0) return;
    let x = fromSX(p.mouseX);
    let y = fromSY(p.mouseY);
    const r = Math.hypot(x, y);
    if (r > 0.94) {
      x = (x / r) * 0.94;
      y = (y / r) * 0.94;
    }
    pts[drag] = { x, y };
  };
  p.mouseReleased = () => {
    drag = -1;
  };

  p.draw = () => {
    p.background('#0d1117');
    const col3 = ['#f78166', '#3fb950', '#f778ba'];

    // disk boundary
    p.noFill();
    p.stroke('#30363d');
    p.strokeWeight(2);
    p.circle(p.width / 2, p.height / 2 - 10, RAD * 2);

    if (mode === 'tri') {
      // faint geodesic grid
      p.stroke('#161b22');
      p.strokeWeight(0.6);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        drawArcPts(arc({ x: 0, y: 0 }, { x: 0.999 * Math.cos(a), y: 0.999 * Math.sin(a) }, 20), '#161b22', 1);
      }
      // sides
      for (let i = 0; i < 3; i++) {
        drawArcPts(arc(pts[i], pts[(i + 1) % 3]), '#58a6ff', 2.2);
      }
      // vertices + angles
      const ang = [
        angleAt(pts[0], pts[1], pts[2]),
        angleAt(pts[1], pts[2], pts[0]),
        angleAt(pts[2], pts[0], pts[1]),
      ];
      for (let i = 0; i < 3; i++) {
        const q = pts[i];
        p.noStroke();
        p.fill(col3[i]);
        p.circle(toSX(q.x), toSY(q.y), drag === i ? 22 : 16);
        p.fill('#0d1117');
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);
        p.text(String.fromCharCode(65 + i), toSX(q.x), toSY(q.y) + 1);
        p.textStyle(p.NORMAL);
      }
      const sumDeg = (ang[0] + ang[1] + ang[2]) * 180 / Math.PI;
      const area = Math.PI - (ang[0] + ang[1] + ang[2]);
      // readouts
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.fill('#c9d1d9');
      p.textSize(13);
      p.text(
        '内角和 = ' + sumDeg.toFixed(1) + '°  （< 180°）',
        20,
        p.height - 92
      );
      p.fill('#3fb950');
      p.text('面积 = π − 内角和 = ' + area.toFixed(3) + ' （≤ π ≈ 3.142）', 20, p.height - 68);
      p.fill('#8b949e');
      p.textSize(11.5);
      p.text('顶角：A ' + (ang[0] * 180 / Math.PI).toFixed(1) + '° · B ' + (ang[1] * 180 / Math.PI).toFixed(1) + '° · C ' + (ang[2] * 180 / Math.PI).toFixed(1) + '°', 20, p.height - 44);
    } else {
      // parallel demo: side BC + geodesics from A
      const A = pts[0];
      const B = pts[1];
      const C = pts[2];
      // draw triangle sides faint
      p.stroke('#1f2833');
      p.strokeWeight(1.4);
      drawArcPts(arc(B, C), '#c9d1d9', 2);
      drawArcPts(arc(A, B), '#c9d1d9', 1);
      drawArcPts(arc(A, C), '#c9d1d9', 1);
      // boundary ends of BC geodesic
      const side = arc(B, C);
      // find circle centre of BC from first & last sample? recompute via formula
      const mBC = circleCentre(B, C);
      const ends = mBC ? boundaryEnds(mBC.x, mBC.y) : null;
      if (ends) {
        // limit parallels from A to each end
        for (const b of ends) {
          drawArcPts(arcToBoundary(A, b), '#f78166', 1.8);
        }
        p.noStroke();
        p.fill('#f78166');
        p.circle(toSX(ends[0].x), toSY(ends[0].y), 6);
        p.circle(toSX(ends[1].x), toSY(ends[1].y), 6);
        p.textSize(11);
        p.textAlign(p.CENTER, p.TOP);
        p.fill('#8b949e');
        p.text('∞', toSX(ends[0].x), toSY(ends[0].y) + 6);
        p.text('∞', toSX(ends[1].x), toSY(ends[1].y) + 6);
      }
      p.noStroke();
      p.fill('#ffd33d');
      p.circle(toSX(A.x), toSY(A.y), 14);
      p.fill('#0d1117');
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('A', toSX(A.x), toSY(A.y) + 1);
      p.noStroke();
      p.fill('#8b949e');
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(13);
      p.text('灰色 = 直线 BC；橙色 = 过 A 的"极限平行线"', 20, p.height - 88);
      p.fill('#c9d1d9');
      p.textSize(12.5);
      p.text('它们之间的整片扇形（过 A 的测地线）都与 BC 不相交：', 20, p.height - 64);
      p.text('过直线外一点有无穷多条平行线（欧氏只有一条）。', 20, p.height - 44);
    }
  };

  function circleCentre(p, q) {
    const A = p.x;
    const B = p.y;
    const C = q.x;
    const D = q.y;
    const b1 = (1 + p.x * p.x + p.y * p.y) / 2;
    const b2 = (1 + q.x * q.x + q.y * q.y) / 2;
    const det = A * D - B * C;
    if (Math.abs(det) < 1e-9) return null;
    return { x: (b1 * D - B * b2) / det, y: (A * b2 - b1 * C) / det };
  }
};

new p5(sketch);
