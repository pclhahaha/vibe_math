import p5 from 'p5';

const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let ringIdx = 0;
  let selectedPrime = -1;
  let hoverPrime = -1;
  let showKrullDim = true;
  let krullSlider = 3;

  // Predefined rings and their spectra
  const rings = [
    { n: 'ℤ', spec: ['(2)', '(3)', '(5)', '(7)'], dim: 1, color: '#58a6ff', primes: [[2], [3], [5], [7]] },
    { n: 'ℤ[x]', spec: ['(2,x)', '(3,x)', '(x)', '(x²+1)', '(2)'], dim: 2, color: '#7ee787', primes: [[2, 0], [3, 0], [0, 0], [0, 1], [2, -1]] },
    { n: 'ℤ[x,y]', spec: ['(2,x,y)', '(x)', '(x,y)', '(y)', '(2,x)', '(x,y²-2)'], dim: 3, color: '#f78166', primes: [[2, 0, 0], [0, 0, 1], [0, 0, 2], [0, 1, 0], [2, 0, 2], [0, 0, 1.5]] },
    { n: 'ℤ[x₁,…,xₙ]', spec: ['(2,x₁,…,xₙ)', '(x₁)', '(x₁,x₂)', '…'], dim: krullSlider, color: '#ffd33d', primes: [[2, 0, krullSlider], [0, 1, 0], [0, 1, 1], [-1, -1, -1]] },
  ];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(530, 490).parent('p5canvas');

    // Ring selector slider
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '1';
    sl.max = '6';
    sl.step = '1';
    sl.value = '3';
    sl.style.cssText = 'width:120px;accent-color:#58a6ff;margin:4px 2px';
    sl.addEventListener('input', () => {
      krullSlider = parseInt(sl.value);
      if (ringIdx === 3) rings[3].dim = krullSlider;
    });
    document.querySelector('.sketch-col')?.appendChild(sl);

    const lbl = document.createElement('span');
    lbl.id = 'comm-dim-label';
    lbl.style.cssText = 'color:#8b949e;font-size:0.85em;margin-left:6px';
    lbl.textContent = 'dim=' + krullSlider;
    document.querySelector('.sketch-col')?.appendChild(lbl);
    sl.addEventListener('input', () => {
      const el = document.getElementById('comm-dim-label');
      if (el) el.textContent = 'dim=' + sl.value;
    });

    // Ring buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:3px;margin:4px 0;flex-wrap:wrap';
    document.querySelector('.sketch-col')?.appendChild(btnContainer);

    const buttons = [];
    for (let i = 0; i < rings.length; i++) {
      const btn = document.createElement('button');
      btn.textContent = rings[i].n;
      btn.style.cssText = 'background:#21262d;color:' + rings[i].color + ';border:1px solid ' + (i === ringIdx ? rings[i].color : '#30363d') + ';border-radius:4px;padding:3px 10px;font-size:0.78em;cursor:pointer';
      btn.addEventListener('click', () => {
        ringIdx = i;
        selectedPrime = -1;
        hoverPrime = -1;
        for (let j = 0; j < 4; j++) {
          buttons[j].style.borderColor = j === i ? rings[j].color : '#30363d';
          buttons[j].style.color = j === i ? rings[j].color : '#8b949e';
        }
      });
      btnContainer.appendChild(btn);
      buttons.push(btn);
    }

    // Toggle Krull dim
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Krull 维数链';
    toggleBtn.style.cssText = 'margin:4px 4px;background:#21262d;color:#ffd33d;border:1px solid #ffd33d;border-radius:4px;padding:3px 10px;font-size:0.8em;cursor:pointer';
    toggleBtn.addEventListener('click', () => { showKrullDim = !showKrullDim; });
    document.querySelector('.sketch-col')?.appendChild(toggleBtn);

    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:0.72em;margin:2px 0';
    hint.textContent = 'Click ring buttons → switch ring | Click spectrum points → view prime ideals | Toggle Krull dim → see chains';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mouseMoved = () => {
    hoverPrime = -1;
    const ring = rings[ringIdx];
    const cx = 185, cy = 90;

    for (let i = 0; i < ring.spec.length; i++) {
      const px = cx + (i % 3 - 1) * 80 + (Math.random() - 0.5) * 20;
      const py = cy + Math.floor(i / 3) * 70 + 40 + Math.random() * 20;
      if (i === 0) {
        if (p.dist(p.mouseX, p.mouseY, cx + 60, cy + 40) < 18) { hoverPrime = i; return; }
        continue;
      }
      if (p.dist(p.mouseX, p.mouseY, px, py) < 16) { hoverPrime = i; return; }
    }
  };

  p.mousePressed = () => {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
    const ring = rings[ringIdx];
    const cx = 185, cy = 90;

    for (let i = 0; i < ring.spec.length; i++) {
      let px, py;
      if (i === 0) { px = cx + 60; py = cy + 40; }
      else {
        px = cx + (i % 3 - 1) * 80 + ((i * 13) % 19 - 9);
        py = cy + Math.floor(i / 3) * 70 + 40 + (i * 7) % 15;
      }
      if (p.dist(p.mouseX, p.mouseY, px, py) < 16) {
        selectedPrime = (selectedPrime === i) ? -1 : i;
        return;
      }
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    const ring = rings[ringIdx];

    // --- Draw spectrum of current ring (center area) ---
    p.push();
    p.translate(10, 10);
    p.fill(ring.color);
    p.textSize(16);
    p.text('Spec(' + ring.n + ')', 10, 22);

    // Draw the affine scheme region
    p.fill('#161b22');
    p.stroke(ring.color);
    p.strokeWeight(2);
    const specX = 10, specY = 38, specW = 380, specH = 220;
    p.rect(specX, specY, specW, specH, 6);

    p.fill('#8b949e');
    p.textSize(10);
    p.text('Affine Scheme', specX + 10, specY + 16);

    // Draw prime ideal points
    const cx = specX + specW / 2;
    const cy = specY + specH / 2;

    for (let i = 0; i < ring.spec.length; i++) {
      let px, py;
      if (i === 0) { px = cx + 40; py = cy - 20; }
      else if (i === 1) { px = cx - 50; py = cy + 50; }
      else if (i === 2) { px = cx + 70; py = cy + 60; }
      else if (i === 3) { px = cx - 70; py = cy - 10; }
      else if (i === 4) { px = cx + 20; py = cy + 10; }
      else { px = cx - 20; py = cy - 50; }

      const isHL = i === hoverPrime || i === selectedPrime;
      p.fill(isHL ? '#f78166' : ring.color);
      p.noStroke();
      p.circle(px, py, isHL ? 14 : 8);

      if (isHL) {
        // Glow
        p.fill(ring.color === '#58a6ff' ? 'rgba(88,166,255,0.2)' :
          ring.color === '#7ee787' ? 'rgba(126,231,135,0.2)' :
            ring.color === '#f78166' ? 'rgba(247,129,102,0.2)' : 'rgba(255,211,61,0.2)');
        p.noStroke();
        p.circle(px, py, 24);
      }

      // Prime label
      if (isHL) {
        p.fill('#fff');
        p.textSize(10);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(ring.spec[i], px, py - 12);
      }
    }

    // Draw generic point for integral domains
    if (ring.dim > 1) {
      p.fill(ring.color);
      p.noFill();
      p.stroke(ring.color);
      p.strokeWeight(2);
      p.circle(cx + 10, cy - 10, 50);
      p.fill(ring.color);
      p.textSize(11);
      p.textAlign(p.CENTER);
      p.text('η (generic pt)', cx + 10, cy - 40);
    }

    // Krull dimension chains
    if (showKrullDim) {
      for (let d = 0; d < Math.min(ring.dim, krullSlider); d++) {
        const x = specX + 20 + d * 80;
        const y = specY + specH - 30 - d * 25;
        p.fill(d === 0 ? '#58a6ff' : d === 1 ? '#7ee787' : '#f78166');
        p.noStroke();
        p.circle(x, y, 8);

        if (d < Math.min(ring.dim, krullSlider) - 1) {
          p.stroke('#ffd33d');
          p.strokeWeight(2);
          const nx = specX + 20 + (d + 1) * 80;
          const ny = specY + specH - 30 - (d + 1) * 25;
          p.line(x, y, nx, ny);
        }
      }
      p.fill('#ffd33d');
      p.textSize(10);
      p.textAlign(p.LEFT);
      p.text('dim=' + ring.dim + ' chain: P₀⊂P₁⊂…⊂Pₙ', specX + 10, specY + specH - 10);
    }
    p.pop();

    // --- Selected prime info panel (below spectrum) ---
    if (selectedPrime >= 0 && selectedPrime < ring.spec.length) {
      p.push();
      p.translate(10, 265);
      p.fill('#161b22');
      p.stroke(ring.color);
      p.strokeWeight(2);
      p.rect(0, 0, 380, 80, 6);

      p.fill('#c9d1d9');
      p.textSize(12);
      p.textAlign(p.LEFT, p.TOP);
      p.text('Prime ideal: ' + ring.spec[selectedPrime], 10, 10);

      p.fill('#8b949e');
      p.textSize(10);
      const primeDesc = getPrimeDescription(ring.n, ring.spec[selectedPrime]);
      p.text(primeDesc, 10, 28);

      p.fill('#58a6ff');
      p.text('ht(P) = ' + Math.min(selectedPrime + 1, ring.dim) + '     dim(R/P) = ' + Math.max(0, ring.dim - 1), 10, 46);
      p.fill('#8b949e');
      p.text('Residue field: ' + ring.n.replace(/x.*/, selectedPrime > 0 ? 'Fp' : 'Q'), 10, 62);
      p.pop();
    }

    // --- Ring ladder (right side) ---
    p.push();
    p.translate(410, 30);
    const ladderRings = ['ℤ', 'ℤ[x]', 'ℤ[x,y]', 'ℤ[x₁,…,xₙ]'];
    const ladderColors = ['#58a6ff', '#7ee787', '#f78166', '#ffd33d'];
    for (let i = 0; i < ladderRings.length; i++) {
      const y = i * 72;
      const active = i === ringIdx;
      p.fill('#161b22');
      p.stroke(active ? ladderColors[i] : '#30363d');
      p.strokeWeight(active ? 2.5 : 1);
      p.rect(0, y, 105, 48, 4);

      p.fill(active ? ladderColors[i] : '#8b949e');
      p.textSize(13);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(ladderRings[i], 8, y + 16);

      const dims = [1, 2, 3, i === 3 ? krullSlider : 3];
      p.fill('#8b949e');
      p.textSize(11);
      p.text('dim=' + dims[i], 8, y + 34);

      if (active) {
        p.fill(ladderColors[i]);
        p.textSize(11);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text('★', 95, y + 16);
      }
    }

    // Arrows
    for (let i = 0; i < ladderRings.length - 1; i++) {
      const y1 = i * 72 + 48;
      const y2 = (i + 1) * 72;
      p.stroke('#555');
      p.strokeWeight(2);
      p.line(52, y1, 52, y2);
      p.fill('#555');
      p.textSize(11);
      p.textAlign(p.CENTER);
      p.text('Noeth?', 52, (y1 + y2) / 2 + 4);
    }
    p.pop();

    // --- Hilbert Basis Theorem + info ---
    p.push();
    p.translate(10, 370);
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);

    // Affine algebra comment
    p.text('A = k[x₁,…,xₙ]/I   affine k-algebra', 0, 0);
    p.text('Hilbert Nullstellensatz: I(V(J)) = √J', 0, 18);

    p.fill('#c9d1d9');
    p.text('V(J) ↔ I(V)  Galois connection between geometry & algebra', 0, 38);

    const hasKrull = ring.dim >= krullSlider;
    p.fill(hasKrull ? '#7ee787' : '#f78166');
    p.textSize(10);
    p.text('Krull dim(' + ring.n + ') = ' + ring.dim + '   ' +
      (hasKrull ? '✓ chain exists' : '✗ chain too long'), 0, 56);

    p.fill('#58a6ff');
    p.textSize(10);
    p.text('R Noetherian ⇔ all ideals finitely generated ⇔ ACC on ideals', 0, 72);
    p.text('R integral domain + dim≤1 + integrally closed = Dedekind domain', 0, 88);
    p.pop();
  };
};

