import p5 from 'p5';

const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let even = 100;
  let showAllMode = true;
  let highlightPair = -1;
  let hoverRow = -1;
  let selectedPairs = [];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 440).parent('p5canvas');

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '4';
    sl.max = '1000';
    sl.step = '2';
    sl.value = '100';
    sl.style.cssText = 'width:200px;accent-color:#58a6ff;margin:4px 2px';
    sl.addEventListener('input', () => {
      even = parseInt(sl.value);
      highlightPair = -1;
      hoverRow = -1;
      selectedPairs = [];
    });
    document.querySelector('.sketch-col')?.appendChild(sl);

    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8b949e;font-size:0.85em;margin-left:6px';
    lbl.id = 'goldbach-n-label';
    lbl.textContent = 'N=' + even;
    document.querySelector('.sketch-col')?.appendChild(lbl);
    sl.addEventListener('input', () => {
      const el = document.getElementById('goldbach-n-label');
      if (el) el.textContent = 'N=' + sl.value;
    });

    const btn = document.createElement('button');
    btn.textContent = 'Toggle: Show All';
    btn.style.cssText = 'margin:4px 6px;background:#21262d;color:#58a6ff;border:1px solid #58a6ff;border-radius:4px;padding:3px 10px;font-size:0.8em;cursor:pointer';
    btn.addEventListener('click', () => {
      showAllMode = !showAllMode;
      btn.textContent = showAllMode ? 'Toggle: Show All' : 'Toggle: Highlight Best';
      btn.style.color = showAllMode ? '#58a6ff' : '#f78166';
      btn.style.borderColor = showAllMode ? '#58a6ff' : '#f78166';
      selectedPairs = [];
      highlightPair = -1;
    });
    document.querySelector('.sketch-col')?.appendChild(btn);

    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:0.72em;margin:2px 0';
    hint.textContent = 'Hover bars → highlight | Click bar → pin decomposition | Toggle mode above';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mouseMoved = () => {
    hoverRow = -1;
    if (!showAllMode) return;
    const w = p.width - 60;
    const primes = getPrimes(even);
    const pairs = getGoldbachPairs(even, primes);
    for (let i = 0; i < pairs.length; i++) {
      const y = 55 + i * 18;
      if (y > p.height - 30) break;
      if (p.mouseY > y - 7 && p.mouseY < y + 10 && p.mouseX > 30 && p.mouseX < 30 + w) {
        hoverRow = i;
        return;
      }
    }
  };

  p.mousePressed = () => {
    if (!showAllMode) return;
    const w = p.width - 60;
    const primes = getPrimes(even);
    const pairs = getGoldbachPairs(even, primes);
    for (let i = 0; i < pairs.length; i++) {
      const y = 55 + i * 18;
      if (y > p.height - 30) break;
      if (p.mouseY > y - 7 && p.mouseY < y + 10 && p.mouseX > 30 && p.mouseX < 30 + w) {
        const idx = selectedPairs.indexOf(i);
        if (idx >= 0) selectedPairs.splice(idx, 1);
        else selectedPairs.push(i);
        return;
      }
    }
  };

  p.doubleClicked = () => {
    if (!showAllMode) return;
    const w = p.width - 60;
    const primes = getPrimes(even);
    const pairs = getGoldbachPairs(even, primes);
    for (let i = 0; i < pairs.length; i++) {
      const y = 55 + i * 18;
      if (y > p.height - 30) break;
      if (p.mouseY > y - 7 && p.mouseY < y + 10 && p.mouseX > 30 && p.mouseX < 30 + w) {
        highlightPair = (highlightPair === i) ? -1 : i;
        return;
      }
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    const w = p.width - 60;
    const primes = getPrimes(even);
    const pairs = getGoldbachPairs(even, primes);

    p.push();
    p.translate(30, 30);

    // Title
    p.fill('#c9d1d9');
    p.textSize(15);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Even = ' + even + '     |     ' + pairs.length + ' Goldbach pairs', 5, 2);

    if (showAllMode) {
      // Show all pairs as bars
      const barH = 12;
      const gap = 18;
      for (let i = 0; i < pairs.length; i++) {
        const y = 25 + i * gap;
        if (y > p.height - 60) break;
        const [p1, p2] = pairs[i];
        const frac1 = p1 / even;
        const frac2 = p2 / even;
        const isHover = i === hoverRow;
        const isPinned = selectedPairs.includes(i);
        const isHighlight = i === highlightPair;

        // Glow effect for hovered/pinned
        if (isHover || isPinned) {
          p.fill(88, 166, 255, 30);
          p.noStroke();
          p.rect(-3, y - 3, w + 6, barH + 8, 5);
        }

        if (isHighlight) {
          p.fill(247, 129, 102, 30);
          p.noStroke();
          p.rect(-3, y - 3, w + 6, barH + 8, 5);
        }

        // Bar for p1
        p.fill(isHighlight ? '#f78166' : '#58a6ff');
        p.noStroke();
        p.rect(0, y, frac1 * w, barH, 3);

        // Bar for p2
        p.fill(isHighlight ? '#ffd33d' : '#f78166');
        p.rect(frac1 * w, y, frac2 * w, barH, 3);

        // Label
        p.fill(isHover || isPinned || isHighlight ? '#fff' : '#8b949e');
        p.textSize(isHighlight ? 12 : 10);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(p1 + ' + ' + p2, frac1 * w + frac2 * w + 6, y + barH / 2);

        if (isPinned) {
          p.fill('#f78166');
          p.textSize(11);
          p.text('★ pinned', frac1 * w + frac2 * w + 60, y + barH / 2);
        }
      }
    } else {
      // Show best decomposition only (closest primes to sqrt(N))
      const best = getBestPair(even, primes);
      if (best) {
        const [p1, p2] = best;
        const frac1 = p1 / even;
        const frac2 = p2 / even;
        const y = 80;
        const barH = 28;

        p.fill('#161b22');
        p.stroke('#58a6ff');
        p.strokeWeight(2);
        p.rect(0, y, w, barH + 30, 8);

        p.fill('#58a6ff');
        p.noStroke();
        p.rect(20, y + 15, frac1 * (w - 40), barH, 4);

        p.fill('#f78166');
        p.rect(20 + frac1 * (w - 40), y + 15, frac2 * (w - 40), barH, 4);

        p.fill('#fff');
        p.textSize(18);
        p.textAlign(p.CENTER, p.TOP);
        p.text(even + ' = ' + p1 + ' + ' + p2, w / 2, y + barH + 20);

        p.fill('#8b949e');
        p.textSize(11);
        p.text('√' + even + ' ≈ ' + Math.sqrt(even).toFixed(1) + '    |p₁-√N|=' + Math.abs(p1 - Math.sqrt(even)).toFixed(1), w / 2, y + barH + 40);
      }
    }

    // Stats at bottom
    const g = getPrimes(even);
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Primes up to ' + even + ': ' + g.length + '    Pairs: ' + pairs.length + '    ' + (checkGoldbach(even, primes) ? '✓ Goldbach holds' : '✗'), 5, p.height - 65);

    p.pop();
  };
};

