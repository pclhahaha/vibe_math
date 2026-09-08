import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 1.2, rotZ = 0, autoRotate = true;
  let dragging = false, prevX = 0, prevY = 0;
  const sc = 120;
  const f = (x, y) => -50 + 40 * Math.sin(x * 0.03) * Math.cos(y * 0.03);

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 440, p.WEBGL).parent('p5canvas');
  };

  p.draw = () => {
    p.background('#0d1117');
    if (autoRotate && !dragging) rotZ += 0.003;

    p.ambientLight(70, 70, 90);
    p.directionalLight(255, 255, 255, 0, 0.5, -1);

    p.rotateX(rotX);
    p.rotateZ(rotZ);

    // Terrain surface with a faint colored fill for visibility
    p.noStroke();
    p.fill(88, 166, 255, 14);
    const step = 0.5;
    for (let i = -3; i < 3; i += step) {
      for (let j = -3; j < 3; j += step) {
        const x = i * sc / 3, y = j * sc / 3;
        const x2 = (i + step) * sc / 3, y2 = (j + step) * sc / 3;
        p.beginShape();
        p.vertex(x, y, f(x, y));
        p.vertex(x2, y, f(x2, y));
        p.vertex(x2, y2, f(x2, y2));
        p.vertex(x, y2, f(x, y2));
        p.endShape();
      }
    }

    // Visible terrain wireframe
    p.stroke('#3d5a80');
    p.strokeWeight(0.7);
    p.noFill();
    for (let i = -3; i <= 3; i++) {
      p.beginShape();
      for (let j = -3; j <= 3; j++) {
        const x = i * sc / 3, y = j * sc / 3;
        p.vertex(x, y, f(x, y));
      }
      p.endShape();
    }
    for (let i = -3; i <= 3; i++) {
      p.beginShape();
      for (let j = -3; j <= 3; j++) {
        const y = i * sc / 3, x = j * sc / 3;
        p.vertex(x, y, f(x, y));
      }
      p.endShape();
    }

    // Level-set contours (horizontal slices) — bright cyan
    p.stroke('#7ee787');
    p.strokeWeight(1.5);
    p.noFill();
    for (let zLev = -80; zLev <= -20; zLev += 15) {
      p.beginShape();
      for (let a = -Math.PI; a <= Math.PI; a += 0.05) {
        const x = 3.5 * sc / 3 * Math.cos(a);
        const y = 3.5 * sc / 3 * Math.sin(a);
        // Only draw points near the level
        if (Math.abs(f(x, y) - zLev) < 12) {
          p.vertex(x, y, f(x, y));
        }
      }
      p.endShape();
    }

    // Gradient arrows (orange) — point up the slope, perpendicular to contours
    const points = [[-1,-1],[-1,1],[1,-1],[1,1],[0,0],[-2,0],[2,0],[0,-2],[0,2]];
    for (const [gx, gy] of points) {
      const dx = gx * sc / 3, dy = gy * sc / 3;
      const gradX = 40 * 0.03 * Math.cos(dx * 0.03) * Math.cos(dy * 0.03) * sc / 3;
      const gradY = -40 * 0.03 * Math.sin(dx * 0.03) * Math.sin(dy * 0.03) * sc / 3;
      const dz = f(dx, dy);
      // Arrow body
      p.stroke('#f78166');
      p.strokeWeight(3.5);
      p.line(dx, dy, dz, dx + gradX * 2, dy + gradY * 2, dz - 5);
      // Arrow tip
      p.push();
      p.translate(dx + gradX * 2, dy + gradY * 2, dz - 5);
      p.fill('#f78166');
      p.noStroke();
      p.sphere(3);
      p.pop();
    }

    // 2D overlay text
    p.push();
    p.resetMatrix();
    p.translate(p.width / 2, p.height / 2);
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9');
    p.textSize(14);
    p.text('Gradient = steepest ascent (perpendicular to level sets)', 40, 40);
    p.fill('#8b949e');
    p.textSize(12);
    p.text('Gradient descent: w ← w − η·∇L(w)', 40, 62);
    p.text('Drag to rotate | Auto-rotate: ' + (autoRotate ? 'ON' : 'OFF'), 40, 84);
    p.fill('#7ee787');
    p.text('Green curves = level sets  |  Orange arrows = ∇f', 40, 106);
    p.pop();
  };

  p.mousePressed = () => { dragging = true; prevX = p.mouseX; prevY = p.mouseY; };
  p.mouseReleased = () => { dragging = false; };
  p.mouseDragged = () => {
    if (!dragging) return;
    const dx = p.mouseX - prevX, dy = p.mouseY - prevY;
    rotZ += dx * 0.01;
    rotX += dy * 0.01;
    rotX = Math.max(-2.5, Math.min(2.5, rotX));
    prevX = p.mouseX; prevY = p.mouseY;
    autoRotate = false;
  };
};

new p5(sketch);
