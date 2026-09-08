import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 1.0, rotY = 0;
  let dragging = false, prevX = 0, prevY = 0;
  let v = 2.5; // VEV position (0 = symmetric, >0 = broken)
  let targetV = 2.5;
  let autoPump = true;
  let pumpPhase = 0;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 500, p.WEBGL).parent('p5canvas');

    // Symmetry toggle button
    const symBtn = document.createElement('button');
    symBtn.textContent = 'Broken (SSB)';
    symBtn.style.cssText =
      'background:#161b22;color:#f78166;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.82em';
    symBtn.addEventListener('click', () => {
      if (targetV > 0.1) {
        targetV = 0;
        autoPump = false;
        symBtn.textContent = 'Symmetric (VEV=0)';
        symBtn.style.color = '#58a6ff';
      } else {
        targetV = 3;
        autoPump = false;
        symBtn.textContent = 'Broken (SSB)';
        symBtn.style.color = '#f78166';
      }
    });
    document.querySelector('.sketch-col')?.appendChild(symBtn);

    const autoBtn = document.createElement('button');
    autoBtn.textContent = 'Auto: ON';
    autoBtn.style.cssText =
      'background:#161b22;color:#7ee787;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.82em';
    autoBtn.addEventListener('click', () => {
      autoPump = !autoPump;
      autoBtn.textContent = autoPump ? 'Auto: ON' : 'Auto: OFF';
      if (autoPump) { targetV = 2.5; symBtn.textContent = 'Broken (SSB)'; symBtn.style.color = '#f78166'; }
    });
    document.querySelector('.sketch-col')?.appendChild(autoBtn);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.rotateX(rotX);
    p.rotateY(rotY);

    const sc = 55;
    const mu2 = 3, lam = 1;

    // Auto animation
    if (autoPump) {
      pumpPhase += 0.015;
      targetV = 2.5 + 0.8 * Math.sin(pumpPhase * 1.3);
    }
    v += (targetV - v) * 0.1;

    // Mexican hat potential: V(φ) = -μ²|φ|²/2 + λ|φ|⁴/4
    // In radial coordinates: V(r) as a function of r
    // Draw the surface as revolution of V(r) around the vertical axis

    // Draw wireframe layers (constant r rings)
    p.stroke('#1a1f2b');
    p.strokeWeight(0.5);
    p.noFill();
    for (let rPos = 0; rPos <= 3.5; rPos += 0.25) {
      const r = rPos * sc;
      const pot = -mu2 * rPos * rPos / 2 + lam * Math.pow(rPos, 4) / 4;
      const z = pot * sc * 0.9;
      p.beginShape();
      for (let a = 0; a <= p.TWO_PI; a += 0.05) {
        p.vertex(r * Math.cos(a), z, r * Math.sin(a));
      }
      p.endShape(p.CLOSE);
    }

    // Vertical contour lines
    for (let a = 0; a <= p.TWO_PI; a += p.TWO_PI / 12) {
      p.beginShape();
      for (let rPos = 0; rPos <= 3.5; rPos += 0.05) {
        const r = rPos * sc;
        const pot = -mu2 * rPos * rPos / 2 + lam * Math.pow(rPos, 4) / 4;
        const z = pot * sc * 0.9;
        p.vertex(r * Math.cos(a), z, r * Math.sin(a));
      }
      p.endShape();
    }

    // Highlight the minimum circle (vacuum manifold) in green
    const rMin = Math.sqrt(mu2 / lam);
    p.stroke('#7ee787');
    p.strokeWeight(3);
    p.noFill();
    p.drawingContext.setLineDash([4, 6]);
    p.beginShape();
    for (let a = 0; a <= p.TWO_PI; a += 0.03) {
      const r = rMin * sc;
      const pot = -mu2 * rMin * rMin / 2 + lam * Math.pow(rMin, 4) / 4;
      const z = pot * sc * 0.9;
      p.vertex(r * Math.cos(a), z, r * Math.sin(a));
    }
    p.endShape(p.CLOSE);
    p.drawingContext.setLineDash([]);

    // Particle at current VEV
    p.noStroke();
    const rV = Math.max(0.05, v) * sc;
    const zV = (-mu2 * (v * v) / 2 + lam * Math.pow(v, 4) / 4) * sc * 0.9;
    const ang = pumpPhase * 1.7;
    const px = rV * Math.cos(ang);
    const pz = rV * Math.sin(ang);

    // Goldstone direction (angular wiggle)
    p.stroke('#ffd33d');
    p.strokeWeight(2);
    p.drawingContext.setLineDash([3, 3]);
    p.line(px, zV, pz, px * 1.3, zV, pz * 1.3);
    p.drawingContext.setLineDash([]);

    // Higgs particle (radial wiggle)
    p.fill('#58a6ff');
    p.sphere(8);

    // Radial direction indicator
    p.stroke('#58a6ff');
    p.strokeWeight(2.5);
    p.line(px * 0.8, zV, pz * 0.8, px * 1.15, zV, pz * 1.15);

    // 2D text overlay (after all 3D drawing); (0,0) = top-left canvas corner
    p.push();
    p.resetMatrix();
    p.translate(p.width / 2, p.height / 2);
    p.fill('#c9d1d9');
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Mexican Hat Potential — Higgs Mechanism', 12, 12);

    p.fill('#7ee787');
    p.textSize(12);
    p.text('Green ring = vacuum manifold (infinite degenerate vacua)', 12, 33);

    p.fill(v < 0.3 ? '#58a6ff' : '#f78166');
    p.text(
      v < 0.3
        ? 'Phase: SYMMETRIC (all gauge bosons massless)'
        : 'Phase: BROKEN — W±, Z acquire mass!',
      12,
      51
    );

    p.fill('#8b949e');
    p.textSize(11);
    p.text('Drag to rotate | ' + (autoPump ? 'Auto: ON' : 'Auto: OFF'), 12, 71);
    p.text('Goldstone(dashed yellow) eaten by W/Z  |  Higgs(blue radial) = 125 GeV', 12, 89);
    p.pop();
  };

  p.mousePressed = () => {
    dragging = true;
    prevX = p.mouseX;
    prevY = p.mouseY;
  };
  p.mouseReleased = () => (dragging = false);
  p.mouseDragged = () => {
    if (!dragging) return;
    rotY += (p.mouseX - prevX) * 0.008;
    rotX += (p.mouseY - prevY) * 0.008;
    rotX = p.constrain(rotX, -p.PI / 2, p.PI / 2);
    prevX = p.mouseX;
    prevY = p.mouseY;
  };
};

new p5(sketch);
