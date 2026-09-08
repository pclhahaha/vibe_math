// Laplace Eigenvalues — square drum modes: sin(mx)sin(ny), nodal lines, Courant check
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let m = 2;
  let n = 1;
  const N = 160; // grid cells per side
  const SIZE = 360; // drawn pixels

  function idxOf(am, an) {
    const lam = am * am + an * an;
    const r = Math.ceil(Math.sqrt(lam));
    let less = 0;
    let eq = 0;
    for (let a = 1; a <= r; a++) {
      for (let b = 1; b <= r; b++) {
        const v = a * a + b * b;
        if (v < lam) less++;
        else if (v === lam && (a < am || (a === am && b < an))) eq++;
      }
    }
    return 1 + less + eq;
  }
  function spectrumRows(maxMN) {
    // distinct lambda values with multiplicity for pairs up to maxMN
    const vals = {};
    for (let a = 1; a <= maxMN; a++)
      for (let b = a; b <= maxMN; b++) {
        const v = a * a + b * b;
        vals[v] = (vals[v] || 0) + (a === b ? 1 : 2);
      }
    return Object.entries(vals)
      .map(([k, v]) => [parseInt(k), v])
      .sort((x, y) => x[0] - y[0]);
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(620, p.windowWidth - 40), 540).parent('p5canvas');

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;align-items:center;margin:6px 2px;flex-wrap:wrap';
    const mk = (label, id, mx) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:0.78em;color:#8b949e';
      wrap.textContent = label;
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.min = '1';
      sl.max = String(mx);
      sl.step = '1';
      sl.value = '1';
      sl.style.cssText = 'width:140px;accent-color:#58a6ff;cursor:pointer';
      sl.addEventListener('input', () => {
        if (id === 'm') m = parseInt(sl.value);
        else n = parseInt(sl.value);
      });
      wrap.appendChild(sl);
      return wrap;
    };
    const sm = mk('m（竖向节线数 m−1）', 'm', 8);
    const sn = mk('n（横向节线数 n−1）', 'n', 8);
    row.appendChild(sm);
    row.appendChild(sn);
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '方形鼓 (0,π)² 的驻波模式 φ=sin(mx)sin(ny)，谱值 λ=m²+n²。红 = 正、蓝 = 负、暗 = 节线。右侧给出谱序、Courant 节域检查与谱表。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    const x0 = 30;
    const y0 = 40;
    const cell = SIZE / N;
    const lam = m * m + n * n;
    const phase = p.millis() * 0.002;
    const amp = Math.cos(phase);

    // ---- mode picture ----
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = ((i + 0.5) / N) * Math.PI;
        const y = ((j + 0.5) / N) * Math.PI;
        const v = Math.sin(m * x) * Math.sin(n * y) * amp;
        let col;
        if (v > 0) {
          const t = Math.min(1, v);
          col = [30 + 170 * t, 40 + 90 * t, 90 + 60 * t];
        } else {
          const t = Math.min(1, -v);
          col = [60 + 90 * t, 40 + 60 * t, 140 + 90 * t];
        }
        p.noStroke();
        p.fill(col[0], col[1], col[2]);
        p.rect(x0 + i * cell, y0 + j * cell, cell + 0.5, cell + 0.5);
      }
    }
    // boundary
    p.stroke('#c9d1d9');
    p.strokeWeight(2);
    p.noFill();
    p.rect(x0 - 1, y0 - 1, SIZE + 2, SIZE + 2);

    // ---- info panel ----
    const ix = x0 + SIZE + 24;
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9');
    p.textSize(14);
    p.text(`模式 (m,n) = (${m}, ${n})`, ix, 40);
    p.fill('#ffd33d');
    p.textSize(15);
    p.text(`λ = m²+n² = ${lam}`, ix, 64);
    p.fill('#8b949e');
    p.textSize(12);
    p.text(`频率比 √(λ/λ₁₁) = √(${lam}/2) = ${Math.sqrt(lam / 2).toFixed(3)}`, ix, 90);
    const domains = m * n;
    const k = idxOf(m, n);
    p.fill('#c9d1d9');
    p.text(`节域数 = m·n = ${domains}`, ix, 116);
    p.text(`谱序 k = ${k}`, ix, 138);
    const ok = domains <= k;
    p.fill(ok ? '#3fb950' : '#f85149');
    p.text(ok ? `✓ Courant：节域 ${domains} ≤ k=${k}` : '✗ Courant 检查失败？', ix, 160);
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text(m !== n ? `简并伙伴：(${n}, ${m}) 同谱 λ=${lam}` : '（m=n：无旋转简并伙伴）', ix, 186);

    // spectrum table
    const rows = spectrumRows(8);
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('谱表（m,n ≤ 8 的不同值）', ix, 230);
    p.textSize(11);
    let yy = 252;
    for (const [val, mult] of rows) {
      const hi = val === lam;
      p.fill(hi ? '#ffd33d' : '#8b949e');
      p.text(`λ=${val}${mult > 1 ? ' ×' + mult : ''}`, ix + (yy % 2 ? 0 : 0), yy);
      if (hi) {
        p.fill('#ffd33d');
        p.text('◄', ix + 118, yy);
      }
      yy += 15;
      if (yy > 470) break;
    }

    // Weyl note
    p.fill('#8b949e');
    p.textSize(11.5);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Weyl 律：N(λ) ≈ (Area/4π)·λ = (π/4)·λ（Area=π²）', x0, y0 + SIZE + 16);
    p.fill('#f78166');
    p.text('Kac：能听出形状吗？——一维能，平面鼓不能（Gordon–Webb–Wolpert 1992）', x0, y0 + SIZE + 38);
  };
};

new p5(sketch);
