import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 0.6, rotY = 0, rotXtar = 0.6, rotYtar = 0;
  let dragging = false, prevMX = 0, prevMY = 0;
  let activeSheet = 0, highlightBranch = true;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 420, p.WEBGL).parent('p5canvas');
    const col = document.querySelector('.sketch-col');
    const toggle = document.createElement('button');
    toggle.textContent = '切换分支割线';
    toggle.style.cssText = 'background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:4px 10px;border-radius:4px;cursor:pointer;margin:4px;font-size:12px';
    toggle.addEventListener('click', () => { highlightBranch = !highlightBranch; });
    col?.appendChild(toggle);
  };

  p.draw = () => {
    p.background('#0d1117');
    if (!dragging) { rotY += 0.008; if (rotY > p.TWO_PI) rotY -= p.TWO_PI; }
    rotX += (rotXtar - rotX) * 0.1; rotY += (rotYtar - rotY) * 0.1;
    rotXtar = rotX; rotYtar = rotY;

    p.rotateX(rotX); p.rotateY(rotY);

    for (let i = 0; i < 2; i++) {
      p.push();
      p.translate(0, (i - 0.5) * 120, 0);
      const isActive = i === activeSheet;
      p.noFill();
      p.stroke(isActive ? '#ffd33d' : (i === 0 ? '#58a6ff' : '#f78166'));
      p.strokeWeight(isActive ? 2 : 1);

      for (let a = 0; a <= Math.PI * 2; a += 0.05) {
        p.beginShape();
        const rSteps = 6;
        for (let k = 0; k <= rSteps; k++) {
          const r = 20 + k * 15;
          const x = r * Math.cos(a), z = r * Math.sin(a);
          const yVal = Math.sqrt(Math.sqrt(x * x + z * z)) * (i === 0 ? 1 : -1);
          p.vertex(x, yVal * 4, z);
        }
        p.endShape();
      }
      for (let r = 20; r <= 95; r += 15) {
        p.beginShape();
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const x = r * Math.cos(a), z = r * Math.sin(a);
          const yVal = Math.sqrt(Math.sqrt(x * x + z * z)) * (i === 0 ? 1 : -1);
          p.vertex(x, yVal * 4, z);
        }
        p.endShape();
      }
      p.pop();
    }

    // Branch cut visualization
    if (highlightBranch) {
      p.stroke('#7ee787'); p.strokeWeight(4);
      p.line(-50, 60, -50, -60);
      p.line(50, -60, 50, 60);

      for (let i = 0; i < 2; i++) {
        p.push(); p.translate(0, (i - 0.5) * 120, 0);
        p.stroke('#7ee787'); p.strokeWeight(0.8); p.noFill();
        p.drawingContext.setLineDash([4, 6]);
        p.beginShape();
        for (let r = 0; r <= 100; r += 2) {
          const sign = i === 0 ? 1 : -1;
          p.vertex(-50 + r, sign * 8, -60 + r);
        }
        p.endShape();
        p.drawingContext.setLineDash([]);
        p.pop();
      }
    }

    p.push();
    p.resetMatrix();
    p.translate(-p.width / 2, -p.height / 2);
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#8b949e'); p.textSize(13);
    p.text('Riemann Surface of \u221az \u2014 2 sheets glued', 12, 12);
    p.text('Sheet ' + (activeSheet + 1) + ' active  |  Click to traverse | Drag to rotate', 12, 32);
    if (highlightBranch) {
      p.fill('#7ee787'); p.textSize(11);
      p.text('Green line: branch cut [0, \u221e)', 12, 52);
    }
    p.pop();
  };

  p.mousePressed = () => {
    if (p.mouseButton === p.LEFT) {
      const sx = p.mouseX - p.width / 2;
      const sy = p.mouseY - p.height / 2;
      if (p.dist(sx, sy, 0, (activeSheet - 0.5) * 120 * Math.cos(rotX)) < 80) {
        activeSheet = (activeSheet + 1) % 2;
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
      rotY += dx * 0.01; rotX += dy * 0.01;
      rotX = p.constrain(rotX, -p.PI / 2, p.PI / 2);
      prevMX = p.mouseX; prevMY = p.mouseY;
    }
  };
  p.mouseReleased = () => { dragging = false; };
};
new p5(s);
