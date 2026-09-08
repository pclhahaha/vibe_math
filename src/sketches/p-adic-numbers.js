// p-adic Numbers — digit expansions (…d2d1d0) and ultrametric distances
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let base = 2;
  const TARGETS = [
    { label: '−1', n: -1, d: 1, ok: (b) => true },
    { label: '1', n: 1, d: 1, ok: () => true },
    { label: '1/3', n: 1, d: 3, ok: (b) => b % 3 !== 0 },
    { label: '2/3', n: 2, d: 3, ok: (b) => b % 3 !== 0 },
    { label: '1/5', n: 1, d: 5, ok: (b) => b % 5 !== 0 },
    { label: '1/7', n: 1, d: 7, ok: (b) => b % 7 !== 0 },
  ];
  let selA = 0; // -1
  let selB = 3; // 2/3
  const D = 18;

  function digitsOf(t) {
    const b = base;
    const out = new Array(D).fill(0);
    let cur = 0; // den * cur ≡ n (mod b^k)
    const n = ((t.n % (b ** D)) + b ** D) % (b ** D);
    const invDen = modInv(t.d, b);
    for (let k = 0; k < D; k++) {
      // r = (n - d*cur)/b^k  (integer mod b)
      let r = (n - t.d * cur) / Math.pow(b, k);
      r = ((Math.round(r) % b) + b) % b;
      const a = (r * invDen) % b;
      out[k] = a;
      cur += a * Math.pow(b, k);
    }
    return out;
  }
  function modInv(a, m) {
    a = ((a % m) + m) % m;
    for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
    return 1;
  }
  function commonPrefix(d1, d2) {
    let k = 0;
    while (k < D && d1[k] === d2[k]) k++;
    return k;
  }

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
    [2, 3, 5, 7].forEach((b) => {
      ctrl.appendChild(mk('p=' + b, () => { base = b; }, '#58a6ff'));
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:4px 2px';
    const mkSel = (lab, list, idx, set) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:0.76em;color:#8b949e';
      wrap.textContent = lab;
      const sl = document.createElement('select');
      sl.style.cssText = 'background:#161b22;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;padding:2px 6px;font-size:0.85em';
      list.forEach((t, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = t.label;
        if (i === idx) o.selected = true;
        sl.appendChild(o);
      });
      sl.addEventListener('change', () => set(parseInt(sl.value)));
      wrap.appendChild(sl);
      return wrap;
    };
    row.appendChild(mkSel('数 A：', TARGETS, selA, (v) => { selA = v; }));
    row.appendChild(mkSel('数 B：', TARGETS, selB, (v) => { selB = v; }));
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '上：p-adic 数码 …a₂a₁a₀（低位在右，向左无限）。每格标的是"模 p^{k+1} 已定"的第 k 位；下：数 A 与 B 的距离 |A−B|_p = p^{−共享前缀长}——超度量。选 p 与两个数看数码（分母含 p 的数不在 ℤ_p，自动跳过）。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);
    const ta = TARGETS[selA];
    const tb = TARGETS[selB];
    const canA = ta.ok(base);
    const canB = tb.ok(base);
    const dA = canA ? digitsOf(ta) : null;
    const dB = canB ? digitsOf(tb) : null;
    const pad = 24;
    const y0 = 66;
    const cellW = 34;
    const cellH = 40;

    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(16);
    p.text('ℚ_' + base + ' 的数码展开：…a₂a₁a₀（低位在右 → 向左无限）', pad, 12);

    const drawRow = (label, digs, col, y) => {
      p.fill('#8b949e');
      p.textSize(12.5);
      p.text(label, pad, y);
      if (!digs) {
        p.fill('#f85149');
        p.text('分母含 p ⟹ 不在 ℤ_p（负赋值）', pad + 170, y);
        return;
      }
      const x0 = pad + 150;
      for (let k = D - 1; k >= 0; k--) {
        const x = x0 + (D - 1 - k) * (cellW + 3);
        const on = digs[k];
        p.noStroke();
        p.fill(col);
        p.rect(x, y, cellW - 2, cellH - 4, 4);
        p.fill('#0d1117');
        p.textSize(14);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(String(on), x + (cellW - 2) / 2, y + cellH / 2 - 2);
        p.textAlign(p.LEFT, p.TOP);
      }
      // labels for low/high index + ellipsis
      p.fill('#484f58');
      p.textSize(10);
      p.textAlign(p.LEFT, p.CENTER);
      p.text('…', x0 - 16, y + cellH / 2 - 2);
      p.text('a₀', x0 + (D - 1) * (cellW + 3) + 4, y + cellH / 2 - 2);
      p.text('a' + (D - 1), x0 - 30, y + cellH / 2 - 2);
      p.textAlign(p.LEFT, p.TOP);
    };
    const rowH = cellH + 16;
    drawRow('A = ' + ta.label + ' =', dA, '#3fb950', y0);
    drawRow('B = ' + tb.label + ' =', dB, '#f778ba', y0 + rowH);

    // verification of A (if available): den*x ≡ n mod p^D
    if (dA) {
      let cur = 0;
      for (let k = 0; k < D; k++) cur += dA[k] * Math.pow(base, k);
      const check = ((ta.d * cur - ta.n) % Math.pow(base, D) + Math.pow(base, D)) % Math.pow(base, D);
      p.noStroke();
      p.fill('#8b949e');
      p.textSize(12);
      p.text('校验：' + ta.d + ' · (数码值) ≡ ' + ((ta.n % Math.pow(base, D)) + Math.pow(base, D)) % Math.pow(base, D) + ' (mod ' + base + '^' + D + ') ' + (check === 0 ? '✓' : '✗'), pad, y0 + 2 * rowH + 4);
    }
    // distance section
    const dy = y0 + 2 * rowH + 40;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(15);
    p.text('超度量距离：|A−B|_p', pad, dy);
    if (dA && dB) {
      const pre = commonPrefix(dA, dB);
      const dist = Math.pow(base, -pre);
      p.fill('#ffd33d');
      p.textSize(13);
      p.text('共享前缀 ' + pre + ' 位 ⟹ |' + ta.label + ' − ' + tb.label + '|_p = p^{−' + pre + '} = ' + dist.toExponential(2), pad, dy + 26);
      p.fill('#8b949e');
      p.textSize(12);
      p.text('例：|−1 − 2/3|₂ = |−5/3|₂：v₂(−5/3)=0 ⟹ 距离 = 2⁻⁰ = 1（首位就不同，共享 0 位）', pad, dy + 50);
      // draw tree prefix visualization: horizontal row of shared vs split
      const ty = dy + 84;
      p.fill('#484f58');
      p.textSize(11);
      p.text('树视角：前 ' + pre + ' 层共享（绿）、第 ' + (pre + 1) + ' 层分叉（橙）', pad, ty);
      const x0 = pad + 320;
      for (let k = 0; k < Math.min(pre + 1, D); k++) {
        const same = k < pre;
        p.noStroke();
        p.fill(same ? '#3fb950' : '#f78166');
        p.rect(x0 + k * 22, ty + 10, 18, 18, 3);
      }
      p.noStroke();
      p.fill('#8b949e');
      p.textSize(11.5);
      p.text('|A−B|_p = p^{−共享长}：共享越多越"近"', pad, dy + 124);
    } else {
      p.fill('#f85149');
      p.text('（A 或 B 不在 ℤ_p——选分母不含 p 的数）', pad, dy + 24);
    }
    // takeaway
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('实数看"小数点后共享几位"；p-adic 看"左边低位共享几位"——同一串数码的镜像。', pad, 520);
    p.fill('#f7c948');
    p.textSize(12.5);
    p.text('−1 = …1111：等比级数 Σpᵏ = −1/(?)，在超度量下收敛——"收敛"是度量的属性。', pad, 540);
  };
};

new p5(sketch);
