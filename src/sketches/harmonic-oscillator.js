import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let n = 1;
  let viewMode = 'classical'; // 'classical' or 'quantum'

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 440).parent('p5canvas');
    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const label = document.createElement('span');
    label.style.cssText = 'font-size:0.8em;color:#8b949e';
    label.textContent = 'Energy level n:';
    slRow.appendChild(label);
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0'; sl.max = '10'; sl.step = '1'; sl.value = '1';
    sl.style.cssText = 'width:160px;accent-color:#58a6ff';
    sl.addEventListener('input', () => { n = parseInt(sl.value); });
    slRow.appendChild(sl);

    const btn = document.createElement('button');
    btn.textContent = '切换 量子/经典';
    btn.style.cssText = 'font-size:0.75em;background:#21262d;color:#8b949e;border:1px solid #30363d;border-radius:4px;padding:2px 8px;cursor:pointer;margin-left:8px';
    btn.addEventListener('click', () => { viewMode = viewMode === 'classical' ? 'quantum' : 'classical'; });
    slRow.appendChild(btn);

    document.querySelector('.sketch-col')?.appendChild(slRow);

    p.mousePressed = () => {
      const mx = p.mouseX, my = p.mouseY;
      const levelsY = [];
      for (let i = 0; i <= 10; i++) {
        const ly = 60 + i * 28;
        levelsY.push(ly);
      }
      for (let i = levelsY.length - 1; i >= 0; i--) {
        if (my >= levelsY[i] - 14 && my <= levelsY[i] + 14 && mx >= 310 && mx <= 480) {
          n = i;
          break;
        }
      }
    };
  };

  // Hermite polynomial via recursion
  const hermite = (n, x) => {
    if (n === 0) return 1;
    if (n === 1) return 2 * x;
    return 2 * x * hermite(n - 1, x) - 2 * (n - 1) * hermite(n - 2, x);
  };

  p.draw = () => {
    p.background('#0d1117');
    const margin = 25;

    if (viewMode === 'classical') {
      // Classical oscillator view
      const cx = 180, cy = 230;
      p.stroke('#1a1f2b'); p.strokeWeight(0.5);
      p.line(margin, cy, cx + 150, cy); // x-axis
      p.line(cx, margin, cx, 2 * cy - margin); // potential axis

      // Potential parabola
      p.stroke('#58a6ff', 80); p.strokeWeight(1.5); p.noFill();
      p.beginShape();
      for (let px = -130; px <= 130; px += 2) {
        const x = px / 100;
        const y = (x * x) * 130;
        p.vertex(cx + px, cy - y);
      }
      p.endShape();

      const t = p.frameCount * 0.04;
      const amplitude = Math.sqrt(2 * (n + 0.5)) * 80;
      const x0 = cx + amplitude * Math.cos(t);
      const y0 = cy - (amplitude / 80) * (amplitude / 80) * 130;

      // Orbit
      p.stroke('#58a6ff'); p.strokeWeight(2); p.noFill();
      p.ellipse(cx, cy, amplitude * 2, (amplitude * amplitude / 80 / 80 * 130) * 2);

      // Mass
      p.stroke('#f78166'); p.strokeWeight(3);
      p.line(cx, cy, x0, y0);
      p.fill('#f78166'); p.noStroke(); p.circle(x0, y0, 10);

      // Energy levels on right side
      for (let i = 0; i <= 10; i++) {
        const ey = cy - (i + 0.5) / (10.5) * 200;
        const active = i === n;
        p.stroke(active ? '#f78166' : '#7ee787'); p.strokeWeight(active ? 2.5 : 1.2);
        p.line(cx + 150, ey, cx + 260, ey);
        p.noStroke(); p.fill('#7ee787'); p.textSize(12);
        p.text('n=' + i, cx + 140, ey + 4);
      }

      p.noStroke(); p.fill('#8b949e'); p.textSize(14); p.textAlign(p.LEFT, p.TOP);
      p.text('Classical oscillator — E = ħω(n + ½)  E₀ = ½ħω (zero-point!)', margin, margin - 6);
      p.text('Click energy levels to change n  |  Ball orbits phase space', margin + 120, margin + 14);

    } else {
      // Quantum view — wavefunction
      const cxQ = 80, cyQ = 240;
      const wQ = 360;

      p.stroke('#1a1f2b'); p.strokeWeight(0.5);
      p.line(cxQ, margin, cxQ, cyQ + 80);
      p.line(margin, cyQ, cxQ + wQ, cyQ);

      // Potential
      p.stroke('#58a6ff', 60); p.strokeWeight(1.5); p.noFill();
      p.beginShape();
      for (let px = 0; px <= wQ; px += 2) {
        const x = p.map(px, 0, wQ, -4, 4);
        const v = x * x * 18;
        p.vertex(cxQ + px, cyQ - v);
      }
      p.endShape();

      // Wavefunction ψ²
      p.stroke('#f78166'); p.strokeWeight(2); p.noFill();
      p.beginShape();
      for (let px = 0; px <= wQ; px += 2) {
        const x = p.map(px, 0, wQ, -3.5, 3.5);
        const h = hermite(n, x);
        const psi = h * Math.exp(-x * x / 2);
        const norm = Math.sqrt(Math.PI) * Math.pow(2, n) * factorial(n);
        const psiN = psi / Math.sqrt(norm);
        const energyLevel = (n + 0.5) * 18;
        p.vertex(cxQ + px, cyQ - energyLevel - psiN * psiN * 120);
      }
      p.endShape();

      // Energy level line
      const eLineY = cyQ - (n + 0.5) * 18;
      p.stroke('#7ee787'); p.strokeWeight(1.5);
      p.line(cxQ, eLineY, cxQ + wQ, eLineY);

      // Wavefunction nodes
      p.fill('#7ee787'); p.noStroke();
      for (let i = 0; i <= n; i++) {
        const nodeX = p.map(i / (n + 1), 0, 1, cxQ + 20, cxQ + wQ - 20);
        p.circle(nodeX, eLineY, 4);
      }

      p.noStroke(); p.fill('#8b949e'); p.textSize(14); p.textAlign(p.LEFT, p.TOP);
      p.text('Quantum harmonic oscillator — wavefunction |ψ_n|² shown', margin, margin - 6);
      p.text('Energy = ħω(' + n + ' + ½) = ' + (n + 0.5).toFixed(1) + 'ħω  |  ' + (n + 1) + ' nodes', margin + 120, margin + 14);
      p.text('Blue = potential  |  Red = |ψ|²  |  Green dots = nodes', margin, margin + 34);
      p.text('Click Toggle button to switch back to Classical view', margin, margin + 54);
    }
  };
};

function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }

new p5(sketch);