function getPrimeDescription(ring, prime) {
  if (ring === 'ℤ') {
    return 'Principal prime. The integer ' + prime.replace(/[()]/g, '') + ' is prime in ℤ.';
  }
  if (ring === 'ℤ[x]') {
    if (prime === '(2,x)') return 'Maximal ideal (2,x). Residue field = 𝔽₂. Height 2.';
    if (prime === '(3,x)') return 'Maximal ideal (3,x). Residue field = 𝔽₃.';
    if (prime === '(x)') return 'Height 1 prime. ℤ[x]/(x) ≅ ℤ. Not maximal.';
    if (prime === '(x²+1)') return 'Height 1 prime. ℤ[x]/(x²+1) ≅ ℤ[i].';
    return 'Prime in ℤ, extended to ℤ[x].';
  }
  if (ring === 'ℤ[x,y]') {
    if (prime === '(2,x,y)') return 'Maximal ideal. Residue field = 𝔽₂. Height 3.';
    if (prime === '(x,y)') return 'Maximal ideal (0 in origin). Residue field = ℤ.';
    if (prime === '(x)') return 'Height 1. ℤ[x,y]/(x) ≅ ℤ[y]. Not maximal.';
    return 'Prime ideal in ℤ[x,y].';
  }
  return 'Prime ideal in ' + ring + '.';
}

new p5(s);
