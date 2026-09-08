// Bifurcation — Logistic map: interactive bifurcation diagram + cobweb
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let mode = 'bif';
  let r = 3.6;
  let x0 = 0.4;
  let bifImg = null;
  const plotL = 6;
  const plotT = 12;
  const plotW = 470;
  const plotH = 300;

  function logistic(x) {
    return r * x * (1 - x);
  }

  function makeBifImage() {
    const g = p.createGraphics(plotW, plotH);
    const R0 = 2.5;
    const R1 = 4.0;
    const steps = 300;
    g.background(13, 17, 23);
    for (let i = 0; i < steps; i++) {
      const rr = R0 + ((i + 0.5) / steps) * (R1 - R0);
      let x = 0.4;
      for (let k = 0; k < 300; k++) x = rr * x * (1 - x);
      for (let k = 0; k < 220; k++) {
        x = rr * x * (1 - x);
        if (x < 0 || x > 1) continue;
        const px = (i / steps) * plotW;
        const py = plotH * (1 - x);
        g.stroke(90, 200, 255, 60);
        g.point(px, py);
      }
    }
    // faint stability tips: mark Feigenbaum & period-3 window x positions
    g.stroke(255, 211, 61, 200);
    g.strokeWeight(1);
    bifImg = g;
  }

  function drawCobweb() {
    // axes box mapping x in [0,1]
    const bx = 60;
    const by = 60;
    const bs = 320; // square
    const X = (x) => bx + x * bs;
    const Y = (x) => by + bs - x * bs;
    // frame
    p.noFill();
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(bx, by, bs, bs);
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.line(bx, by + bs, bx + bs, by + bs);
    p.line(bx, by, bx, by + bs);
    // parabola
    p.stroke('#58a6ff');
    p.strokeWeight(2);
    for (let i = 0; i < 120; i++) {
      const x1 = i / 120;
      const x2 = (i + 1) / 120;
      p.line(X(x1), Y(logistic(x1)), X(x2), Y(logistic(x2)));
    }
    // diagonal
    p.stroke('#8b949e');
    p.strokeWeight(1.2);
    p.setLineDash([6, 4]);
    p.line(X(0), Y(0), X(1), Y(1));
    p.setLineDash([]);
    // cobweb orbit
    let x = x0;
    p.stroke('#f7c948');
    p.strokeWeight(1.6);
    for (let i = 0; i < 260; i++) {
      const yv = logistic(x);
      const xNext = yv;
      p.line(X(x), Y(x), X(x), Y(yv));
      p.line(X(x), Y(yv), X(xNext), Y(yv));
      x = xNext;
      if (i === 0) {
        p.noStroke();
        p.fill('#ffd33d');
        p.circle(X(x0), Y(x0), 6);
      }
      if (Math.abs(x - x0) < 1e-9 && i > 2) break;
    }
    // axes labels
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('0', bx - 10, by + bs + 2);
    p.text('1', bx + bs + 2, by + bs + 2);
    p.text('x₀=0.4', bx - 44, by + bs + 24);
    p.text('r = ' + r.toFixed(4), bx, by - 24);
    // fixed point x*=1-1/r marker
    if (r > 1) {
      p.noStroke();
      p.fill('#3fb950');
      p.textSize(11);
      p.text('x* = ' + (1 - 1 / r).toFixed(4), bx, by + bs + 40);
    }
    // time series strip
    const sy0 = by + bs + 66;
    p.fill('#8b949e');
    p.textSize(11);
    p.text('时间序列 xₙ（最近 120 步）', bx, sy0);
    let y = x0;
    const hist = [];
    for (let i = 0; i < 260; i++) {
      y = logistic(y);
      if (i >= 140) hist.push(y);
    }
    const tw = 260;
    const th = 60;
    for (let i = 1; i < hist.length; i++) {
      p.stroke('#3fb950');
      p.strokeWeight(1.6);
      p.line(
        bx + ((i - 1) / (hist.length - 1)) * tw,
        sy0 + 16 + (1 - hist[i - 1]) * th,
        bx + (i / (hist.length - 1)) * tw,
        sy0 + 16 + (1 - hist[i]) * th
      );
    }
    // period hint
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(11);
    p.text('周期 ≈ ' + detectPeriod().toFixed(0) + (detectPeriod() > 40 ? '（混沌/长周期）' : ''), bx + tw + 16, sy0 + 30);
  }

  function detectPeriod() {
    let y = x0;
    const arr = [];
    for (let i = 0; i < 600; i++) {
      y = logistic(y);
      arr.push(y);
    }
    for (let per = 1; per <= 40; per++) {
      let ok = true;
      for (let i = 0; i < 200; i++) {
        if (Math.abs(arr[arr.length - 1 - i] - arr[arr.length - 1 - i - per]) > 1e-5) {
          ok = false;
          break;
        }
      }
      if (ok) return per;
    }
    return 99;
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(680, p.windowWidth - 40), 600).parent('p5canvas');
    makeBifImage();

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.72em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('🧭 分岔图', () => { mode = 'bif'; }, '#58a6ff'));
    ctrl.appendChild(mk('🕸️ 蛛网', () => { mode = 'web'; }, '#f7c948'));
    ctrl.appendChild(document.createTextNode(' r：'));
    [2.8, 3.2, 3.5, 3.8284, 3.9, 4.0].forEach((rr) => {
      ctrl.appendChild(mk(String(rr), () => { r = rr; mode = 'web'; }, '#8b949e'));
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.75em';
    lab.textContent = 'r：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0.1';
    sl.max = '4.0';
    sl.step = '0.0005';
    sl.value = String(r);
    sl.style.cssText = 'width:240px;accent-color:#f7c948;cursor:pointer';
    sl.addEventListener('input', () => {
      r = parseFloat(sl.value);
    });
    row.appendChild(sl);
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '分岔图：每个 r 迭代 300+220 步画轨迹。点击图内任意点跳到对应 r（r 轴 2.5→4）。蛛网模式：拖动 r 滑杆，观察稳定点→2-环→级联→混沌；周期 3 窗口 r≈3.8284 内部有缩微分岔图。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mousePressed = () => {
    if (mode !== 'bif') return;
    if (p.mouseX >= plotL && p.mouseX <= plotL + plotW && p.mouseY >= plotT && p.mouseY <= plotT + plotH) {
      const rr = 2.5 + ((p.mouseX - plotL) / plotW) * 1.5;
      r = rr;
      const sl = document.querySelector('input[type=range]');
      if (sl) sl.value = String(rr.toFixed(4));
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    if (mode === 'bif') {
      p.noStroke();
      p.fill('#c9d1d9');
      p.textSize(14);
      p.textAlign(p.LEFT, p.TOP);
      p.text('Logistic 分岔图：x_{n+1} = r·xₙ(1−xₙ)（r: 2.5 → 4，点击选 r）', plotL, 4);
      p.image(bifImg, plotL, plotT + 12, plotW, plotH);
      // r cursor
      const cx = plotL + ((r - 2.5) / 1.5) * plotW;
      p.stroke('#ffd33d');
      p.strokeWeight(1.5);
      p.setLineDash([4, 3]);
      p.line(cx, plotT, cx, plotT + plotH + 12);
      p.setLineDash([]);
      p.noStroke();
      p.fill('#ffd33d');
      p.text('r = ' + r.toFixed(4), cx - 30, plotT + plotH + 22);
      p.fill('#8b949e');
      p.textSize(11.5);
      p.text('r=3（×2 分岔）  r≈3.449（×4）  r_∞≈3.5699（混沌开始）  r≈3.8284（周期3窗口）', plotL, plotT + plotH + 46);
    } else {
      p.textAlign(p.LEFT, p.TOP);
      drawCobweb();
    }
  };
};

new p5(sketch);
