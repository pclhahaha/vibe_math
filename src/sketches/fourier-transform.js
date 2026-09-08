// Fourier Transform — filtering = multiplication in frequency domain (DFT demo)
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const N = 256;
  let sig = 'noise'; // noise | square | gauss
  let mode = 'low'; // low | high | off
  let K = 16; // cutoff bin

  // raw signal samples on [0,1)
  function buildSignal() {
    const s = new Array(N);
    for (let j = 0; j < N; j++) {
      const x = j / N;
      if (sig === 'noise') s[j] = 0.8 * Math.sin(2 * Math.PI * 3 * x) + 0.4 * Math.sin(2 * Math.PI * 42 * x);
      else if (sig === 'square') s[j] = Math.sin(2 * Math.PI * 2 * x) >= 0 ? 1 : -1;
      else {
        const d = (x - 0.5) / 0.09;
        s[j] = Math.exp(-d * d) - 0.1;
      }
    }
    return s;
  }

  function dft(re, inv) {
    const fr = new Array(N).fill(0);
    const fi = new Array(N).fill(0);
    for (let k = 0; k < N; k++) {
      let sr = 0;
      let si = 0;
      for (let j = 0; j < N; j++) {
        const ang = ((inv ? 1 : -1) * 2 * Math.PI * k * j) / N;
        sr += re[j] * Math.cos(ang);
        si += re[j] * Math.sin(ang);
      }
      fr[k] = inv ? sr / N : sr;
      fi[k] = inv ? si / N : si;
    }
    return { re: fr, im: fi };
  }

  function recompute() {
    sigArr = buildSignal();
    spec = dft(sigArr, false);
    mag = spec.re.map((r, k) => Math.hypot(r, spec.im[k]));
    // mask
    mask = new Array(N).fill(1);
    if (mode === 'low') for (let k = 0; k < N; k++) if (k > K && N - k > K) mask[k] = 0;
    if (mode === 'high') for (let k = 0; k < N; k++) if (k <= K || N - k <= K) mask[k] = 0;
    // filtered signal = IDFT( mask * spec )
    const mre = spec.re.map((r, k) => r * mask[k]);
    const mim = spec.im.map((r, k) => r * mask[k]);
    const fil = dft(mre, true);
    // note: using complex inverse on real spectrum with mask symmetric on conj pairs -> imag ~ 0
    filt = fil.re.map((r) => r);
  }

  let sigArr = [];
  let spec = null;
  let mag = [];
  let mask = [];
  let filt = [];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(580, p.windowWidth - 40), 500).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    [
      ['noise', '正弦+高频噪声'],
      ['square', '方波'],
      ['gauss', '高斯脉冲'],
    ].forEach(([k, lab]) => {
      const b = document.createElement('button');
      b.textContent = lab;
      b.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.76em;margin:2px';
      b.addEventListener('click', () => {
        sig = k;
        recompute();
      });
      ctrl.appendChild(b);
    });
    ctrl.appendChild(document.createTextNode('  '));
    [
      ['off', '全通', '#8b949e'],
      ['low', '▽ 低通', '#3fb950'],
      ['high', '△ 高通', '#f78166'],
    ].forEach(([k, lab, col]) => {
      const b = document.createElement('button');
      b.textContent = lab;
      b.style.cssText =
        'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.76em;margin:2px';
      b.addEventListener('click', () => {
        mode = k;
        recompute();
      });
      ctrl.appendChild(b);
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.76em';
    lab.textContent = '截止频率（bin）：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '1';
    sl.max = '60';
    sl.step = '1';
    sl.value = String(K);
    sl.style.cssText = 'width:160px;accent-color:#58a6ff;cursor:pointer';
    sl.addEventListener('input', () => {
      K = parseInt(sl.value);
    });
    sl.addEventListener('change', () => {
      if (mode !== 'off') recompute();
    });
    row.appendChild(sl);
    const val = document.createElement('span');
    val.id = 'kc';
    val.style.cssText = 'color:#58a6ff;font-size:0.76em;width:60px';
    val.textContent = String(K);
    row.appendChild(val);
    sl.addEventListener('input', () => {
      val.textContent = String(K);
    });
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '上：时域信号（灰 = 原信号，彩色 = 滤波后）。下：频谱 |F̂|（阴影 = 被保留的频段）。滤波 = 频域乘一个 0/1 掩码，再逆变换——这就是卷积定理的工程形态。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    recompute();
  };

  p.draw = () => {
    p.background('#0d1117');
    const W = p.width;
    const sigT = 42; // top of signal panel
    const sigH = 180;
    const specT = sigT + sigH + 46;
    const specH = p.height - specT - 20;

    // ---------- signal panel ----------
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    const sigName = { noise: '正弦(3Hz) + 高频噪声(42Hz)', square: '方波', gauss: '高斯脉冲' }[sig];
    const modeName = { off: '全通（原样）', low: '低通：保留 k ≤ K 的低频', high: '高通：只留 k > K 的高频' }[mode];
    p.text(`时域  f(x)：${sigName}      →  ${modeName}`, 14, sigT - 14);

    const toY = (v) => p.map(v, 1.45, -1.45, sigT + 8, sigT + sigH - 16);
    const toX = (i) => p.map(i, 0, N - 1, 40, W - 26);

    // zero line
    p.stroke('#2d333b');
    p.strokeWeight(1);
    p.line(40, toY(0), W - 26, toY(0));

    // original (grey)
    p.stroke('#8b949e');
    p.strokeWeight(1.1);
    for (let i = 0; i < N - 1; i += 2) p.line(toX(i), toY(sigArr[i]), toX(i + 1), toY(sigArr[i + 1]));
    // filtered (colored)
    const fcol = mode === 'low' ? '#3fb950' : mode === 'high' ? '#f78166' : '#58a6ff';
    p.stroke(fcol);
    p.strokeWeight(2.2);
    for (let i = 0; i < N - 1; i += 2) p.line(toX(i), toY(filt[i]), toX(i + 1), toY(filt[i + 1]));

    // ---------- spectrum panel ----------
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(12);
    p.text('频域  |F̂(ξ)|：左半 k=0…N/2（阴影 = 被掩码保留）', 14, specT - 16);

    let maxM = 0;
    for (let k = 0; k <= N / 2; k++) maxM = Math.max(maxM, mag[k]);
    maxM = Math.max(maxM, 1e-6);
    const fx = (k) => p.map(k, 0, N / 2, 40, W - 26);
    const fy = (m) => p.map(m, 0, maxM * 1.15, specT + specH - 14, specT + 14);

    // mask shading (keep region light)
    p.noStroke();
    for (let k = 0; k <= N / 2; k++) {
      if (mask[k] > 0) {
        p.fill(63, 185, 80, 26);
        p.rect(fx(k), specT, fx(k + 1) - fx(k) + 1, specH - 6);
      }
    }
    if (mode !== 'off') {
      p.stroke('#ffd33d');
      p.strokeWeight(1.2);
      p.line(fx(K), specT, fx(K), specT + specH - 6);
      p.noStroke();
      p.fill('#ffd33d');
      p.textSize(10.5);
      p.text('K=' + K, fx(K) + 3, specT + 2);
    }

    // spectrum bars
    p.noStroke();
    p.fill('#58a6ff');
    for (let k = 0; k <= N / 2; k++) {
      const hgt = fy(0) - fy(mag[k]);
      p.rect(fx(k), fy(mag[k]), Math.max(1.5, (W - 66) / (N / 2) - 1), hgt);
    }
    p.stroke('#2d333b');
    p.strokeWeight(1);
    p.line(40, fy(0), W - 26, fy(0));

    // legend
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.text('掩码乘法 F̂·Mask —— 若时域做卷积 f∗h，此处就是 ĥ 的形状', 14, p.height - 14);
  };
};

new p5(sketch);
