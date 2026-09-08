import p5 from 'p5';

const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let n = 5;
  let autoAngle = 0;
  let userAngle = 0;
  let dragging = false;
  let extensionLayers = 0;
  let cycleHighlight = -1;
  let selectedRoot = -1;
  let showPermutation = false;
  let permRoots = [];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 500).parent('p5canvas');

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '2';
    sl.max = '7';
    sl.step = '1';
    sl.value = '5';
    sl.style.cssText = 'width:140px;accent-color:#58a6ff;margin:4px 2px';
    sl.addEventListener('input', () => {
      n = parseInt(sl.value);
      extensionLayers = 0;
      cycleHighlight = -1;
      selectedRoot = -1;
      showPermutation = false;
    });
    document.querySelector('.sketch-col')?.appendChild(sl);

    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8b949e;font-size:0.85em';
    lbl.textContent = ' degree n=' + n;
    lbl.id = 'galois-n-label';
    document.querySelector('.sketch-col')?.appendChild(lbl);
    sl.addEventListener('input', () => {
      const el = document.getElementById('galois-n-label');
      if (el) el.textContent = ' degree n=' + sl.value;
    });

    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:0.72em;margin:2px 0';
    hint.textContent = 'Click left tower → build extensions | Click cycle nodes → automorphism | Drag root circle → rotate';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mousePressed = () => {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
    dragging = true;

    // Check tower area (x: 10-150, y: 20-280)
    if (p.mouseX < 150 && p.mouseY < 280 && p.mouseY > 20) {
      extensionLayers = (extensionLayers + 1) % 5;
      cycleHighlight = -1;
      selectedRoot = -1;
      return;
    }

    // Check cycle diagram area (center y: 330-430)
    const cy = 370;
    const g = n - 1;
    const cr = 42;
    for (let i = 0; i < g; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / g;
      const cx = 310 + cr * Math.cos(a);
      const cy2 = cy + cr * Math.sin(a);
      if (p.dist(p.mouseX, p.mouseY, cx, cy2) < 16) {
        cycleHighlight = i;
        permRoots = [];
        for (let k = 0; k < n; k++) {
          permRoots.push((k * (i + 2)) % n);
        }
        showPermutation = true;
        return;
      }
    }

    // Check root circle (center: 360, 150, r=85)
    const rootCX = 350;
    const rootCY = 150;
    for (let i = 0; i < n; i++) {
      const a = autoAngle + userAngle + i * Math.PI * 2 / n;
      const rx = rootCX + 85 * Math.cos(a);
      const ry = rootCY + 85 * Math.sin(a);
      if (p.dist(p.mouseX, p.mouseY, rx, ry) < 14) {
        selectedRoot = i;
      }
    }
  };

  p.mouseReleased = () => { dragging = false; };

  p.mouseDragged = () => {
    if (dragging) {
      userAngle += (p.mouseX - p.pmouseX) * 0.008;
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    if (!dragging) autoAngle += 0.003;

    // --- Field extension tower (top-left) ---
    p.push();
    p.translate(10, 20);
    const towerLabels = ['ℚ', 'ℚ(√a)', 'ℚ(ζₙ)', 'ℚ(ζₙ, ⁿ√b)', 'Splitting Field'];
    const towerDegrees = [1, 2, n - 1, n * (n - 1), n * (n - 1)];
    for (let i = 0; i <= extensionLayers; i++) {
      const y = i * 48;
      const active = i < extensionLayers || i === extensionLayers;
      p.fill('#161b22');
      p.stroke(active ? '#58a6ff' : '#30363d');
      p.strokeWeight(active ? 2.5 : 1);
      p.rect(0, y, 135, 36, 4);
      p.fill(active ? '#58a6ff' : '#8b949e');
      p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(towerLabels[i], 8, y + 18);
      if (active) {
        p.fill('#c9d1d9');
        p.textSize(11);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text('[' + towerDegrees[i] + ']', 128, y + 18);
      }
    }
    for (let i = 0; i < extensionLayers; i++) {
      const y1 = i * 48 + 36;
      const y2 = (i + 1) * 48;
      p.stroke('#f78166');
      p.strokeWeight(1.5);
      p.line(67, y1, 67, y2);
      p.fill('#f78166');
      p.noStroke();
      p.triangle(63, y2 - 4, 71, y2 - 4, 67, y2);
    }
    if (extensionLayers > 0) {
      p.fill('#f78166');
      p.textSize(13);
      p.text('Gal(ℚ(ζₙ)/ℚ) ≅ (ℤ/nℤ)*', 10, extensionLayers * 48 + 52);
    }
    p.pop();

    // --- Root circle (right) ---
    p.push();
    const rootCX = 370;
    const rootCY = 150;
    const crR = 85;
    p.translate(rootCX, rootCY);
    const totalAngle = autoAngle + userAngle;

    // Orbit lines for permutation
    if (showPermutation && cycleHighlight >= 0) {
      p.stroke('#f78166');
      p.strokeWeight(2);
      for (let i = 0; i < n; i++) {
        const j = permRoots[i];
        const a1 = totalAngle + i * Math.PI * 2 / n;
        const a2 = totalAngle + j * Math.PI * 2 / n;
        if (i !== j) {
          p.drawingContext.setLineDash([4, 4]);
          p.line(crR * Math.cos(a1), crR * Math.sin(a1), crR * Math.cos(a2), crR * Math.sin(a2));
          p.drawingContext.setLineDash([]);
        }
      }
    }

    for (let i = 0; i < n; i++) {
      const a = totalAngle + i * Math.PI * 2 / n;
      const x = crR * Math.cos(a);
      const y = crR * Math.sin(a);
      const isSel = i === selectedRoot;
      p.fill(isSel ? '#f78166' : '#58a6ff');
      p.noStroke();
      p.circle(x, y, isSel ? 16 : 10);
      p.fill('#c9d1d9');
      p.textSize(11);
      p.textAlign(p.CENTER);
      p.text('ζ' + (i === 0 ? '₀' : i), x, y - 14);
      if (isSel) {
        p.fill('#f78166');
        p.textSize(10);
        p.text('σ(ζ' + i + ')=ζ' + i + '^(' + (i + 2) + ')', x, y + 22);
      }
    }

    // Connecting lines
    p.noFill();
    p.stroke('#30363d');
    p.strokeWeight(0.8);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = totalAngle + i * Math.PI * 2 / n;
        const b = totalAngle + j * Math.PI * 2 / n;
        p.line(crR * Math.cos(a), crR * Math.sin(a), crR * Math.cos(b), crR * Math.sin(b));
      }
    }
    p.pop();

    // --- Galois cycle structure (bottom) ---
    p.push();
    p.translate(310, 370);
    const g = n - 1;
    const cycR = 40;

    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text('Galois group: C' + g, 0, -50);

    // Draw cycle nodes
    p.noFill();
    p.stroke('#30363d');
    p.strokeWeight(1.5);
    p.beginShape();
    for (let i = 0; i <= g; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / g;
      p.vertex(cycR * Math.cos(a), cycR * Math.sin(a));
    }
    p.endShape();

    // Direction arrows on edges
    for (let i = 0; i < g; i++) {
      const a1 = -Math.PI / 2 + i * Math.PI * 2 / g;
      const a2 = -Math.PI / 2 + (i + 1) * Math.PI * 2 / g;
      const mx = cycR * Math.cos((a1 + a2) / 2);
      const my = cycR * Math.sin((a1 + a2) / 2);
      p.stroke('#f78166');
      p.strokeWeight(1);
      // arrow
      const dx = -Math.sin((a1 + a2) / 2) * 4;
      const dy = Math.cos((a1 + a2) / 2) * 4;
      p.line(mx - dx, my - dy, mx + dx, my + dy);
    }

    for (let i = 0; i < g; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / g;
      const x = cycR * Math.cos(a);
      const y = cycR * Math.sin(a);
      const isHL = i === cycleHighlight;
      p.fill(isHL ? '#f78166' : '#58a6ff');
      p.noStroke();
      p.circle(x, y, isHL ? 14 : 9);
      p.fill('#0d1117');
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(i + 1, x, y + 1);
    }

    if (cycleHighlight >= 0) {
      p.fill('#f78166');
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text('σ' + (cycleHighlight + 1) + ': ζ ↦ ζ^' + (cycleHighlight + 2), 0, cycR + 14);
    }
    p.pop();

    // Solvability status
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    const solvable = n <= 4;
    p.fill(solvable ? '#7ee787' : '#f78166');
    p.text('S' + n + ' is ' + (solvable ? 'solvable ✓ radicals exist' : 'NOT solvable ✗ no radical formula'), 10, 475);
  };
};

new p5(s);
