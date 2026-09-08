// Representation Theory — S3 acting on the triangle: matrices, traces, character table
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const rad = (d) => (d * Math.PI) / 180;
  const rot = (th) => [Math.cos(th), -Math.sin(th), Math.sin(th), Math.cos(th)];
  const S = [1, 0, 0, -1]; // reflection across x-axis
  const mul = (A, B) => [
    A[0] * B[0] + A[1] * B[2],
    A[0] * B[1] + A[1] * B[3],
    A[2] * B[0] + A[3] * B[2],
    A[2] * B[1] + A[3] * B[3],
  ];
  const R = rot(rad(120));
  const R2 = rot(rad(240));

  // triangle vertex positions
  const V = [1, 0, Math.cos(rad(120)), Math.sin(rad(120)), Math.cos(rad(240)), Math.sin(rad(240))];
  const v = (i) => ({ x: V[2 * i], y: V[2 * i + 1] });

  // six elements of S3 in the faithful 2-dim (standard) representation
  const ELEMS = [
    { label: 'e', mat: [1, 0, 0, 1], cls: 0 },
    { label: 'r (120°)', mat: R, cls: 1 },
    { label: 'r² (240°)', mat: R2, cls: 1 },
    { label: 's (翻面)', mat: S, cls: 2 },
    { label: 'sr', mat: mul(S, R), cls: 2 },
    { label: 'sr²', mat: mul(S, R2), cls: 2 },
  ];
  ELEMS.forEach((el) => {
    // permutation: where each vertex goes
    const perm = [];
    for (let i = 0; i < 3; i++) {
      const img = { x: el.mat[0] * v(i).x + el.mat[1] * v(i).y, y: el.mat[2] * v(i).x + el.mat[3] * v(i).y };
      let best = 0;
      let bd = 1e9;
      for (let j = 0; j < 3; j++) {
        const d = Math.hypot(img.x - v(j).x, img.y - v(j).y);
        if (d < bd) {
          bd = d;
          best = j;
        }
      }
      perm.push(best);
    }
    el.perm = perm;
    el.chi = el.mat[0] + el.mat[3];
  });

  let sel = ELEMS[0];

  const CLASS_NAMES = ['单位元', '旋转', '反射'];
  const CLASS_LABEL = ['e', 'r, r²', 's, sr, sr²'];
  const CLASS_SIZE = [1, 2, 3];
  const TABLE = [
    ['χ₀ 平凡', 1, 1, 1],
    ['χ₁ 符号', 1, 1, -1],
    ['χ₂ 标准', 2, -1, 0],
  ];

  const fmt = (x) => {
    if (Math.abs(x) < 1e-9) return '0';
    if (Math.abs(x - 1) < 1e-9) return '1';
    if (Math.abs(x + 1) < 1e-9) return '−1';
    if (Math.abs(Math.abs(x) - 0.5) < 1e-9) return x > 0 ? '1/2' : '−1/2';
    return x.toFixed(2);
  };

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(560, p.windowWidth - 40), 520).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    ELEMS.forEach((el) => {
      const b = document.createElement('button');
      b.textContent = el.label;
      b.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:2px';
      b.addEventListener('click', () => {
        sel = el;
      });
      ctrl.appendChild(b);
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '点击元素，观察标准表示（2×2 矩阵）如何搬动三角形的三个顶点。灰方块 = 顶点原位的"槽"；同色圆点 = 顶点 1、2、3 移动后的位置。注意：同一共轭类的元素 trace（特征标）相同，与坐标无关。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');

    // ---------- left: triangle ----------
    const cx = 165;
    const cy = 170;
    const s = 130; // scale
    const P = (i) => ({ x: cx + v(i).x * s, y: cy + v(i).y * s });

    // slot squares (original positions)
    p.noStroke();
    for (let i = 0; i < 3; i++) {
      const q = P(i);
      p.fill('#484f58');
      p.rect(q.x - 8, q.y - 8, 16, 16, 3);
      p.fill('#0d1117');
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('槽' + (i + 1), q.x, q.y + 0.5);
    }

    // ghost triangle outline
    p.stroke('#30363d');
    p.strokeWeight(1.2);
    p.noFill();
    p.triangle(P(0).x, P(0).y, P(1).x, P(1).y, P(2).x, P(2).y);

    // transformed triangle (fill translucent)
    const TP = sel.perm.map((j) => P(j));
    p.fill(88, 166, 255, 26);
    p.stroke('#58a6ff');
    p.strokeWeight(1.6);
    p.triangle(TP[0].x, TP[0].y, TP[1].x, TP[1].y, TP[2].x, TP[2].y);

    // moving labeled vertices (color per original label)
    const cols = ['#f78166', '#3fb950', '#f778ba'];
    for (let i = 0; i < 3; i++) {
      const q = TP[i];
      p.noStroke();
      p.fill(cols[i]);
      p.circle(q.x, q.y, 20);
      p.fill('#0d1117');
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.text(String(i + 1), q.x, q.y + 0.5);
      p.textStyle(p.NORMAL);
    }

    // reflection axis (for class 2) / rotation hint (for class 1)
    if (sel.cls === 2) {
      // axis = fixed line of the reflection: solve (M - I)v = 0
      const M = sel.mat;
      // direction (dx, dy) with (M-I)·(dx,dy)=0 -> from row 0
      let ang;
      const a = M[0] - 1;
      const b = M[1];
      if (Math.abs(a) > 1e-9) ang = Math.atan2(-a, b); // b*dy = -a*dx -> dy/dx = -a/b
      else ang = Math.PI / 2;
      p.stroke(255, 255, 255, 60);
      p.strokeWeight(1);
      p.setLineDash([5, 5]);
      p.line(cx - s * 1.6 * Math.cos(ang), cy - s * 1.6 * Math.sin(ang), cx + s * 1.6 * Math.cos(ang), cy + s * 1.6 * Math.sin(ang));
      p.setLineDash([]);
    }

    // ---------- right: matrix + trace ----------
    const mx0 = 330;
    const my0 = 60;
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text('元素 g = ' + sel.label, mx0, my0 - 22);
    p.text('标准表示 ρ₂(g)（2×2）', mx0, my0 + 82);

    const cell = 34;
    p.stroke('#58a6ff');
    p.strokeWeight(1.2);
    p.line(mx0 - 14, my0 - 6, mx0 - 14, my0 + 2 * cell + 6);
    p.line(mx0 + 2 * cell + 14, my0 - 6, mx0 + 2 * cell + 14, my0 + 2 * cell + 6);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const val = sel.mat[2 * r + c];
        p.noStroke();
        p.fill('#c9d1d9');
        p.textSize(15);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(fmt(val), mx0 + c * cell + cell / 2, my0 + r * cell + cell / 2 + 1);
      }
    }

    // permutation
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text('顶点置换：', mx0, my0 + 2 * cell + 30);
    p.fill('#ffd33d');
    p.text('(1 2 3) → (' + sel.perm.map((x) => x + 1).join(' ') + ')', mx0, my0 + 2 * cell + 48);

    // class
    p.fill('#8b949e');
    p.text('共轭类：' + CLASS_NAMES[sel.cls] + '（大小 ' + CLASS_SIZE[sel.cls] + '）', mx0, my0 + 2 * cell + 74);

    // trace (character)
    p.fill('#8b949e');
    p.text('特征标 χ₂(g) = tr ρ₂(g) =', mx0, my0 + 2 * cell + 102);
    const chiColor = sel.cls === 0 ? '#3fb950' : sel.cls === 1 ? '#f78166' : '#58a6ff';
    p.fill(chiColor);
    p.textSize(34);
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.TOP);
    p.text(String(sel.chi), mx0, my0 + 2 * cell + 132);
    p.textStyle(p.NORMAL);

    // ---------- bottom: character table ----------
    const ty = 380;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('S₃ 特征标表（行 = 不可约表示，列 = 共轭类）', 20, ty + 2);

    // column x positions
    const colsX = [150, 270, 400];
    const sizes = [1, 2, 3];
    const clsLabels = ['e', '(123)', '(12)'];
    const clsNames = ['单位元', '3-轮换', '对换'];

    // highlight current class column
    p.noStroke();
    p.fill(88, 166, 255, 26);
    p.rect(colsX[sel.cls] - 38, ty + 20, 110, 92, 6);

    // header
    p.fill('#8b949e');
    p.textSize(12);
    p.text('类（大小）', 20, ty + 34);
    for (let c = 0; c < 3; c++) {
      p.text(clsLabels[c] + '  ×' + sizes[c], colsX[c] - 24, ty + 34);
    }
    p.stroke('#30363d');
    p.strokeWeight(0.6);
    p.line(20, ty + 48, 500, ty + 48);

    // rows
    for (let r = 0; r < 3; r++) {
      const y = ty + 58 + r * 26;
      p.noStroke();
      p.fill(r === 2 ? '#58a6ff' : '#c9d1d9');
      p.textSize(12);
      p.text(TABLE[r][0], 20, y);
      for (let c = 0; c < 3; c++) {
        p.text(String(TABLE[r][c + 1]), colsX[c] - 10, y);
      }
    }

    // footnote
    p.fill('#8b949e');
    p.textSize(11);
    p.text('核对：1²+1²+2² = 6 = |S₃|；行正交 Σ_c |C_c|χ_i(c)χ_j(c) = 0（i≠j）', 20, ty + 132);
  };
};

new p5(sketch);
