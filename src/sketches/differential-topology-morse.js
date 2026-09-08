import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let rotX = 0.5, rotY = 0.3;
  let dragging = false, prevX = 0, prevY = 0;
  let showLevel = 0.5;
  let levelAnim = 0.5;
  let mode = 'surface'; // 'surface' | 'levelset'

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 480, p.WEBGL).parent('p5canvas');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin:6px 0';

    const surfBtn = document.createElement('button');
    surfBtn.textContent = '曲面';
    surfBtn.style.cssText =
      'background:#1a2a3a;color:#58a6ff;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.82em;margin:2px';
    surfBtn.addEventListener('click', () => {
      mode = 'surface';
      surfBtn.style.background = '#1a2a3a';
      document.querySelectorAll('.sketch-col button')[1].style.background = '#161b22';
    });
    btnRow.appendChild(surfBtn);

    const lvlBtn = document.createElement('button');
    lvlBtn.textContent = '水平集';
    lvlBtn.style.cssText =
      'background:#161b22;color:#8b949e;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.82em;margin:2px';
    lvlBtn.addEventListener('click', () => {
      mode = 'levelset';
      surfBtn.style.background = '#161b22';
      lvlBtn.style.background = '#1a2a3a';
      lvlBtn.style.color = '#58a6ff';
    });
    btnRow.appendChild(lvlBtn);

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '-0.6';
    sl.max = '0.8';
    sl.step = '0.01';
    sl.value = '0';
    sl.style.cssText = 'width:100px;accent-color:#58a6ff;margin:2px 6px';
    sl.addEventListener('input', () => {
      showLevel = parseFloat(sl.value);
    });
    btnRow.appendChild(sl);
    const slLabel = document.createElement('span');
    slLabel.style.cssText = 'color:#8b949e;font-size:0.72em';
    slLabel.textContent = '水平';
    btnRow.appendChild(slLabel);

    document.querySelector('.sketch-col')?.appendChild(btnRow);
  };

  // f(x,y) = x³ - 3x + y²  (Morse function on R²)
  function f(x, y) {
    return x * x * x / 3 - 2 * x + y * y / 2;
  }

  p.draw = () => {
    p.background('#0d1117');
    p.ambientLight(60, 60, 65);

    levelAnim += (showLevel - levelAnim) * 0.1;

    p.rotateX(rotX);
    p.rotateY(rotY);
    p.scale(1.2);

    const sc = 75;
    const res = 50;

    if (mode === 'surface') {
      drawSurface(sc, res);
    } else {
      drawLevelSets(sc, res);
    }

    // Critical points
    // f_x = x² - 2 = 0 → x = ±√2 ≈ ±1.414
    // f_y = y = 0
    // At (√2, 0): Hessian = [[2√2, 0], [0, 1]] → 2 positive eigenvalues → index 0 (minimum)
    // At (-√2, 0): Hessian = [[-2√2, 0], [0, 1]] → 1 positive, 1 negative → index 1 (saddle)
    const cp1 = [Math.sqrt(2), 0];
    const cp2 = [-Math.sqrt(2), 0];
    const c1 = f(cp1[0], cp1[1]).toFixed(2);
    const c2 = f(cp2[0], cp2[1]).toFixed(2);

    // Screen positions for 3D-anchored labels (projected while 3D transform is active)
    const projMin = p.worldToScreen(cp1[0] * sc, cp1[1] * sc - 14, f(cp1[0], cp1[1]) * sc);
    const projSad = p.worldToScreen(cp2[0] * sc, cp2[1] * sc - 14, f(cp2[0], cp2[1]) * sc);

    // Minimum (red)
    p.push();
    p.translate(cp1[0] * sc, cp1[1] * sc, f(cp1[0], cp1[1]) * sc);
    p.fill('#ffd33d');
    p.noStroke();
    p.sphere(6);
    p.pop();

    // Saddle (blue)
    p.push();
    p.translate(cp2[0] * sc, cp2[1] * sc, f(cp2[0], cp2[1]) * sc);
    p.fill('#f78166');
    p.noStroke();
    p.sphere(6);
    p.pop();

    // 2D text overlay (after all 3D drawing); (0,0) = top-left canvas corner
    p.push();
    p.resetMatrix();
    p.translate(p.width / 2, p.height / 2);

    // Critical point labels anchored to their 3D positions
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.fill('#ffd33d');
    p.text('idx=0 (min)', projMin.x, projMin.y);
    p.fill('#f78166');
    p.text('idx=1 (saddle)', projSad.x, projSad.y);

    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Morse function: f(x,y) = x³/3 − 2x + y²/2', 16, 14);
    p.text(
      'Crit pts:  ' +
        c1 +
        ' (min, idx=0)   ' +
        c2 +
        ' (saddle, idx=1)',
      16,
      32
    );
    p.fill('#58a6ff');
    p.textSize(12);
    p.text('Morse inequalities: c₀ ≥ b₀, c₁ ≥ b₁', 16, 52);
    p.text('Σ (−1)ᵏ c_k = χ(M) (alternating sum = Euler char)', 16, 70);
    p.pop();
  };

  function drawSurface(sc, res) {
    // Wireframe
    p.stroke('#141920');
    p.strokeWeight(0.4);
    p.noFill();

    for (let i = -res; i <= res; i++) {
      const x = (i / res) * 4;
      p.beginShape();
      for (let j = -res; j <= res; j++) {
        const y = (j / res) * 3;
        p.vertex(x * sc, y * sc, f(x, y) * sc);
      }
      p.endShape();
    }
    for (let j = -res; j <= res; j++) {
      const y = (j / res) * 3;
      p.beginShape();
      for (let i = -res; i <= res; i++) {
        const x = (i / res) * 4;
        p.vertex(x * sc, y * sc, f(x, y) * sc);
      }
      p.endShape();
    }

    // Sublevel set highlight
    p.fill(88, 166, 255, 25);
    p.noStroke();
    p.beginShape();
    for (let i = -res; i <= res; i++) {
      const x = (i / res) * 4;
      for (let j = -res; j <= res; j++) {
        const y = (j / res) * 3;
        if (f(x, y) <= levelAnim) {
          p.vertex(x * sc, y * sc, f(x, y) * sc);
        }
      }
    }
    p.endShape();
  }

  function drawLevelSets(sc, res) {
    // Draw level set f(x,y) = levelAnim as a contour
    p.stroke('#f78166');
    p.strokeWeight(3);
    p.noFill();
    p.beginShape();
    for (let i = -res; i <= res; i++) {
      const x = (i / res) * 4;
      // Find y where f(x,y) ≈ levelAnim
      // f = x³/3 - 2x + y²/2 = level → y² = 2(level - x³/3 + 2x)
      const rhs = 2 * (levelAnim - x * x * x / 3 + 2 * x);
      if (rhs >= 0) {
        const y = Math.sqrt(rhs);
        p.vertex(x * sc, y * sc, levelAnim * sc);
      }
    }
    p.endShape();

    // Flat plane at level
    p.stroke('#30363d');
    p.strokeWeight(0.5);
    p.noFill();
    const sz = 4 * sc;
    p.beginShape();
    p.vertex(-sz, -sz, levelAnim * sc);
    p.vertex(sz, -sz, levelAnim * sc);
    p.vertex(sz, sz, levelAnim * sc);
    p.vertex(-sz, sz, levelAnim * sc);
    p.endShape(p.CLOSE);

    // Surface ghost
    p.stroke('#141920');
    p.strokeWeight(0.3);
    p.noFill();
    for (let i = -res; i <= res; i += 4) {
      const x = (i / res) * 4;
      p.beginShape();
      for (let j = -res; j <= res; j++) {
        const y = (j / res) * 3;
        p.vertex(x * sc, y * sc, f(x, y) * sc);
      }
      p.endShape();
    }
  }

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
