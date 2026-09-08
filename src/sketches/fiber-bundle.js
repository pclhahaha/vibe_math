import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 0.5, rotY = 0, rotXtar = 0.5, rotYtar = 0;
  let dragging = false, prevMX = 0, prevMY = 0;
  let selAngle = 0, selOnBase = false;
  let showTriv = true;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 400, p.WEBGL).parent('p5canvas');
    const col = document.querySelector('.sketch-col');
    const toggle = document.createElement('button');
    toggle.textContent = '切换平凡化';
    toggle.style.cssText = 'background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:4px 10px;border-radius:4px;cursor:pointer;margin:4px;font-size:12px';
    toggle.addEventListener('click', () => { showTriv = !showTriv; });
    col?.appendChild(toggle);
  };

  p.draw = () => {
    p.background('#0d1117');
    if (!dragging) {
      rotY += 0.005;
      if (rotY > p.TWO_PI) rotY -= p.TWO_PI;
    }
    rotX += (rotXtar - rotX) * 0.1;
    rotY += (rotYtar - rotY) * 0.1;
    rotXtar = rotX; rotYtar = rotY;

    p.rotateX(rotX);
    p.rotateY(rotY);

    p.noFill();
    p.stroke('#1a1f2b'); p.strokeWeight(1);
    p.torus(80, 25, 16, 8);

    const a = p.frameCount * 0.03;
    if (selOnBase) {
      p.stroke('#ffd33d'); p.strokeWeight(2);
      p.noFill(); p.circle(0, 0, 80 * 2);
    }

    const bx = 80 * Math.cos(a), by = 80 * Math.sin(a);
    p.push(); p.translate(bx, by, 0);
    p.stroke('#58a6ff'); p.strokeWeight(2); p.noFill();
    p.beginShape();
    for (let b = 0; b <= Math.PI * 2; b += 0.1)
      p.vertex(25 * Math.cos(b), 25 * Math.sin(b), 0);
    p.endShape(p.CLOSE);
    p.stroke('#f78166'); p.strokeWeight(4);
    p.line(0, 0, 0, 20 * Math.cos(a), 20 * Math.sin(a), 0);
    p.pop();

    if (showTriv) {
      const sx = 80 * Math.cos(a), sy = 80 * Math.sin(a);
      p.push(); p.translate(sx, sy, 0);
      p.stroke('#7ee787'); p.strokeWeight(1.5); p.noFill();
      for (let dx = -15; dx <= 15; dx += 7.5) {
        p.beginShape();
        for (let dy = -15; dy <= 15; dy += 1)
          p.vertex(dx, dy, dx * dy * 0.003);
        p.endShape();
      }
      for (let dy = -15; dy <= 15; dy += 7.5) {
        p.beginShape();
        for (let dx = -15; dx <= 15; dx += 1)
          p.vertex(dx, dy, dx * dy * 0.003);
        p.endShape();
      }
      p.pop();
    }

    // 2D text overlay (after all 3D drawing); (0,0) = top-left canvas corner
    p.push();
    p.resetMatrix();
    p.translate(p.width / 2, p.height / 2);
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9'); p.textSize(14);
    p.text('Fiber Bundle: base × fiber at each point', 10, 10);
    p.fill('#8b949e');
    p.text('Connection = gauge potential A_μ  Curvature = F = dA + A∧A', 10, 30);
    if (showTriv) {
      p.fill('#7ee787'); p.textSize(11);
      p.text('Local trivialization: U × F → π⁻¹(U)  (green grid)', 10, 52);
    }
    p.pop();
  };

  p.mousePressed = () => {
    if (p.mouseButton === p.LEFT) {
      const mx = p.mouseX, my = p.mouseY;
      if (p.dist(mx, my, p.width / 2 + 80 * Math.cos(rotY + a()), p.height / 2 + 80 * Math.sin(rotX) * Math.cos(rotY + a())) < 30) {
        selOnBase = !selOnBase;
        selAngle = rotY + a();
        return false;
      }
      dragging = true; prevMX = p.mouseX; prevMY = p.mouseY;
      return false;
    }
    return true;
  };
  p.mouseDragged = () => {
    if (dragging) {
      const dx = p.mouseX - prevMX, dy = p.mouseY - prevMY;
      rotY += dx * 0.01;
      rotX += dy * 0.01;
      rotX = p.constrain(rotX, -p.PI / 2, p.PI / 2);
      prevMX = p.mouseX; prevMY = p.mouseY;
    }
  };
  p.mouseReleased = () => { dragging = false; };
  function a() { return p.frameCount * 0.03; }
};
new p5(s);
