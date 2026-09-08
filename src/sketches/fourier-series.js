import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let harmonics = 1;
  let waveType = 'square'; // 'square' | 'sawtooth' | 'triangle'
  let playing = false;
  let playTimer = 0;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 420).parent('p5canvas');
    const wrap = document.querySelector('.sketch-col');

    // Wave type buttons
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:4px;margin:4px 0;';
    const types = [
      { id: 'square', label: 'Square' },
      { id: 'sawtooth', label: 'Sawtooth' },
      { id: 'triangle', label: 'Triangle' },
    ];
    types.forEach(tp => {
      const b = document.createElement('button');
      b.textContent = tp.label;
      b.style.cssText = `padding:3px 10px;border:1px solid #30363d;border-radius:4px;background:${
        waveType === tp.id ? '#1f2a3a' : '#0d1117'
      };color:#58a6ff;cursor:pointer;font-size:0.8em;`;
      b.addEventListener('click', () => {
        waveType = tp.id;
        document.querySelectorAll('[data-wave-btn]').forEach(bb => {
          bb.style.background = bb.dataset.waveId === waveType ? '#1f2a3a' : '#0d1117';
        });
      });
      b.dataset.waveId = tp.id;
      b.dataset.waveBtn = '1';
      btnRow.appendChild(b);
    });

    // Play button
    const playBtn = document.createElement('button');
    playBtn.id = 'play-btn';
    playBtn.textContent = '▶ Play';
    playBtn.style.cssText =
      'padding:3px 12px;border:1px solid #30363d;border-radius:4px;background:#0d1117;color:#58a6ff;cursor:pointer;font-size:0.8em;margin:2px;';
    playBtn.addEventListener('click', () => {
      playing = !playing;
      playBtn.textContent = playing ? '⏸ Stop' : '▶ Play';
      playBtn.style.background = playing ? '#1f2a3a' : '#0d1117';
    });
    btnRow.appendChild(playBtn);

    // Harmonics slider
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '1'; sl.max = '30'; sl.step = '1'; sl.value = '1';
    sl.style.cssText = 'width:160px;accent-color:#58a6ff;margin:2px';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8b949e;font-size:0.85em;margin-left:6px';
    lbl.textContent = '1 harmonic';
    sl.addEventListener('input', () => {
      harmonics = parseInt(sl.value);
      lbl.textContent = harmonics + ' harmonics';
    });

    wrap?.appendChild(btnRow);
    wrap?.appendChild(sl);
    wrap?.appendChild(lbl);
  };

  // Compute wave value at t in [0, 2π)
  const waveVal = (t, H) => {
    let s = 0;
    if (waveType === 'square') {
      for (let k = 1; k <= H; k++) {
        const nv = 2 * k - 1;
        s += (4 / (p.PI * nv)) * p.sin(nv * t);
      }
    } else if (waveType === 'sawtooth') {
      for (let k = 1; k <= H; k++) {
        s += (2 / (p.PI * k)) * p.sin(k * t) * (k % 2 === 0 ? -1 : 1);
      }
    } else { // triangle
      for (let k = 1; k <= H; k++) {
        const nv = 2 * k - 1;
        const sign = ((k - 1) % 2 === 0) ? 1 : -1;
        s += (8 / (p.PI * p.PI * nv * nv)) * sign * p.sin(nv * t);
      }
    }
    return s;
  };

  p.draw = () => {
    p.background('#0d1117');
    const w = p.width, h = p.height;

    // Auto-play
    if (playing) {
      playTimer += p.deltaTime / 1000;
      if (playTimer > 0.15) {
        playTimer = 0;
        harmonics = (harmonics % 30) + 1;
        document.querySelectorAll('span').forEach(s => { if (s.textContent && s.textContent.includes('harmonic')) s.textContent = harmonics + ' harmonics'; });
      }
    }

    // --- Main waveform ---
    const x0 = 40, x1 = w - 40;
    const mainY = 95, mainAmp = 55;
    p.stroke('#f78166');
    p.strokeWeight(2.5);
    p.noFill();
    p.beginShape();
    for (let x = x0; x <= x1; x += 1) {
      const t = p.map(x, x0, x1, -p.PI, p.PI);
      p.vertex(x, mainY - waveVal(t, harmonics) * mainAmp);
    }
    p.endShape();
    p.stroke('#333'); p.strokeWeight(1);
    p.line(x0, mainY, x1, mainY);

    // Labels
    p.fill('#8b949e');
    p.textSize(12);
    const labels = {
      square: 'Square = 4/π (sin x + 1/3 sin 3x + 1/5 sin 5x + ...)',
      sawtooth: 'Sawtooth = 2/π (sin x − 1/2 sin 2x + 1/3 sin 3x − ...)',
      triangle: 'Triangle = 8/π² (sin x − 1/9 sin 3x + 1/25 sin 5x − ...)',
    };
    p.text(labels[waveType], 40, 20);
    p.fill('#58a6ff');
    p.text(`Harmonics: ${harmonics}`, 40, 42);

    if (waveType === 'square') {
      const gibbsPct = harmonics >= 2 ? 17.9 - (17.9 - 8.0) / (1 + 0.3 * harmonics) : 0;
      p.fill('#f78166');
      p.textSize(10);
      p.text(`Gibbs overshoot ≈ ${gibbsPct.toFixed(1)}% of jump (→ ~8.95% as N→∞)`, 40, 62);
    }

    // --- Individual harmonics (compact) ---
    const compY0 = 165, compSpacing = 8, compAmp = 4;
    const maxShow = Math.min(harmonics, 16);
    const compCols = ['#58a6ff', '#f78166', '#79c0ff', '#ffa198', '#a5d6ff', '#ffc2af'];
    for (let k = 1; k <= maxShow; k++) {
      const nv = waveType === 'sawtooth' ? k : 2 * k - 1;
      p.stroke(compCols[k % 6]);
      p.strokeWeight(1);
      p.noFill();
      p.beginShape();
      const offY = compY0 + (k - 1) * compSpacing;
      for (let x = x0; x <= x1; x += 1) {
        const t = p.map(x, x0, x1, -p.PI, p.PI);
        let coeff;
        if (waveType === 'square') coeff = 4 / (p.PI * nv);
        else if (waveType === 'sawtooth') coeff = (2 / (p.PI * k)) * (k % 2 === 0 ? -1 : 1);
        else coeff = (8 / (p.PI * p.PI * nv * nv)) * ((k - 1) % 2 === 0 ? 1 : -1);
        p.vertex(x, offY + compAmp * 2 - coeff * p.sin(nv * t) * compAmp * 2);
      }
      p.endShape();
    }
    p.fill('#8b949e');
    p.textSize(10);
    p.text('Individual harmonics:', x0, compY0 - 10);

    // --- Frequency spectrum (bottom) ---
    const specY = h - 45, maxBarH = 70, barW = 6;
    const nBars = Math.min(harmonics, 26);
    const barGap = barW + 2;
    const specW = barGap * nBars;
    const specStart = p.constrain((w - specW) / 2, 40, w - specW - 20);
    for (let k = 1; k <= nBars; k++) {
      let ampl;
      if (waveType === 'square') ampl = 4 / (p.PI * (2 * k - 1));
      else if (waveType === 'sawtooth') ampl = 2 / (p.PI * k);
      else ampl = 8 / (p.PI * p.PI * (2 * k - 1) * (2 * k - 1));
      const bh = ampl * maxBarH;
      p.fill(k % 2 === 0 ? '#58a6ff' : '#f78166');
      p.noStroke();
      p.rect(specStart + (k - 1) * barGap, specY - bh, barW, bh);
    }
    p.fill('#8b949e');
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Spectrum |a_n| (blue=even, orange=odd)', x0, specY + 6);
    p.text('n = 1, 3, 5, 7, ... →', specStart + specW / 2, specY + 18);
    p.textAlign(p.LEFT, p.TOP);
  };
};
new p5(sketch);
