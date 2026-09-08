// Cryptography — tiny RSA lab: keygen, encrypt/decrypt, brute-force factoring demo
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let pv = 61;
  let qv = 53;
  let ev = 17;
  let mv = 65;
  let n = 0;
  let phi = 0;
  let d = 0;
  let c = 0;
  let dec = 0;
  let steps = 0; // trial divisions needed
  let out = [];

  const isPrime = (x) => {
    if (x < 2) return false;
    for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;
    return true;
  };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const powmod = (base, ex, mod) => {
    let r = 1;
    base %= mod;
    while (ex > 0) {
      if (ex % 2) r = (r * base) % mod;
      base = (base * base) % mod;
      ex = Math.floor(ex / 2);
    }
    return r;
  };
  const invmod = (a, m) => {
    // extended euclid
    let [old_r, r] = [a, m];
    let [old_s, s] = [1, 0];
    while (r !== 0) {
      const q = Math.floor(old_r / r);
      [old_r, r] = [r, old_r - q * r];
      [old_s, s] = [s, old_s - q * s];
    }
    return ((old_s % m) + m) % m;
  };

  function compute() {
    pv = Math.max(2, Math.floor(pv));
    qv = Math.max(2, Math.floor(qv));
    n = pv * qv;
    phi = (pv - 1) * (qv - 1);
    out = [];
    if (!isPrime(pv) || !isPrime(qv)) {
      out.push('⚠ p 或 q 不是素数——RSA 需要素数（n 的分解才困难）。');
    }
    if (gcd(ev, phi) !== 1) {
      out.push('⚠ e 与 φ(n) 不互素：没有解密指数，请换 e。');
    }
    ev = Math.max(2, Math.floor(ev));
    if (gcd(ev, phi) === 1) {
      d = invmod(ev, phi);
      mv = ((Math.floor(mv) % n) + n) % n;
      c = powmod(mv, ev, n);
      dec = powmod(c, d, n);
    }
    // brute force trial division: steps to find first factor
    steps = 0;
    if (isPrime(pv) && isPrime(qv) && pv !== qv) {
      const small = Math.min(pv, qv);
      for (let i = 2; i <= small; i++) {
        steps++;
        if (n % i === 0) break;
      }
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(600, p.windowWidth - 40), 480).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    [[61, 53, 17, 65], [5, 11, 3, 7], [7, 13, 5, 10], [17, 19, 7, 42]].forEach(([pp, qq, ee, mm], i) => {
      const b = document.createElement('button');
      b.textContent = ['经典 61·53', '微型 5·11', '小 7·13', '中 17·19'][i];
      b.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', () => {
        pv = pp; qv = qq; ev = ee; mv = mm;
        syncInputs();
        compute();
      });
      ctrl.appendChild(b);
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0;font-size:0.76em;color:#8b949e';
    row.innerHTML =
      'p <input id="inP" style="width:56px">  q <input id="inQ" style="width:56px">  e <input id="inE" style="width:56px">  消息 m <input id="inM" style="width:90px">';
    row.querySelectorAll('input').forEach((el) => {
      el.style.cssText +=
        ';background:#161b22;border:1px solid #30363d;color:#c9d1d9;border-radius:5px;padding:3px 6px;font-size:0.95em';
      el.addEventListener('change', () => {
        pv = parseInt(document.getElementById('inP').value) || pv;
        qv = parseInt(document.getElementById('inQ').value) || qv;
        ev = parseInt(document.getElementById('inE').value) || ev;
        mv = parseInt(document.getElementById('inM').value) || mv;
        compute();
      });
    });
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '改 p、q、e、m 或点预设即时重算。右图绿色进度条 = "试除法攻击"找到第一个因子所需的步数（每多 1 位密钥翻倍——真实 2048 位 = 2¹⁰²⁴ 步）。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    syncInputs();
    compute();
  };

  function syncInputs() {
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = String(v);
    };
    set('inP', pv); set('inQ', qv); set('inE', ev); set('inM', mv);
  }

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);

    // --- top-left: parameters & flow ---
    p.fill('#c9d1d9');
    p.textSize(15);
    p.text(`RSA：n = p·q = ${pv}·${qv} = ${n}`, 24, 20);
    p.fill('#8b949e');
    p.textSize(13);
    p.text(`φ(n) = (p−1)(q−1) = ${Math.max(0, (pv - 1) * (qv - 1))}`, 24, 46);
    const okE = pv > 0 && qv > 0 && isPrime(pv) && isPrime(qv) && gcd(ev, phi) === 1;
    p.fill(okE ? '#3fb950' : '#f85149');
    p.text(
      okE
        ? `公钥 (e,n) = (${ev}, ${n})     私钥 d = ${d}      （ed ≡ 1 mod φ）`
        : '参数无效：请选素数 p、q 且 gcd(e, φ)=1（用预设按钮最省事）',
      24,
      72
    );

    // --- flow boxes ---
    const bx = 24;
    const by = 120;
    const bw2 = 120;
    const bh2 = 56;
    const box = (x, y, title, val, col) => {
      p.noStroke();
      p.fill('#161b22');
      p.rect(x, y, bw2, bh2, 8);
      p.stroke(col);
      p.strokeWeight(1.4);
      p.rect(x, y, bw2, bh2, 8);
      p.noStroke();
      p.fill('#8b949e');
      p.textSize(11.5);
      p.text(title, x + 10, y + 8);
      p.fill(col);
      p.textSize(15);
      p.text(val, x + 10, y + 30);
    };
    box(bx, by, '消息 m', String(mv % Math.max(1, n)), '#c9d1d9');
    box(bx + bw2 + 34, by, '密文 c = m^e', String(okE ? c : '—'), '#ffd33d');
    box(bx + 2 * (bw2 + 34), by, '还原 m = c^d', String(okE ? dec : '—'), '#3fb950');
    // arrows
    p.stroke('#484f58');
    p.strokeWeight(2);
    p.line(bx + bw2 + 8, by + bh2 / 2, bx + bw2 + 26, by + bh2 / 2);
    p.line(bx + 2 * bw2 + 42, by + bh2 / 2, bx + 2 * bw2 + 60, by + bh2 / 2);
    p.noStroke();
    p.fill('#484f58');
    p.textSize(10.5);
    p.text('^e mod n', bx + bw2 + 26, by - 4);
    p.text('^d mod n', bx + 2 * bw2 + 60, by - 4);

    // --- brute-force panel ---
    const y2 = by + bh2 + 60;
    p.fill('#f78166');
    p.textSize(14);
    p.text('攻击视角：试除法分解 n（从 2 开始逐个试除）', 24, y2);
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text(`试到第 ${steps} 步找到因子 ${Math.min(pv, qv)}`, 24, y2 + 26);

    // progress bar: first factor position within [2, sqrt(n)]
    const spanX = 24;
    const spanW = p.width - 48;
    const barY = y2 + 48;
    p.noFill();
    p.stroke('#30363d');
    p.strokeWeight(8);
    p.line(spanX, barY, spanX + spanW, barY);
    const limit = Math.sqrt(n);
    const frac = Math.min(1, Math.min(pv, qv) / Math.max(2, limit));
    p.stroke('#3fb950');
    p.strokeWeight(8);
    p.line(spanX, barY, spanX + spanW * frac, barY);
    p.noStroke();
    p.fill('#3fb950');
    p.textSize(11);
    p.text('因子在 √n 的 ' + (frac * 100).toFixed(2) + '% 处', spanX + spanW * frac + 8, barY - 12);

    // scale note
    const y3 = barY + 40;
    p.fill('#8b949e');
    p.textSize(12.5);
    p.text('每给 n 加 1 个二进制位，试除工作量 ×2（翻倍）', 24, y3);
    p.fill('#c9d1d9');
    p.text('真实 RSA：n = 2048 位 ⟹ 试除约 2¹⁰²⁴ 步，宇宙年龄也不够。', 24, y3 + 24);
    p.fill('#f78166');
    p.text('量子 Shor：O((log n)³) ⟹ 几分钟 ⟹ NIST 后量子标准（格密码）已登场。', 24, y3 + 48);

    // warnings
    if (out.length) {
      p.fill('#f85149');
      p.textSize(12);
      p.text(out.join('\n'), 24, y3 + 78);
    }
  };
};

new p5(sketch);
