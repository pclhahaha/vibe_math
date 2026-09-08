// CLT — Monte Carlo: standardized sample means vs N(0,1) for growing n
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const T = 4000; // trials per recompute
  let src = 'uniform';
  let nIdx = 3; // n = NS[nIdx]

  const NS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
  const SRC = {
    uniform: { name: '均匀 U[0,1]', mu: 0.5, sd: Math.sqrt(1 / 12), R: 4.5 },
    coin: { name: '硬币 0/1', mu: 0.5, sd: 0.5, R: 4.5 },
    exp: { name: '指数 Exp(1)（偏斜）', mu: 1, sd: 1, R: 4.5 },
    cauchy: { name: '柯西（反例：无方差）', mu: null, sd: null, R: 14 },
  };
  const BINS = 84;

  const sample = () => {
    if (src === 'uniform') return Math.random();
    if (src === 'coin') return Math.random() < 0.5 ? 1 : 0;
    if (src === 'exp') return -Math.log(1 - Math.random());
    return Math.tan(Math.PI * (Math.random() - 0.5)); // cauchy
  };

  let hist = [];
  let n = 8;
  let empMean = 0;
  let empVar = 1;

  function run() {
    n = NS[nIdx];
    const mu = SRC[src].mu;
    const sd = SRC[src].sd;
    const isCauchy = mu === null;
    const zs = [];
    for (let t = 0; t < T; t++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += sample();
      zs.push(isCauchy ? s / n : (s - n * mu) / (sd * Math.sqrt(n)));
    }
    empMean = zs.reduce((a, b) => a + b, 0) / T;
    empVar = zs.reduce((a, b) => a + (b - empMean) * (b - empMean), 0) / T;
    const R = SRC[src].R;
    hist = new Array(BINS).fill(0);
    for (const z of zs) {
      const idx = Math.floor(((z + R) / (2 * R)) * BINS);
      if (idx >= 0 && idx < BINS) hist[idx]++;
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(580, p.windowWidth - 40), 520).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    Object.keys(SRC).forEach((k) => {
      const b = document.createElement('button');
      b.textContent = SRC[k].name;
      b.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.75em;margin:2px';
      b.addEventListener('click', () => {
        src = k;
        run();
      });
      ctrl.appendChild(b);
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.76em';
    lab.textContent = '每个均值含多少样本 n：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0';
    sl.max = String(NS.length - 1);
    sl.step = '1';
    sl.value = String(nIdx);
    sl.style.cssText = 'width:180px;accent-color:#58a6ff;cursor:pointer';
    sl.addEventListener('input', () => {
      nIdx = parseInt(sl.value);
    });
    sl.addEventListener('change', () => {
      run();
    });
    row.appendChild(sl);
    const val = document.createElement('span');
    val.id = 'nv';
    val.style.cssText = 'color:#58a6ff;font-size:0.76em;min-width:46px';
    row.appendChild(val);
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '每次画 4000 个"样本均值"：每个均值 = n 个独立样本的平均，标准化后画直方图。黄区 = 标准正态 N(0,1)。n 增大时任何"方差有限"的分布都向钟形收敛；柯西是反例。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    run();
  };

  p.draw = () => {
    p.background('#0d1117');
    const R = SRC[src].R;
    const binR = (2 * R) / BINS;
    const left = 46;
    const top = 40;
    const W = p.width - left - 30;
    const H = p.height - 195;

    let maxD = 0.45;
    for (let i = 0; i < BINS; i++) maxD = Math.max(maxD, hist[i] / T / binR);
    maxD *= 1.15;
    const toX = (x) => p.map(x, -R, R, left, left + W);
    const toY = (d) => p.map(d, 0, maxD, top + H, top);

    // axes + ticks
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(left, top + H, left + W, top + H);
    p.line(toX(0), top + H, toX(0), top);
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text('0', toX(0) - 14, top + H + 3);
    for (const tick of [-3, -2, -1, 1, 2, 3]) {
      p.stroke('#1a1f2b');
      p.strokeWeight(0.6);
      p.line(toX(tick), top + H, toX(tick), top + H + 5);
      p.noStroke();
      p.fill('#484f58');
      p.text(String(tick), toX(tick) - 6, top + H + 6);
    }

    // histogram bars (density scale)
    const bw = W / BINS;
    p.noStroke();
    p.fill(88, 166, 255, 200);
    for (let i = 0; i < BINS; i++) {
      if (!hist[i]) continue;
      const xc = -R + (i + 0.5) * binR;
      const d = hist[i] / T / binR;
      p.rect(toX(xc) - bw / 2 + 0.5, toY(d), bw - 1, top + H - toY(d));
    }

    // normal pdf fill
    p.fill(255, 211, 61, 60);
    p.noStroke();
    p.beginShape();
    p.vertex(toX(-R), top + H);
    for (let x = -R; x <= R; x += R / 100) {
      p.vertex(toX(x), toY(Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI)));
    }
    p.vertex(toX(R), top + H);
    p.endShape(p.CLOSE);
    p.fill('#ffd33d');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('N(0,1)', toX(R) - 50, top + 2);

    // readouts
    const ty = top + H + 30;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      `${SRC[src].name}  ·  n = ${n}（每个均值 ${n} 个样本）  ·  试验 ${T} 次`,
      left,
      ty - 2
    );
    const isCauchy = SRC[src].mu === null;
    if (isCauchy) {
      p.fill('#f85149');
      p.text(
        `经验均值 ${empMean.toFixed(3)} · 经验方差 ${empVar.toFixed(2)}（随 n 几乎不变！）`,
        left,
        ty + 22
      );
      p.text(
        '反例：柯西无方差，均值仍是柯西——CLT 需要有限方差，钟形永远不会出现。',
        left,
        ty + 42
      );
    } else {
      p.fill('#3fb950');
      p.text(
        `经验均值 ${empMean.toFixed(3)}（≈0）· 经验方差 ${empVar.toFixed(3)}（≈1 ⟹ 标准化正确）`,
        left,
        ty + 22
      );
      p.fill('#8b949e');
      p.text(
        n >= 64
          ? '✓ 直方图已贴合钟形：这就是中心极限定理。'
          : 'n 还小：分布仍是原样或偏斜——钟形是渐近的。',
        left,
        ty + 42
      );
    }
  };
};

new p5(sketch);
