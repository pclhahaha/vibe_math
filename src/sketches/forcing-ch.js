// Forcing — build a Cohen real on the binary tree, see it escape every "old" real
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let bits = [];
  const OLD = [
    '01010101010101010101010101010101010101010101010101',
    '10101010101010101010101010101010101010101010101010',
    '00110011001100110011001100110011001100110011001100',
  ];
  let playing = false;
  let depth = 10;

  function stepOnce() {
    bits.push(Math.random() < 0.5 ? 0 : 1);
  }
  function growTo(k) {
    while (bits.length < k) bits.push(Math.random() < 0.5 ? 0 : 1);
  }
  function diffAt(idx, j) {
    const s = OLD[j];
    let d = 0;
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] !== parseInt(s[i % s.length])) d++;
    }
    return d;
  }
  function addOneReal() {
    OLD.push('');
    for (let i = 0; i < 56; i++) OLD[OLD.length - 1] += Math.random() < 0.5 ? '0' : '1';
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(820, p.windowWidth - 40), 560).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('➕ 走一步（0/1）', stepOnce, '#58a6ff'));
    ctrl.appendChild(mk('⏩ 长到 60 位', () => growTo(60), '#58a6ff'));
    ctrl.appendChild(mk('⏯ 自动生长', () => { playing = !playing; }, '#f7c948'));
    ctrl.appendChild(mk('➕ 再加一个"老实数"', addOneReal, '#f78166'));
    ctrl.appendChild(mk('↺ 重置', () => { bits = []; }, '#8b949e'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '每次走一步 = 在 Cohen 条件树上选一个有限 0/1 条件并延长（穿过稠密集 Dₙ）。无限步后得到通用实数 r——与下方每个"老实数"逐位比较，差异数持续为正（r 不属于旧宇宙）。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    if (playing && bits.length < 60) {
      for (let i = 0; i < 3; i++) stepOnce();
    }
    p.textAlign(p.LEFT, p.TOP);

    // ---- path display (recent window) ----
    const show = bits.slice(-32);
    const x0 = 40;
    const y0 = 40;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(15);
    p.text('Cohen 实数 r = 0.' + (bits.slice(0, 24).join('') || '?') + '…（已长 ' + bits.length + ' 位）', x0, 10);

    // draw tree recent window: rows: level k shows bit at index
    const cols = 16;
    const rows = Math.ceil(show.length / cols);
    const cw = 44;
    const ch = 34;
    for (let i = 0; i < show.length; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const b = show[i];
      p.fill(b === 1 ? '#3fb950' : '#1e3a5f');
      p.stroke(b === 1 ? '#3fb950' : '#1e3a5f');
      p.strokeWeight(1);
      p.rect(x0 + c * cw, y0 + r * ch, 34, 24, 5);
      p.noStroke();
      p.fill('#0d1117');
      p.textSize(13);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(String(b), x0 + c * cw + 17, y0 + r * ch + 13);
      p.textAlign(p.LEFT, p.TOP);
    }
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.text('（最近 32 位窗口：条件每延长一位，r 的一位被"决定"）', x0, y0 + rows * ch + 8);

    // ---- dense-set notes ----
    const ny = y0 + rows * ch + 36;
    p.fill('#8b949e');
    p.textSize(12);
    p.text('稠密集 Dₙ = {长度≥n}：每走到长度 n，相当于穿过了 D₁…Dₙ。', x0, ny);
    p.text('通用滤 ⟹ 穿过每个 Dₙ ⟹ r 是无限序列。', x0, ny + 20);

    // ---- comparison with old reals ----
    const cy = ny + 60;
    p.fill('#c9d1d9');
    p.textSize(13.5);
    p.text('与"旧宇宙"里的老实数比较（差异位数）：', x0, cy);
    let y = cy + 24;
    for (let j = 0; j < OLD.length; j++) {
      const d = diffAt(j, j);
      p.fill(d > 0 ? '#3fb950' : '#f85149');
      p.textSize(12.5);
      p.text('x' + (j + 1) + ' = 0.' + OLD[j].slice(0, 20) + '…   r≠x' + (j + 1) + '（' + d + ' 位不同）✓', x0, y);
      y += 22;
    }
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('每个老实数 x 都被某个稠密集 E_x="在某位与 x 不同"排除：', x0, y + 4);
    p.text('r 与所有老实数都不同 ⟹ r 是"新"实数。', x0, y + 24);

    // ---- bottom: takeaway ----
    p.fill('#f7c948');
    p.textSize(12.5);
    p.text('κ 个独立 Cohen 实数（ccc 保持基数 ℵ₂）⟹ M[G] ⊨ 2^ℵ₀ ≥ ℵ₂ ⟹ ¬CH。', x0, y + 60);
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('Con(ZFC) ⟹ Con(ZFC+¬CH)（Cohen 1963）；配 Gödel 的 Con(ZFC+CH)：CH 独立。', x0, y + 82);
  };
};

new p5(sketch);
