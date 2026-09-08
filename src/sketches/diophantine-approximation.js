// Diophantine Approximation — continued fraction convergents & error decay
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const PRESETS = {
    pi: { name: 'π ≈ 3.14159265358979', val: Math.PI },
    e: { name: 'e ≈ 2.71828182845905', val: Math.E },
    sqrt2: { name: '√2 ≈ 1.41421356237310', val: Math.SQRT2 },
    phi: { name: '黄金比 φ ≈ 1.61803398874989', val: (1 + Math.sqrt(5)) / 2 },
    zeta3: { name: 'ζ(3) ≈ 1.20205690315959', val: 1.202056903159594 },
  };
  let key = 'pi';
  let cf = []; // partial quotients
  let conv = []; // {p,q,a,err,bound,qerr}
  let periodic = false;

  function compute() {
    const alpha = PRESETS[key].val;
    cf = [];
    let x = alpha;
    const seen = {};
    let guard = 0;
    while (guard++ < 40) {
      const a = Math.floor(x);
      cf.push(a);
      const r = x - a;
      if (Math.abs(r) < 1e-10) break;
      const keyR = r.toFixed(9);
      if (seen[keyR]) {
        periodic = true;
        break;
      }
      seen[keyR] = true;
      x = 1 / r;
      if (!isFinite(x) || x > 1e12) break;
    }
    // convergents
    conv = [];
    let pm2 = 1;
    let qm2 = 0;
    let pm1 = cf[0];
    let qm1 = 1;
    for (let n = 0; n < cf.length; n++) {
      let p;
      let q;
      if (n === 0) {
        p = cf[0];
        q = 1;
      } else if (n === 1) {
        p = cf[1] * cf[0] + 1;
        q = cf[1];
      } else {
        p = cf[n] * pm1 + pm2;
        q = cf[n] * qm1 + qm2;
      }
      if (q > 1e14) break;
      const err = Math.abs(alpha - p / q);
      conv.push({ a: cf[n], p, q, err });
      pm2 = pm1;
      qm2 = qm1;
      pm1 = p;
      qm1 = q;
    }
    // add next-q bound using following convergent q
    for (let i = 0; i < conv.length; i++) {
      conv[i].qnext = i + 1 < conv.length ? conv[i + 1].q : conv[i].q * 1000;
      conv[i].bound = 1 / (conv[i].q * conv[i].qnext);
      conv[i].qerr = conv[i].q * conv[i].err;
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(700, p.windowWidth - 40), 620).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    Object.keys(PRESETS).forEach((k) => {
      const b = document.createElement('button');
      b.textContent = PRESETS[k].name;
      b.style.cssText = 'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:3px 9px;border-radius:6px;cursor:pointer;font-size:0.72em;margin:2px';
      b.addEventListener('click', () => {
        key = k;
        compute();
      });
      ctrl.appendChild(b);
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '左表：部分商 aₙ 与收敛子 pₙ/qₙ（含误差 |α−p/q|、1/(q q_{n+1}) 上界、q·‖qα‖）。右图（对数坐标）：误差随分母下降——每条竖线是一次"纪录刷新"。虚线 = 1/q² 参考线；黄金比的点贴着 1/(√5 q²)，π 因大项 292 骤降。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    compute();
  };

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);
    const alpha = PRESETS[key].val;
    const mx = 8;
    const my = 6;
    const LW = 340;

    // header
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text(`${PRESETS[key].name}  连分数 = [${cf.slice(0, 14).join('; ')}${cf.length > 14 ? ', …' : ''}]`, mx, my);
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text(`周期连分数（二次无理数）？ ${periodic ? '是 ✓' : '未发现 / 截断'}` , mx, my + 20);

    // table
    const tx = mx;
    const ty = 54;
    p.fill('#8b949e');
    p.textSize(11);
    p.text('n  aₙ   pₙ/qₙ                 误差 |α−p/q|         1/(q·qₙ₊₁)       q·‖qα‖', tx, ty - 14);
    let y = ty;
    for (let i = 0; i < Math.min(conv.length, 16); i++) {
      const c0 = conv[i];
      const big = i + 1 < conv.length && conv[i + 1].a >= 100;
      p.fill(i === conv.length - 1 ? '#ffd33d' : '#c9d1d9');
      p.textSize(11);
      const bigA = c0.a >= 100;
      p.text(
        String(i) + '   ' + String(bigA ? c0.a + ' ★' : c0.a).padEnd(3) + '  ' + c0.p + '/' + c0.q,
        tx,
        y
      );
      p.fill('#8b949e');
      p.text(c0.err.toExponential(2), tx + 118, y);
      p.text(c0.bound.toExponential(2), tx + 218, y);
      p.fill(big ? '#f78166' : '#8b949e');
      p.text(c0.qerr.toFixed(4), tx + 290, y);
      y += 16;
      if (big) {
        p.fill('#f78166');
        p.textSize(10.5);
        p.text('← 大项！误差骤降', tx + 218, y - 13);
      }
    }

    // ---- log-log plot ----
    const px0 = 360;
    const py0 = 40;
    const pw = p.width - px0 - 24;
    const ph = p.height - 90;
    // log axes: q in [1, 1e8], err in [1e-10, 1]
    const q0 = 0;
    const q1 = 8; // log10(q)
    const e0 = 0; // log10 err top = 1
    const e1 = -10; // bottom
    const X = (q) => px0 + ((Math.log10(q) - q0) / (q1 - q0)) * pw;
    const Y = (err) => py0 + ((e0 - Math.log10(Math.max(err, 1e-10))) / (e0 - e1)) * ph;
    // frame
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(px0, py0, pw, ph);
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(10.5);
    p.text('q=1', px0, py0 + ph + 2);
    p.text('q=10⁸', px0 + pw - 40, py0 + ph + 2);
    p.text('误差=1', px0 - 2, py0);
    p.text('误差=10⁻¹⁰', px0 - 2, py0 + ph - 10);

    // reference lines: err = 1/q^2 -> log err = -2 log q
    p.stroke(255, 255, 255, 90);
    p.setLineDash([3, 3]);
    const linePts = [];
    for (let lq = 0; lq <= 8; lq += 0.05) linePts.push([px0 + (lq / 8) * pw, py0 + ((0 - -2 * lq) / 10) * ph]);
    for (let i = 1; i < linePts.length; i++) p.line(linePts[i - 1][0], linePts[i - 1][1], linePts[i][0], linePts[i][1]);
    p.setLineDash([]);
    p.noStroke();
    p.fill(255, 255, 255, 110);
    p.textSize(10);
    p.text('1/q²', px0 + pw - 30, py0 + ((0 - -16) / 10) * ph - 2);

    // convergents points & polyline
    p.stroke('#3fb950');
    p.strokeWeight(1.4);
    p.noFill();
    p.beginShape();
    for (const c0 of conv) p.vertex(X(c0.q), Y(c0.err));
    p.endShape();
    for (const c0 of conv) {
      p.noStroke();
      p.fill('#3fb950');
      p.circle(X(c0.q), Y(c0.err), 6);
    }
    // mark big-ratio steps (π at q=113)
    for (let i = 1; i < conv.length; i++) {
      if (conv[i].a >= 100) {
        p.fill('#f78166');
        p.textSize(10);
        p.text('aₙ=' + conv[i].a, X(conv[i].q) + 4, Y(conv[i].err) - 6);
      }
    }
    // golden special: draw 1/(√5 q²) line when φ selected (slope -2 constant log10(1/√5))
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.text('误差逐层下降；大项 aₙ 制造骤降台阶。', px0, py0 + ph + 16);
  };
};

new p5(sketch);
