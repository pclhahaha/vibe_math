// Surface Topology — fundamental polygons & circle covers
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const SURF = [
    { key: 'sphere', name: '球面 S²', word: [], g: 0, orientable: true, chi: 2 },
    { key: 'torus', name: '环面 T²', word: ['a', 'b', 'a⁻¹', 'b⁻¹'], g: 1, orientable: true, chi: 0 },
    { key: 'dbl', name: '双环面 T²#T²', word: ['a', 'b', 'a⁻¹', 'b⁻¹', 'c', 'd', 'c⁻¹', 'd⁻¹'], g: 2, orientable: true, chi: -2 },
    { key: 'rp2', name: '射影平面 ℝP²', word: ['a', 'a'], k: 1, orientable: false, chi: 1 },
    { key: 'klein', name: '克莱因瓶', word: ['a', 'a', 'b', 'b'], k: 2, orientable: false, chi: 0 },
  ];
  let sel = 1; // torus
  let coverN = 3;

  const COLORS = ['#58a6ff', '#f78166', '#3fb950', '#f778ba'];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(800, p.windowWidth - 40), 640).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    SURF.forEach((s, i) => {
      const b = document.createElement('button');
      b.textContent = s.name;
      b.style.cssText = 'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', () => {
        sel = i;
      });
      ctrl.appendChild(b);
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '上：标准多边形（同色边 = 同一条边，箭头方向 = 粘合方向）。右表：粘合后 V′=1、E′=边对数，χ=V′−E′+1 = 2−2g（定向）/ 2−k（非定向）。下：S¹ 的 n 重覆盖 z↦zⁿ 与 π₁(S¹)=ℤ 的子群 nℤ。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    const row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.74em';
    lab.textContent = '覆盖层数 n：';
    row2.appendChild(lab);
    const sl2 = document.createElement('input');
    sl2.type = 'range';
    sl2.min = '1';
    sl2.max = '8';
    sl2.step = '1';
    sl2.value = String(coverN);
    sl2.style.cssText = 'width:200px;accent-color:#3fb950;cursor:pointer';
    sl2.addEventListener('input', () => {
      coverN = parseInt(sl2.value);
    });
    row2.appendChild(sl2);
    const val = document.createElement('span');
    val.style.cssText = 'color:#3fb950;font-size:0.78em;width:40px';
    val.textContent = String(coverN);
    row2.appendChild(val);
    sl2.addEventListener('input', () => {
      val.textContent = String(coverN);
    });
    document.querySelector('.sketch-col')?.appendChild(row2);
  };

  p.draw = () => {
    p.background('#0d1117');
    const S = SURF[sel];
    // ---------- polygon ----------
    const cx0 = 250;
    const cy0 = 200;
    const R = 140;
    const nE = Math.max(2, S.word.length);
    // draw filled polygon
    p.noStroke();
    p.fill(22, 27, 34);
    p.beginShape();
    for (let i = 0; i < nE; i++) {
      const a = (i / nE) * p.TWO_PI - Math.PI / 2;
      p.vertex(cx0 + R * p.cos(a), cy0 + R * p.sin(a));
    }
    p.endShape(p.CLOSE);
    // edges with colors + arrows
    const colOf = {};
    let colorIdx = 0;
    for (const w of S.word) {
      const letter = w.replace('⁻¹', '');
      if (!(letter in colOf)) colOf[letter] = COLORS[colorIdx++ % COLORS.length];
    }
    p.textAlign(p.CENTER, p.CENTER);
    for (let i = 0; i < nE; i++) {
      const a0 = (i / nE) * p.TWO_PI - Math.PI / 2;
      const a1 = ((i + 1) / nE) * p.TWO_PI - Math.PI / 2;
      const x0 = cx0 + R * p.cos(a0);
      const y0 = cy0 + R * p.sin(a0);
      const x1 = cx0 + R * p.cos(a1);
      const y1 = cy0 + R * p.sin(a1);
      const w = S.word.length ? S.word[i] : '';
      const letter = w.replace('⁻¹', '');
      p.stroke(colOf[letter] || '#8b949e');
      p.strokeWeight(3);
      p.line(x0, y0, x1, y1);
      // arrowhead along or against traversal
      const midx = (x0 + x1) / 2;
      const midy = (y0 + y1) / 2;
      const rev = w.endsWith('⁻¹');
      const am = rev ? -1 : 1;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      const ux = (dx / len) * am;
      const uy = (dy / len) * am;
      const bx = midx - ux * 12;
      const by = midy - uy * 12;
      p.noStroke();
      p.fill(colOf[letter] || '#8b949e');
      p.triangle(bx, by, bx - uy * 6 + ux * 6, by + ux * 6 + uy * 6, bx + uy * 6 + ux * 6, by - ux * 6 + uy * 6);
      // label outward
      const nx = -ux;
      const ny = -uy;
      p.fill('#c9d1d9');
      p.textSize(13);
      p.text(S.word.length ? S.word[i] : '', cx0 + (R + 16) * p.cos((a0 + a1) / 2), cy0 + (R + 16) * p.sin((a0 + a1) / 2));
    }
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(15);
    p.textAlign(p.LEFT, p.TOP);
    p.text(S.name + '（标准多边形）', 40, 20);

    // ---------- right table ----------
    const px = 560;
    const py = 40;
    p.fill('#c9d1d9');
    p.textSize(14);
    p.text('粘合后的胞腔', px, py);
    const lines = [
      ['可定向', S.orientable ? '✓' : '✗'],
      ['顶点 V′', S.word.length ? '1' : '（球：无粘边）'],
      ['边 E′', String(Math.max(0, S.word.length / 2))],
      ['面 F', '1'],
      ['χ = V′−E′+F', S.orientable ? String(2 - 2 * S.g) : String(2 - S.k)],
      ['χ 核对', String(S.chi)],
      ['亏格 g / k', S.orientable ? 'g=' + S.g : 'k=' + S.k],
    ];
    lines.forEach(([k, v], i) => {
      p.fill('#8b949e');
      p.textSize(12.5);
      p.text(k, px, py + 24 + i * 24);
      p.fill('#ffd33d');
      p.text(v, px + 170, py + 24 + i * 24);
    });
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('分类：同胚 ⟺ 可定向性 + χ 相同', px, py + 24 + lines.length * 24 + 8);

    // ---------- circle cover ----------
    const cyy = 430;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(14);
    p.text('圆覆盖 S¹ → S¹：z ↦ z^' + coverN + '（n 重）', 40, cyy);
    p.textSize(11.5);
    p.fill('#8b949e');
    p.text('π₁(S¹) = ℤ：子群 ' + coverN + 'ℤ ↔ 这 ' + coverN + ' 重覆盖（Galois 对应）', 40, cyy + 22);
    // base circle
    const bcr = 70;
    const bx = 180;
    p.noFill();
    p.stroke('#484f58');
    p.strokeWeight(1.6);
    p.circle(bx, cyy + 70, bcr * 2);
    // lifts: n points around with connecting same target? draw n small circles above on cover circle radius different? Represent covering as n layers vertical: draw vertical segment with n dots mapping to single base point.
    p.stroke('#30363d');
    for (let k = 0; k < coverN; k++) {
      p.fill('#3fb950');
      p.circle(bx, cyy + 70 - 26 - k * 16, 7);
      p.stroke('#30363d');
      p.strokeWeight(1);
      p.line(bx, cyy + 70 - 26 - k * 16, bx, cyy + 70);
    }
    p.fill('#3fb950');
    p.circle(bx, cyy + 70, 8);
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text('上：' + coverN + ' 个层', bx + 30, cyy + 20);
    p.text('下：基点', bx + 30, cyy + 64);

    // winding loop text right
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9');
    p.textSize(12.5);
    p.text('绕底圆一圈 ↦ 在覆盖中沿', 420, cyy + 30);
    p.text(coverN === 1 ? '一层走一圈（恒等）。' : '垂直爬升到第 ' + coverN + ' 层（n 倍圈）。', 420, cyy + 52);
    p.text('度 n = |π₁| 商子群的指数。', 420, cyy + 74);
    // cover degree slider as keyboard: buttons for n
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.text('n = ' + coverN + '（按钮上/下一段）', 420, cyy + 130);

  };
};

new p5(sketch);
