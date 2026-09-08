import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 0.5, rotY = 0, rotXtar = 0.5, rotYtar = 0;
  let dragging = false, prevMX = 0, prevMY = 0;
  let showSoul = false, shrinkAnim = 0, shrinkTarget = 0;
  let soulPos;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 420, p.WEBGL).parent('p5canvas');
    soulPos = { x: 0, y: 0, z: 0 };
    const col = document.querySelector('.sketch-col');
    const btn = document.createElement('button');
    btn.textContent = '显示灵魂';
    btn.style.cssText = 'background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:4px 10px;border-radius:4px;cursor:pointer;margin:4px;font-size:12px';
    btn.addEventListener('click', () => { showSoul = !showSoul; btn.textContent = showSoul ? 'Hide Soul' : '显示灵魂'; });
    col?.appendChild(btn);
    const btn2 = document.createElement('button');
    btn2.textContent = '收缩到灵魂';
    btn2.style.cssText = 'background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:4px 10px;border-radius:4px;cursor:pointer;margin:4px;font-size:12px';
    btn2.addEventListener('click', () => { shrinkTarget = shrinkTarget === 0 ? 1 : 0; });
    col?.appendChild(btn2);
  };

  p.draw = () => {
    p.background('#0d1117');
    if (!dragging) { rotY += 0.008; if (rotY > p.TWO_PI) rotY -= p.TWO_PI; }
    rotX += (rotXtar - rotX) * 0.1; rotY += (rotYtar - rotY) * 0.1;
    rotXtar = rotX; rotYtar = rotY;
    shrinkAnim += (shrinkTarget - shrinkAnim) * 0.05;

    p.rotateX(rotX); p.rotateY(rotY);

    const R = 140 * (1 - shrinkAnim * 0.85);

    // Outer manifold
    p.noFill(); p.stroke('#1a1f2b'); p.strokeWeight(0.5);
    if (shrinkAnim < 0.99) {
      p.sphere(R, 30, 20);
    }

    // Geodesic rays (like the soul conjecture proof)
    p.stroke('#21262d'); p.strokeWeight(0.3);
    for (let i = 0; i < 16; i++) {
      const phi = i * p.TWO_PI / 16;
      const theta = 0;
      const sx = R * Math.cos(theta) * Math.cos(phi);
      const sy = R * Math.cos(theta) * Math.sin(phi);
      const sz = R * Math.sin(theta);
      p.line(sx, sy, sz, sx * 0.15, sy * 0.15, sz * 0.15);
    }

    // Soul submanifold
    if (showSoul) {
      p.push();
      p.noFill(); p.stroke('#ffd33d'); p.strokeWeight(3);
      p.sphere(12);
      for (let i = 0; i < 3; i++) {
        const a = i * p.TWO_PI / 3;
        p.stroke('#ffd33d'); p.strokeWeight(1.5);
        p.line(0, 0, 0, 20 * Math.cos(a), 20 * Math.sin(a), 0);
      }
      p.fill('#ffd33d'); p.noStroke();
      p.sphere(4);
      p.pop();
    }

    // Ambient particles on the manifold
    p.fill('#58a6ff'); p.noStroke();
    for (let i = 0; i < 60; i++) {
      const a = (i * 0.6180339887) * p.TWO_PI;
      const b = Math.asin(2 * ((i * 0.3819660113) % 1) - 1);
      const r = R + 20;
      p.push();
      p.translate(r * Math.cos(b) * Math.cos(a), r * Math.cos(b) * Math.sin(a), r * Math.sin(b));
      p.sphere(1.5);
      p.pop();
    }

    // Curvature indicator
    if (showSoul) {
      p.fill('#f78166'); p.noStroke();
      const ca = p.frameCount * 0.02;
      for (let i = 0; i < 8; i++) {
        const phi = i * p.TWO_PI / 8 + ca;
        const r = R * (0.6 + 0.4 * shrinkAnim);
        p.push();
        p.translate(r * Math.cos(phi), r * Math.sin(phi), 10);
        p.sphere(2);
        p.pop();
      }
    }

    p.push();
    p.resetMatrix();
    p.translate(-p.width / 2, -p.height / 2);
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#8b949e'); p.textSize(13);
    p.text('Soul Conjecture (Perelman 1994) \u2014 7 pages', 12, 12);
    p.text('M = S \u00d7 R\u1d37. If sec > 0 at one point \u2192 S = point', 12, 32);
    if (shrinkAnim > 0.01) {
      p.fill('#f78166'); p.textSize(12);
      p.text('Shrinking M to Soul... (Sharafutdinov retraction)', 12, 52);
    }
    if (showSoul) {
      p.fill('#ffd33d');
      p.text('Soul: compact totally geodesic submanifold', 12, 72);
      p.text('Soul S = {pt}', 12, 90);
    }
    p.pop();
  };

  p.mousePressed = () => {
    dragging = true; prevMX = p.mouseX; prevMY = p.mouseY;
    return false;
  };
  p.mouseDragged = () => {
    if (dragging) {
      const dx = p.mouseX - prevMX, dy = p.mouseY - prevMY;
      rotY += dx * 0.01; rotX += dy * 0.01;
      rotX = p.constrain(rotX, -p.PI / 2, p.PI / 2);
      prevMX = p.mouseX; prevMY = p.mouseY;
    }
  };
  p.mouseReleased = () => { dragging = false; };
};
new p5(s);
