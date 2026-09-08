// Algebraic Number Theory — lattice of Z[sqrt(d)] (d<0), units, and factorizations of 6
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const FIELDS = [
    { d: -1, name: 'ℤ[i]（高斯整数）', h: 1 },
    { d: -2, name: 'ℤ[√−2]', h: 1 },
    { d: -5, name: 'ℤ[√−5]', h: 2 },
    { d: -6, name: 'ℤ[√−6]', h: 2 },
    { d: -10, name: 'ℤ[√−10]', h: 2 },
    { d: -13, name: 'ℤ[√−13]', h: 2 },
  ];
  let field = FIELDS[2]; // start at Z[sqrt(-5)]
  let chains = []; // list of arrays of element keys for target 6
  const B = 9; // half lattice range

  const el = (a, b) => ({ a, b });
  const norm = (z) => z.a * z.a - field.d * z.b * z.b;
  const mul = (x, y) => ({
    a: x.a * y.a + field.d * x.b * y.b,
    b: x.a * y.b + x.b * y.a,
  });
  // returns delta with gamma*delta = t, or null
  function quotient(t, gamma) {
    const N = norm(gamma);
    if (N === 0) return null;
    const c = (gamma.a * t.a - field.d * gamma.b * t.b) / N;
    const e = (gamma.a * t.b - gamma.b * t.a) / N;
    const rc = Math.round(c);
    const re = Math.round(e);
    if (Math.abs(c - rc) > 1e-6 || Math.abs(e - re) > 1e-6) return null;
    const d0 = el(rc, re);
    const prod = mul(gamma, d0);
    if (prod.a === t.a && prod.b === t.b) return d0;
    return null;
  }
  // canonical representative up to units: b>0, or b==0 && a>0
  function canon(z) {
    if (z.b > 0) return { a: z.a, b: z.b };
    if (z.b < 0) return { a: -z.a, b: -z.b };
    return { a: Math.abs(z.a), b: 0 };
  }
  const keyOf = (z) => z.a + ',' + z.b;
  function isUnit(z) {
    return norm(z) === 1 && !(z.a === 0 && z.b === 0);
  }
  function irreducible(z) {
    const n = norm(z);
    for (let aa = -6; aa <= 6; aa++) {
      for (let bb = -6; bb <= 6; bb++) {
        const g = el(aa, bb);
        if (isUnit(g) || (aa === 0 && bb === 0)) continue;
        const ng = norm(g);
        if (ng >= n) continue;
        const q = quotient(z, g);
        if (q && !isUnit(q)) return false;
      }
    }
    return true;
  }
  function factorChains(t, minKey, depth) {
    // returns array of arrays of canonical keys, first factor key >= minKey
    if (depth > 6) return [];
    const out = [];
    const seen = {};
    const n = norm(t);
    for (let aa = -6; aa <= 6; aa++) {
      for (let bb = -6; bb <= 6; bb++) {
        const g = el(aa, bb);
        if (isUnit(g)) continue;
        const cg = canon(g);
        const ck = keyOf(cg);
        if (ck < minKey) continue;
        if (norm(g) > n) continue;
        if (!irreducible(g)) continue;
        if (seen[ck]) continue;
        seen[ck] = 1;
        const q = quotient(t, g);
        if (!q) continue;
        const cq = canon(q);
        const tail =
          isUnit(q) || norm(q) === 1
            ? [[]]
            : factorChains(mulToEl(q), ck, depth + 1);
        for (const tailChain of tail) {
          const chain = [ck].concat(tailChain);
          if (out.length < 30) out.push(chain);
        }
      }
    }
    return out;
  }
  function mulToEl(q) {
    return el(q.a, q.b);
  }
  function computeChains() {
    const t = el(6, 0);
    chains = [];
    const seen = {};
    const raw = factorChains(t, '-999', 0);
    for (const ch of raw) {
      const s = ch.join('|');
      if (!seen[s]) {
        seen[s] = 1;
        chains.push(ch);
      }
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(720, p.windowWidth - 40), 620).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    FIELDS.forEach((f) => {
      const b = document.createElement('button');
      b.textContent = f.name + '（h=' + f.h + '）';
      b.style.cssText = 'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:3px 9px;border-radius:6px;cursor:pointer;font-size:0.72em;margin:2px';
      b.addEventListener('click', () => {
        field = f;
        computeChains();
      });
      ctrl.appendChild(b);
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '格点 = ℤ[√d] 的元素 a+b√d（画在复平面 a + b√|d|·i）。颜色 = 范数 a²+|d|b²；黄圈 = 单位。右栏：元素 6 的"不可约分解链"——UFD（h=1）只有 1 条，ℤ[√−5]（h=2）有 2 条。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    computeChains();
  };

  const fmt = (z) => {
    if (z.b === 0) return String(z.a);
    const s = Math.abs(z.b) === 1 ? (z.b > 0 ? '' : '−') : String(Math.abs(z.b));
    const sq = '√' + Math.abs(field.d);
    const sign = z.b > 0 ? '+' : '−';
    return z.a === 0 ? (z.b > 0 ? '' : '−') + s + sq : z.a + sign + s + sq;
  };

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);
    const sc = Math.min(30, 380 / (2 * Math.max(B, Math.ceil(B * Math.sqrt(Math.abs(field.d)))) + 8));
    const cx = 210;
    const cy = 300;
    const sx = (a, b) => cx + a * sc;
    const sy = (a, b) => cy - b * Math.sqrt(Math.abs(field.d)) * sc;

    // lattice points
    for (let a = -B; a <= B; a++) {
      for (let b = -B; b <= B; b++) {
        const n = norm(el(a, b));
        const t = Math.min(1, Math.log(1 + n) / Math.log(1 + 200));
        p.noStroke();
        if (n === 1) p.fill('#ffd33d');
        else if (n === 0) continue;
        else p.fill(30 + 160 * (1 - t), 40 + 60 * t, 160);
        p.circle(sx(a, b), sy(a, b), n === 1 ? 9 : 5);
        if (n === 1) {
          p.noFill();
          p.stroke('#ffd33d');
          p.strokeWeight(1);
          p.circle(sx(a, b), sy(a, b), 13);
        }
      }
    }
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.line(sx(-B, 0), sy(-B, 0), sx(B, 0), sy(B, 0));
    p.line(sx(0, -B), sy(0, -B), sx(0, B), sy(0, B));

    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(14);
    p.text(field.name + '　O_K 的格点（范数 a²+' + Math.abs(field.d) + 'b²）', 14, 10);
    p.fill('#8b949e');
    p.textSize(12);
    p.text('黄圈 = 单位（N=1）', 14, 34);
    p.text('点击右侧文字可试更多元素（当前固定 6）', 14, 52);

    // right info
    const ix = 470;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(15);
    p.text('6 的不可约分解（到单位、次序）', ix, 60);
    p.text('链条数：' + chains.length, ix, 86);
    p.fill(chains.length === 1 ? '#3fb950' : '#f78166');
    p.text('类数 h=' + field.h + (field.h === 1 ? '（UFD ⟹ 唯一分解）' : '（非 UFD ⟹ 多条分解）'), ix, 110);
    let y = 148;
    for (let i = 0; i < Math.min(chains.length, 6); i++) {
      const ch = chains[i];
      const txt = ch.map((k) => {
        const [a, b] = k.split(',').map(Number);
        return fmt(el(a, b));
      }).join(' · ');
      p.fill('#8b949e');
      p.textSize(13);
      p.text('分解 ' + (i + 1) + '：', ix, y);
      p.fill('#c9d1d9');
      p.textSize(12.5);
      p.text(txt, ix + 70, y);
      y += 26;
    }
    // highlight factors of first chain on lattice
    if (chains.length && chains[0]) {
      const marks = [
        [2, 0],
        [1, 1],
      ];
      p.noFill();
      p.stroke('#f7c948');
      p.strokeWeight(1.4);
      for (const [a, b] of marks) {
        p.circle(sx(a, b), sy(a, b), 16);
      }
    }
    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('例：6 = 2·3 = (1+√−5)(1−√−5)', ix, y + 14);
    p.text('两链不可约因子互不关联 ⟹ 非 UFD。', ix, y + 34);
    p.text('（ℤ[i] 中 2 可再分：2=−i(1+i)²，链唯一）', ix, y + 54);

    // legend for norm scale
    p.fill('#8b949e');
    p.textSize(10.5);
    p.text('范数色阶：亮 = 小', 14, 590);
    p.text('暗 = 大', 14, 604);
  };
};

new p5(sketch);
