// Lattices & Post-Quantum Crypto — 2D Gauss reduction + LWE candidate explorer
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  // ---- lattice part ----
  let v1 = { x: 2, y: 0 };
  let v2 = { x: 1, y: 2 };
  let r1 = null;
  let r2 = null;

  function gaussReduce(u, v) {
    let a = { x: u.x, y: u.y };
    let b = { x: v.x, y: v.y };
    for (let i = 0; i < 60; i++) {
      if (a.x * a.x + a.y * a.y > b.x * b.x + b.y * b.y) {
        const t = a;
        a = b;
        b = t;
      }
      const dot = a.x * b.x + a.y * b.y;
      const na = a.x * a.x + a.y * a.y;
      const m = Math.round(dot / na);
      if (m === 0) break;
      b = { x: b.x - m * a.x, y: b.y - m * a.y };
    }
    return [a, b];
  }

  // ---- LWE part ----
  let q = 31;
  let T = 2;
  let secret = 7;
  let samples = [];
  let lweCandidates = [];

  function regenLWE() {
    samples = [];
    const k = Math.floor(lweSamples);
    for (let i = 0; i < k; i++) {
      const a = 1 + Math.floor(Math.random() * (q - 1));
      const e = Math.floor(Math.random() * (2 * T + 1)) - T;
      const b = (((a * secret + e) % q) + q) % q;
      samples.push({ a, b });
    }
    recomputeCandidates();
  }
  function recomputeCandidates() {
    lweCandidates = [];
    for (let s = 0; s < q; s++) {
      let ok = true;
      for (const sm of samples) {
        let r = (((sm.b - sm.a * s) % q) + q) % q;
        if (r > q / 2) r -= q;
        if (Math.abs(r) > T) {
          ok = false;
          break;
        }
      }
      if (ok) lweCandidates.push(s);
    }
  }

  let lweSamples = 2;

  function setBasis(u1, u2) {
    v1 = { x: u1[0], y: u1[1] };
    v2 = { x: u2[0], y: u2[1] };
    const rr = gaussReduce(v1, v2);
    r1 = rr[0];
    r2 = rr[1];
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(760, p.windowWidth - 40), 600).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 9px;border-radius:6px;cursor:pointer;font-size:0.72em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('基 A ⟨(2,0),(1,2)⟩', () => setBasis([2, 0], [1, 2]), '#58a6ff'));
    ctrl.appendChild(mk('基 B ⟨(3,1),(1,2)⟩', () => setBasis([3, 1], [1, 2]), '#58a6ff'));
    ctrl.appendChild(mk('基 C（斜）⟨(4,1),(1,3)⟩', () => setBasis([4, 1], [1, 3]), '#58a6ff'));
    ctrl.appendChild(mk('随机基', () => {
      const u1 = [Math.floor(Math.random() * 7) - 3, Math.floor(Math.random() * 7) - 3];
      const u2 = [Math.floor(Math.random() * 7) - 3, Math.floor(Math.random() * 7) - 3];
      setBasis(u1, u2);
    }, '#8b949e'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:4px 2px';
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
      sl.style.cssText = 'width:110px;accent-color:#58a6ff;cursor:pointer';
      sl.addEventListener('input', () => {
        cb(parseInt(sl.value));
      });
      wrap.appendChild(sl);
      return wrap;
    };
    row.appendChild(mkSl('LWE: q', 17, 127, q, (v) => { q = v; regenLWE(); }));
    row.appendChild(mkSl('噪声界 T', 1, 6, T, (v) => { T = v; regenLWE(); }));
    row.appendChild(mkSl('样本数 k', 1, 3, lweSamples, (v) => { lweSamples = v; regenLWE(); }));
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '左：格点（灰点）与原基（蓝）/ Gauss 归约后的短基（橙）——2D 找最短几乎免费。右：LWE 玩具（n=1）：滑动 q/T/样本数，看"候选秘密"如何被噪声模糊、又被更多样本唯一化。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    setBasis([2, 0], [1, 2]);
    regenLWE();
  };

  p.draw = () => {
    p.background('#0d1117');
    // ---- left lattice ----
    const bx = 200;
    const by = 290;
    const sc = 30;
    const SX = (x) => bx + x * sc;
    const SY = (y) => by - y * sc;

    p.noStroke();
    for (let a = -8; a <= 8; a++) {
      for (let b = -8; b <= 8; b++) {
        const gx = a * v1.x + b * v2.x;
        const gy = a * v1.y + b * v2.y;
        if (Math.abs(gx) < 9 && Math.abs(gy) < 9) {
          p.fill(60, 70, 84);
          p.circle(SX(gx), SY(gy), 4);
        }
      }
    }
    const drawV = (v, col, w) => {
      p.stroke(col);
      p.strokeWeight(w);
      p.line(bx, by, SX(v.x), SY(v.y));
      p.noStroke();
      p.fill(col);
      p.circle(SX(v.x), SY(v.y), 7);
    };
    drawV(v1, '#58a6ff', 3);
    drawV(v2, '#58a6ff', 3);
    if (r1) {
      drawV(r1, '#f7c948', 2.4);
      drawV(r2, '#f7c948', 2.4);
    }
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.line(bx - 270, by, bx + 270, by);
    p.line(bx, by - 270, bx, by + 270);
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('2D 格与 Gauss 归约', 40, 20);
    p.fill('#8b949e');
    p.textSize(11.5);
    const len = (v) => Math.sqrt(v.x * v.x + v.y * v.y);
    if (r1) {
      p.text('原基长：' + len(v1).toFixed(2) + ', ' + len(v2).toFixed(2), 40, 44);
      p.fill('#f7c948');
      p.text('归约后：' + len(r1).toFixed(2) + ', ' + len(r2).toFixed(2) + '（最短 ≈ ' + Math.min(len(r1), len(r2)).toFixed(2) + '）', 40, 66);
      p.fill('#8b949e');
      p.textSize(11);
      p.text('Gauss 归约在 2D 找到真正最短向量；高维（500）要指数时间。', 40, 92);
    }

    // ---- right LWE panel ----
    const px = 500;
    const py = 24;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('LWE 玩具：秘密 s=' + secret + '（保密）', px, py);
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('公开样本 (aᵢ, bᵢ = aᵢ·s+eᵢ mod ' + q + ')，|eᵢ|≤' + T + '：', px, py + 22);
    let yy = py + 46;
    for (const sm of samples) {
      p.fill('#8b949e');
      p.text('(' + sm.a + ', ' + sm.b + ')', px, yy);
      yy += 18;
    }
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('候选秘密 s′ 数：' + lweCandidates.length, px, yy + 6);
    p.fill(lweCandidates.includes(secret) ? '#3fb950' : '#f85149');
    p.text('真值 s=' + secret + ' 在候选中：' + (lweCandidates.includes(secret) ? '✓' : '✗'), px, yy + 28);
    p.fill('#8b949e');
    p.textSize(11);
    p.text(lweCandidates.length === 1 ? '唯一化：再多样本也只需穷举 q。' : '噪声制造模糊：需要穷举/解格。', px, yy + 50);
    // bar of candidates
    p.stroke('#30363d');
    p.strokeWeight(1);
    const bw0 = 230;
    const barY = yy + 84;
    p.rect(px, barY, bw0, 14);
    p.noStroke();
    for (const c0 of lweCandidates) {
      const x0 = px + (c0 / q) * bw0;
      p.fill(c0 === secret ? '#f7c948' : '#3fb950');
      p.rect(x0, barY, Math.max(2, bw0 / q), 14);
    }
    p.fill('#8b949e');
    p.textSize(10.5);
    p.text('0 ……… q（黄 = 真实 s）', px, barY + 26);
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('q 大 + k=1：候选多；k=3：候选唯一但穷举 q 次。', px, barY + 46);
  };
};

new p5(sketch);
