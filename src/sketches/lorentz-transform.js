import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let v = 0.5;
  let dragV = 0.5;
  let dragging = false;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 480).parent('p5canvas');
    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0';
    const label = document.createElement('span');
    label.style.cssText = 'font-size:0.8em;color:#8b949e';
    label.textContent = 'v/c:';
    slRow.appendChild(label);
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0'; sl.max = '0.95'; sl.step = '0.01'; sl.value = '0.5';
    sl.style.cssText = 'width:180px;accent-color:#58a6ff';
    sl.addEventListener('input', () => { v = parseFloat(sl.value); dragV = v; });
    slRow.appendChild(sl);
    document.querySelector('.sketch-col')?.appendChild(slRow);

    p.mousePressed = () => {
      const cx = p.mouseX - p.width / 2, cy = p.mouseY - p.height / 2;
      if (p.dist(cx, cy, 0, -180) < 50) dragging = true;
    };
    p.mouseReleased = () => { dragging = false; };
    p.mouseDragged = () => {
      if (!dragging) return;
      const cx = p.mouseX - p.width / 2;
      dragV = p.constrain(cx / 200, -0.95, 0.95);
      v = dragV;
    };
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    const g = 1 / Math.sqrt(1 - v * v);

    // Stationary frame (blue)
    p.stroke('#58a6ff'); p.strokeWeight(2);
    p.line(-220, 0, 220, 0); p.line(0, -220, 0, 220);
    for (let i = -3; i <= 3; i++) {
      p.stroke('#58a6ff', 50); p.strokeWeight(0.5);
      p.line(i * 55, -200, i * 55, 200);
      p.line(-200, i * 55, 200, i * 55);
    }

    // Moving frame (red)
    p.push();
    p.shearX(Math.atanh(v));
    p.stroke('#f78166'); p.strokeWeight(2);
    p.line(-220, 0, 220, 0); p.line(0, -220, 0, 220);
    p.pop();

    // Invariant hyperbola x^2 - (ct)^2 = constant
    p.stroke('#ffd33d', 100); p.strokeWeight(1.5); p.noFill();
    const constants = [2500, 10000, 22500];
    for (const c2 of constants) {
      const r = Math.sqrt(c2);
      p.beginShape();
      for (let t = -180; t <= 180; t += 3) {
        const y = t;
        const x2 = c2 + y * y;
        if (x2 < 0) continue;
        const x = Math.sqrt(x2);
        if (Math.abs(x) < 240) p.vertex(x, -y);
      }
      p.endShape();
      p.beginShape();
      for (let t = -180; t <= 180; t += 3) {
        const y = t;
        const x2 = c2 + y * y;
        if (x2 < 0) continue;
        const x = Math.sqrt(x2);
        if (Math.abs(x) < 240) p.vertex(-x, -y);
      }
      p.endShape();
    }

    // Time dilation visualization — a clock tick interval
    const ct0 = 120;
    p.stroke('#7ee787'); p.strokeWeight(4);
    p.line(-10, -ct0, 10, -ct0);
    const ct1 = ct0 * g;
    p.stroke('#f78166'); p.strokeWeight(2);
    p.line(55 * 0 - 8, -ct1, 55 * 0 + 8, -ct1);

    // Length contraction visualization
    const L0 = 160;
    p.stroke('#7ee787'); p.strokeWeight(4);
    p.line(-L0 / 2, -15, L0 / 2, -15);
    const L = L0 / g;
    p.stroke('#f78166'); p.strokeWeight(2);
    p.line(0, -30, L, -30);

    // Drag handle
    p.fill('#ffd33d'); p.noStroke();
    const handleX = v * 200, handleY = -180;
    p.circle(handleX, handleY, 16);
    p.fill('#ffd33d'); p.textSize(12); p.textAlign(p.CENTER, p.CENTER);
    p.text('drag me', handleX, handleY + 14);

    // Info panel
    p.fill('#8b949e'); p.textSize(14); p.textAlign(p.LEFT, p.TOP);
    p.text('v=' + v.toFixed(3) + 'c  γ=' + g.toFixed(3), -220, -190);

    p.fill('#58a6ff');
    p.text('Stationary frame (blue)  —   Moving frame (red, sheared)', -220, -170);

    p.fill('#7ee787');
    p.text('Time dilation: Δt\' = γ·Δt₀  = ' + g.toFixed(3) + ' × Δt₀', -220, -145);
    p.fill('#f78166');
    p.text('green tick = proper time Δt₀,  red tick = dilated Δt\' = γ·Δt₀', -220, -127);

    p.text('Length contraction: L = L₀/γ = ' + L0.toFixed(0) + '/' + g.toFixed(2) + ' = ' + L.toFixed(1), -220, -106);
    p.text('green bar = proper length L₀,  red bar = contracted L', -220, -88);

    p.fill('#ffd33d', 200);
    p.text('Yellow curves = invariant hyperbolas  x² − (ct)² = const', -220, -64);
    p.fill('#8b949e');
    p.text('Drag yellow handle to change velocity', -220, -43);
  };
};
new p5(sketch);
