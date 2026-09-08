import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let mode = 'wave'; // 'wave' | 'lines' | 'capacitor'
  let freq = 1.2;
  let amp = 0.8;
  let charges = [];
  const c = 300;
  const sliders = {};

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 420).parent('p5canvas');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:6px 0';
    const mkBtn = (txt, m) => {
      const b = document.createElement('button');
      b.textContent = txt;
      b.style.cssText = 'background:#161b22;color:#8b949e;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.8em';
      b.classList.add('em-mode');
      b.addEventListener('click', () => {
        mode = m;
        document.querySelectorAll('.em-mode').forEach((x) => {
          x.style.color = '#8b949e';
          x.style.borderColor = '#30363d';
        });
        b.style.color = '#f78166';
        b.style.borderColor = '#f78166';
        updateSliders();
      });
      btnRow.appendChild(b);
      return b;
    };
    const b1 = mkBtn('EM Wave', 'wave');
    mkBtn('Field Lines', 'lines');
    mkBtn('Capacitor', 'capacitor');
    b1.style.color = '#f78166';
    b1.style.borderColor = '#f78166';
    document.querySelector('.sketch-col')?.appendChild(btnRow);

    const mkSlider = (labelText, min, max, step, val, id) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:2px 0';
      const lab = document.createElement('span');
      lab.style.cssText = 'font-size:0.78em;color:#8b949e;width:118px';
      lab.textContent = labelText;
      row.appendChild(lab);
      const sl = document.createElement('input');
      sl.type = 'range'; sl.min = '' + min; sl.max = '' + max; sl.step = '' + step; sl.value = '' + val;
      sl.style.cssText = 'width:150px;accent-color:#58a6ff';
      row.appendChild(sl);
      const valSpan = document.createElement('span');
      valSpan.style.cssText = 'font-size:0.78em;color:#f78166;width:76px';
      row.appendChild(valSpan);
      document.querySelector('.sketch-col')?.appendChild(row);
      sliders[id] = { row, sl, val: valSpan };
      return sliders[id];
    };

    const f = mkSlider('Frequency f:', '0.6', '3.5', '0.05', freq, 'freq');
    f.sl.addEventListener('input', () => {
      freq = parseFloat(f.sl.value);
      f.val.textContent = freq.toFixed(2) + ' Hz';
    });
    f.val.textContent = freq.toFixed(2) + ' Hz';

    const a = mkSlider('E-field strength:', '0.2', '1.6', '0.02', amp, 'strength');
    a.sl.addEventListener('input', () => {
      amp = parseFloat(a.sl.value);
      a.val.textContent = amp.toFixed(2);
    });
    a.val.textContent = amp.toFixed(2);

    p.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  function updateSliders() {
    sliders.freq.row.style.display = mode === 'wave' ? 'flex' : 'none';
    sliders.strength.row.style.display = 'flex';
  }

  function arrow(x0, y0, x1, y1, color, weight) {
    p.stroke(color);
    p.strokeWeight(weight);
    p.line(x0, y0, x1, y1);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const h = 6;
    p.noStroke();
    p.fill(color);
    p.triangle(
      x1, y1,
      x1 - h * Math.cos(ang - 0.45), y1 - h * Math.sin(ang - 0.45),
      x1 - h * Math.cos(ang + 0.45), y1 - h * Math.sin(ang + 0.45)
    );
  }

  function drawWave() {
    const t = p.millis() / 1000;
    const lam = c / freq;
    const k = (2 * Math.PI) / lam;
    const omega = 2 * Math.PI * freq;
    const yE = 118, yB = 320;
    const x0 = 35, x1 = 475;
    const Apx = amp * 52;

    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(x0, yE, x1, yE);
    p.line(x0, yB, x1, yB);

    p.noFill();
    p.stroke('#58a6ff');
    p.strokeWeight(1.2);
    p.beginShape();
    for (let x = x0; x <= x1; x += 3) p.vertex(x, yE - Apx * Math.sin(k * (x - x0) - omega * t));
    p.endShape();
    p.stroke('#f78166');
    p.strokeWeight(1.2);
    p.beginShape();
    for (let x = x0; x <= x1; x += 3) p.vertex(x, yB - Apx * Math.sin(k * (x - x0) - omega * t));
    p.endShape();

    for (let x = x0; x <= x1; x += 14) {
      const s = Math.sin(k * (x - x0) - omega * t);
      if (Math.abs(s) < 0.04) continue;
      const E = Apx * s;
      arrow(x, yE, x, yE - E, '#58a6ff', 1.8);

      const B = Apx * s;
      p.stroke('#f78166');
      p.strokeWeight(1.4);
      p.noFill();
      p.circle(x, yB, 12);
      if (B > 0) {
        p.noStroke();
        p.fill('#f78166');
        p.circle(x, yB, 3.4);
      } else {
        p.stroke('#f78166');
        p.strokeWeight(1.4);
        p.line(x - 3.4, yB - 3.4, x + 3.4, yB + 3.4);
        p.line(x - 3.4, yB + 3.4, x + 3.4, yB - 3.4);
      }
    }

    p.fill('#58a6ff');
    p.textSize(12);
    p.text('E (vertical, blue)', x0, yE - Apx - 18);
    p.fill('#f78166');
    p.text('B (⊙ out / ⊗ into page)', x0, yB + 30);

    const markerY = yB + 62;
    p.stroke('#7ee787');
    p.strokeWeight(1);
    p.line(x0, markerY, x0 + lam, markerY);
    p.line(x0, markerY - 5, x0, markerY + 5);
    p.line(x0 + lam, markerY - 5, x0 + lam, markerY + 5);
    p.fill('#7ee787');
    p.textSize(11);
    p.text('λ = c/f = ' + lam.toFixed(1) + ' px', x0 + 6, markerY + 18);

    p.fill('#8b949e');
    p.textSize(12);
    p.text('Propagation → x,  c = 1/√(μ₀ε₀)', x0, 24);
    p.fill('#484f58');
    p.textSize(10.5);
    p.text('E = A sin(kx − ωt),  B = (A/c) sin(kx − ωt),  E ⊥ B ⊥ k', x0, yE + Apx + 34);
  }

  function fieldAt(x, y) {
    let ex = 0, ey = 0;
    for (const ch of charges) {
      const dx = x - ch.x, dy = y - ch.y;
      const r2 = dx * dx + dy * dy + 8;
      const inv = Math.pow(r2, -1.5);
      ex += ch.q * dx * inv;
      ey += ch.q * dy * inv;
    }
    return { ex, ey };
  }

  function drawLines() {
    for (let gx = 30; gx < 470; gx += 34) {
      for (let gy = 40; gy < 390; gy += 34) {
        const f = fieldAt(gx, gy);
        const mag = Math.sqrt(f.ex * f.ex + f.ey * f.ey);
        if (mag < 1e-4) continue;
        const len = p.constrain(mag * amp * 22, 0, 16);
        const a0 = Math.atan2(f.ey, f.ex);
        const alpha = 40 + 130 * Math.min(1, mag * amp / 8);
        p.stroke(88, 166, 255, alpha);
        p.strokeWeight(1);
        const x0 = gx - Math.cos(a0) * len * 0.5, y0 = gy - Math.sin(a0) * len * 0.5;
        p.line(x0, y0, gx, gy);
      }
    }

    const steps = 220, stepSz = 6;
    for (const ch of charges) {
      const dir = Math.sign(ch.q);
      const N = 16;
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2;
        let x = ch.x + Math.cos(ang) * 9;
        let y = ch.y + Math.sin(ang) * 9;
        p.stroke(ch.q > 0 ? '#58a6ff' : '#f78166');
        p.strokeWeight(1.4);
        p.noFill();
        p.beginShape();
        for (let s = 0; s < steps; s++) {
          const f = fieldAt(x, y);
          const mag = Math.sqrt(f.ex * f.ex + f.ey * f.ey) || 1;
          const nx = (f.ex / mag) * dir;
          const ny = (f.ey / mag) * dir;
          p.vertex(x, y);
          x += nx * stepSz;
          y += ny * stepSz;
          if (x < 5 || x > 495 || y < 5 || y > 415) break;
          let hit = false;
          for (const o of charges) {
            if (o !== ch && p.dist(x, y, o.x, o.y) < 9) { hit = true; break; }
          }
          if (hit) break;
        }
        p.endShape();
      }
    }

    for (const ch of charges) {
      const R = 9 + 3 * Math.abs(ch.q);
      p.noStroke();
      p.fill(ch.q > 0 ? '#58a6ff' : '#f78166');
      p.circle(ch.x, ch.y, R * 2);
      p.fill('#0d1117');
      p.textSize(13);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(ch.q > 0 ? '+' : '−', ch.x, ch.y + 1);
    }
    p.textAlign(p.LEFT, p.TOP);

    p.fill('#8b949e');
    p.textSize(12);
    p.text('∇·E = ρ/ε₀  —  field lines diverge from +, converge to −', 30, 20);
    p.fill('#484f58');
    p.textSize(10.5);
    p.text('Left-click: place + charge  |  Right-click: place − charge  |  C: clear', 30, 400);
  }

  function drawCapacitor() {
    const t = p.millis() / 1000;
    const Q = amp * (1 - Math.cos(t * 0.9)) / 2;
    const px0 = 60, px1 = 440, yTop = 170, yBot = 260;

    p.stroke('#c9d1d9');
    p.strokeWeight(3);
    p.line(px0, yTop, px1, yTop);
    p.line(px0, yBot, px1, yBot);

    p.stroke('#7ee787');
    p.strokeWeight(2);
    p.line(px0, yTop, px0 - 20, yTop);
    p.line(px0 - 20, yTop, px0 - 20, yBot);
    p.line(px0 - 20, yBot, px0, yBot);

    const n = Math.round(Q * 16);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    for (let i = 0; i < n; i++) {
      const x = px0 + 20 + (i % 18) * 23;
      p.fill('#58a6ff');
      p.textSize(12);
      p.text('+', x, yTop - 16);
      p.fill('#f78166');
      p.text('−', x, yBot + 16);
    }
    p.textAlign(p.LEFT, p.TOP);

    const nE = 4 + Math.round(Q * 5);
    const ymid = (yTop + yBot) / 2;
    for (let i = 0; i < nE; i++) {
      const x = px0 + 30 + (i * (px1 - px0 - 60)) / (nE - 1);
      const len = 6 + Q * 14;
      arrow(x, ymid, x, ymid - len, '#58a6ff', 1.8);
    }

    const drawBCircles = (x, y, maxR) => {
      p.stroke('#f78166');
      p.strokeWeight(1.2);
      for (let r = 8; r <= maxR; r += 8) {
        p.drawingContext.setLineDash([4, 4]);
        p.noFill();
        p.circle(x, y, r * 2);
        p.drawingContext.setLineDash([]);
        p.noStroke();
        p.fill('#f78166');
        p.circle(x, y - r, 2.4);
      }
    };
    drawBCircles(px0 - 20, ymid, 6 + Q * 14);
    drawBCircles(px1 - 60, ymid, 6 + Q * 16);

    p.fill('#f78166');
    p.textSize(11.5);
    p.text('B (conduction current)', px0 - 76, 44);
    p.text('B (displacement current)', px1 - 156, 44);
    p.fill('#58a6ff');
    p.text('E between plates', px0 + 110, yBot + 40);

    p.fill('#8b949e');
    p.textSize(12);
    p.text('Maxwell:  ∇×B = μ₀J + μ₀ε₀ ∂E/∂t', 60, 20);
    p.fill('#7ee787');
    p.textSize(11);
    p.text('Charge Q = ' + Q.toFixed(2) + ' accumulating on plates', 60, 400);
    p.fill('#484f58');
    p.text('Displacement current I_d = ε₀ dΦ_E/dt — B in gap comes from ∂E/∂t', 60, 380);
  }

  p.draw = () => {
    p.background('#0d1117');
    if (mode === 'wave') drawWave();
    else if (mode === 'lines') drawLines();
    else drawCapacitor();
  };

  p.mousePressed = () => {
    if (mode !== 'lines') return false;
    if (p.mouseX > 0 && p.mouseX < 500 && p.mouseY > 0 && p.mouseY < 420) {
      const q = p.mouseButton === p.RIGHT ? -1 : 1;
      charges.push({ x: p.mouseX, y: p.mouseY, q: q * amp });
    }
    return false;
  };

  p.keyPressed = () => {
    if (mode === 'lines' && (p.key === 'c' || p.key === 'C')) {
      charges = [];
    }
  };
};

new p5(sketch);
