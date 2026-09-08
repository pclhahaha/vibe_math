import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 0.5, rotY = 0, rotZ = 0;
  let dragging = false, prevMX = 0, prevMY = 0;
  let loopAngle = 0, loopTilt = 0.3, loopRadius = 90;
  let targetRadius = 90, targetTilt = 0.3;
  let showTorus = false;
  let autoMode = true, autoPhase = 0;
  let hoverLoop = false;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    const c = p.createCanvas(Math.min(500, p.windowWidth - 60), 440, p.WEBGL);
    c.parent('p5canvas');

    // Toggle sphere/torus
    const sphereBtn = document.createElement('button');
    sphereBtn.textContent = 'Sphere (S³)';
    sphereBtn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.78em';
    sphereBtn.addEventListener('click', () => {
      showTorus = !showTorus;
      sphereBtn.textContent = showTorus ? 'Torus (NOT S³)' : 'Sphere (S³)';
    });
    document.querySelector('.sketch-col')?.appendChild(sphereBtn);

    // Auto animation toggle
    const autoBtn = document.createElement('button');
    autoBtn.textContent = 'Auto: ON';
    autoBtn.style.cssText =
      'background:#161b22;color:#7ee787;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.78em';
    autoBtn.addEventListener('click', () => {
      autoMode = !autoMode;
      autoBtn.textContent = autoMode ? 'Auto: ON' : 'Auto: OFF';
    });
    document.querySelector('.sketch-col')?.appendChild(autoBtn);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.ambientLight(60, 60, 80);

    // Auto mode: animate loop shrinking, tilting
    if (autoMode) {
      autoPhase += 0.01;
      targetRadius = 90 - 20 * Math.abs(Math.sin(autoPhase * 1.3));
      targetTilt = 0.3 * Math.sin(autoPhase * 0.7);
      loopRadius += (targetRadius - loopRadius) * 0.05;
      loopTilt += (targetTilt - loopTilt) * 0.05;
    }

    p.rotateX(rotX);
    p.rotateY(rotY);
    p.rotateZ(rotZ);

    // Draw the manifold (sphere or torus)
    if (!showTorus) {
      // Sphere with wireframe
      p.stroke('#21262d');
      p.strokeWeight(0.4);
      p.noFill();
      p.sphere(150, 32, 18);

      // Highlight some meridians/parallels
      p.stroke('#30363d');
      p.strokeWeight(0.6);
      p.push();
      for (let i = 0; i < 6; i++) {
        p.rotateY((p.PI / 6) * i);
        p.beginShape();
        for (let a = 0; a <= p.TWO_PI; a += 0.05) {
          p.vertex(150 * Math.cos(a), 150 * Math.sin(a), 0);
        }
        p.endShape();
      }
      p.pop();
    } else {
      // Torus
      p.stroke('#21262d');
      p.strokeWeight(0.4);
      p.noFill();
      p.torus(100, 30, 40, 20);

      // Non-contractible loop on torus (red)
      p.push();
      p.stroke('#f78166');
      p.strokeWeight(3);
      p.noFill();
      p.beginShape();
      for (let a = 0; a <= p.TWO_PI; a += 0.02) {
        p.vertex(100 * Math.cos(a), 0, 100 * Math.sin(a));
      }
      p.endShape();
      p.pop();
    }

    // Draw the interactive loop
    p.push();
    p.rotateX(loopTilt);
    p.rotateY(loopAngle);

    const lr = showTorus ? 70 : loopRadius;
    if (hoverLoop) {
      p.stroke('#ffd33d');
      p.strokeWeight(4);
    } else {
      p.stroke('#58a6ff');
      p.strokeWeight(3);
    }
    p.noFill();

    // Draw deformed loop on surface
    const R = 150;
    const segments = 80;
    p.beginShape();
    for (let i = 0; i <= segments; i++) {
      const a = (p.TWO_PI * i) / segments;
      const r = lr + 5 * Math.sin(a * 3 + autoPhase * 2);
      const x = r * Math.cos(a);
      const y = r * Math.sin(a);
      const zOff = Math.sqrt(Math.max(0, R * R - x * x - y * y)) - R;
      p.vertex(x, y, zOff);
    }
    p.endShape();

    // Shrinking indicator
    if (!showTorus && loopRadius < 30 && autoMode) {
      p.fill('#7ee787');
      p.noStroke();
      p.sphere(6);
    }
    p.pop();

    // Info text (2D)
    p.push();
    p.resetMatrix();
    p.fill('#8b949e');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    if (showTorus) {
      p.text('Torus: not simply connected — some loops cannot shrink', -230, -190);
      p.text('Poincare: the ONLY closed 3-manifold', -230, -170);
      p.text('where ALL loops shrink to a point is S³', -230, -150);
    } else {
      p.text('Drag to rotate | Blue loop = any closed curve', -230, -190);
      p.text('Watch it shrink to a point — this IS simple connectivity', -230, -170);
      p.text('Goal: prove only S³ has this property (Perelman 2003)', -230, -150);
    }
    p.pop();

    // Check mouse hover on loop (approx)
    const mx = p.mouseX - p.width / 2;
    const my = p.mouseY - p.height / 2;
    hoverLoop = Math.abs(mx) + Math.abs(my) < 200 && loopRadius > 10;
  };

  p.mousePressed = () => {
    dragging = true;
    prevMX = p.mouseX;
    prevMY = p.mouseY;
  };

  p.mouseReleased = () => {
    dragging = false;
  };

  p.mouseDragged = () => {
    if (!dragging) return;
    const dx = p.mouseX - prevMX;
    const dy = p.mouseY - prevMY;
    if (!autoMode) {
      rotY += dx * 0.01;
      rotX += dy * 0.008;
      rotX = p.constrain(rotX, -1.2, 1.2);
    } else {
      rotY += dx * 0.008;
      rotX += dy * 0.006;
      rotX = p.constrain(rotX, -1.2, 1.2);
    }
    prevMX = p.mouseX;
    prevMY = p.mouseY;
  };
};

new p5(sketch);
