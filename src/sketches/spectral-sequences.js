// Spectral Sequences — Leray–Serre for Hopf fibration: pages E2 -> E3 = Einfty
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let page = 2; // 2 or 3
  const CELLS = [
    { p: 0, q: 0, id: 'A' },
    { p: 0, q: 1, id: 'B' },
    { p: 2, q: 0, id: 'C' },
    { p: 2, q: 1, id: 'D' },
  ];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(820, p.windowWidth - 40), 580).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.76em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('E₂ 页', () => { page = 2; }, '#58a6ff'));
    ctrl.appendChild(mk('E₃ = E_∞ 页', () => { page = 3; }, '#f7c948'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      'Hopf 纤维化 S¹→S³→S² 的 Leray–Serre 谱序列。E₂ 有四个 ℤ（青格点）；唯一差分 d₂ 把 (0,1) 打到 (2,0)（橙箭头），两格同归于尽。翻到 E₃：只剩 (0,0) 与 (2,1)——即 H⁰ 与 H³(S³)。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  const alive = () => {
    if (page === 2) return ['A', 'B', 'C', 'D'];
    return ['A', 'D']; // E3=E_inf
  };

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);
    const x0 = 120;
    const y0 = 90;
    const cw = 90;
    const ch = 74;
    const aliveSet = new Set(alive());
    const deadSet = ['B', 'C'].filter((id) => !aliveSet.has(id));

    // axes labels
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(12);
    for (let pp = 0; pp <= 3; pp++) p.text('p=' + pp, x0 + pp * cw + 24, y0 - 24);
    for (let qq = 0; qq <= 2; qq++) p.text('q=' + qq, x0 - 56, y0 + qq * ch + 24);

    // grid: draw all four cells state
    for (const cell of CELLS) {
      const x = x0 + cell.p * cw;
      const y = y0 + cell.q * ch;
      const on = aliveSet.has(cell.id);
      p.noStroke();
      p.fill(on ? '#14324a' : '#161b22');
      p.stroke(on ? '#58a6ff' : '#30363d');
      p.strokeWeight(on ? 1.6 : 1);
      p.rect(x, y, cw - 4, ch - 4, 8);
      p.noStroke();
      p.fill(on ? '#58a6ff' : '#484f58');
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(on ? 'ℤ' : '0', x + (cw - 4) / 2, y + (ch - 4) / 2);
      p.textAlign(p.LEFT, p.TOP);
      // degree corner label
      p.fill('#8b949e');
      p.textSize(10.5);
      p.text(cell.id + '(总度' + (cell.p + cell.q) + ')', x + 6, y + 4);
    }

    // d2 arrow B -> C on page 2
    if (page === 2) {
      const B = CELLS[1];
      const C = CELLS[2];
      const x1 = x0 + B.p * cw + (cw - 4) / 2;
      const y1 = y0 + B.q * ch + (ch - 4) / 2;
      const x2 = x0 + C.p * cw + (cw - 4) / 2;
      const y2 = y0 + C.q * ch + (ch - 4) / 2;
      p.stroke('#f78166');
      p.strokeWeight(3);
      p.line(x1 + 8, y1 + 6, x2 - 6, y2 - 6);
      // arrowhead
      const ang = Math.atan2(y2 - 6 - (y1 + 6), x2 - 6 - (x1 + 8));
      const hx = x2 - 6;
      const hy = y2 - 6;
      p.noStroke();
      p.fill('#f78166');
      p.triangle(hx, hy, hx - 14 * Math.cos(ang - 0.4), hy - 14 * Math.sin(ang - 0.4), hx - 14 * Math.cos(ang + 0.4), hy - 14 * Math.sin(ang + 0.4));
      p.noStroke();
      p.fill('#f78166');
      p.textSize(13);
      p.text('d₂', (x1 + x2) / 2 - 8, (y1 + y2) / 2 - 4);
    }

    // header
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(16);
    p.text('Hopf：E' + (page === 2 ? '₂' : '₃ = E_∞') + '（Leray–Serre：E₂ = H*(S²; H*(S¹))）', x0 - 40, 22);

    // right column conclusions
    const rx = x0 + 3 * cw + 46;
    p.fill('#c9d1d9');
    p.textSize(13.5);
    p.text('结论', rx, 60);
    const lines = [];
    if (page === 2) {
      lines.push('• E₂：四格 ℤ（B、C 待死）');
      lines.push('• 唯一可能差分 d₂:(0,1)→(2,0)');
      lines.push('• 若 d₂=0 ⟹ 坍缩，S³ 像 S²×S¹（错！）');
      lines.push('• H¹(S³)=H²(S³)=0 强迫 d₂ 同构');
      lines.push('• transgression：纤维类跨界到底类');
    } else {
      lines.push('• B、C 被 d₂ 消除（同归于尽）');
      lines.push('• 存活：A=(0,0)、D=(2,1)');
      lines.push('• H⁰(S³)=ℤ、(2,1)总度 3 ⟹ H³=ℤ');
      lines.push('• H¹=H²=0 ✓ 与庞加莱对偶一致');
      lines.push('• E_∞ 只给 graded；无扩张问题 ✓');
    }
    let y = 92;
    p.fill('#8b949e');
    p.textSize(12.5);
    for (const l of lines) {
      p.text(l, rx, y);
      y += 24;
    }

    // footer
    p.fill('#8b949e');
    p.textSize(12);
    p.text('公式：E_{r+1}=H(E_r, d_r)；d_r 从 (p,q) 到 (p+r,q−r+1)。', x0 - 40, 480);
    p.fill('#484f58');
    p.textSize(11.5);
    p.text('真正的功夫在算 d₂：本例由 H¹(S³)=0 逼迫。extension problem 仍在"最后一公里"等你。', x0 - 40, 504);
  };
};

new p5(sketch);
