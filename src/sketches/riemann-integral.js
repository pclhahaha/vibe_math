import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let n = 4;
  let funcIdx = 0;
  let lowerX = 0;
  let upperX = 2 * Math.PI;
  let draggingBound = false;
  let draggingHandle = ''; // 'left' | 'right' | ''

  // Function definitions
  const funcs = [
    { name: 'sin(3x)·e^(-x/2)', f: (x) => Math.sin(x * 3) * Math.exp(-x * 0.5) },
    { name: 'cos(2x)·e^(-x/3)', f: (x) => Math.cos(x * 2) * Math.exp(-x / 3) },
    { name: 'sin(4x)/(x+1)', f: (x) => Math.sin(x * 4) / (x + 0.8) },
    { name: 'x·sin(5x)·e^(-x)', f: (x) => x * Math.sin(x * 5) * Math.exp(-x) },
  ];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(540, 460).parent('p5canvas');

    // Slider for partition count
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '1';
    sl.max = '60';
    sl.value = '4';
    sl.style.cssText = 'width:170px;accent-color:#58a6ff;margin:4px 2px';
    sl.addEventListener('input', () => {
      n = parseInt(sl.value);
      const el = document.getElementById('rn-label');
      if (el) el.textContent = 'partitions=' + n;
    });
    document.querySelector('.sketch-col')?.appendChild(sl);

    const lbl = document.createElement('span');
    lbl.id = 'rn-label';
    lbl.style.cssText = 'color:#8b949e;font-size:0.85em;margin-left:6px';
    lbl.textContent = 'partitions=' + n;
    document.querySelector('.sketch-col')?.appendChild(lbl);

    // Function selector button
    const btn = document.createElement('button');
    btn.textContent = 'Function: ' + funcs[0].name;
    btn.style.cssText = 'margin:4px 6px;background:#21262d;color:#58a6ff;border:1px solid #58a6ff;border-radius:4px;padding:3px 10px;font-size:0.8em;cursor:pointer';
    btn.addEventListener('click', () => {
      funcIdx = (funcIdx + 1) % funcs.length;
      btn.textContent = 'Function: ' + funcs[funcIdx].name;
    });
    document.querySelector('.sketch-col')?.appendChild(btn);

    // Reset bounds button
    const rst = document.createElement('button');
    rst.textContent = '重置边界';
    rst.style.cssText = 'margin:4px 4px;background:#21262d;color:#f78166;border:1px solid #f78166;border-radius:4px;padding:3px 10px;font-size:0.8em;cursor:pointer';
    rst.addEventListener('click', () => {
      lowerX = 0;
      upperX = 2 * Math.PI;
    });
    document.querySelector('.sketch-col')?.appendChild(rst);

    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:0.72em;margin:2px 0';
    hint.textContent = 'Click function button → cycle functions | Drag blue/orange handles → change integration bounds | Slider → partitions';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mousePressed = () => {
    if (p.mouseX < 40 || p.mouseX > p.width - 40 || p.mouseY < 40 || p.mouseY > p.height - 80) return;
    const w = p.width - 80;
    const baseline = p.height * 0.55;

    // Check handle distances
    const lx = 40 + (lowerX - 0) / (2 * Math.PI) * w;
    const rx = 40 + (upperX - 0) / (2 * Math.PI) * w;
    const distLeft = p.dist(p.mouseX, p.mouseY, lx, baseline);
    const distRight = p.dist(p.mouseX, p.mouseY, rx, baseline);
    if (distLeft < 16) { draggingHandle = 'left'; draggingBound = true; return; }
    if (distRight < 16) { draggingHandle = 'right'; draggingBound = true; return; }
    draggingHandle = '';
  };

  p.mouseReleased = () => { draggingBound = false; draggingHandle = ''; };

  p.mouseDragged = () => {
    if (!draggingBound || !draggingHandle) return;
    const w = p.width - 80;
    const t = ((p.mouseX - 40) / w) * 2 * Math.PI;
    const clamped = Math.max(0.05, Math.min(2 * Math.PI - 0.05, t));
    if (draggingHandle === 'left') {
      if (clamped < upperX - 0.1) lowerX = clamped;
    } else if (draggingHandle === 'right') {
      if (clamped > lowerX + 0.1) upperX = clamped;
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    p.push();
    p.translate(40, 30);
    const w = p.width - 80;
    const h = p.height - 110;
    const func = funcs[funcIdx].f;
    const baseline = p.height * 0.55;

    // Draw axes
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(0, baseline, w, baseline);
    p.line(0, 30, 0, baseline + 60);

    // Draw curve
    p.noFill();
    p.stroke('#58a6ff');
    p.strokeWeight(3);
    p.beginShape();
    for (let px = 0; px <= w; px += 1) {
      const x = (px / w) * 2 * Math.PI;
      const fy = baseline - h * (0.45 + 0.4 * func(x));
      p.vertex(px, fy);
    }
    p.endShape();

    // Draw shaded region between bounds
    p.fill(88, 166, 255, 25);
    p.noStroke();
    const lpx = (lowerX / (2 * Math.PI)) * w;
    const rpx = (upperX / (2 * Math.PI)) * w;
    p.beginShape();
    p.vertex(lpx, baseline);
    for (let px = lpx; px <= rpx; px += 2) {
      const x = (px / w) * 2 * Math.PI;
      const fy = baseline - h * (0.45 + 0.4 * func(x));
      p.vertex(px, fy);
    }
    p.vertex(rpx, baseline);
    p.endShape(p.CLOSE);

    // Draw Riemann rectangles (lower = inf, upper = sup)
    const dx = (upperX - lowerX) / n;
    let lowerSum = 0;
    let upperSum = 0;

    for (let i = 0; i < n; i++) {
      const a = lowerX + i * dx;
      const b = a + dx;
      const x1 = (a / (2 * Math.PI)) * w;
      const x2 = Math.min((b / (2 * Math.PI)) * w, w);

      // Sample function to find min/max in this subinterval
      const samples = 50;
      let minVal = Infinity;
      let maxVal = -Infinity;
      for (let s = 0; s <= samples; s++) {
        const sx = a + (s / samples) * dx;
        const val = func(sx);
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }

      const minY = baseline - h * (0.45 + 0.4 * minVal);
      const maxY = baseline - h * (0.45 + 0.4 * maxVal);
      const rectHmin = baseline - minY;
      const rectHmax = baseline - maxY;

      // Upper sum rectangle (orange, taller)
      if (rectHmax > 0) {
        p.fill(247, 129, 102, 35);
        p.stroke('#f78166');
        p.strokeWeight(1);
        p.rect(x1, maxY, x2 - x1 - 0.5, rectHmax);
      }

      // Lower sum rectangle (blue, shorter, on top)
      if (rectHmin > 0) {
        p.fill(88, 166, 255, 45);
        p.stroke('#58a6ff');
        p.strokeWeight(1.5);
        p.rect(x1, minY, x2 - x1 - 0.5, rectHmin);
      }

      lowerSum += minVal * dx;
      upperSum += maxVal * dx;
    }

    // Scale sums to display area
    const scaleFactor = h * 0.4;
    const displayLower = scaleFactor * lowerSum;
    const displayUpper = scaleFactor * upperSum;
    const actualLower = lowerSum;
    const actualUpper = upperSum;

    // Draw bound handles
    p.fill('#58a6ff');
    p.noStroke();
    p.circle(lpx, baseline, 16);
    p.fill('#f78166');
    p.circle(rpx, baseline, 16);
    p.fill('#fff');
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('L', lpx, baseline + 1);
    p.text('R', rpx, baseline + 1);

    // Annotation text
    p.fill('#c9d1d9');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text('f(x) = ' + funcs[funcIdx].name + '    [' + lowerX.toFixed(1) + ', ' + upperX.toFixed(1) + ']', 0, -18);

    p.fill('#58a6ff');
    p.textSize(11);
    p.text('Lower sum L(f,n) = ' + actualLower.toFixed(3) + '   (blue rects)', 0, h + 15);

    p.fill('#f78166');
    p.text('Upper sum U(f,n) = ' + actualUpper.toFixed(3) + '   (orange rects)', 0, h + 32);

    p.fill('#8b949e');
    p.textSize(11);
    p.text('Gap U-L = ' + (actualUpper - actualLower).toFixed(3) + '    n=' + n + '    → 0 as n→∞', 0, h + 49);

    // Convergence indicator
    const gap = actualUpper - actualLower;
    p.fill(gap < 0.1 ? '#7ee787' : '#f78166');
    p.textSize(10);
    p.text(gap < 0.1 ? '✓ Converged (gap < 0.1)' : '↻ Increase n to converge', 250, h + 49);

    p.pop();
  };
};

new p5(sketch);
