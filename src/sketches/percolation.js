// Percolation — square lattice site percolation: crossing, clusters, sweep curve
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let L = 48;
  let prob = 0.593;
  let cells = null; // 0 closed,1 open
  let colors = null; // 0 closed,1 open,2 reach,3 path
  let crossing = false;
  let sweep = null; // array of crossing freq vs p
  let playing = false;

  function regen() {
    cells = new Uint8Array(L * L);
    for (let i = 0; i < L * L; i++) cells[i] = Math.random() < prob ? 1 : 0;
    computeCrossing();
  }
  const idx = (x, y) => y * L + x;
  function computeCrossing() {
    colors = new Uint8Array(L * L).fill(1);
    for (let i = 0; i < L * L; i++) if (!cells[i]) colors[i] = 0;
    // BFS from open left column
    const parent = new Int32Array(L * L).fill(-2);
    const queue = [];
    for (let y = 0; y < L; y++) {
      if (cells[idx(0, y)]) {
        parent[idx(0, y)] = -1;
        queue.push(idx(0, y));
        colors[idx(0, y)] = 2;
      }
    }
    let head = 0;
    let reachedRight = -1;
    while (head < queue.length) {
      const cur = queue[head++];
      const x = cur % L;
      const y = (cur - x) / L;
      if (x === L - 1) {
        reachedRight = cur;
        break;
      }
      const nb = [];
      if (x > 0) nb.push(idx(x - 1, y));
      if (x < L - 1) nb.push(idx(x + 1, y));
      if (y > 0) nb.push(idx(x, y - 1));
      if (y < L - 1) nb.push(idx(x, y + 1));
      for (const n of nb) {
        if (cells[n] && parent[n] === -2) {
          parent[n] = cur;
          colors[n] = 2;
          queue.push(n);
        }
      }
    }
    crossing = reachedRight >= 0;
    if (crossing) {
      let cur = reachedRight;
      while (cur !== -1) {
        colors[cur] = 3;
        cur = parent[cur];
      }
    }
  }

  function largestClusterFrac() {
    const seen = new Uint8Array(L * L);
    let best = 0;
    for (let s = 0; s < L * L; s++) {
      if (!cells[s] || seen[s]) continue;
      let size = 0;
      const st = [s];
      seen[s] = 1;
      while (st.length) {
        const cur = st.pop();
        size++;
        const x = cur % L;
        const y = (cur - x) / L;
        const nb = [];
        if (x > 0) nb.push(cur - 1);
        if (x < L - 1) nb.push(cur + 1);
        if (y > 0) nb.push(cur - L);
        if (y < L - 1) nb.push(cur + L);
        for (const n of nb) {
          if (cells[n] && !seen[n]) {
            seen[n] = 1;
            st.push(n);
          }
        }
      }
      if (size > best) best = size;
    }
    return best / (L * L);
  }

  function doSweep() {
    sweep = [];
    const trials = 24;
    for (let pp = 0.35; pp <= 0.85; pp += 0.0125) {
      let count = 0;
      for (let t = 0; t < trials; t++) {
        prob = pp;
        regen();
        if (crossing) count++;
      }
      sweep.push({ p: pp, f: count / trials });
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(640, p.windowWidth - 40), 620).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('🎲 再生', () => { regen(); }, '#58a6ff'));
    ctrl.appendChild(mk('▶ 连续采样', () => { playing = !playing; }, '#f78166'));
    ctrl.appendChild(mk('📈 扫描相变曲线', () => { doSweep(); regen(); }, '#3fb950'));
    ctrl.appendChild(mk('✕ 清曲线', () => { sweep = null; }, '#8b949e'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:4px 2px';
    const mkSl = (lab, mn, mx, val, cb, w) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:0.75em;color:#8b949e';
      wrap.textContent = lab;
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.min = String(mn);
      sl.max = String(mx);
      sl.step = String((mx - mn) / 400);
      sl.value = String(val);
      sl.style.cssText = 'width:' + w + 'px;accent-color:#58a6ff;cursor:pointer';
      sl.addEventListener('input', () => {
        cb(parseFloat(sl.value));
      });
      wrap.appendChild(sl);
      return wrap;
    };
    const slP = mkSl('p = 0.593（方形点渗流 p_c≈0.5927）', 0.2, 0.9, prob, (v) => { prob = v; regen(); }, 220);
    const slL = mkSl('L = 48', 16, 96, L, (v) => { L = Math.floor(v); regen(); }, 140);
    row.appendChild(slP);
    row.appendChild(slL);
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '深蓝 = 开孔点；青色 = 从左边界可达；黄色 = 找到的一条左→右贯穿路径。p < p_c≈0.5927 几乎不贯通，p 更大几乎必贯通。盒子越大相变越陡（临界窗口 ~L^{-3/4}）。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    regen();
  };

  p.draw = () => {
    p.background('#0d1117');
    if (playing) regen();
    const gx = 16;
    const gy = 30;
    const G = Math.min(p.width - 320, 430);
    const cell = G / L;

    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const c0 = colors[idx(x, y)];
        p.noStroke();
        if (c0 === 3) p.fill('#f7c948');
        else if (c0 === 2) p.fill('#2e5f7a');
        else if (c0 === 1) p.fill('#58a6ff');
        else p.fill('#101418');
        p.rect(gx + x * cell, gy + y * cell, cell + 0.5, cell + 0.5);
      }
    }
    p.stroke('#c9d1d9');
    p.strokeWeight(1.2);
    p.noFill();
    p.rect(gx, gy, G, G);

    // --- right panel stats + sweep ---
    const px = gx + G + 22;
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text(`p = ${prob.toFixed(3)}`, px, 40);
    p.text(`L = ${L}`, px, 60);
    p.fill(crossing ? '#3fb950' : '#f85149');
    p.textSize(14);
    p.text(crossing ? '✓ 存在左→右贯通' : '✗ 无贯通', px, 82);
    p.fill('#8b949e');
    p.textSize(12);
    p.text(`最大团簇占比 = ${largestClusterFrac().toFixed(3)}`, px, 108);

    // sweep chart
    const cx0 = px;
    const cy0 = 190;
    const cw = p.width - cx0 - 20;
    const ch = 180;
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(cx0, cy0, cw, ch);
    // p_c line for site square ~0.5927
    p.stroke('#ffd33d');
    p.setLineDash([4, 4]);
    const xpc = cx0 + ((0.5927 - 0.3) / 0.55) * cw;
    p.line(xpc, cy0, xpc, cy0 + ch);
    p.setLineDash([]);
    p.noStroke();
    p.fill('#ffd33d');
    p.textSize(10.5);
    p.text('p_c≈0.593', xpc - 26, cy0 + ch + 14);
    if (sweep) {
      p.stroke('#3fb950');
      p.strokeWeight(2);
      p.noFill();
      p.beginShape();
      for (const pt of sweep) {
        p.vertex(cx0 + ((pt.p - 0.3) / 0.55) * cw, cy0 + ch - pt.f * ch);
      }
      p.endShape();
    }
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.text('穿越频率（每次 24 个样本，按 p 扫描）', cx0, cy0 - 14);
    p.text('0.3', cx0 - 14, cy0 + ch);
    p.text('0.85', cx0 + cw - 20, cy0 + ch);
  };
};

new p5(sketch);
