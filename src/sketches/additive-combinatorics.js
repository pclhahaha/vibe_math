// Additive Combinatorics — A + A size, energy, 3-AP detection on a clickable set
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const N = 44;
  let A = new Set([0, 1, 2, 3, 4, 5, 6, 7]); // default arithmetic progression

  // ---- statistics ----
  function sumsetReps() {
    // rep[s] = number of ordered pairs (a,b) in A with a+b=s
    const reps = new Array(2 * N).fill(0);
    const arr = [...A];
    for (const a of arr) for (const b of arr) reps[a + b]++;
    return reps;
  }
  function has3AP() {
    const arr = [...A].sort((x, y) => x - y);
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++) {
        const m = arr[i] + arr[j];
        if (m % 2 === 0 && A.has(m / 2)) return true;
      }
    return false;
  }
  function greedy3free() {
    A = new Set();
    for (let x = 0; x < N; x++) {
      let ok = true;
      const cur = [...A];
      for (const y of cur) {
        if ((x + y) % 2 === 0 && A.has((x + y) / 2)) { ok = false; break; }
        if (A.has(2 * x - y) || A.has(2 * y - x)) { ok = false; break; }
      }
      if (ok) A.add(x);
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(620, p.windowWidth - 40), 520).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('✎ 点击上方单元格切换', () => {}, '#8b949e'));
    ctrl.appendChild(mk('等差 {0..9}', () => { A = new Set(Array.from({ length: 10 }, (_, i) => i)); }, '#58a6ff'));
    ctrl.appendChild(mk('随机 14 点', () => { A = new Set(); while (A.size < 14) A.add(Math.floor(Math.random() * N)); }, '#f778ba'));
    ctrl.appendChild(mk('两个等差块', () => { A = new Set([...Array.from({ length: 7 }, (_, i) => i), ...Array.from({ length: 7 }, (_, i) => 30 + i)]); }, '#f78166'));
    ctrl.appendChild(mk('无 3-AP（贪心）', greedy3free, '#3fb950'));
    ctrl.appendChild(mk('清空', () => { A = new Set(); }, '#8b949e'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '第一行：点选集合 A（0..43）。第二行：A+A 每个和的表示数 r(s)（柱子越高表示方式越多）。右侧读数：|A+A| 与上下界、加性能量 E、是否含三项等差数列。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mousePressed = () => {
    // row A cells
    const cell = 12;
    const gap = 2;
    const y0 = 60;
    const x0 = 20;
    if (p.mouseY >= y0 && p.mouseY <= y0 + cell) {
      const idx = Math.floor((p.mouseX - x0) / (cell + gap));
      if (idx >= 0 && idx < N) {
        if (A.has(idx)) A.delete(idx);
        else A.add(idx);
      }
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    const cell = 12;
    const gap = 2;
    const x0 = 20;
    const yA = 60;

    p.noStroke();
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text('集合 A（点击切换 0..' + (N - 1) + '）', x0, yA - 20);

    // row A
    for (let i = 0; i < N; i++) {
      const x = x0 + i * (cell + gap);
      const on = A.has(i);
      p.fill(on ? '#58a6ff' : '#161b22');
      p.stroke(on ? '#58a6ff' : '#30363d');
      p.strokeWeight(0.8);
      p.rect(x, yA, cell, cell, 3);
    }
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(10.5);
    p.text('0', x0, yA + cell + 14);
    p.text(String(N - 1), x0 + (N - 1) * (cell + gap), yA + cell + 14);

    // row A+A reps
    const reps = sumsetReps();
    const yS = yA + 60;
    p.fill('#8b949e');
    p.textSize(12);
    p.text('A+A 的表示数 r(s)（绿 = 去重后的不同和）', x0, yS - 16);
    const maxR = Math.max(...reps, 1);
    const sW = Math.max(3, (p.width - 2 * x0) / (2 * N) - 1);
    for (let s = 0; s < 2 * N; s++) {
      const x = x0 + s * (sW + 1);
      const h = reps[s] > 0 ? 14 + (reps[s] / maxR) * 90 : 0;
      p.fill(reps[s] > 0 ? '#3fb950' : '#161b22');
      p.rect(x, yS + 100 - h, sW, h);
    }
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.line(x0, yS + 100, x0 + (2 * N) * (sW + 1), yS + 100);
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(10.5);
    p.text('s = 0', x0, yS + 114);
    p.text('s = ' + (2 * N - 1), x0 + (2 * N) * (sW + 1) - 40, yS + 114);

    // ---- stats ----
    const k = A.size;
    const distinct = reps.filter((v) => v > 0).length;
    const E = reps.reduce((a, v) => a + v * v, 0);
    const ap3 = has3AP();
    const statsY = yS + 150;
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9');
    p.textSize(14);
    p.text(`|A| = ${k}`, x0, statsY);
    p.text(`|A+A| = ${distinct}`, x0 + 130, statsY);
    p.fill('#8b949e');
    p.textSize(12);
    p.text(`（最小 2|A|−1 = ${Math.max(0, 2 * k - 1)}，最大 k(k+1)/2 = ${Math.min(2 * N, (k * (k + 1)) / 2)}）`, x0, statsY + 24);

    p.fill('#c9d1d9');
    p.textSize(14);
    p.text(`加性能量 E = ${E}`, x0, statsY + 56);
    p.fill('#8b949e');
    p.textSize(12);
    p.text(`E/|A|³ = ${k ? (E / Math.pow(k, 3)).toFixed(3) : '—'}（等差 ≈ 4/3≈1.333，随机 ≈ 1/|A|→0）`, x0, statsY + 80);

    const apCol = ap3 ? '#f85149' : '#3fb950';
    p.fill(apCol);
    p.textSize(14);
    p.text(ap3 ? '⚠ 含三项等差数列 (a, b, 2b−a)' : '✓ 无三项等差数列（3-AP-free）', x0, statsY + 112);
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('若 3-AP-free 且规模可观 ⟹ Roth/多项式方法关心的对象（见正文）。', x0, statsY + 136);

    // lesson
    p.fill('#ffd33d');
    p.textSize(12);
    p.text('观察：等差块 ⟹ |A+A| 最小、E/|A|³ 接近 1.33、必含 3-AP；随机 ⟹ 膨胀最大、能量塌缩、几乎无 3-AP。', x0, statsY + 168);
  };
};

new p5(sketch);
