import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let N = 1000, viewStart = 0, viewEnd = 1000;
  let dragging = false, dragStart = 0;
  let showGaps = false;
  let highlightPair = -1;
  let isPrime = [], primes = [], twinPairs = [];

  function sieve(limit) {
    isPrime = Array(limit + 1).fill(true);
    isPrime[0] = isPrime[1] = false;
    for (let i = 2; i * i <= limit; i++) {
      if (isPrime[i]) for (let j = i * i; j <= limit; j += i) isPrime[j] = false;
    }
    primes = [];
    twinPairs = [];
    for (let i = 2; i <= limit; i++) {
      if (isPrime[i]) {
        primes.push(i);
        if (i >= 3 && isPrime[i - 2]) twinPairs.push(i - 2);
      }
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    const c = p.createCanvas(Math.min(600, p.windowWidth - 40), 440);
    c.parent('p5canvas');
    sieve(N);

    // N slider
    const labelN = document.createElement('span');
    labelN.textContent = 'N: ';
    labelN.style.cssText = 'color:#8b949e;font-size:0.78em;margin-left:4px';
    document.querySelector('.sketch-col')?.appendChild(labelN);

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '100';
    sl.max = '3000';
    sl.step = '100';
    sl.value = '1000';
    sl.style.cssText = 'width:150px;accent-color:#58a6ff;margin:4px';
    sl.addEventListener('input', () => {
      N = parseInt(sl.value);
      sieve(N);
      viewEnd = N;
      viewStart = Math.max(0, viewEnd - (p.width - 80));
    });
    document.querySelector('.sketch-col')?.appendChild(sl);

    // Gap view toggle
    const gapBtn = document.createElement('button');
    gapBtn.textContent = '显示间隔';
    gapBtn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.78em';
    gapBtn.addEventListener('click', () => {
      showGaps = !showGaps;
      gapBtn.textContent = showGaps ? 'Show Pairs' : '显示间隔';
    });
    document.querySelector('.sketch-col')?.appendChild(gapBtn);

    // Zoom instructions
    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 0 0 4px';
    hint.textContent = 'Scroll to zoom · Drag to pan · Zhang 2013 → gap ≤ 70M';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');

    if (showGaps) {
      drawGapsView();
    } else {
      drawPrimeView();
    }

    // Legend
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    const y0 = p.height - 30;
    p.text(`N=${N}  Primes: ${primes.length}  Twin pairs: ${twinPairs.length}`, 20, y0);
    p.text(
      'Zhang(2013) gap≤70M → Polymath gap≤246 → Conjecture: gap=2',
      20,
      y0 + 18
    );
  };

  function drawPrimeView() {
    const w = p.width - 60;
    const h = p.height - 80;
    const x0 = 30;
    const yMid = h / 2;
    const yTop = yMid - 100;
    const yBot = yMid + 60;

    // Scroll by dragging
    const viewWidth = viewEnd - viewStart;

    // Number line
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(x0, yMid, x0 + w, yMid);

    // Tick marks every 50
    p.stroke('#21262d');
    p.strokeWeight(0.5);
    p.fill('#484f58');
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    for (let n = Math.floor(viewStart / 50) * 50; n <= viewEnd; n += 50) {
      if (n < viewStart || n > viewEnd) continue;
      const x = p.map(n, viewStart, viewEnd, x0, x0 + w);
      p.line(x, yMid - 4, x, yMid + 4);
      p.text(n, x, yMid + 8);
    }

    // Draw primes as dots
    for (const prime of primes) {
      if (prime < viewStart || prime > viewEnd) continue;
      const x = p.map(prime, viewStart, viewEnd, x0, x0 + w);
      const isTwin = isPrime[prime + 2] || isPrime[prime - 2];
      if (isTwin) {
        p.stroke('#58a6ff');
        p.strokeWeight(3);
        p.fill('#58a6ff');
        p.circle(x, yTop, 5);
      } else {
        p.stroke('#484f58');
        p.strokeWeight(1);
        p.fill('#30363d');
        p.circle(x, yTop, 3);
      }
    }

    // Draw twin prime connections
    p.stroke('#ffd33d');
    p.strokeWeight(1.5);
    for (const p1 of twinPairs) {
      const p2 = p1 + 2;
      if (p1 < viewStart || p2 > viewEnd) continue;
      const x1 = p.map(p1, viewStart, viewEnd, x0, x0 + w);
      const x2 = p.map(p2, viewStart, viewEnd, x0, x0 + w);
      p.line(x1, yTop + 8, x2, yTop + 8);
    }

    // Highlight hovered pair
    if (highlightPair >= 0) {
      const p1 = highlightPair;
      const p2 = p1 + 2;
      if (p1 >= viewStart && p2 <= viewEnd) {
        const x1 = p.map(p1, viewStart, viewEnd, x0, x0 + w);
        const x2 = p.map(p2, viewStart, viewEnd, x0, x0 + w);
        p.fill('#ffd33d');
        p.noStroke();
        // Show connection and label
        p.rect(x1 - 25, yBot, 50, 40, 6);
        p.fill('#0d1117');
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`(${p1}, ${p2})`, (x1 + x2) / 2, yBot + 12);
        p.text(`gap = 2`, (x1 + x2) / 2, yBot + 28);

        // Highlight bars
        p.stroke('#ffd33d');
        p.strokeWeight(2);
        p.line(x1, yTop - 8, x1, yTop + 8);
        p.line(x2, yTop - 8, x2, yTop + 8);
      }
    }

    // Zhang bound reference line
    p.stroke('#f78166');
    p.strokeWeight(1);
    p.drawingContext.setLineDash([4, 6]);
    const gapRefX = p.map(246, 0, 300, x0, x0 + 200);
    p.line(x0, yMid + 30, x0 + 200, yMid + 30);
    p.fill('#f78166');
    p.textSize(10);
    p.text('gap≤246 (Polymath)', x0 + 40, yMid + 34);
    p.drawingContext.setLineDash([]);
  }

  function drawGapsView() {
    // Show prime gap distribution as a histogram
    const w = p.width - 60;
    const h = p.height - 80;
    const x0 = 30;
    const y0 = h;

    // Calculate gaps
    const gaps = [];
    for (let i = 1; i < primes.length; i++) {
      const gap = primes[i] - primes[i - 1];
      if (gap <= 100) gaps.push(gap);
    }

    // Bin gaps
    const gapCount = {};
    for (const g of gaps) {
      const bin = g - (g % 2);
      gapCount[bin] = (gapCount[bin] || 0) + 1;
    }

    const maxCount = Math.max(...Object.values(gapCount));

    // Axes
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.line(x0, 20, x0, y0);
    p.line(x0, y0, x0 + w, y0);

    // Bars
    const barW = 8;
    for (let g = 2; g <= 100; g += 2) {
      if (!gapCount[g]) continue;
      const x = p.map(g, 2, 100, x0 + 10, x0 + w - 10);
      const barH = (gapCount[g] / maxCount) * (h - 40);
      // Twin prime gap (2) in gold, small gaps in blue, large in gray
      if (g === 2) p.fill('#ffd33d');
      else if (g <= 10) p.fill('#58a6ff');
      else if (g <= 30) p.fill('#7ee787');
      else p.fill('#30363d');

      p.noStroke();
      p.rect(x - barW / 2, y0 - barH, barW, barH);

      // Label for small gaps
      if (g <= 10 || g % 20 === 0) {
        p.fill('#8b949e');
        p.textSize(11);
        p.textAlign(p.CENTER, p.TOP);
        p.text(g, x, y0 + 4);
      }
    }

    // Labels
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Prime gap distribution', 20, 4);
    p.text(`Gap=2 (twin): ${gapCount[2] || 0} pairs`, 20, 20);
    p.text(`Gap=4 (cousin): ${gapCount[4] || 0} pairs`, 20, 36);
    p.text(`Gap=6 (sexy): ${gapCount[6] || 0} pairs`, 20, 52);

    // Polymath bound
    p.stroke('#f78166');
    p.strokeWeight(2);
    const boundX = p.map(246, 2, 100, x0 + 10, x0 + w - 10);
    if (boundX < x0 + w) {
      p.drawingContext.setLineDash([4, 4]);
      p.line(boundX, 20, boundX, y0);
      p.drawingContext.setLineDash([]);
    }
  }

  p.mousePressed = () => {
    dragging = true;
    dragStart = p.mouseX;
  };

  p.mouseReleased = () => {
    dragging = false;
  };

  p.mouseDragged = () => {
    if (!dragging) return;
    const dx = p.mouseX - dragStart;
    const vw = viewEnd - viewStart;
    const scale = vw / (p.width - 60);
    const shift = dx * scale;
    viewStart = Math.max(0, viewStart - shift);
    viewEnd = viewStart + vw;
    if (viewEnd > N) {
      viewEnd = N;
      viewStart = Math.max(0, viewEnd - vw);
    }
    dragStart = p.mouseX;
  };

  p.mouseWheel = (e) => {
    e.preventDefault();
    const zoom = e.delta > 0 ? 1.3 : 1 / 1.3;
    const center = p.map(p.constrain(p.mouseX, 30, p.width - 30), 30, p.width - 30, viewStart, viewEnd);
    const half = (viewEnd - viewStart) / 2;
    viewStart = Math.max(0, center - half * zoom);
    viewEnd = Math.min(N, viewStart + half * 2 * zoom);
    return false;
  };

  p.mouseMoved = () => {
    if (showGaps || dragging) return;
    const x0 = 30;
    const w = p.width - 60;
    const mx = p.map(p.constrain(p.mouseX, x0, x0 + w), x0, x0 + w, viewStart, viewEnd);
    highlightPair = -1;
    for (const p1 of twinPairs) {
      const p2 = p1 + 2;
      const x1 = p.map(p1, viewStart, viewEnd, x0, x0 + w);
      const x2 = p.map(p2, viewStart, viewEnd, x0, x0 + w);
      if (p.mouseX >= x1 - 10 && p.mouseX <= x2 + 10) {
        highlightPair = p1;
        break;
      }
    }
  };
};

new p5(sketch);
