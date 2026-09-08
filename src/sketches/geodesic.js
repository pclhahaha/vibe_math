import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 0.6, rotY = 0.2;
  let autoRotate = true;
  let showTorus = false;
  let dragging = false, prevX = 0, prevY = 0;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 480, p.WEBGL).parent('p5canvas');

    const torusBtn = document.createElement('button');
    torusBtn.textContent = '显示环面';
    torusBtn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.82em';
    torusBtn.addEventListener('click', () => {
      showTorus = !showTorus;
      torusBtn.textContent = showTorus ? 'Show Sphere' : '显示环面';
    });
    document.querySelector('.sketch-col')?.appendChild(torusBtn);

    const autoBtn = document.createElement('button');
    autoBtn.textContent = 'Auto: ON';
    autoBtn.style.cssText =
      'background:#161b22;color:#7ee787;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.82em';
    autoBtn.addEventListener('click', () => {
      autoRotate = !autoRotate;
      autoBtn.textContent = autoRotate ? 'Auto: ON' : 'Auto: OFF';
    });
    document.querySelector('.sketch-col')?.appendChild(autoBtn);
  };

  p.draw = () => {
    p.background('#0d1117');

    if (autoRotate && !dragging) {
      rotY += 0.004;
    }

    p.rotateX(rotX);
    p.rotateY(rotY);

    // Grid sphere/wireframe for reference
    p.stroke('#1a1f2b');
    p.strokeWeight(0.4);
    p.noFill();

    if (!showTorus) {
      // Sphere
      p.sphere(155, 24, 14);

      // Highlight equator
      p.stroke('#30363d');
      p.strokeWeight(0.8);
      p.beginShape();
      for (let a = 0; a <= p.TWO_PI; a += 0.03) {
        p.vertex(155 * Math.cos(a), 0, 155 * Math.sin(a));
      }
      p.endShape();

      // Multiple geodesics (great circles) at different tilts
      const geodesics = [
        { rx: 0, ry: 0, col: '#f78166', label: 'geodesic 1' },
        { rx: p.PI / 4, ry: p.PI / 3, col: '#58a6ff', label: 'geodesic 2' },
        { rx: -p.PI / 3, ry: p.PI / 6, col: '#ffd33d', label: 'geodesic 3' },
      ];

      const R = 158; // slightly outside the sphere
      for (const g of geodesics) {
        p.push();
        p.rotateX(g.rx);
        p.rotateY(g.ry);
        p.stroke(g.col);
        p.strokeWeight(3);
        p.noFill();
        p.beginShape();
        for (let a = 0; a <= p.TWO_PI; a += 0.02) {
          p.vertex(R * Math.cos(a), R * Math.sin(a), 0);
        }
        p.endShape();
        p.pop();
      }

      // 2D text overlay (after all 3D drawing); (0,0) = top-left canvas corner
      p.push();
      p.resetMatrix();
      p.translate(p.width / 2, p.height / 2);
      p.fill('#c9d1d9');
      p.textSize(14);
      p.textAlign(p.LEFT, p.TOP);
      p.text('Sphere: all geodesics = great circles (shortest path)', 10, 30);
      p.fill('#8b949e');
      p.textSize(12);
      p.text('Drag to rotate | Auto-rotation: ' + (autoRotate ? 'ON' : 'OFF'), 10, 52);
      p.pop();
    } else {
      // Torus
      p.stroke('#1a1f2b');
      p.strokeWeight(0.4);
      p.noFill();
      p.torus(100, 30, 40, 24);

      // Draw a few geodesics on torus — they spiral and can have complicated paths
      p.stroke('#f78166');
      p.strokeWeight(2.5);
      p.noFill();
      // Meridian
      p.push();
      p.beginShape();
      for (let a = 0; a <= p.TWO_PI; a += 0.02) {
        const x = (100 + 30 * Math.cos(a)) * Math.cos(0);
        const y = 30 * Math.sin(a);
        const z = (100 + 30 * Math.cos(a)) * Math.sin(0);
        p.vertex(x, y, z);
      }
      p.endShape();
      p.pop();

      // A spiral geodesic
      p.stroke('#58a6ff');
      p.strokeWeight(2.5);
      p.beginShape();
      for (let t = 0; t <= p.TWO_PI * 3; t += 0.02) {
        const a = t * 0.7;
        const x = (100 + 30 * Math.cos(a)) * Math.cos(t);
        const y = 30 * Math.sin(a);
        const z = (100 + 30 * Math.cos(a)) * Math.sin(t);
        p.vertex(x, y, z);
      }
      p.endShape();

      // 2D text overlay (after all 3D drawing); (0,0) = top-left canvas corner
      p.push();
      p.resetMatrix();
      p.translate(p.width / 2, p.height / 2);
      p.fill('#c9d1d9');
      p.textSize(14);
      p.textAlign(p.LEFT, p.TOP);
      p.text('Torus: NOT all geodesics close simply', 10, 30);
      p.fill('#8b949e');
      p.textSize(12);
      p.text('Only special winding ratios give closed geodesics', 10, 52);
      p.pop();
    }
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
    const dx = p.mouseX - prevX;
    const dy = p.mouseY - prevY;
    rotY += dx * 0.008;
    rotX += dy * 0.008;
    rotX = p.constrain(rotX, -p.PI / 2, p.PI / 2);
    prevX = p.mouseX;
    prevY = p.mouseY;
  };
};

new p5(sketch);
