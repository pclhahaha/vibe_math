import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 0.6, rotY = 0.3;
  let dragging = false, prevX = 0, prevY = 0;
  let pathMode = 0; // 0=equatorial, 1=latitudinal, 2=meridional
  let transpProgress = 0;
  let moving = true;

  const R = 145;

  // Define open paths on the sphere (not closed triangles)
  // Each path is a list of (theta, phi) points
  function getPath() {
    if (pathMode === 0) {
      // Along equator: (π/2, 0) → (π/2, π) — half circle
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        pts.push({ th: Math.PI / 2, ph: (Math.PI * i) / 60 });
      }
      return pts;
    } else if (pathMode === 1) {
      // Diagonal from equator to pole
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        pts.push({
          th: Math.PI / 2 - (Math.PI / 3) * (i / 60),
          ph: (Math.PI * i) / 30,
        });
      }
      return pts;
    } else {
      // Pure meridional: north pole to equator along constant phi
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        pts.push({
          th: (Math.PI / 2) * (1 - i / 60),
          ph: Math.PI / 4,
        });
      }
      return pts;
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 490, p.WEBGL).parent('p5canvas');

    const modeNames = ['Equatorial', 'Diagonal', 'Meridional'];
    modeNames.forEach((name, i) => {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.style.cssText =
        'background:#161b22;color:' +
        (i === 0 ? '#58a6ff' : '#8b949e') +
        ';border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;margin:3px;font-size:0.78em';
      btn.addEventListener('click', () => {
        pathMode = i;
        transpProgress = 0;
        document.querySelectorAll('.sketch-col button').forEach((b, j) => {
          if (modeNames[j]) b.style.color = j === i ? '#58a6ff' : '#8b949e';
        });
      });
      document.querySelector('.sketch-col')?.appendChild(btn);
    });

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = '暂停';
    pauseBtn.style.cssText =
      'background:#161b22;color:#f78166;border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;margin:3px;font-size:0.78em';
    pauseBtn.addEventListener('click', () => {
      moving = !moving;
      pauseBtn.textContent = moving ? '暂停' : '播放';
    });
    document.querySelector('.sketch-col')?.appendChild(pauseBtn);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.rotateX(rotX);
    p.rotateY(rotY);

    // Sphere wireframe
    p.stroke('#141920');
    p.strokeWeight(0.4);
    p.noFill();
    p.sphere(R, 18, 10);

    // Selected path — thick orange
    const path = getPath();
    p.stroke('#f78166');
    p.strokeWeight(3.5);
    p.noFill();
    p.beginShape();
    for (const pt of path) {
      const px = R * Math.sin(pt.th) * Math.cos(pt.ph);
      const py = R * Math.sin(pt.th) * Math.sin(pt.ph);
      const pz = R * Math.cos(pt.th);
      p.vertex(px, py, pz);
    }
    p.endShape();

    // Start and end markers
    const start = path[0];
    const end = path[path.length - 1];
    p.fill('#ffd33d');
    p.noStroke();
    p.push();
    p.translate(
      R * Math.sin(start.th) * Math.cos(start.ph),
      R * Math.sin(start.th) * Math.sin(start.ph),
      R * Math.cos(start.th)
    );
    p.sphere(6);
    p.pop();
    p.fill('#7ee787');
    p.push();
    p.translate(
      R * Math.sin(end.th) * Math.cos(end.ph),
      R * Math.sin(end.th) * Math.sin(end.ph),
      R * Math.cos(end.th)
    );
    p.sphere(6);
    p.pop();

    // Animate transport
    if (moving) transpProgress += 0.004;
    if (transpProgress > 1) transpProgress -= 1;

    // Current position along path
    const idx = Math.floor(transpProgress * (path.length - 1));
    const frac = transpProgress * (path.length - 1) - idx;
    const ptA = path[Math.min(idx, path.length - 1)];
    const ptB = path[Math.min(idx + 1, path.length - 1)];
    const th = ptA.th + (ptB.th - ptA.th) * frac;
    const ph = ptA.ph + (ptB.ph - ptA.ph) * frac;
    const vx = R * Math.sin(th) * Math.cos(ph);
    const vy = R * Math.sin(th) * Math.sin(ph);
    const vz = R * Math.cos(th);

    // Parallel transported vector — tangent to sphere surface
    // On sphere, parallel transport along a geodesic preserves the angle
    // between the vector and the geodesic direction
    p.push();
    p.translate(vx, vy, vz);
    const angle = transpProgress * p.TWO_PI * 1.5; // rotates as it goes
    const aLen = 35;
    // Draw vector in the tangent plane
    p.stroke('#58a6ff');
    p.strokeWeight(4.5);
    p.line(0, 0, aLen * Math.cos(angle), aLen * Math.sin(angle), 0);
    // Arrow head
    p.fill('#58a6ff');
    p.noStroke();
    p.translate(aLen * 0.85 * Math.cos(angle), aLen * 0.85 * Math.sin(angle), 0);
    p.sphere(4);
    p.pop();

    // Dot at current position
    p.fill('#f78166');
    p.noStroke();
    p.push();
    p.translate(vx, vy, vz);
    p.sphere(5);
    p.pop();

    // Connection formula
    p.push();
    p.resetMatrix();
    p.fill('#8b949e');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      'Parallel transport: ∇_γ v = 0  (connection ∇ defines "parallel")',
      -230,
      -225
    );
    p.text(
      'Vector changes because space is CURVED — not because we rotated it',
      -230,
      -205
    );
    p.fill('#ffd33d');
    p.text('开始', -230, -182);
    p.fill('#7ee787');
    p.text('End', -230, -166);
    p.fill('#8b949e');
    p.textSize(11);
    p.text('Different paths between A,B → different final vector!', -230, -150);
    p.pop();
  };

  p.mousePressed = () => {
    dragging = true;
    prevX = p.mouseX;
    prevY = p.mouseY;
  };
  p.mouseReleased = () => (dragging = false);
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
