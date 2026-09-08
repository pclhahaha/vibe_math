import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let particles = [], Re = 50, vorticies = [], dragPart = null;
  let showArrows = true;
  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    const c = p.createCanvas(500, 380); c.parent('p5canvas');
    for (let i = 0; i < 200; i++) particles.push({ x: p.random(20, 480), y: p.random(20, 360), vx: p.random(-1, 1), vy: p.random(-1, 1) });
    const col = document.querySelector('.sketch-col');
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = '1'; slider.max = '5000'; slider.value = '50';
    slider.style.cssText = 'width:180px;accent-color:#58a6ff;margin:4px';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8b949e;font-size:0.75em;margin:0 8px';
    lbl.textContent = 'Re=50';
    slider.addEventListener('input', () => { Re = parseInt(slider.value); lbl.textContent = 'Re=' + Re; });
    col?.appendChild(slider); col?.appendChild(lbl);
    const toggle = document.createElement('button');
    toggle.textContent = '切换速度箭头';
    toggle.style.cssText = 'background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:4px 10px;border-radius:4px;cursor:pointer;margin:4px;font-size:12px';
    toggle.addEventListener('click', () => { showArrows = !showArrows; });
    col?.appendChild(toggle);
  };
  p.draw = () => {
    p.background('#0d1117');
    const dt = 0.5, visc = 100 / Re;

    if (showArrows) {
      const step = 25;
      for (let gx = step; gx < 500; gx += step) {
        for (let gy = step; gy < 380; gy += step) {
          let tvx = 0, tvy = 0;
          for (const v of vorticies) {
            const dx = gx - v.x, dy = gy - v.y, r2 = dx * dx + dy * dy + 4;
            tvx += -v.strength * dy / r2;
            tvy += v.strength * dx / r2;
          }
          const mag = Math.sqrt(tvx * tvx + tvy * tvy);
          if (mag > 0.2) {
            const nx = tvx / mag, ny = tvy / mag;
            p.stroke('#484f58'); p.strokeWeight(0.8);
            p.line(gx, gy, gx + nx * 10, gy + ny * 10);
            p.fill('#484f58'); p.noStroke();
            p.circle(gx + nx * 10, gy + ny * 10, 2.5);
          }
        }
      }
    }

    for (const v of vorticies) {
      p.stroke('#f78166'); p.strokeWeight(1.5); p.noFill();
      p.circle(v.x, v.y, Math.abs(v.strength) * 8 + 6);
      p.fill('#f78166'); p.textSize(10); p.text((v.strength > 0 ? '↻' : '↺'), v.x - 4, v.y + 4);
      let life = v.life || 300; v.life = life - 1;
    }
    vorticies = vorticies.filter(v => (v.life || 300) > 0);

    for (const pt of particles) {
      if (pt === dragPart) {
        pt.x = p.constrain(p.mouseX, 0, 500);
        pt.y = p.constrain(p.mouseY, 0, 380);
        pt.vx = 0; pt.vy = 0;
      } else {
        let ax = 0, ay = 0;
        for (const v of vorticies) {
          const dx = pt.x - v.x, dy = pt.y - v.y, r2 = dx * dx + dy * dy + 2;
          ax += -v.strength * dy / r2 * 5;
          ay += v.strength * dx / r2 * 5;
        }
        pt.vx += ax * dt; pt.vy += ay * dt;
        pt.vx += p.random(-visc, visc); pt.vy += p.random(-visc, visc);
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        if (pt.x < 0 || pt.x > 500) { pt.x = p.constrain(pt.x, 0, 500); pt.vx *= -1; }
        if (pt.y < 0 || pt.y > 380) { pt.y = p.constrain(pt.y, 0, 380); pt.vy *= -1; }
      }
      const speed = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy);
      const isDragged = pt === dragPart;
      p.noStroke();
      p.fill(isDragged ? '#ffd33d' : (speed > 2 ? 248 : 88), 113, 102, Math.min(200, isDragged ? 255 : speed * 80 + 50));
      p.circle(pt.x, pt.y, isDragged ? 6 : 3);
    }

    p.fill('#8b949e'); p.textSize(13);
    p.text('Re = ' + Re + '  (' + (Re < 2000 ? 'Laminar' : 'Turbulent') + ')', 20, 25);
    p.text('Click: add vortex  |  Drag: move particle', 20, 48);
    p.fill('#ffd33d'); p.textSize(11);
    p.text('Vortices: ' + vorticies.length, 20, 68);
  };
  p.mousePressed = () => {
    for (const pt of particles) {
      if (p.dist(p.mouseX, p.mouseY, pt.x, pt.y) < 8) { dragPart = pt; return false; }
    }
    vorticies.push({ x: p.mouseX, y: p.mouseY, strength: p.random([-2, -1.5, 1.5, 2]), life: 300 });
    return false;
  };
  p.mouseDragged = () => { if (dragPart) return false; };
  p.mouseReleased = () => { dragPart = null; };
};
new p5(sketch);
