// Demo sketches for the micro-viz system.
// Each is `(p, container) => {}` producing a tiny p5 sketch inside `container`.
import { registerDemoHosted } from './micro-viz.js';

// ---------- 1. 割线 → 切线 (导数) ----------
registerDemoHosted('secant-tangent', (p, container) => {
  let h = 1.0;
  const f = (x) => 0.25 * x * x;
  p.setup = () => {
    p.createCanvas(300, 190).parent(container);
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0.05'; sl.max = '2'; sl.step = '0.01'; sl.value = '1';
    sl.style.cssText = 'width:180px;accent-color:#58a6ff;display:block;margin:6px auto';
    sl.addEventListener('input', () => { h = parseFloat(sl.value); });
    container.appendChild(sl);
    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:.72em;text-align:center;margin-bottom:4px';
    hint.textContent = '拖动滑块：两点越近，割线越贴近切线';
    container.insertBefore(hint, container.firstChild);
  };
  p.draw = () => {
    p.background('#0d1117');
    const ox = 30, oy = 150, sc = 55;
    const px = (x) => ox + x * sc, py = (y) => oy - y * sc;
    p.stroke('#30363d'); p.strokeWeight(1);
    p.line(ox, oy, ox + 240, oy); // x axis
    p.line(ox, oy, ox, oy - 140); // y axis
    // curve
    p.noFill(); p.stroke('#58a6ff'); p.strokeWeight(2);
    p.beginShape();
    for (let x = -2.6; x <= 3; x += 0.05) p.vertex(px(x), py(f(x)));
    p.endShape();
    // two points
    const a = 1.5;
    const b = a + h;
    p.fill('#f78166'); p.noStroke();
    p.circle(px(a), py(f(a)), 6);
    p.circle(px(b), py(f(b)), 6);
    // secant
    p.stroke('#f78166'); p.strokeWeight(1.5);
    p.line(px(a - 1), py(f(a) - (f(b) - f(a)) / h * 1), px(b + 1), py(f(b) + (f(b) - f(a)) / h * 1));
    // tangent at a (limiting slope f'(a)=0.5a)
    const m = 0.5 * a;
    p.stroke('#7ee787'); p.strokeWeight(2);
    p.line(px(a - 1.5), py(f(a) - m * 1.5), px(a + 1.5), py(f(a) + m * 1.5));
    // labels
    p.fill('#8b949e'); p.textSize(10); p.textAlign(p.CENTER, p.TOP);
    p.text('红=割线  绿=切线', 150, 168);
    p.text('h=' + h.toFixed(2) + '  割线斜率=' + ((f(b) - f(a)) / h).toFixed(3), 150, 8);
  };
});

// ---------- 2. 矩阵 det 变零 (线性变换) ----------
registerDemoHosted('det-zero', (p, container) => {
  let a = 2, b = 0.5, c = 0.3, d = 1.5;
  const mkslider = (label) => {
    const wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:3px;font-size:.72em;color:#8b949e';
    wrap.textContent = label + ' ';
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '-3'; sl.max = '3'; sl.step = '0.1'; sl.value = '1';
    sl.style.cssText = 'width:56px;accent-color:#58a6ff';
    wrap.appendChild(sl);
    container.appendChild(wrap);
    return sl;
  };
  p.setup = () => {
    p.createCanvas(300, 190).parent(container);
    const sa = mkslider('a'), sb = mkslider('b'), sc = mkslider('c'), sd = mkslider('d');
    [sa, sb, sc, sd].forEach((s, i) => s.addEventListener('input', () => {
      const v = parseFloat(s.value);
      if (i === 0) a = v; else if (i === 1) b = v; else if (i === 2) c = v; else d = v;
    }));
    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:.72em;text-align:center;margin-top:4px';
    hint.textContent = '调 a,b,c,d 让 det 变成 0——正方形就被压扁了';
    container.appendChild(hint);
  };
  p.draw = () => {
    p.background('#0d1117');
    const cx = 150, cy = 85, sc = 42;
    p.stroke('#141920'); p.strokeWeight(0.4);
    for (let i = -3; i <= 3; i++) { p.line(cx + i * sc, 5, cx + i * sc, 165); p.line(5, cy + i * sc, 295, cy + i * sc); }
    const det = a * d - b * c;
    // unit square (blue)
    p.noFill(); p.stroke('#58a6ff'); p.strokeWeight(2);
    p.beginShape(); p.vertex(cx, cy); p.vertex(cx + sc, cy); p.vertex(cx + sc, cy - sc); p.vertex(cx, cy - sc); p.endShape(p.CLOSE);
    // transformed parallelogram (red)
    p.fill(248, 113, 102, 30); p.stroke('#f78166'); p.strokeWeight(2);
    p.beginShape();
    const T = (x, y) => [cx + (a * x + b * y) * sc, cy - (c * x + d * y) * sc];
    p.vertex(...T(0, 0)); p.vertex(...T(1, 0)); p.vertex(...T(1, 1)); p.vertex(...T(0, 1));
    p.endShape(p.CLOSE);
    p.fill(Math.abs(det) < 0.1 ? '#f78166' : '#7ee787');
    p.textSize(12); p.textAlign(p.CENTER, p.TOP);
    p.text('det = ' + det.toFixed(2) + (Math.abs(det) < 0.1 ? '  → 压扁!  rank=1' : ''), 150, 168);
  };
});

