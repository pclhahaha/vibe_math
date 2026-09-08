import p5 from 'p5';

const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let epsilon = 0.15;
  let intervals = [];
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentSet = 0; // 0=parabola, 1=Cantor-like, 2=rational approximation
  let hoveredInterval = -1;
  let setSize = 200;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 470).parent('p5canvas');

    // Slider for epsilon
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0.02';
    sl.max = '0.8';
    sl.step = '0.01';
    sl.value = '0.15';
    sl.style.cssText = 'width:160px;accent-color:#58a6ff;margin:4px 2px';
    sl.addEventListener('input', () => { epsilon = parseFloat(sl.value); });
    document.querySelector('.sketch-col')?.appendChild(sl);

    const lb = document.createElement('span');
    lb.id = 'measure-eps';
    lb.style.cssText = 'color:#8b949e;font-size:0.85em;margin-left:6px';
    lb.textContent = 'ε=' + epsilon.toFixed(2);
    document.querySelector('.sketch-col')?.appendChild(lb);
    sl.addEventListener('input', () => {
      const el = document.getElementById('measure-eps');
      if (el) el.textContent = 'ε=' + parseFloat(sl.value).toFixed(2);
    });

    // Button to change set
    const btn = document.createElement('button');
    btn.textContent = 'Change Set [parabola]';
    btn.style.cssText = 'margin:4px 6px;background:#21262d;color:#58a6ff;border:1px solid #58a6ff;border-radius:4px;padding:3px 10px;font-size:0.8em;cursor:pointer';
    btn.addEventListener('click', () => {
      currentSet = (currentSet + 1) % 3;
      const names = ['parabola y=x²', 'Cantor dust', 'rational Q∩[0,1]'];
      btn.textContent = 'Change Set [' + names[currentSet] + ']';
      intervals = [];
    });
    document.querySelector('.sketch-col')?.appendChild(btn);

    // Clear intervals button
    const clr = document.createElement('button');
    clr.textContent = '清除';
    clr.style.cssText = 'margin:4px 4px;background:#21262d;color:#f78166;border:1px solid #f78166;border-radius:4px;padding:3px 10px;font-size:0.8em;cursor:pointer';
    clr.addEventListener('click', () => { intervals = []; hoveredInterval = -1; });
    document.querySelector('.sketch-col')?.appendChild(clr);

    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:0.72em;margin:2px 0';
    hint.textContent = 'Drag on canvas → add covering interval | Click existing interval → remove | Adjust ε for precision';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mousePressed = () => {
    if (p.mouseX < 30 || p.mouseX > p.width - 30 || p.mouseY < 40 || p.mouseY > p.height - 70) return;

    // Check if clicking on an existing interval
    for (let i = intervals.length - 1; i >= 0; i--) {
      const iv = intervals[i];
      const x1 = 30 + iv.ax * (p.width - 60);
      const x2 = 30 + iv.bx * (p.width - 60);
      const y = 40 + iv.ay * (p.height - 110);
      const h = iv.bh * (p.height - 110);
      if (p.mouseX > x1 - 4 && p.mouseX < x2 + 4 && p.mouseY > y - 4 && p.mouseY < y + h + 4) {
        intervals.splice(i, 1);
        hoveredInterval = -1;
        return;
      }
    }

    // Start drag to create new interval
    dragging = true;
    dragStartX = p.mouseX;
    dragStartY = p.mouseY;
  };

  p.mouseReleased = () => {
    if (dragging) {
      const dx = Math.abs(p.mouseX - dragStartX);
      const dy = Math.abs(p.mouseY - dragStartY);
      if (dx > 5 || dy > 5) {
        const ax = Math.min(dragStartX, p.mouseX);
        const ay = Math.min(dragStartY, p.mouseY);
        const bx = Math.max(dragStartX, p.mouseX);
        const by = Math.max(dragStartY, p.mouseY);
        intervals.push({
          ax: (ax - 30) / (p.width - 60),
          ay: (ay - 40) / (p.height - 110),
          bx: (bx - 30) / (p.width - 60),
          bh: (by - 40) / (p.height - 110),
        });
      }
    }
    dragging = false;
  };

  p.mouseMoved = () => {
    hoveredInterval = -1;
    for (let i = intervals.length - 1; i >= 0; i--) {
      const iv = intervals[i];
      const x1 = 30 + iv.ax * (p.width - 60);
      const x2 = 30 + iv.bx * (p.width - 60);
      const y = 40 + iv.ay * (p.height - 110);
      const h = iv.bh * (p.height - 110);
      if (p.mouseX > x1 - 4 && p.mouseX < x2 + 4 && p.mouseY > y - 4 && p.mouseY < y + h + 4) {
        hoveredInterval = i;
        return;
      }
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    const w = p.width - 60;
    const h = p.height - 110;

    // Draw set points
    if (currentSet === 0) {
      // Parabola y = x^2
      for (let i = 0; i < 500; i++) {
        const x = Math.random();
        const y = Math.random() * 0.6;
        if (y < x * x * 0.65) {
          p.fill('#58a6ff');
          p.noStroke();
          const sx = 30 + x * w;
          const sy = 40 + y * h / 0.65;
          p.rect(sx, sy, 1.8, 1.8);
        }
      }
    } else if (currentSet === 1) {
      // Cantor-like dust
      for (let i = 0; i < 300; i++) {
        let x = Math.random();
        let y = 0;
        for (let j = 0; j < 6; j++) {
          const third = Math.floor(x * 3);
          if (third === 1) break;
          x = (third === 0) ? x * 3 : (x - 2 / 3) * 3;
          y++;
        }
        if (y >= 6) {
          p.fill('#58a6ff');
          p.noStroke();
          const sx = 30 + Math.random() * w;
          const sy = 40 + (0.1 + 0.8 * Math.random()) * h;
          p.rect(sx, sy, 1.5, 1.5);
        }
      }
    } else {
      // Rational approximation - dense but measure zero
      for (let d = 2; d < 20; d++) {
        for (let n = 1; n < d; n++) {
          const x = n / d;
          p.fill('#58a6ff');
          p.noStroke();
          const sx = 30 + x * w;
          const sy = 40 + (0.2 + 0.6 * (n / d)) * h;
          p.rect(sx, sy, 1.5, 1.5);
        }
      }
    }

    // Draw epsilon grid
    const epsX = Math.max(2, Math.floor(w * epsilon));
    p.stroke('#30363d');
    p.strokeWeight(0.5);
    for (let x = 30; x <= 30 + w; x += epsX) {
      p.line(x, 40, x, 40 + h);
    }

    // Draw covering intervals
    for (let i = 0; i < intervals.length; i++) {
      const iv = intervals[i];
      const x1 = 30 + iv.ax * w;
      const x2 = 30 + iv.bx * w;
      const y = 40 + iv.ay * h;
      const iw = Math.max(0, iv.bx * w - iv.ax * w);
      const ih = Math.max(0, iv.bh * h - iv.ay * h);
      const isHovered = i === hoveredInterval;

      p.fill(isHovered ? 'rgba(247,129,102,0.35)' : 'rgba(88,166,255,0.25)');
      p.stroke(isHovered ? '#f78166' : '#58a6ff');
      p.strokeWeight(isHovered ? 2.5 : 1.5);
      p.rect(x1, y, iw, ih, 3);

      if (isHovered) {
        const measure = iw * ih;
        p.fill('#f78166');
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text('|I|=' + measure.toFixed(0) + '   click to remove', (x1 + x2) / 2, y - 4);
      }
    }

    // Drag preview
    if (dragging) {
      const x1 = Math.min(dragStartX, p.mouseX);
      const y1 = Math.min(dragStartY, p.mouseY);
      const x2 = Math.max(dragStartX, p.mouseX);
      const y2 = Math.max(dragStartY, p.mouseY);
      p.fill('rgba(247,129,102,0.2)');
      p.stroke('#f78166');
      p.strokeWeight(2);
      p.drawingContext.setLineDash([5, 3]);
      p.rect(x1, y1, x2 - x1, y2 - y1);
      p.drawingContext.setLineDash([]);
    }

    // Outer measure calculation
    let totalMeasure = 0;
    for (const iv of intervals) {
      totalMeasure += Math.abs((iv.bx - iv.ax) * w * (iv.bh - iv.ay) * h);
    }
    const normalizedMeasure = totalMeasure;

    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Outer measure m*: ' + normalizedMeasure.toFixed(0) + '  (ε=' + epsilon.toFixed(2) + ')', 30, 10);

    p.fill('#8b949e');
    p.textSize(11);
    p.text('m*(S) = inf Σ|Iᵢ| over countable covers   |   Drag to cover the set', 30, 25);

    // Legend
    p.push();
    p.translate(30, h + 50);
    p.textSize(10);
    p.fill('#8b949e');
    const names = ['y=x² (area=1/3)', 'Cantor dust (m=0)', 'Q∩[0,1] (m=0)'];
    p.text('Set: ' + names[currentSet] + '    |    Click interval → remove    |    Interval count: ' + intervals.length, 0, 0);
    p.pop();
  };
};

new p5(s);
