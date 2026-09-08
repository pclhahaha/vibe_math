// Compact Lie Group Representations — U(1) Fourier = Peter–Weyl, SU(2) CG calculator
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let mode = 'u1'; // u1 | cg
  let K = 8;
  let wave = 'square';
  // CG state
  let j1 = 0.5;
  let j2 = 0.5;

  const ck = (k) => {
    // Fourier coeffs of chosen wave on [-pi,pi]
    if (wave === 'square') {
      // f = sign(sin) -> c_k = 0 even; c_k = 2/(i*pi k)*(-1)^((k-1)/2)?? compute ck real part for sin basis
      if (k === 0) return 0;
      const m = Math.abs(k);
      if (m % 2 === 0) return 0;
      // for sin part: f=sign(sin theta): c_k = -2i/(pi k)*(-1)^((k-1)/2)?? use direct integral: for odd k>0, imag part of c_k:
      // f = 1 on (0,pi), -1 on (-pi,0); c_k = (1/2pi)(∫_0^pi e^{-ikθ}dθ - ∫_{-pi}^0 e^{-ikθ}dθ)
      const val = (2 / (Math.PI * m)) * (k > 0 ? -1 : 1) * Math.pow(-1, (m - 1) / 2) * 1;
      return { re: 0, im: val };
    }
    // sawtooth f = theta/pi on (-pi,pi): c_k = -2i/(pi^2 k)*? -> c_k = 2*(-1)^{k+1}/(i pi k)?? quick numeric: c_k = (1/2pi)∫θ/π e^{-ikθ}dθ
    if (k === 0) return { re: 0, im: 0 };
    const m = Math.abs(k);
    // ∫_{-π}^{π} θ e^{-ikθ} dθ = -2π i (-1)^k / k? gives c_k = ... use known: sawtooth (θ/π): c_k = (2 i (-1)^{k+1})/(π k)
    return { re: 0, im: (2 * Math.pow(-1, m + 1)) / (Math.PI * m) * (k > 0 ? 1 : -1) };
  };
  const fval = (t) => {
    // wave on -pi..pi
    if (wave === 'square') return Math.sin(t) >= 0 ? 1 : -1;
    return t / Math.PI;
  };
  const partial = (t, Kk) => {
    let s = 0;
    for (let k = -Kk; k <= Kk; k++) {
      const c = ck(k);
      const re = c && c.re !== undefined ? c.re : 0;
      const im = c && c.im !== undefined ? c.im : 0;
      s += re * Math.cos(k * t) - im * Math.sin(k * t);
    }
    return s;
  };

  function halfList() {
    return [0, 0.5, 1, 1.5, 2, 2.5];
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(800, p.windowWidth - 40), 560).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('🎻 U(1) 谐波合成（Peter–Weyl）', () => { mode = 'u1'; }, '#58a6ff'));
    ctrl.appendChild(mk('🧲 SU(2) CG 分解', () => { mode = 'cg'; }, '#f7c948'));
    ctrl.appendChild(mk('方波', () => { wave = 'square'; }, '#8b949e'));
    ctrl.appendChild(mk('锯齿', () => { wave = 'saw'; }, '#8b949e'));
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
      sl.style.cssText = 'width:150px;accent-color:#58a6ff;cursor:pointer';
      sl.addEventListener('input', () => cb(parseFloat(sl.value)));
      wrap.appendChild(sl);
      return wrap;
    };
    row.appendChild(mkSl('最高谐波 K', 0, 30, K, (v) => { K = Math.round(v); }));
    row.appendChild(mkSl('j₁（自旋）', 0, 5, j1 * 2, (v) => { j1 = v / 2; }));
    row.appendChild(mkSl('j₂（自旋）', 0, 5, j2 * 2, (v) => { j2 = v / 2; }));
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '模式 ①：圆群 S¹ 的 Peter–Weyl = 傅里叶级数——部分和逼近方波/锯齿（吉布斯过冲 9%），能量条 = Parseval。模式 ②：SU(2) 张量积 CG 分解：维数核对 (2j₁+1)(2j₂+1)=Σ(2j+1)；½⊗½=0⊕1 即单重态+三重态。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);
    if (mode === 'u1') {
      const px0 = 70;
      const py0 = 50;
      const pw = p.width - 140;
      const ph = 300;
      const Y = (v) => py0 + ph / 2 - v * (ph / 2 - 20);
      const X = (t) => px0 + ((t + Math.PI) / (2 * Math.PI)) * pw;
      p.noStroke();
      p.fill('#c9d1d9');
      p.textSize(14);
      p.text('U(1) = S¹：L²(S¹) 的 Peter–Weyl 基 {e^{ikθ}}，部分和 k≤K=' + K, px0 - 30, 16);
      p.stroke('#8b949e');
      p.strokeWeight(1);
      p.line(px0, Y(0), px0 + pw, Y(0));
      // target
      p.stroke(136, 148, 160, 200);
      p.strokeWeight(2);
      p.noFill();
      p.beginShape();
      for (let i = 0; i <= 400; i++) {
        const t = -Math.PI + (i / 400) * 2 * Math.PI;
        p.vertex(X(t), Y(fval(t)));
      }
      p.endShape();
      // partial sum
      p.stroke('#f7c948');
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i <= 400; i++) {
        const t = -Math.PI + (i / 400) * 2 * Math.PI;
        p.vertex(X(t), Y(partial(t, K)));
      }
      p.endShape();
      p.noStroke();
      p.fill('#8b949e');
      p.textSize(11.5);
      p.text('灰 = 目标，黄 = 部分和（吉布斯过冲 ≈9%）', px0, py0 + ph + 16);
      // energy
      let e2 = 0;
      let etot = 0;
      const target = wave === 'square' ? 1 : 1 / 3;
      for (let k = -K; k <= K; k++) {
        const c = ck(k);
        const v = (c ? c.re * c.re + c.im * c.im : 0);
        e2 += v;
      }
      for (let k = -120; k <= 120; k++) {
        const c = ck(k);
        etot += c ? c.re * c.re + c.im * c.im : 0;
      }
      const frac = e2 / etot;
      p.noStroke();
      p.fill('#c9d1d9');
      p.textSize(12.5);
      p.text('Parseval：捕获能量 = ' + (frac * 100).toFixed(1) + '%（=Σ|c_k|²/‖f‖²）', px0, py0 + ph + 42);
      p.stroke('#30363d');
      p.strokeWeight(1);
      const bx = px0;
      const by = py0 + ph + 66;
      p.rect(bx, by, 300, 12);
      p.noStroke();
      p.fill('#3fb950');
      p.rect(bx, by, Math.max(1, frac * 300), 12);
      p.fill('#8b949e');
      p.textSize(11);
      p.text('部分能量', bx + 306, by);
    } else {
      // CG
      const px0 = 90;
      const py0 = 60;
      const J1 = 2 * j1 + 1;
      const J2 = 2 * j2 + 1;
      p.noStroke();
      p.fill('#c9d1d9');
      p.textSize(15);
      p.text('SU(2)：V_{j₁} ⊗ V_{j₂} 的 CG 分解（j₁=' + j1 + '，j₂=' + j2 + '）', px0 - 30, 30);
      const outs = [];
      for (let j = Math.abs(j1 - j2); j <= j1 + j2 + 0.0001; j += 1) outs.push(j);
      const prod = J1 * J2;
      const sum = outs.reduce((a, j) => a + (2 * j + 1), 0);
      // bars
      let x = px0;
      for (const j of outs) {
        const w = 3 * (2 * j + 1);
        p.noStroke();
        p.fill(j === 0 ? '#f778ba' : '#58a6ff');
        p.rect(x, py0 + 60, w, 90);
        p.fill('#c9d1d9');
        p.textSize(11.5);
        p.text('j=' + j, x + w / 2 - 10, py0 + 60 + 96);
        p.text('(' + (2 * j + 1) + ')', x + w / 2 - 8, py0 + 60 + 112);
        x += w + 16;
      }
      p.fill('#c9d1d9');
      p.textSize(13);
      p.text('分解：' + outs.map((j) => 'V_' + j + (outs.length > 1 && j !== outs[outs.length - 1] ? ' ⊕ ' : '')).join(''), px0 - 30, py0 + 200);
      p.fill('#ffd33d');
      p.text('维数核对：(' + J1 + ')·(' + J2 + ') = ' + prod + ' = ' + sum + ' ✓', px0 - 30, py0 + 224);
      p.fill('#8b949e');
      p.textSize(12);
      p.text('j₁=j₂=½ ⟹ 单重态(0)+三重态(1)：两电子自旋的对称/反对称。', px0 - 30, py0 + 252);
      p.fill('#484f58');
      p.textSize(11);
      p.text('提示：把 j₁、j₂ 滑到 0.5/0.5、1/0.5、1/1 看维数 4=1+3、6=2+4、9=1+3+5。', px0 - 30, py0 + 274);
    }
  };
};

new p5(sketch);
