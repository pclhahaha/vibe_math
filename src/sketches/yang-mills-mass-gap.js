// Yang–Mills & Mass Gap — confinement potential, Wilson area law, running couplings
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let sigma = 0.6; // string tension

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(760, p.windowWidth - 40), 520).parent('p5canvas');

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:6px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.75em';
    lab.textContent = '弦张力 σ（禁闭强度）：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0';
    sl.max = '1';
    sl.step = '0.01';
    sl.value = String(sigma);
    sl.style.cssText = 'width:200px;accent-color:#f78166;cursor:pointer';
    sl.addEventListener('input', () => {
      sigma = parseFloat(sl.value);
    });
    row.appendChild(sl);
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '① 夸克-反夸克势：σ>0 ⟹ V=σR 线性（色通量管，禁闭）；σ=0 ⟹ 库仑 −1/R（自由）。② Wilson 圈：面积律 e^{−σR²}（禁闭，gap>0）vs 周长律 e^{−mR}（无质量传播）。③ 跑动耦合：QCD 渐近自由（高能弱）vs QED（高能强）。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);
    const W = p.width;
    const pad = 20;

    // ---------- panel 1: potential ----------
    const y0 = 34;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('① 夸克-反夸克势 V(R)（禁闭 vs 库仑）', pad, 10);
    const bx1 = pad;
    const bw1 = 330;
    const bh1 = 200;
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(bx1, y0, bw1, bh1);
    // confining V = sigma*R (draw in R 0..10, V scaled)
    p.stroke(sigma > 0.02 ? '#f78166' : '#484f58');
    p.strokeWeight(2.2);
    for (let i = 1; i < 200; i++) {
      const R1 = (i - 1) / 20;
      const R2 = i / 20;
      const y1 = bh1 - Math.min(bh1 - 4, sigma * R1 * (bh1 - 12));
      const y2 = bh1 - Math.min(bh1 - 4, sigma * R2 * (bh1 - 12));
      p.line(bx1 + 30 + (R1 / 10) * (bw1 - 60), y0 + y1, bx1 + 30 + (R2 / 10) * (bw1 - 60), y0 + y2);
    }
    // Coulomb -1/R dashed
    p.stroke(88, 166, 255, 220);
    p.strokeWeight(1.4);
    p.setLineDash([5, 4]);
    for (let i = 1; i < 200; i++) {
      const R1 = Math.max(0.3, (i - 1) / 20);
      const R2 = Math.max(0.3, i / 20);
      const y1 = bh1 - Math.min(bh1 - 4, (1.2 / R1) * (bh1 - 12) / 3);
      const y2 = bh1 - Math.min(bh1 - 4, (1.2 / R2) * (bh1 - 12) / 3);
      p.line(bx1 + 30 + ((R1 - 0.3) / 9.7) * (bw1 - 60), y0 + y1, bx1 + 30 + ((R2 - 0.3) / 9.7) * (bw1 - 60), y0 + y2);
    }
    p.setLineDash([]);
    p.noStroke();
    p.fill('#f78166');
    p.text('V = σR（线性：色通量管 ⟹ 禁闭）', bx1 + 8, y0 + bh1 - 52);
    p.fill('#58a6ff');
    p.text('V = −1/R（库仑：QED 自由）', bx1 + 8, y0 + bh1 - 32);
    p.fill('#8b949e');
    p.text('R →', bx1 + bw1 - 26, y0 + bh1 + 4);
    p.text('σ=' + sigma.toFixed(2), bx1 + 8, y0 + 4);

    // ---------- panel 2: Wilson loop ----------
    const bx2 = bx1 + bw1 + 46;
    const bw2 = 330;
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('② Wilson 圈：−ln⟨W⟩ ~ ?（对数）', bx2, 10);
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(bx2, y0, bw2, bh1);
    // area law: R^2 (times sigma) ; perimeter law: 4R * m
    p.stroke('#f78166');
    p.strokeWeight(2);
    for (let i = 1; i < 200; i++) {
      const R1 = (i - 1) / 22;
      const R2 = i / 22;
      const v1 = sigma * R1 * R1;
      const v2 = sigma * R2 * R2;
      const y1 = bh1 - Math.min(bh1 - 8, (v1 / 5) * (bh1 - 20));
      const y2 = bh1 - Math.min(bh1 - 8, (v2 / 5) * (bh1 - 20));
      p.line(bx2 + 30 + (R1 / 9) * (bw2 - 60), y0 + y1, bx2 + 30 + (R2 / 9) * (bw2 - 60), y0 + y2);
    }
    p.stroke(136, 160, 178, 220);
    p.strokeWeight(1.6);
    p.setLineDash([5, 4]);
    const m = 0.45;
    for (let i = 1; i < 200; i++) {
      const R1 = (i - 1) / 22;
      const R2 = i / 22;
      const v1 = m * 4 * R1;
      const v2 = m * 4 * R2;
      const y1 = bh1 - Math.min(bh1 - 8, (v1 / 5) * (bh1 - 20));
      const y2 = bh1 - Math.min(bh1 - 8, (v2 / 5) * (bh1 - 20));
      p.line(bx2 + 30 + (R1 / 9) * (bw2 - 60), y0 + y1, bx2 + 30 + (R2 / 9) * (bw2 - 60), y0 + y2);
    }
    p.setLineDash([]);
    p.noStroke();
    p.fill('#f78166');
    p.text('面积律 ∝ σR²（禁闭 ⟹ gap>0）', bx2 + 8, y0 + bh1 - 52);
    p.fill('#8b949e');
    p.text('周长律 ∝ mR（无质量传播子）', bx2 + 8, y0 + bh1 - 32);
    p.fill('#8b949e');
    p.text('R →', bx2 + bw2 - 26, y0 + bh1 + 4);

    // ---------- panel 3: running couplings ----------
    const y3 = y0 + bh1 + 54;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('③ 跑动耦合 α(Q)：QCD vs QED', pad, y3 - 14);
    const bx3 = pad;
    const bw3 = W - 2 * pad;
    const bh3 = 160;
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(bx3, y3, bw3, bh3);
    const XQ = (q) => bx3 + (Math.log10(q) / 5) * (bw3 - 40) + 20;
    const YQ = (v) => y3 + bh3 - Math.min(bh3 - 6, v * (bh3 - 16));
    // QCD alpha_s ~ 1/(1 + 0.8 ln Q) (toy)
    p.stroke('#f78166');
    p.strokeWeight(2.2);
    for (let i = 1; i < 300; i++) {
      const q1 = Math.pow(10, (i - 1) / 60);
      const q2 = Math.pow(10, i / 60);
      const a1 = 1 / (1 + 0.9 * Math.log(q1));
      const a2 = 1 / (1 + 0.9 * Math.log(q2));
      p.line(XQ(q1), YQ(a1), XQ(q2), YQ(a2));
    }
    // QED alpha ~ const * (1+0.02 ln Q)
    p.stroke('#58a6ff');
    p.strokeWeight(2);
    for (let i = 1; i < 300; i++) {
      const q1 = Math.pow(10, (i - 1) / 60);
      const q2 = Math.pow(10, i / 60);
      const a1 = 0.35 * (1 + 0.12 * Math.log(q1));
      const a2 = 0.35 * (1 + 0.12 * Math.log(q2));
      p.line(XQ(q1), YQ(a1), XQ(q2), YQ(a2));
    }
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(10.5);
    p.text('Q (对数)', bx3 + bw3 - 34, y3 + bh3 + 2);
    p.text('10⁰', bx3 + 10, y3 + bh3 + 2);
    p.text('10⁵', bx3 + bw3 - 56, y3 + bh3 + 2);
    p.fill('#f78166');
    p.text('QCD：渐近自由（高能弱 → 红外禁闭）', bx3 + 10, y3 + bh3 - 42);
    p.fill('#58a6ff');
    p.text('QED：红外自由（光子无质量）', bx3 + 10, y3 + bh3 - 22);

    // bottom note
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('面积律 + 线性势 ⟹ 谱间隙为正：四维 Yang–Mills 质量缺口的物理图像（Jaffe–Witten 千禧年）。', pad, y3 + bh3 + 24);
  };
};

new p5(sketch);
