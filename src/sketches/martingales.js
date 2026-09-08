// Martingales — random walk CLT, gambler's ruin, doubling strategy
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let mode = 'walk'; // walk | ruin | double
  let nSteps = 400;
  let ruinStart = 3;
  let ruinTarget = 10;
  let cap = 10;
  let walkEnds = [];
  let walkPath = [];
  let ruinFreq = 0;
  let doubleStats = null; // {runs, bankrupt, doubled, net}
  const TRIALS = 3000;

  // ---------------- random walk ----------------
  function runWalk() {
    walkEnds = [];
    for (let t = 0; t < TRIALS; t++) {
      let x = 0;
      if (t === 0) walkPath = [0];
      for (let i = 0; i < nSteps; i++) {
        x += Math.random() < 0.5 ? 1 : -1;
        if (t === 0) walkPath.push(x);
      }
      walkEnds.push(x);
    }
  }

  // ---------------- ruin ----------------
  function runRuin() {
    let bank = 0;
    let surv = 0;
    for (let t = 0; t < TRIALS; t++) {
      let x = ruinStart;
      while (x > 0 && x < ruinTarget) {
        x += Math.random() < 0.5 ? 1 : -1;
      }
      if (x === 0) bank++;
      else surv++;
    }
    ruinFreq = bank / TRIALS;
  }

  // ---------------- doubling ----------------
  function runDoubling() {
    const runs = 200;
    let bank = 0;
    let dbl = 0;
    const target = 2 * cap;
    for (let t = 0; t < runs; t++) {
      let wealth = cap;
      let done = false;
      while (!done) {
        // one session: bet 1, double until a win; then bank +1
        let bet = 1;
        let streak = 0;
        while (true) {
          if (bet > wealth) {
            // cannot cover -> bankrupt
            bank++;
            done = true;
            break;
          }
          wealth -= bet;
          if (Math.random() < 0.5) {
            // win: recover losses + 1
            wealth += 2 * bet;
            break;
          }
          bet *= 2;
          streak++;
          if (streak > 40) {
            bank++;
            done = true;
            break;
          }
        }
        if (done) break;
        if (wealth >= target) {
          dbl++;
          done = true;
        }
      }
    }
    doubleStats = { runs, bankrupt: bank, doubled: dbl };
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(760, p.windowWidth - 40), 560).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('🚶 随机游走', () => { mode = 'walk'; runWalk(); }, '#58a6ff'));
    ctrl.appendChild(mk('🏦 赌徒破产', () => { mode = 'ruin'; runRuin(); }, '#f78166'));
    ctrl.appendChild(mk('🃏 加倍下注', () => { mode = 'double'; runDoubling(); }, '#f7c948'));
    ctrl.appendChild(mk('🎲 重新模拟', () => {
      if (mode === 'walk') runWalk();
      else if (mode === 'ruin') runRuin();
      else runDoubling();
    }, '#3fb950'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin:4px 2px';
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
      sl.style.cssText = 'width:120px;accent-color:#58a6ff;cursor:pointer';
      sl.addEventListener('input', () => cb(parseInt(sl.value)));
      sl.addEventListener('change', () => {
        if (mode === 'walk') runWalk();
        else if (mode === 'ruin') runRuin();
        else runDoubling();
      });
      wrap.appendChild(sl);
      return wrap;
    };
    row.appendChild(mkSl('步数 n', 10, 2000, nSteps, (v) => { nSteps = v; }));
    row.appendChild(mkSl('本金 i', 1, 9, ruinStart, (v) => { ruinStart = v; }));
    row.appendChild(mkSl('目标 N', 10, 100, ruinTarget, (v) => { ruinTarget = v; }));
    row.appendChild(mkSl('资本 M', 4, 60, cap, (v) => { cap = v; }));
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '① 3000 条随机游走终点的直方图 → 钟形（CLT）。② 破产频率 vs 理论 (N−i)/N。③ 加倍策略（本金 M、翻倍即收）：观察"清零"如何周期性抹掉小赢——期望恒 0。滑块松手后重新模拟。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    runWalk();
  };

  // ------------ draw helpers ------------
  function hist(vals, lo, hi, bins) {
    const h = new Array(bins).fill(0);
    for (const v of vals) {
      const b = Math.floor(((v - lo) / (hi - lo)) * bins);
      if (b >= 0 && b < bins) h[b]++;
    }
    return h;
  }

  p.draw = () => {
    p.background('#0d1117');
    p.textAlign(p.LEFT, p.TOP);

    if (mode === 'walk') {
      const lo = -Math.ceil(Math.sqrt(nSteps) * 4 + 4);
      const hi = -lo;
      const bins = 80;
      const h = hist(walkEnds, lo, hi, bins);
      const maxH = Math.max(...h, 1);
      const px = 90;
      const py = 60;
      const pw = p.width - px - 100;
      const ph = 300;
      const bw = pw / bins;
      for (let i = 0; i < bins; i++) {
        const bh = (h[i] / maxH) * (ph - 10);
        p.fill('#58a6ff');
        p.rect(px + i * bw, py + ph - bh, bw - 1, bh);
      }
      // gaussian overlay scaled
      p.noFill();
      p.stroke('#f78166');
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i <= bins; i++) {
        const x = lo + (i / bins) * (hi - lo);
        const d = Math.exp((-x * x) / (2 * nSteps)) / Math.sqrt(2 * Math.PI * nSteps);
        const count = d * (hi - lo) * TRIALS / bins;
        const yv = py + ph - (count / maxH) * (ph - 10);
        p.vertex(px + i * bw, yv);
      }
      p.endShape();
      // stats
      p.noStroke();
      p.fill('#c9d1d9');
      p.textSize(13);
      let s = 0;
      let s2 = 0;
      for (const v of walkEnds) {
        s += v;
        s2 += v * v;
      }
      s /= TRIALS;
      s2 /= TRIALS;
      p.text('随机游走终点（3000 条，n=' + nSteps + '）：经验均值 ' + s.toFixed(2) + '、二阶矩 ' + s2.toFixed(0) + ' ≈ n=' + nSteps, px, py + ph + 20);
      p.fill('#3fb950');
      p.text('CLT：分布 ≈ N(0, n)，标准差 √n = ' + Math.sqrt(nSteps).toFixed(1), px, py + ph + 42);
      // small path on the right
      const sxp = p.width - 170;
      p.fill('#8b949e');
      p.textSize(11);
      p.text('一条路径', sxp, 60);
      p.stroke('#f7c948');
      p.strokeWeight(1.6);
      p.noFill();
      p.beginShape();
      const nP = walkPath.length;
      for (let i = 0; i < nP; i++) {
        p.vertex(sxp + (i / Math.max(1, nP - 1)) * 150, 300 - walkPath[i] * 2);
      }
      p.endShape();
    } else if (mode === 'ruin') {
      const theory = (ruinTarget - ruinStart) / ruinTarget;
      const px = 90;
      const py = 80;
      const ph = 260;
      p.fill('#c9d1d9');
      p.textSize(15);
      p.text('赌徒破产：本金 ' + ruinStart + '，目标 ' + ruinTarget, px, py - 40);
      // bars
      p.noStroke();
      p.fill('#f85149');
      const bh1 = theory * ph;
      p.rect(px, py + ph - bh1, 90, bh1);
      p.fill('#58a6ff');
      const bh2 = (1 - theory) * ph;
      p.rect(px + 120, py + ph - bh2, 90, bh2);
      p.fill('#c9d1d9');
      p.textSize(13);
      p.text('理论破产 ' + (theory * 100).toFixed(1) + '%', px - 10, py + ph - bh1 - 12);
      p.text('理论到目标 ' + ((1 - theory) * 100).toFixed(1) + '%', px + 110, py + ph - bh2 - 12);
      p.text('蒙特卡洛破产 ' + (ruinFreq * 100).toFixed(1) + '%', px + 240, py + 40);
      p.fill('#8b949e');
      p.textSize(11.5);
      p.text('目标 N 越大，破产越接近必然：一维随机游走常返。', px, py + ph + 30);
      p.text('画布：把 N 拉到 100、本金 1 → 破产 ≈99%。', px, py + ph + 52);
    } else {
      // doubling
      const px = 80;
      const py = 80;
      p.fill('#c9d1d9');
      p.textSize(15);
      p.text('加倍策略（资本 M=' + cap + '，翻倍即收手）', px, py - 40);
      if (doubleStats) {
        const br = doubleStats.bankrupt / doubleStats.runs;
        const db = doubleStats.doubled / doubleStats.runs;
        p.fill('#f85149');
        p.textSize(14);
        p.text('清零（破产）频率：' + (br * 100).toFixed(1) + '%', px, py);
        p.fill('#3fb950');
        p.text('成功翻倍频率：' + (db * 100).toFixed(1) + '%', px, py + 28);
        p.fill('#8b949e');
        p.textSize(12);
        p.text('破产损失 ≈ M，成功收益 = M（翻倍）；频率加权后期望 ≈ 0。', px, py + 60);
        // bar
        p.noStroke();
        p.fill('#f85149');
        const bw1 = br * 300;
        p.rect(px, py + 92, Math.max(2, bw1), 26);
        p.fill('#3fb950');
        p.rect(px + 320, py + 92, Math.max(2, db * 300), 26);
        p.fill('#8b949e');
        p.textSize(11);
        p.text('破产  →', px, py + 128);
        p.text('翻倍 →', px + 320, py + 128);
      }
      p.fill('#8b949e');
      p.textSize(11.5);
      p.text('若资本无限："几乎必然赢 1 元"（无界停时破坏公平）；', px, py + 170);
      p.text('资本有限 = 下注上限：小赢高频、清零罕见但巨亏——总期望 0。', px, py + 192);
    }
  };
};

new p5(sketch);
