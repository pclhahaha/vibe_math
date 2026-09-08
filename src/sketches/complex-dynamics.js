// Complex Dynamics — escape-time Julia set + clickable Mandelbrot parameter window
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const N = 200; // julia grid resolution
  const JS = 400; // drawn size (px)
  const jx = 16;
  const jy = 40;
  let c = { re: -0.8, im: 0.156 };
  let maxIter = 120;
  let view = { cx: 0, cy: 0, span: 3.6 };
  let juliaPix = null; // Uint8 escape counts
  let mbPix = null;
  let dirty = true;
  const MB = { x: 450, y: 40, w: 260, h: 130 };

  function juliaIter(zr, zi) {
    const cr = c.re;
    const ci = c.im;
    for (let k = 0; k < maxIter; k++) {
      const zr2 = zr * zr;
      const zi2 = zi * zi;
      if (zr2 + zi2 > 16) return k;
      zi = 2 * zr * zi + ci;
      zr = zr2 - zi2 + cr;
    }
    return -1; // bounded (approx)
  }

  function computeJulia() {
    juliaPix = new Uint16Array(N * N);
    for (let py = 0; py < N; py++) {
      const zi = view.cy + view.span * (0.5 - py / N);
      for (let px = 0; px < N; px++) {
        const zr = view.cx + view.span * (px / N - 0.5);
        juliaPix[py * N + px] = juliaIter(zr, zi);
      }
    }
  }
  function computeMB() {
    const { w, h } = MB;
    mbPix = new Uint16Array(w * h);
    for (let y = 0; y < h; y++) {
      const ci = 1.15 - (y / h) * 2.3;
      for (let x = 0; x < w; x++) {
        const cr = -2.2 + (x / w) * 3.0;
        let zr = 0;
        let zi = 0;
        let k = 0;
        for (; k < 100; k++) {
          const zr2 = zr * zr;
          const zi2 = zi * zi;
          if (zr2 + zi2 > 4) break;
          zi = 2 * zr * zi + ci;
          zr = zr2 - zi2 + cr;
        }
        mbPix[y * w + x] = k >= 100 ? -1 : k;
      }
    }
  }

  function palette(k) {
    const t = k / maxIter;
    // dark blue -> cyan -> yellow-ish
    const r = Math.floor(40 + 200 * t * t);
    const g = Math.floor(60 + 160 * t);
    const b = Math.floor(120 + 100 * (1 - t));
    return [r, g, b];
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(760, p.windowWidth - 40), 560).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, rc, ic, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.72em;margin:2px';
      b.addEventListener('click', () => {
        c = { re: rc, im: ic };
        dirty = true;
      });
      return b;
    };
    ctrl.appendChild(mk('圆 c=0', 0, 0, '#58a6ff'));
    ctrl.appendChild(mk('兔 c≈−0.123+0.745i', -0.123, 0.745, '#58a6ff'));
    ctrl.appendChild(mk('树形 c=−0.8+0.156i', -0.8, 0.156, '#58a6ff'));
    ctrl.appendChild(mk('尘埃 c=1', 1, 0, '#f78166'));
    ctrl.appendChild(mk('线段 c=−2', -2, 0, '#f78166'));
    ctrl.appendChild(mk('c=i', 0, 1, '#58a6ff'));
    ctrl.appendChild(mk('↺ 复位视图', 0, 0, '#8b949e'));
    ctrl.lastChild.addEventListener('click', () => {
      view = { cx: 0, cy: 0, span: 3.6 };
      dirty = true;
    });
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.75em';
    lab.textContent = '最大迭代：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '20';
    sl.max = '300';
    sl.step = '10';
    sl.value = String(maxIter);
    sl.style.cssText = 'width:160px;accent-color:#58a6ff;cursor:pointer';
    sl.addEventListener('change', () => {
      maxIter = parseInt(sl.value);
      dirty = true;
    });
    row.appendChild(sl);
    const val = document.createElement('span');
    val.id = 'iv';
    val.style.cssText = 'color:#58a6ff;font-size:0.75em;width:40px';
    val.textContent = String(maxIter);
    row.appendChild(val);
    sl.addEventListener('input', () => {
      val.textContent = String(sl.value);
    });
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '左：c 固定时 z²+c 的填充 Julia 集（黑 = 轨道有界 ≈ K_c，色 = 逃逸时间）。右：Mandelbrot 集（点它选 c；黑 = c∈M 近似）。双击 Julia 图放大，复位按钮回默认。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    dirty = true;
  };

  p.mousePressed = () => {
    // click MB window
    const { x, y, w, h } = MB;
    if (p.mouseX >= x && p.mouseX <= x + w && p.mouseY >= y && p.mouseY <= y + h) {
      c = { re: -2.2 + ((p.mouseX - x) / w) * 3.0, im: 1.15 - ((p.mouseY - y) / h) * 2.3 };
      dirty = true;
      return;
    }
    if (p.mouseX >= jx && p.mouseX <= jx + JS && p.mouseY >= jy && p.mouseY <= jy + JS) {
      // double click zoom
      if (p.mouseButton === p.RIGHT) {
        view = { cx: 0, cy: 0, span: 3.6 };
      }
    }
  };
  p.doubleClicked = () => {
    if (p.mouseX >= jx && p.mouseX <= jx + JS && p.mouseY >= jy && p.mouseY <= jy + JS) {
      const zr = view.cx + view.span * ((p.mouseX - jx) / JS - 0.5);
      const zi = view.cy + view.span * (0.5 - (p.mouseY - jy) / JS);
      view = { cx: zr, cy: zi, span: view.span * 0.45 };
      dirty = true;
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    if (dirty) {
      computeJulia();
      computeMB();
      dirty = false;
    }

    // julia
    const cell = JS / N;
    for (let py = 0; py < N; py++) {
      for (let px = 0; px < N; px++) {
        const k = juliaPix[py * N + px];
        p.noStroke();
        if (k < 0) {
          p.fill(5, 7, 12);
        } else {
          const [r, g, b] = palette(k);
          p.fill(r, g, b);
        }
        p.rect(jx + px * cell, jy + py * cell, cell + 0.5, cell + 0.5);
      }
    }
    // Julia label + c
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Julia / 填充集（c = ${c.re.toFixed(3)}${c.im >= 0 ? '+' : ''}${c.im.toFixed(3)}i）`, jx, 16);
    p.fill('#8b949e');
    p.textSize(11);
    p.text('双击放大 · 右键复位', jx, 30);

    // MB
    const { x, y, w, h } = MB;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const k = mbPix[py * w + px];
        p.noStroke();
        if (k < 0) p.fill(4, 6, 10);
        else p.fill(40 + (k % 8) * 24, 40, 90);
        p.rect(x + px, y + py, 1, 1);
      }
    }
    // c marker on MB
    const mbx = x + ((c.re + 2.2) / 3.0) * w;
    const mby = y + ((1.15 - c.im) / 2.3) * h;
    p.stroke('#ffd33d');
    p.strokeWeight(2);
    p.noFill();
    p.circle(mbx, mby, 9);
    p.noStroke();
    p.fill('#8b949e');
    p.textSize(12);
    p.text('Mandelbrot 集：点击选 c（黑 ≈ 内）', x, y - 16);

    // critical orbit test (approximate membership)
    let zr = 0;
    let zi = 0;
    let bound = true;
    for (let k = 0; k < 400; k++) {
      const nz = zr * zr - zi * zi + c.re;
      zi = 2 * zr * zi + c.im;
      zr = nz;
      if (zr * zr + zi * zi > 4) {
        bound = false;
        break;
      }
    }
    p.noStroke();
    p.fill(bound ? '#3fb950' : '#f78166');
    p.textSize(13);
    p.text(bound ? '临界轨道 0 有界 ⟹ c ≈ ∈ M（Julia 连通）' : '临界轨道逃逸 ⟹ c ≈ ∉ M（Julia ≈ Cantor 尘埃）', x, y + h + 20);

    p.fill('#8b949e');
    p.textSize(11.5);
    p.text('c∈M ⟺ J_c 连通（Fatou–Julia–Douady–Hubbard）；黑色只是有限迭代近似。', x, y + h + 40);
  };
};

new p5(sketch);
