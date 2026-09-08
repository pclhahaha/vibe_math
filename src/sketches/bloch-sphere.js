import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 0.5, rotY = 0.3;
  let dragging = false, prevX = 0, prevY = 0;
  let theta = 1.2, phi = 0.8; // state parameters
  let draggingState = false;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 500, p.WEBGL).parent('p5canvas');

    // Preset states
    const states = [
      { name: '|0⟩', t: 0, p: 0 },
      { name: '|1⟩', t: Math.PI, p: 0 },
      { name: '|+⟩', t: Math.PI / 2, p: 0 },
      { name: '|−⟩', t: Math.PI / 2, p: Math.PI },
      { name: '|+i⟩', t: Math.PI / 2, p: Math.PI / 2 },
      { name: '|−i⟩', t: Math.PI / 2, p: 3 * Math.PI / 2 },
    ];
    states.forEach((st) => {
      const btn = document.createElement('button');
      btn.textContent = st.name;
      btn.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;margin:2px;font-size:0.78em';
      btn.addEventListener('click', () => {
        theta = st.t;
        phi = st.p;
      });
      document.querySelector('.sketch-col')?.appendChild(btn);
    });
  };

  p.draw = () => {
    p.background('#0d1117');
    p.rotateX(rotX);
    p.rotateY(rotY);

    const R = 145;

    // Sphere
    p.stroke('#141920');
    p.strokeWeight(0.5);
    p.noFill();
    p.sphere(R, 22, 14);

    // Equator ring
    p.stroke('#30363d');
    p.strokeWeight(1.5);
    p.noFill();
    p.beginShape();
    for (let a = 0; a <= p.TWO_PI; a += 0.03) {
      p.vertex(R * Math.cos(a), R * Math.sin(a), 0);
    }
    p.endShape();

    // Meridians
    for (let a = 0; a < Math.PI; a += Math.PI / 4) {
      p.stroke('#1a1f2b');
      p.strokeWeight(0.3);
      p.beginShape();
      for (let b = 0; b <= p.TWO_PI; b += 0.05) {
        p.vertex(R * Math.sin(b) * Math.cos(a), R * Math.sin(b) * Math.sin(a), R * Math.cos(b));
      }
      p.endShape();
    }

    // State vector from center to surface
    const sx = R * Math.sin(theta) * Math.cos(phi);
    const sy = R * Math.sin(theta) * Math.sin(phi);
    const sz = R * Math.cos(theta);

    // Axes
    p.stroke('#484f58');
    p.strokeWeight(0.5);
    p.line(0, 0, -R - 20, 0, 0, R + 20);
    p.line(0, -R - 20, 0, 0, R + 20, 0);
    p.line(-R - 20, 0, 0, R + 20, 0, 0);

    p.stroke('#58a6ff');
    p.strokeWeight(3.5);
    p.line(0, 0, 0, sx, sy, sz);
    p.fill('#58a6ff');
    p.noStroke();
    p.push();
    p.translate(sx, sy, sz);
    p.sphere(6);
    // Glow
    p.fill(88, 166, 255, 40);
    p.sphere(14);
    p.pop();

    // Projection on the z-axis (measurement probabilities)
    const projZ = sz;
    p.stroke('#ffd33d');
    p.strokeWeight(2);
    p.drawingContext.setLineDash([4, 6]);
    const projPt = p.map(projZ, -R, R, R, -R);
    p.line(sx, sy, sz, 0, 0, projZ);
    p.drawingContext.setLineDash([]);
    p.fill('#ffd33d');
    p.noStroke();
    p.push();
    p.translate(0, 0, projZ);
    p.sphere(4);
    p.pop();

    // Measurement probability labels
    const P0 = Math.cos(theta / 2) * Math.cos(theta / 2);
    const P1 = Math.sin(theta / 2) * Math.sin(theta / 2);

    // Screen positions for 3D-anchored labels (projected while 3D transform is active)
    const projN = p.worldToScreen(0, -R - 14, 0);
    const projS = p.worldToScreen(0, R + 14, 0);
    const projP0 = p.worldToScreen(10, 0, projZ);

    // 2D text overlay (after all 3D drawing); (0,0) = top-left canvas corner
    p.push();
    p.resetMatrix();
    p.translate(p.width / 2, p.height / 2);

    // Measurement probability label anchored to the projection point
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(11);
    p.fill('#ffd33d');
    p.text('P(0)=' + (P0 * 100).toFixed(0) + '%', projP0.x, projP0.y);

    // |0⟩ label at north pole, |1⟩ label at south pole
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.fill('#f78166');
    p.text('|0⟩', projN.x, projN.y);
    p.fill('#7ee787');
    p.text('|1⟩', projS.x, projS.y);

    // Info box
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#0d1117');
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(10, 10, 210, 70, 6);

    p.fill('#58a6ff');
    p.textSize(13);
    p.text('|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩', 20, 18);

    p.fill('#8b949e');
    p.textSize(12);
    p.text(
      `θ = ${((theta * 180) / Math.PI).toFixed(0)}°  φ = ${((phi * 180) / Math.PI).toFixed(0)}°`,
      20,
      38
    );
    p.text(`P(|0⟩) = ${(P0 * 100).toFixed(0)}%  P(|1⟩) = ${(P1 * 100).toFixed(0)}%`, 20, 56);
    p.text('Drag to rotate | Click presets to set state', 20, 74);
    p.pop();
  };

  p.mousePressed = () => {
    dragging = true;
    prevX = p.mouseX;
    prevY = p.mouseY;
  };
  p.mouseReleased = () => {
    dragging = false;
  };
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
