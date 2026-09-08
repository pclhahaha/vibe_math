// P vs NP — SAT: verify one row vs brute-force scan 2^n rows
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  // formulas as arrays of clauses; literal = signed var (1-based, negative = negated)
  const PRESETS = [
    {
      name: '可满足（多数解）',
      n: 3,
      clauses: [
        [1, 2, -3],
        [-1, 2, 3],
        [1, -2, 3],
      ],
    },
    {
      name: '长链（少解）',
      n: 4,
      clauses: [
        [1, -2],
        [2, -3],
        [3, -4],
        [-1, 4],
      ],
    },
    {
      name: '不可满足',
      n: 2,
      clauses: [
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ],
    },
  ];

  let cur = PRESETS[0];
  let satRows = [];
  let sel = -1;
  let scanMsg = '';
  const N_VAR_HEAD = 46;

  const evalRow = (a) => {
    for (const cl of cur.clauses) {
      let ok = false;
      for (const lit of cl) {
        const varIdx = Math.abs(lit) - 1;
        const val = (a >> (cur.n - 1 - varIdx)) & 1;
        if ((lit > 0 && val === 1) || (lit < 0 && val === 0)) {
          ok = true;
          break;
        }
      }
      if (!ok) return false;
    }
    return true;
  };
  const bitsOf = (a) => {
    const out = [];
    for (let i = 0; i < cur.n; i++) out.push((a >> (cur.n - 1 - i)) & 1);
    return out;
  };
  const firstBad = (a) => {
    for (let j = 0; j < cur.clauses.length; j++) {
      let ok = false;
      for (const lit of cur.clauses[j]) {
        const varIdx = Math.abs(lit) - 1;
        const val = (a >> (cur.n - 1 - varIdx)) & 1;
        if ((lit > 0 && val === 1) || (lit < 0 && val === 0)) {
          ok = true;
          break;
        }
      }
      if (!ok) return j;
    }
    return -1;
  };
  const fmtClause = (cl) =>
    '(' +
    cl
      .map((lit) => {
        const name = 'x' + Math.abs(lit);
        return lit < 0 ? '¬' + name : name;
      })
      .join('∨') +
    ')';

  function loadPreset(i) {
    cur = PRESETS[i];
    satRows = [];
    for (let a = 0; a < 1 << cur.n; a++) if (evalRow(a)) satRows.push(a);
    sel = satRows.length ? satRows[0] : -1;
    scanMsg = '';
  }

  // geometry
  const LEFT = 14;
  const TOP = 40;
  const COLW = 26;
  const RIGHT = 268; // info panel x
  const rowH = () => Math.min(19, Math.max(13, Math.floor((p.height - TOP - 96) / (1 << cur.n))));
  const tableW = () => N_VAR_HEAD + cur.n * COLW + 46;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(580, p.windowWidth - 40), 560).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    PRESETS.forEach((pr, i) => {
      const b = document.createElement('button');
      b.textContent = pr.name;
      b.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:2px';
      b.addEventListener('click', () => loadPreset(i));
      ctrl.appendChild(b);
    });
    const scanBtn = document.createElement('button');
    scanBtn.textContent = '🚀 暴力搜索';
    scanBtn.style.cssText =
      'background:#161b22;color:#f78166;border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:2px';
    scanBtn.addEventListener('click', () => {
      const rows = 1 << cur.n;
      if (satRows.length === 0) {
        scanMsg = `扫完 2^${cur.n} = ${rows} 行仍无解——证明"不可满足"必须遍历全表。`;
        return;
      }
      const foundAt = satRows[0];
      scanMsg = `从行 0 扫到行 ${foundAt}，查了 ${foundAt + 1} 行才找到证书；最坏要查满 ${rows} 行。`;
      sel = foundAt;
    });
    ctrl.appendChild(scanBtn);
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent = '绿行 = 使公式为真的赋值（证书）。点击任意行扮演"验证器"：只查这一行（常数步）；而"求解"在最坏情形要扫 2ⁿ 行。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    loadPreset(0);
  };

  p.mousePressed = () => {
    const rh = rowH();
    const rows = 1 << cur.n;
    const x0 = LEFT;
    const y0 = TOP;
    if (p.mouseX >= x0 && p.mouseX <= x0 + tableW() && p.mouseY >= y0 && p.mouseY <= y0 + rows * rh) {
      sel = Math.floor((p.mouseY - y0) / rh);
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    const n = cur.n;
    const rows = 1 << n;
    const rh = rowH();
    const tw = tableW();

    // formula
    p.noStroke();
    p.fill('#58a6ff');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text(cur.clauses.map(fmtClause).join('∧'), LEFT, 10);

    // header
    p.fill('#8b949e');
    p.textSize(12);
    p.text('赋值', LEFT, TOP - 2);
    for (let i = 0; i < n; i++) p.text('x' + (i + 1), LEFT + N_VAR_HEAD + 6 + i * COLW, TOP - 2);
    p.text('满足?', LEFT + N_VAR_HEAD + n * COLW + 6, TOP - 2);

    for (let a = 0; a < rows; a++) {
      const y = TOP + a * rh;
      const sat = satRows.includes(a);
      p.noStroke();
      p.fill(sat ? '#134a26' : '#161b22');
      p.rect(LEFT, y, tw - 2, rh - 1, 3);
      if (a === sel) {
        p.noFill();
        p.stroke('#ffd33d');
        p.strokeWeight(2);
        p.rect(LEFT - 1, y - 1, tw, rh + 1, 4);
      }
      const bits = bitsOf(a);
      p.textSize(11.5);
      for (let i = 0; i < n; i++) {
        p.fill(bits[i] ? '#58a6ff' : '#484f58');
        p.text(String(bits[i]), LEFT + N_VAR_HEAD + 6 + i * COLW + 4, y + rh * 0.26);
      }
      p.fill(sat ? '#3fb950' : '#f85149');
      p.text(sat ? '✓' : '✗', LEFT + N_VAR_HEAD + n * COLW + 8, y + rh * 0.26);
    }

    // ---- right info panel ----
    const px = RIGHT;
    const py = 56;
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('验证器视角（NP）', px, py - 16);
    if (sel >= 0) {
      p.fill('#8b949e');
      p.textSize(11.5);
      p.text('候选证书 w = ' + bitsOf(sel).join(' '), px, py);
      const bad = firstBad(sel);
      if (bad < 0) {
        p.fill('#3fb950');
        p.text('✓ V=1：全部子句为真，证书合法！', px, py + 20);
        p.fill('#8b949e');
        p.text('验证只检查这一行：O(m·n) ≈ 常数步', px, py + 38);
      } else {
        p.fill('#f85149');
        p.text('✗ 子句 ' + fmtClause(cur.clauses[bad]) + ' 为假', px, py + 20);
        p.fill('#8b949e');
        p.text('验证器当场拒绝——但只查了这一行。', px, py + 38);
      }
    } else {
      p.fill('#8b949e');
      p.textSize(11.5);
      p.text('（本公式无满足赋值；点任意行验证失败）', px, py);
    }

    // brute force message
    const by = py + 92;
    p.fill('#f78166');
    p.textSize(13);
    p.text('暴力搜索（求解需面对）', px, by - 16);
    p.fill('#c9d1d9');
    p.textSize(11.5);
    p.text(scanMsg || `最坏情形：查满 2^${n} = ${rows} 行。`, px, by);
    p.text('本公式满足赋值：' + satRows.length + ' / ' + rows, px, by + 20);

    // scaling lesson
    const sy = by + 86;
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('把 n 放大：验一行 vs 找一行', px, sy - 8);
    p.textSize(11.5);
    p.fill('#8b949e');
    p.text('n=30：2³⁰ ≈ 10.7 亿行', px, sy + 12);
    p.text('n=60：2⁶⁰ ≈ 1.15×10¹⁸ 行', px, sy + 30);
    p.text('n=80：2⁸⁰ ≈ 1.2×10²⁴ 行', px, sy + 48);
    p.fill('#3fb950');
    p.text('验证任何一行：永远是常数步', px, sy + 70);
  };
};

new p5(sketch);
