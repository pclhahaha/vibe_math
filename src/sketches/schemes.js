// Schemes — Spec Z as the "prime axis" and fat points k[x]/(x^n)
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let mode = 'specZ';
  let n = 2;
  const primes = [];
  {
    const isPrime = (x) => {
      if (x < 2) return false;
      for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;
      return true;
    };
    for (let x = 2; primes.length < 40; x++) if (isPrime(x)) primes.push(x);
  }
  let a = 1.5; // complex parameter for Spec C[t]

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(900, p.windowWidth - 40), 560).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('Spec ℤ（素数轴）', () => { mode = 'specZ'; }, '#58a6ff'));
    ctrl.appendChild(mk('Spec ℂ[t]（连续轴）', () => { mode = 'specCt'; }, '#58a6ff'));
    ctrl.appendChild(mk('胖点 Spec k[x]/(xⁿ)', () => { mode = 'fat'; }, '#f7c948'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin:4px 2px';
    const mkSl = (lab, mn, mx, val, cb) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:0.74em;color:#8b949e';
      wrap.textContent = lab;
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.min = String(mn);
      sl.max = String(mx);
      sl.step = '1';
      sl.value = String(val);
      sl.style.cssText = 'width:160px;accent-color:#f7c948;cursor:pointer';
      sl.addEventListener('input', () => cb(parseFloat(sl.value)));
      wrap.appendChild(sl);
      return wrap;
    };
    row.appendChild(mkSl('重数 n（胖点）', 1, 6, n, (v) => { n = Math.round(v); }));
    row.appendChild(mkSl('参数 a（ℂ[t] 的点）', -2, 2, a * 100, (v) => { a = v / 100; }));
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      'Spec ℤ：点 = 素数 (p)（闭点，剩余域 F_p）+ 一般点 (0)。Spec ℂ[t]：点 = (t−a)（a∈ℂ）连续排成一条线。胖点：Spec k[x]/(xⁿ) 的点集只有一个，但幂零阶 n 给出"厚度"——重数在结构层不在拓扑里。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);
    p.noStroke();

    if (mode === 'specZ' || mode === 'specCt') {
      const y0 = 150;
      const x0 = 60;
      const W = p.width - 120;
      p.fill('#c9d1d9');
      p.textSize(16);
      p.text(mode === 'specZ' ? 'Spec ℤ：一维算术曲线（点 = 素理想）' : 'Spec ℂ[t]：仿射直线（点 = (t−a)，a∈ℂ）', x0, 60);
      // axis
      p.stroke('#30363d');
      p.strokeWeight(1.6);
      p.line(x0, y0, x0 + W, y0);
      if (mode === 'specZ') {
        // primes on log-ish scale
        const xOf = (idx) => x0 + (idx / (primes.length - 1)) * W;
        for (let i = 0; i < primes.length; i++) {
          const x = xOf(i);
          p.noStroke();
          p.fill('#58a6ff');
          p.circle(x, y0, 9);
          p.fill('#8b949e');
          p.textSize(10.5);
          p.textAlign(p.CENTER, p.TOP);
          p.text('(' + primes[i] + ')', x, y0 + 10);
          p.textAlign(p.LEFT, p.TOP);
        }
        // generic point far at the end marker
        p.fill('#f7c948');
        p.circle(x0 + W, y0, 12);
        p.fill('#8b949e');
        p.text('一般点 (0)（稠密）', x0 + W - 30, y0 + 16);
        p.textSize(12);
        p.fill('#8b949e');
        p.text('闭点 (p)：剩余域 F_p——"模 p 约化" = 在该点取纤维。维数 = 1。', x0, y0 + 44);
      } else {
        // continuum of closed points
        const a2 = Math.max(-1.8, Math.min(1.8, a));
        for (let i = 0; i <= 200; i++) {
          const t = -2 + (i / 200) * 4;
          const x = x0 + ((t + 2) / 4) * W;
          p.noStroke();
          p.fill(88, 166, 255, 120);
          p.circle(x, y0, 5);
        }
        const xa = x0 + ((a2 + 2) / 4) * W;
        p.fill('#f7c948');
        p.circle(xa, y0, 12);
        p.fill('#8b949e');
        p.text('当前点 (t−' + a2.toFixed(2) + ')（闭点），一般点 (0) 稠密', xa - 90, y0 + 18);
        p.fill('#8b949e');
        p.textSize(12);
        p.text('Spec ℂ[t] 与 Spec ℤ 平行：a ∈ ℂ ↔ 素数 p。', x0, y0 + 44);
      }
    } else {
      // fat point mode
      const cx = p.width / 2;
      const cy = 220;
      p.fill('#c9d1d9');
      p.textSize(16);
      p.textAlign(p.CENTER, p.TOP);
      p.text('胖点 Spec k[x]/(xⁿ)，n=' + n, cx, 70);
      // draw n concentric "thickness" rings / stacked point
      for (let i = n; i >= 1; i--) {
        p.noStroke();
        const col = i === 1 ? '#f7c948' : 88 + (i / n) * 90;
        p.fill(col, 166, 255, 60 + (i / n) * 120);
        p.circle(cx, cy, 30 + i * 22);
      }
      p.fill('#0d1117');
      p.textSize(14);
      p.text('x=0 的单点', cx, cy - 4);
      p.textAlign(p.LEFT, p.TOP);
      // arrows for tangent directions (n>=2)
      p.noStroke();
      p.fill('#8b949e');
      p.textSize(12);
      p.text('点集：只有 1 个闭点（拓扑相同！）——', 60, cy + 150);
      p.text('n 只改变结构层：xⁿ = 0（幂零阶 n）。', 60, cy + 172);
      p.text('n≥2：有切向量方向 Spec k[ε]→X（无穷小箭头）', 60, cy + 194);
      p.text('重数/形变/相交数都活在这里——不在点集里。', 60, cy + 216);
    }
  };
};

new p5(sketch);