// ---------- 3. 面积验证 (行列式) ----------
registerDemoHosted('area-det', (p, container) => {
  let a = 2, b = 1, c = 0.5, d = 2;
  p.setup = () => {
    p.createCanvas(300, 190).parent(container);
    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:.72em;text-align:center;margin-bottom:4px';
    hint.textContent = '拖 A 向量端点到整点，验证面积 = |det|';
    container.insertBefore(hint, container.firstChild);
  };
  p.draw = () => {
    p.background('#0d1117');
    const cx = 80, cy = 110, sc = 50;
    p.stroke('#141920'); p.strokeWeight(0.4);
    for (let i = -1; i <= 4; i++) { p.line(cx + i * sc, 5, cx + i * sc, 175); p.line(5, cy - i * sc, 285, cy - i * sc); }
    p.stroke('#30363d'); p.strokeWeight(1);
    p.line(cx, 5, cx, 175); p.line(5, cy, 285, cy);
    // basis e1, e2
    p.stroke('#58a6ff'); p.strokeWeight(2);
    p.line(cx, cy, cx + sc, cy); p.line(cx, cy, cx, cy - sc);
    // transformed parallelogram
    const det = a * d - b * c;
    p.fill(88, 166, 255, 40); p.stroke('#f78166'); p.strokeWeight(2);
    p.beginShape();
    p.vertex(cx, cy);
    p.vertex(cx + a * sc, cy - c * sc);
    p.vertex(cx + (a + b) * sc, cy - (c + d) * sc);
    p.vertex(cx + b * sc, cy - d * sc);
    p.endShape(p.CLOSE);
    p.fill('#8b949e'); p.textSize(11); p.textAlign(p.CENTER, p.TOP);
    p.text('列向量: (' + a + ',' + c + ')  (' + b + ',' + d + ')', 165, 8);
    p.fill('#ffd33d');
    p.text('面积 = |' + a + '·' + d + ' − ' + b + '·' + c + '| = ' + Math.abs(det).toFixed(2), 165, 24);
  };
});

