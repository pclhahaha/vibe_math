import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let M = 1, mx = 0, my = 0, draggingMass = false;
  let tracedRays = [], showRing = true;
  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 420).parent('p5canvas');
    const col = document.querySelector('.sketch-col');
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0.1'; sl.max = '3'; sl.step = '0.1'; sl.value = '1';
    sl.style.cssText = 'width:200px;accent-color:#58a6ff;margin:4px';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8b949e;font-size:0.75em;margin:0 8px';
    lbl.textContent = 'M=1.0';
    sl.addEventListener('input', () => { M = parseFloat(sl.value); lbl.textContent = 'M=' + M.toFixed(1); });
    col?.appendChild(sl); col?.appendChild(lbl);
    const toggle = document.createElement('button');
    toggle.textContent = '切换爱因斯坦环';
    toggle.style.cssText = 'background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:4px 10px;border-radius:4px;cursor:pointer;margin:4px;font-size:12px';
    toggle.addEventListener('click', () => { showRing = !showRing; });
    col?.appendChild(toggle);
  };
  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2 + mx, p.height / 2 + my);

    const nRays = 9;
    for (let i = 0; i < nRays; i++) {
      const x0 = p.map(i, 0, nRays - 1, -180, 180);
      p.noFill();
      const isTraced = tracedRays.includes(i);
      p.stroke(isTraced ? '#ffd33d' : '#58a6ff');
      p.strokeWeight(isTraced ? 2.5 : 1.5);
      p.beginShape();
      for (let y = -200; y <= 200; y += 4) {
        const r = Math.sqrt(x0 * x0 + y * y);
        const d = 80 * M / (r * 0.5 + 20) * ((y > 0) ? 1 : -1);
        p.vertex(x0 + d * (1 - y * y / 40000), y);
      }
      p.endShape();
    }

    const einsteinR = Math.sqrt(4 * M * 80);
    if (showRing) {
      p.stroke('#f78166'); p.strokeWeight(1.5); p.noFill();
      p.drawingContext.setLineDash([5, 5]);
      p.circle(0, 0, einsteinR * 2);
      p.drawingContext.setLineDash([]);
      p.fill('#f78166'); p.textSize(11);
      p.text('θ_E = ' + einsteinR.toFixed(1) + ' px', einsteinR * 0.7, -einsteinR * 0.7);
    }

    for (let r = 30; r > 0; r -= 3) {
      p.fill(100 - r, 60 - r, 20 - r); p.noStroke(); p.circle(0, 0, r * 2);
    }
    if (draggingMass) {
      p.stroke('#ffd33d'); p.strokeWeight(2); p.noFill();
      p.circle(0, 0, 36);
    }
    p.fill('#ffd33d'); p.textSize(10); p.textAlign(p.CENTER);
    p.text('DRAG', 0, -22);

    p.translate(-p.width / 2 - mx, -p.height / 2 - my);
    p.fill('#8b949e'); p.textSize(14); p.textAlign(p.LEFT);
    p.text('Mass M=' + M.toFixed(1) + '  α=4GM/c²b', 20, 20);
    p.text('Click rays to trace | Drag mass | Ring shows θ_E', 20, 42);
    p.text('Einstein 1919: Eddington measured 1.75 arcsec at eclipse', 20, 62);
  };
  p.mousePressed = () => {
    const dmx = p.mouseX - p.width / 2 - mx;
    const dmy = p.mouseY - p.height / 2 - my;
    if (p.dist(dmx, dmy, 0, 0) < 30) { draggingMass = true; return false; }
    const nRays = 9;
    let bestIdx = -1, bestDist = 25;
    for (let i = 0; i < nRays; i++) {
      const x0 = p.map(i, 0, nRays - 1, -180, 180);
      for (let y = -200; y <= 200; y += 4) {
        const r = Math.sqrt(x0 * x0 + y * y);
        const d = 80 * M / (r * 0.5 + 20) * ((y > 0) ? 1 : -1);
        const px = x0 + d * (1 - y * y / 40000);
        const dist = p.dist(dmx, dmy, px, y);
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
    }
    if (bestIdx >= 0) {
      const idx = tracedRays.indexOf(bestIdx);
      if (idx >= 0) tracedRays.splice(idx, 1);
      else tracedRays.push(bestIdx);
      return false;
    }
    return true;
  };
  p.mouseDragged = () => {
    if (draggingMass) { mx = p.mouseX - p.width / 2; my = p.mouseY - p.height / 2; }
  };
  p.mouseReleased = () => { draggingMass = false; };
};
new p5(sketch);
