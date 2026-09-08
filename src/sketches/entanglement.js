import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let alice = -1, bob = -1; // -1 = not measured
  let correlated = true;
  let corrStrength = 1;
  let count = 0, agree = 0;
  let measAnim = 0; // measurement animation timer

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    const c = p.createCanvas(Math.min(520, p.windowWidth - 40), 420);
    c.parent('p5canvas');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:6px 0;';

    const mBtn = document.createElement('button');
    mBtn.textContent = '测量';
    mBtn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:7px 16px;border-radius:8px;cursor:pointer;font-size:0.85em;margin:2px';
    mBtn.addEventListener('click', () => {
      measAnim = 1;
      setTimeout(() => {
        const r = Math.random();
        alice = r < 0.5 ? 0 : 1;
        bob = Math.random() < (correlated ? corrStrength : 0.5) ? alice : 1 - alice;
        count++;
        if (alice === bob) agree++;
        measAnim = 0;
      }, 300);
    });
    btnRow.appendChild(mBtn);

    const tBtn = document.createElement('button');
    tBtn.textContent = 'Correlated: ON';
    tBtn.style.cssText =
      'background:#161b22;color:#7ee787;border:1px solid #30363d;padding:7px 16px;border-radius:8px;cursor:pointer;font-size:0.85em;margin:2px';
    tBtn.addEventListener('click', () => {
      correlated = !correlated;
      tBtn.textContent = correlated ? 'Correlated: ON' : 'Correlated: OFF';
      tBtn.style.color = correlated ? '#7ee787' : '#f78166';
      count = 0;
      agree = 0;
      alice = -1;
      bob = -1;
    });
    btnRow.appendChild(tBtn);

    const rBtn = document.createElement('button');
    rBtn.textContent = '重置';
    rBtn.style.cssText =
      'background:#161b22;color:#8b949e;border:1px solid #30363d;padding:7px 16px;border-radius:8px;cursor:pointer;font-size:0.85em;margin:2px';
    rBtn.addEventListener('click', () => {
      count = 0;
      agree = 0;
      alice = -1;
      bob = -1;
    });
    btnRow.appendChild(rBtn);

    const corrRow = document.createElement('div');
    corrRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin:2px 0;flex-wrap:wrap';
    const corrLabel = document.createElement('span');
    corrLabel.textContent = 'Correlation strength:';
    corrLabel.style.cssText = 'color:#8b949e;font-size:0.82em';
    const corrSpan = document.createElement('span');
    corrSpan.textContent = '1.00';
    corrSpan.style.cssText = 'color:#7ee787;font-size:0.82em;min-width:32px';
    const corrSlider = document.createElement('input');
    corrSlider.type = 'range'; corrSlider.min = '0'; corrSlider.max = '1'; corrSlider.step = '0.01'; corrSlider.value = '1';
    corrSlider.style.cssText = 'width:150px;accent-color:#58a6ff';
    corrSlider.addEventListener('input', () => {
      corrStrength = parseFloat(corrSlider.value);
      corrSpan.textContent = corrStrength.toFixed(2);
      if (corrStrength <= 0.5) corrSpan.style.color = '#f78166';
      else if (corrStrength <= 0.707) corrSpan.style.color = '#ffd33d';
      else corrSpan.style.color = '#7ee787';
    });
    corrRow.appendChild(corrLabel); corrRow.appendChild(corrSlider); corrRow.appendChild(corrSpan);
    document.querySelector('.sketch-col')?.appendChild(corrRow);
    document.querySelector('.sketch-col')?.appendChild(btnRow);
  };

  p.draw = () => {
    p.background('#0d1117');
    const cx = p.width / 2;
    const cy = 180;

    // Entanglement line
    p.stroke('#ffd33d');
    p.strokeWeight(2.5);
    p.drawingContext.setLineDash([6, 4]);
    p.line(cx - 140, cy, cx + 140, cy);
    p.drawingContext.setLineDash([]);

    // Bell state label
    p.fill('#ffd33d');
    p.textSize(13);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(correlated ? "Bell state |Φ⁺⟩ = (|00⟩+|11⟩)/√2" : 'No correlation (classical)', cx, cy - 15);

    // Alice's qubit (left)
    const ax = cx - 160, ay = cy;
    p.fill('#161b22');
    p.stroke('#58a6ff');
    p.strokeWeight(2.5);
    p.circle(ax, ay, 80);

    if (alice >= 0) {
      // Show measurement result
      p.fill('#58a6ff');
      p.noStroke();
      p.textSize(36);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(alice, ax, ay);
    } else {
      p.fill('#58a6ff');
      p.noStroke();
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('?', ax, ay);
    }
    p.fill('#8b949e');
    p.textSize(13);
    p.text('Alice', ax, ay + 52);

    // Bob's qubit (right)
    const bx = cx + 160, by = ay;
    p.fill('#161b22');
    p.stroke('#f78166');
    p.strokeWeight(2.5);
    p.circle(bx, by, 80);

    if (bob >= 0) {
      p.fill('#f78166');
      p.noStroke();
      p.textSize(36);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(bob, bx, by);
    } else {
      p.fill('#f78166');
      p.noStroke();
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('?', bx, by);
    }
    p.fill('#8b949e');
    p.textSize(13);
    p.text('Bob', bx, by + 52);

    // Measurement animation flash
    if (measAnim > 0) {
      p.fill(255, 255, 255, 40 * measAnim);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
    }

    // Stats panel
    const sx = 15, sy = 8;
    p.fill('#0d1117');
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(sx, sy, 220, 52, 6);
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      `Trials: ${count}  |  Match: ${agree}  |  ` +
        (count > 0 ? (agree / count * 100).toFixed(0) : '—') +
        '%',
      sx + 8, sy + 8
    );
    if (correlated) {
      p.fill('#7ee787');
      p.text('Quantum: 100% correlation expected (≠ causation!)', sx + 8, sy + 28);
    } else {
      p.fill('#f78166');
      p.text('Classical: ~50% match (random)', sx + 8, sy + 28);
    }

    const chsh = correlated ? corrStrength * 2 * Math.sqrt(2) : 0;
    const chshCol = chsh > 2 ? '#7ee787' : '#f78166';
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Bell test: CHSH ≤ 2 (local realism) | QM: CHSH = 2√2 ≈ 2.828', sx, p.height - 34);
    p.fill(chshCol);
    p.text('Live CHSH: ' + chsh.toFixed(3) + ' (corr=' + corrStrength.toFixed(2) + ') ' + (chsh > 2 ? '— violates!' : '— classical'), sx, p.height - 22);
    p.fill('#8b949e');
    p.text('2022 Nobel: Aspect, Clauser, Zeilinger — entanglement experiments', sx, p.height - 10);
  };
};

new p5(sketch);