// ---------- 4. ε-δ 挑战 (ε-δ 语言) ----------
registerDemoHosted('eps-delta', (p, container) => {
  let eps = 0.5, delta = 0.3;
  const f = (x) => x * x; // limit at a=1 is L=1
  const a = 1, L = 1;
  p.setup = () => {
    p.createCanvas(300, 190).parent(container);
    const mk = (label, min, max, val) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:inline-flex;align-items:center;gap:3px;font-size:.72em;color:#8b949e';
      wrap.textContent = label + ' ';
      const sl = document.createElement('input');
      sl.type = 'range'; sl.min = min; sl.max = max; sl.step = '0.02'; sl.value = val;
      sl.style.cssText = 'width:90px;accent-color:#58a6ff';
      wrap.appendChild(sl);
      container.appendChild(wrap);
      return sl;
    };
    const se = mk('ε', '0.1', '1', '0.5'), sd = mk('δ', '0.02', '0.8', '0.3');
    se.addEventListener('input', () => { eps = parseFloat(se.value); });
    sd.addEventListener('input', () => { delta = parseFloat(sd.value); });
  };
  p.draw = () => {
    p.background('#0d1117');
    const ox = 30, oy = 150, sc = 55;
    const px = (x) => ox + (x - 0.2) * sc, py = (y) => oy - (y - 0.2) * sc;
    p.stroke('#30363d'); p.strokeWeight(1);
    p.line(ox - 5, oy, ox + 245, oy); p.line(ox, oy, ox, oy - 140);
    // curve
    p.noFill(); p.stroke('#58a6ff'); p.strokeWeight(2);
    p.beginShape();
    for (let x = 0; x <= 2.2; x += 0.02) p.vertex(px(x), py(f(x)));
    p.endShape();
    // L ± ε band (horizontal)
    p.fill(247, 129, 102, 40); p.noStroke();
    p.rect(ox, py(L + eps), 240, (py(L - eps) - py(L + eps)));
    // a ± δ band (vertical)
    p.fill(126, 231, 135, 30);
    p.rect(px(a - delta), oy - 140, (px(a + delta) - px(a - delta)), 140);
    // target point
    p.fill('#ffd33d'); p.noStroke(); p.circle(px(a), py(L), 5);
    // check: does δ work for this ε?
    const maxDiff = Math.max(Math.abs(f(a - delta) - L), Math.abs(f(a + delta) - L));
    const works = maxDiff <= eps;
    p.textSize(11); p.textAlign(p.CENTER, p.TOP);
    p.fill(works ? '#7ee787' : '#f78166');
    p.text(works ? '✓ δ 有效：窗口内 |f(x)−L| < ε' : '✗ δ 太大：窗口超出 ε 带，减小 δ', 150, 168);
  };
});

// ---------- 5. 逐点 vs 一致收敛 (实分析) ----------
registerDemoHosted('uniform-vs-pointwise', (p, container) => {
  let n = 2;
  p.setup = () => {
    p.createCanvas(300, 190).parent(container);
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '1'; sl.max = '200'; sl.step = '1'; sl.value = '2';
    sl.style.cssText = 'width:180px;accent-color:#58a6ff;display:block;margin:6px auto';
    sl.addEventListener('input', () => { n = parseInt(sl.value); });
    container.appendChild(sl);
    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:.72em;text-align:center;margin-bottom:4px';
    hint.textContent = 'f_n(x)=xⁿ  ·  拖动 n：看 x=1 处那根"刺"永远不掉下来';
    container.insertBefore(hint, container.firstChild);
  };
  p.draw = () => {
    p.background('#0d1117');
    // plot region: x in [0,1], y in [-0.1, 1.1]
    const ox = 35, oy = 168, scx = 260, scy = 145;
    const px = (x) => ox + x * scx, py = (y) => oy - y * scy;
    p.stroke('#30363d'); p.strokeWeight(1);
    p.line(ox, oy, ox + scx, oy); p.line(ox, oy, ox, oy - scy);
    // ε-tube around limit (limit is 0 for x<1, 1 at x=1) — draw band y in [-0.05,0.05]
    const eps = 0.05;
    p.fill(126, 231, 135, 25); p.noStroke();
    p.rect(ox, py(eps), scx, (py(-eps) - py(eps)));
    p.stroke('#7ee787'); p.strokeWeight(0.8);
    p.line(ox, py(eps), ox + scx, py(eps));
    p.line(ox, py(-eps), ox + scx, py(-eps));
    // limit function: 0 for x<1, jump to 1 at x=1
    p.stroke('#8b949e'); p.strokeWeight(1.5);
    p.line(ox, py(0), ox + scx - 1, py(0));
    p.fill('#8b949e'); p.noStroke();
    p.circle(ox + scx, py(1), 4); // hollow-ish dot at (1,1)
    // the curve f_n
    p.stroke('#f78166'); p.strokeWeight(2); p.noFill();
    p.beginShape();
    for (let x = 0; x <= 1; x += 0.001) {
      p.vertex(px(x), py(Math.pow(x, n)));
    }
    p.endShape();
    // the "spike" at x=1
    p.fill('#f78166'); p.noStroke();
    p.circle(px(1), py(1), 5);
    // labels
    p.fill('#8b949e'); p.textSize(10); p.textAlign(p.CENTER, p.TOP);
    p.text('n = ' + n, 150, 8);
    p.text('绿色带 = ε 管道（围绕极限）', 150, 178);
    // verdict
    p.fill('#f78166');
    p.textSize(10);
    p.text('红刺永远在管道外 → 不是一致收敛', 150, 22);
  };
});
