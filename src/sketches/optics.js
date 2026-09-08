import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let slitSep = 15, lambda = 30;
  let mode = 'interference';
  let theta1 = 0.6;
  let dragging = false;
  let rpx = 0, rpy = 0;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(530, p.windowWidth - 40), 420).parent('p5canvas');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin:4px 0';
    ['Interference', 'Refraction'].forEach((name, i) => {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.style.cssText =
        'background:#161b22;color:' + (i === 0 ? '#58a6ff' : '#8b949e') +
        ';border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;font-size:0.82em';
      btn.addEventListener('click', () => { mode = i === 0 ? 'interference' : 'refraction'; });
      btnRow.appendChild(btn);
    });
    document.querySelector('.sketch-col')?.appendChild(btnRow);

    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '2'; sl.max = '40'; sl.step = '1'; sl.value = '15';
    sl.style.cssText = 'width:100px;accent-color:#58a6ff;margin:4px 6px';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8b949e;font-size:0.72em';
    lbl.textContent = 'slit sep: 15';
    sl.addEventListener('input', () => {
      slitSep = parseFloat(sl.value); lbl.textContent = 'slit sep: ' + slitSep;
    });
    document.querySelector('.sketch-col')?.appendChild(sl);
    document.querySelector('.sketch-col')?.appendChild(lbl);
  };

  p.draw = () => {
    p.background('#0d1117');
    if (mode === 'interference') drawInterference();
    else drawRefraction();
  };

  function drawInterference() {
    p.translate(p.width / 2, 40);
    const L = 180, h = p.height - 80;

    p.fill('#58a6ff');
    p.noStroke();
    p.circle(-slitSep / 2, -10, 6);
    p.circle(slitSep / 2, -10, 6);
    p.fill('#c9d1d9');
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text('S₁', -slitSep / 2, 2);
    p.text('S₂', slitSep / 2, 2);

    // Interference pattern
    for (let y = 0; y < h; y += 2) {
      const dy = y - h / 2;
      const r1 = Math.sqrt((dy + slitSep / 2) ** 2 + L * L);
      const r2 = Math.sqrt((dy - slitSep / 2) ** 2 + L * L);
      const phase = (p.TWO_PI * (r1 - r2)) / lambda;
      const I = Math.cos(phase / 2) ** 2;
      const bright = p.constrain(I * 220 + 15, 0, 255);
      p.stroke(88, 166, bright * 0.5 + 80);
      p.strokeWeight(2.5);
      p.line(0, y, 0, y + 2);
    }

    // Screen
    p.stroke('#484f58');
    p.strokeWeight(2);
    p.line(0, 0, 0, h);

    // Wavefront arcs
    p.stroke('#30363d');
    p.strokeWeight(0.6);
    p.noFill();
    for (let r = 30; r < L; r += 12) {
      p.arc(-slitSep / 2, -10, r * 2, r * 2, -p.PI / 3, p.PI / 3);
      p.arc(slitSep / 2, -10, r * 2, r * 2, p.PI - p.PI / 3, p.PI + p.PI / 3);
    }

    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Young Double Slit — Δx = λL/d', 0, h + 8);
    p.text('d=' + slitSep + ' λ=' + lambda + ' spacing=' + ((lambda * L) / slitSep).toFixed(0) + 'px', 0, h + 28);
  }

  function drawRefraction() {
    p.translate(p.width / 2, p.height / 2);
    const rayLen = 180;

    // Interface
    p.stroke('#484f58');
    p.strokeWeight(2.5);
    p.line(-p.width / 2, 0, p.width / 2, 0);

    // Medium labels
    p.fill('#58a6ff');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('n₁ = 1.0 (air)', -p.width / 2 + 10, -p.height / 2 + 8);
    p.fill('#f78166');
    p.text('n₂ = 1.5 (glass)', -p.width / 2 + 10, 12);

    // Normal
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.drawingContext.setLineDash([4, 6]);
    p.line(0, -200, 0, 200);
    p.drawingContext.setLineDash([]);

    const n1 = 1.0, n2 = 1.5;
    const sinTheta2 = (n1 * Math.sin(theta1)) / n2;
    const theta2 = sinTheta2 < 1 ? Math.asin(sinTheta2) : p.HALF_PI;

    // Store ray tip position for drag detection
    rpx = -rayLen * Math.sin(theta1);
    rpy = -rayLen * Math.cos(theta1);

    // Incident ray
    p.stroke('#58a6ff');
    p.strokeWeight(3.5);
    p.line(0, 0, rpx, rpy);

    // Refracted ray
    const t2x = rayLen * Math.sin(theta2);
    const t2y = rayLen * Math.cos(theta2);
    p.stroke('#f78166');
    p.strokeWeight(3.5);
    p.line(0, 0, t2x, t2y);

    // Reflected ray
    p.stroke('#58a6ff');
    p.strokeWeight(1.5);
    p.drawingContext.setLineDash([3, 4]);
    p.line(0, 0, rpx, rayLen * Math.cos(theta1));
    p.drawingContext.setLineDash([]);

    // Angle arcs
    p.noFill();
    p.stroke('#ffd33d');
    p.strokeWeight(1.5);
    p.arc(0, 0, 55, 55, -p.HALF_PI - theta1, -p.HALF_PI);
    p.arc(0, 0, 65, 65, -p.HALF_PI, -p.HALF_PI + theta2);

    p.fill('#ffd33d');
    p.textSize(11);
    p.text('θ₁=' + ((theta1 * 180) / Math.PI).toFixed(0) + '°', -70, -30);
    p.text('θ₂=' + ((theta2 * 180) / Math.PI).toFixed(0) + '°', 30, 45);

    // Drag handle on incident ray tip
    const tipR = 14;
    p.fill(dragging ? '#ffd33d' : '#58a6ff');
    p.noStroke();
    p.circle(rpx, rpy, tipR);
    if (!dragging) {
      p.fill('#c9d1d9');
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('drag', rpx, rpy);
    }

    // Formula
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Snell's Law: n₁ sin θ₁ = n₂ sin θ₂", 0, p.height / 2 - 50);
  };

  p.mousePressed = () => {
    if (mode === 'refraction') {
      if (p.dist(p.mouseX - p.width / 2, p.mouseY - p.height / 2, rpx, rpy) < 20) {
        dragging = true;
      }
    }
  };

  p.mouseReleased = () => { dragging = false; };

  p.mouseDragged = () => {
    if (!dragging) return;
    const cx = p.width / 2, cy = p.height / 2;
    const dx = cx - p.mouseX;
    const dy = cy - p.mouseY;
    theta1 = p.constrain(Math.atan2(dx, dy), 0.08, 1.4);
  };
};

new p5(sketch);
