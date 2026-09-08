// Convex Optimization — gradient descent vs momentum on an elliptic bowl
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let a = 1;
  let b = 6;
  let beta = 0.9;
  let useMomentum = false;
  const start = { x: 1.4, y: 1.0 };
  let gdPath = [];
  let momPath = [];
  let fHist = [];
  let mHist = [];

  const L = () => Math.max(a, b);
  const mu = () => Math.min(a, b);
  const eta = () => 1 / L();
  const fx = (x, y) => 0.5 * (a * x * x + b * y * y);
  const grad = (x, y) => ({ x: a * x, y: b * y });

  function run() {
    // plain GD
    gdPath = [];
    fHist = [];
    let x = start.x;
    let y = start.y;
    const et = eta();
    for (let k = 0; k < 600; k++) {
      gdPath.push({ x, y });
      fHist.push(fx(x, y));
      const g = grad(x, y);
      x -= et * g.x;
      y -= et * g.y;
      if (fx(x, y) < 1e-10) break;
    }
    // heavy-ball momentum
    momPath = [];
    mHist = [];
    x = start.x;
    y = start.y;
    let vx = 0;
    let vy = 0;
    for (let k = 0; k < 600; k++) {
      momPath.push({ x, y });
      mHist.push(fx(x, y));
      const g = grad(x, y);
      vx = beta * vx - et * g.x;
      vy = beta * vy - et * g.y;
      x += vx;
      y += vy;
      if (fx(x, y) < 1e-10) break;
    }
  }

  function stepsTo(hist, tol) {
    for (let i = 0; i < hist.length; i++) if (hist[i] < tol) return i + 1;
    return -1;
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(660, p.windowWidth - 40), 580).parent('p5canvas');

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin:6px 2px';
    const mkSl = (label, mn, mx, val, cb) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:0.75em;color:#8b949e';
      wrap.textContent = label;
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.min = String(mn);
      sl.max = String(mx);
      sl.step = '0.1';
      sl.value = String(val);
      sl.style.cssText = 'width:130px;accent-color:#58a6ff;cursor:pointer';
      sl.addEventListener('input', () => {
        cb(parseFloat(sl.value));
        run();
      });
      wrap.appendChild(sl);
      return wrap;
    };
    row.appendChild(mkSl('a（x 曲率）', 0.2, 10, a, (v) => { a = v; }));
    row.appendChild(mkSl('b（y 曲率）', 0.2, 10, b, (v) => { b = v; }));
    document.querySelector('.sketch-col')?.appendChild(row);

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:2px';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.75em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk(useMomentum ? '动量：开' : '动量：关', () => { useMomentum = !useMomentum; }, '#f7c948'));
    // recreate button after state change
    const momBtn = ctrl.firstChild;
    momBtn.addEventListener('click', () => {
      momBtn.textContent = useMomentum ? '动量：开' : '动量：关';
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '左：椭圆谷 f=½(ax²+by²) 的等高线与两条下山路径（灰=纯梯度，黄=动量 β=0.9）。右：f(x_k)−f* 的收敛曲线（对数轴），灰斜率 ~线性几何率，动量拖出加速。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    run();
  };

  p.draw = () => {
    p.background('#0d1117');
    // contour map
    const bx = 40;
    const by = 30;
    const bs = 420;
    const cx = bx + bs / 2;
    const cy = by + bs / 2;
    const scale = bs / 3.2;
    const SX = (x) => cx + x * scale;
    const SY = (y) => cy - y * scale;

    // contours: ellipses sqrt(a x^2 + b y^2) = c
    p.stroke('#1d2633');
    p.strokeWeight(1);
    for (const lev of [0.2, 0.4, 0.6, 0.9, 1.4, 2.2, 3.4, 5]) {
      p.noFill();
      p.beginShape();
      for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * p.TWO_PI;
        const rr = lev / Math.sqrt(Math.max(1e-6, a * Math.pow(Math.cos(t), 2) + b * Math.pow(Math.sin(t), 2)));
        const x = rr * Math.cos(t);
        const y = rr * Math.sin(t);
        if (Math.abs(x) < 1.7 && Math.abs(y) < 1.7) p.vertex(SX(x), SY(y));
      }
      p.endShape();
    }
    // axes
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(cx, by, cx, by + bs);
    p.line(bx, cy, bx + bs, cy);

    // paths
    const drawPath = (arr, col, wgt, skip) => {
      p.noFill();
      p.stroke(col);
      p.strokeWeight(wgt);
      p.beginShape();
      for (let i = 0; i < arr.length; i += skip) p.vertex(SX(arr[i].x), SY(arr[i].y));
      p.endShape();
    };
    drawPath(gdPath, '#8b949e', 1.6, 1);
    if (useMomentum) drawPath(momPath, '#f7c948', 2.2, 1);
    // start marker
    p.noStroke();
    p.fill('#ffd33d');
    p.circle(SX(start.x), SY(start.y), 8);

    // ---- convergence inset ----
    const ix = bx + bs + 28;
    const iy = by;
    const iw = p.width - ix - 16;
    const ih = 300;
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(ix, iy, iw, ih);
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(12);
    p.text('f(x_k) − f*（对数轴）', ix, iy - 6);
    p.fill('#8b949e');
    p.textSize(10.5);
    p.text('10⁰', ix - 4, iy + 6);
    p.text('10⁻⁸', ix - 4, iy + ih - 6);
    const Y = (v) => iy + ih - (Math.min(0, Math.log10(Math.max(v, 1e-8))) / 8) * ih;
    const X = (k, kmax) => ix + (k / kmax) * iw;
    const plot = (hist, col, kmax) => {
      p.stroke(col);
      p.strokeWeight(1.8);
      p.noFill();
      p.beginShape();
      for (let k = 0; k < hist.length; k++) {
        const v = Math.max(hist[k], 1e-8);
        p.vertex(X(k, kmax), Y(v));
      }
      p.endShape();
    };
    const kmax = Math.max(gdPath.length, momPath.length, 10);
    plot(fHist, '#8b949e', kmax);
    if (useMomentum) plot(mHist, '#f7c948', kmax);

    // readouts
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9');
    p.textSize(13);
    const sGd = stepsTo(fHist, 1e-6);
    const sMo = stepsTo(mHist, 1e-6);
    p.text('κ = L/μ = ' + (L() / mu()).toFixed(1), ix, iy + ih + 14);
    p.fill('#8b949e');
    p.text('纯梯度到 f−f*<10⁻⁶：' + (sGd > 0 ? sGd + ' 步' : '600+'), ix, iy + ih + 36);
    p.fill('#f7c948');
    p.text(useMomentum ? '动量到 10⁻⁶：' + (sMo > 0 ? sMo + ' 步' : '600+') : '（开启动量对比步数）', ix, iy + ih + 56);
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('理论：纯梯度几何率 (1−1/κ)^k；强凸下动量也线性但更优；' , ix, iy + ih + 82);
    p.text('光滑凸（无强凸）时动量 O(1/k²) 且一阶最优。', ix, iy + ih + 100);
  };
};

new p5(sketch);