function getPrimes(limit) {
  const isPrime = Array(limit + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let i = 2; i * i <= limit; i++)
    if (isPrime[i])
      for (let j = i * i; j <= limit; j += i) isPrime[j] = false;
  const primes = [];
  for (let i = 2; i <= limit; i++) if (isPrime[i]) primes.push(i);
  return primes;
}

function getGoldbachPairs(even, primes = null) {
  if (!primes) primes = getPrimes(even);
  const isPrime = Array(even + 1).fill(false);
  for (const p of primes) isPrime[p] = true;
  const pairs = [];
  for (const p1 of primes) {
    if (p1 > even / 2) break;
    const p2 = even - p1;
    if (isPrime[p2]) pairs.push([p1, p2]);
  }
  return pairs;
}

function getBestPair(even, primes) {
  const target = Math.sqrt(even);
  const isPrime = Array(even + 1).fill(false);
  for (const p of primes) isPrime[p] = true;
  let best = null;
  let bestDist = Infinity;
  for (const p of primes) {
    if (p > even / 2) break;
    const p2 = even - p;
    if (isPrime[p2]) {
      const d = Math.abs(p - target);
      if (d < bestDist) { bestDist = d; best = [p, p2]; }
    }
  }
  return best;
}

function checkGoldbach(even, primes) {
  return getGoldbachPairs(even, primes).length > 0;
}

new p5(s);
