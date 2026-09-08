import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 0.6, rotY = 0.3;
  let dragging = false, prevX = 0, prevY = 0;

  // 0=sphere, 1=saddle, 2=cylinder
  let surfaceMode = 0;
  const modeNames = ['Sphere (K>0)', 'Saddle (K<0)', 'Cylinder (K=0)'];

  // Parallel transport state
  let transpAngle = 0;       // current angle of transported vector
  let transpProgress = 0;    // 0 to 1 around the loop
  let transportActive = false;
  let holonomy = 0;          // accumulated rotation after one loop

  // Triangle vertices for the geodesic loop
  // Sphere: area = α+β+γ-π = holonomy
  // Saddle: area = π-(α+β+γ), holonomy negative
  function getTriangle() {
    if (surfaceMode === 0) {
      // Large triangle on sphere
      return [
        { th: Math.PI / 2, ph: 0 },
        { th: Math.PI / 2, ph: Math.PI / 2 },
        { th: Math.PI / 4, ph: Math.PI / 4 },
      ];
    } else if (surfaceMode === 1) {
      // Triangle on saddle (treat as R^3 surface z = x² - y²)
      // Use 3 points on the saddle
      return [
        { x: 100, y: -60, z: 0 },
        { x: -80, y: -50, z: 0 },
        { x: 40, y: 80, z: 0 },
      ];
    } else {
      // Triangle on cylinder (closed geodesic VS open)
      return [
        { th: 0, z: 80 },
        { th: Math.PI / 2, z: -40 },
        { th: Math.PI, z: 40 },
      ];
    }
  }

  // Compute saddle surface z(x,y) = (x² - y²)/R
  function saddleZ(x, y) {
    return (x * x - y * y) / 800;
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 500, p.WEBGL).parent('p5canvas');

    // Surface mode buttons
    modeNames.forEach((name, i) => {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.style.cssText =
        'background:#161b22;color:' +
        (i === 0 ? '#58a6ff' : '#8b949e') +
        ';border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;margin:3px;font-size:0.78em';
      btn.addEventListener('click', () => {
        surfaceMode = i;
        transportActive = false;
        transpProgress = 0;
        holonomy = 0;
        transpAngle = 0;
        document.querySelectorAll('.sketch-col button').forEach((b, j) => {
          if (j < 3) b.style.color = j === i ? '#58a6ff' : '#8b949e';
        });
      });
      document.querySelector('.sketch-col')?.appendChild(btn);
    });

    // Start/stop transport button
    const tBtn = document.createElement('button');
    tBtn.textContent = '开启平行移动';
    tBtn.style.cssText =
      'background:#161b22;color:#7ee787;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.82em';
    tBtn.addEventListener('click', () => {
      transportActive = !transportActive;
      tBtn.textContent = transportActive ? 'Transport Off' : '开启平行移动';
      tBtn.style.color = transportActive ? '#f78166' : '#7ee787';
      if (!transportActive) { transpProgress = 0; transpAngle = 0; }
    });
    document.querySelector('.sketch-col')?.appendChild(tBtn);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.rotateX(rotX);
    p.rotateY(rotY);

    if (surfaceMode === 0) {
      drawSphere();
    } else if (surfaceMode === 1) {
      drawSaddle();
    } else {
      drawCylinder();
    }

    // UI text overlay (2D, after all 3D drawing); (0,0) = top-left canvas corner
    p.push();
    p.resetMatrix();
    p.translate(p.width / 2, p.height / 2);
    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text(modeNames[surfaceMode] + ' | Drag to rotate', 10, 10);
    p.fill('#8b949e');
    p.text(
      'Holonomy: ' + holonomy.toFixed(2) + ' rad  (' + ((holonomy * 180) / Math.PI).toFixed(0) + '°)',
      10,
      32
    );
    if (surfaceMode === 0) {
      p.text(
        'Gauss-Bonnet: ʃʃ K dA = 2πχ(M) | Holonomy = area × K',
        10,
        54
      );
    } else if (surfaceMode === 2) {
      p.text('Cylinder K=0 → parallel transport returns unchanged', 10, 54);
    }
    p.pop();
  };

  function drawSphere() {
    const R = 140;

    // Wireframe
    p.stroke('#141920');
    p.strokeWeight(0.4);
    p.noFill();
    p.sphere(R, 20, 12);

    // Geodesic triangle
    const tri = getTriangle();
    p.stroke('#f78166');
    p.strokeWeight(3);
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= 3; i++) {
      const v = tri[i % 3];
      const px = R * Math.sin(v.th) * Math.cos(v.ph);
      const py = R * Math.sin(v.th) * Math.sin(v.ph);
      const pz = R * Math.cos(v.th);
      p.vertex(px, py, pz);
    }
    p.endShape();

    // Parallel transport along the triangle
    if (transportActive) {
      transpProgress += 0.003;
      if (transpProgress > 1) {
        transpProgress -= 1;
        // After one full loop, rotate by holonomy
        transpAngle += 1.5; // sphere: holonomy ≈ area of triangle
        holonomy = transpAngle;
      }
    }

    // Interpolate along triangle edges
    const seg = transpProgress * 3;
    const idx = Math.min(2, Math.floor(seg));
    const frac = seg - idx;
    const v1 = tri[idx], v2 = tri[(idx + 1) % 3];
    const th = v1.th + (v2.th - v1.th) * frac;
    const ph = v1.ph + (v2.ph - v1.ph) * frac;
    const px = R * Math.sin(th) * Math.cos(ph);
    const py = R * Math.sin(th) * Math.sin(ph);
    const pz = R * Math.cos(th);

    // Transported vector (blue arrow)
    p.push();
    p.translate(px, py, pz);
    p.stroke('#58a6ff');
    p.strokeWeight(4);
    const vLen = 35;
    p.line(0, 0, vLen * Math.cos(transpAngle), vLen * Math.sin(transpAngle), 0);
    // Arrow head
    p.fill('#58a6ff');
    p.noStroke();
    p.translate(vLen * 0.8 * Math.cos(transpAngle), vLen * 0.8 * Math.sin(transpAngle), 0);
    p.sphere(4);
    p.pop();

    // Red dot on the vector base
    p.fill('#f78166');
    p.noStroke();
    p.push();
    p.translate(px, py, pz);
    p.sphere(5);
    p.pop();
  }

  function drawSaddle() {
    const R = 140;
    const gridSize = 3;

    // Wireframe of saddle surface (z = x² - y²)
    p.stroke('#141920');
    p.strokeWeight(0.5);
    p.noFill();

    for (let i = -gridSize; i <= gridSize; i++) {
      p.beginShape();
      for (let j = -gridSize; j <= gridSize; j += 0.1) {
        const x = i * (R / gridSize);
        const y = j * (R / gridSize);
        p.vertex(x, y, saddleZ(x, y));
      }
      p.endShape();
    }
    for (let j = -gridSize; j <= gridSize; j++) {
      p.beginShape();
      for (let i = -gridSize; i <= gridSize; i += 0.1) {
        const x = i * (R / gridSize);
        const y = j * (R / gridSize);
        p.vertex(x, y, saddleZ(x, y));
      }
      p.endShape();
    }

    // Geodesic triangle on saddle
    const tri = getTriangle();
    p.stroke('#f78166');
    p.strokeWeight(3);
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= 3; i++) {
      const v = tri[i % 3];
      p.vertex(v.x, v.y, saddleZ(v.x, v.y));
    }
    p.endShape();

    // Transport
    if (transportActive) {
      transpProgress += 0.003;
      if (transpProgress > 1) {
        transpProgress -= 1;
        transpAngle -= 0.4; // saddle: negative holonomy
        holonomy = transpAngle;
      }
    }

    const seg = transpProgress * 3;
    const idx = Math.min(2, Math.floor(seg));
    const frac = seg - idx;
    const v1 = tri[idx], v2 = tri[(idx + 1) % 3];
    const lx = v1.x + (v2.x - v1.x) * frac;
    const ly = v1.y + (v2.y - v1.y) * frac;
    const lz = saddleZ(lx, ly);

    p.push();
    p.translate(lx, ly, lz);
    p.stroke('#58a6ff');
    p.strokeWeight(4);
    const vLen = 30;
    p.line(0, 0, vLen * Math.cos(transpAngle), vLen * Math.sin(transpAngle), 0);
    p.fill('#58a6ff');
    p.noStroke();
    p.translate(vLen * 0.8 * Math.cos(transpAngle), vLen * 0.8 * Math.sin(transpAngle), 0);
    p.sphere(3);
    p.pop();

    p.fill('#f78166');
    p.noStroke();
    p.push();
    p.translate(lx, ly, lz);
    p.sphere(4);
    p.pop();
  }

  function drawCylinder() {
    const R = 80, H = 200;

    // Cylinder body
    p.stroke('#141920');
    p.strokeWeight(0.5);
    p.noFill();
    for (let j = 0; j <= 10; j++) {
      const z = p.map(j, 0, 10, -H / 2, H / 2);
      p.beginShape();
      for (let a = 0; a <= p.TWO_PI; a += 0.05) {
        p.vertex(R * Math.cos(a), R * Math.sin(a), z);
      }
      p.endShape();
    }
    // vertical lines
    for (let a = 0; a <= p.TWO_PI; a += p.TWO_PI / 8) {
      p.line(R * Math.cos(a), R * Math.sin(a), -H / 2, R * Math.cos(a), R * Math.sin(a), H / 2);
    }

    // Geodesic triangle on cylinder
    const tri = getTriangle();
    p.stroke('#f78166');
    p.strokeWeight(3);
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= 3; i++) {
      const v = tri[i % 3];
      const cx = R * Math.cos(v.th), cy = R * Math.sin(v.th);
      p.vertex(cx, cy, v.z);
    }
    p.endShape();

    // Transport on cylinder (K=0 → no holonomy!)
    if (transportActive) {
      transpProgress += 0.004;
      if (transpProgress > 1) {
        transpProgress -= 1;
        holonomy = transpAngle; // stays the same (K=0)
      }
    }

    const seg = transpProgress * 3;
    const idx = Math.min(2, Math.floor(seg));
    const frac = seg - idx;
    const v1 = tri[idx], v2 = tri[(idx + 1) % 3];
    const th = v1.th + (v2.th - v1.th) * frac;
    const zz = v1.z + (v2.z - v1.z) * frac;
    const cx = R * Math.cos(th), cy = R * Math.sin(th);

    p.push();
    p.translate(cx, cy, zz);
    // Rotate the vector to align with cylinder surface normal
    p.rotateY(-th + p.HALF_PI);
    p.stroke('#58a6ff');
    p.strokeWeight(4);
    const vLen = 30;
    p.line(0, 0, vLen * Math.cos(transpAngle), vLen * Math.sin(transpAngle), 0);
    p.fill('#58a6ff');
    p.noStroke();
    p.push();
    p.translate(vLen * 0.8 * Math.cos(transpAngle), vLen * 0.8 * Math.sin(transpAngle), 0);
    p.sphere(3);
    p.pop();
    p.pop();

    p.fill('#f78166');
    p.noStroke();
    p.push();
    p.translate(cx, cy, zz);
    p.sphere(4);
    p.pop();
  }

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
