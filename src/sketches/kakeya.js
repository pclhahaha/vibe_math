import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let angle = Math.PI / 4;
  let mode = 'naive';
  let level = 3;
  let dragging = false;
  let hoverHandle = false;

  const needleLen = 140;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(520, p.windowWidth - 40), 440).parent('p5canvas');

    // Controls
    const ctrlRow = document.createElement('div');
    ctrlRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0';

    const modeBtn = document.createElement('button');
    modeBtn.textContent = 'Besicovitch 技巧';
    modeBtn.style.cssText =
      'background:#161b22;color:#f78166;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;font-size:0.82em';
    modeBtn.addEventListener('click', () => {
      mode = mode === 'naive' ? 'besicovitch' : 'naive';
      modeBtn.textContent = mode === 'naive' ? 'Besicovitch 技巧' : 'Naive Rotation';
      modeBtn.style.color = mode === 'naive' ? '#f78166' : '#58a6ff';
    });
    ctrlRow.appendChild(modeBtn);

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '1';
    sl.max = '8';
    sl.step = '1';
    sl.value = '3';
    sl.style.cssText = 'width:90px;accent-color:#58a6ff';
    sl.addEventListener('input', () => {
      level = parseInt(sl.value);
    });
    ctrlRow.appendChild(sl);

    const slLabel = document.createElement('span');
    slLabel.style.cssText = 'color:#8b949e;font-size:0.75em';
    slLabel.textContent = 'Sub: ' + level;
    sl.addEventListener('input', () => { slLabel.textContent = 'Sub: ' + level; });
    ctrlRow.appendChild(slLabel);

    document.querySelector('.sketch-col')?.appendChild(ctrlRow);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.7em;margin:2px 0 0 4px';
    hint.textContent = '拖动橙色圆点旋转针';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);

    // Light grid
    p.stroke('#141920');
    p.strokeWeight(0.3);
    for (let i = -6; i <= 6; i++) {
      p.line(i * 40, -200, i * 40, 200);
      p.line(-200, i * 40, 200, i * 40);
    }

    if (mode === 'naive') {
      // Naive rotation — circular sector
      const area = Math.PI * needleLen * needleLen * (angle / p.TWO_PI);
      p.fill(248, 113, 102, 12);
      p.noStroke();
      p.beginShape();
      p.vertex(0, 0);
      for (let a = 0; a <= angle; a += 0.02) {
        p.vertex(needleLen * p.cos(a), needleLen * p.sin(a));
      }
      p.vertex(0, 0);
      p.endShape(p.CLOSE);

      // Boundary circle
      p.stroke('#30363d');
      p.strokeWeight(0.6);
      p.noFill();
      p.circle(0, 0, needleLen * 2);

      // Area label
      p.fill('#f78166');
      p.textSize(13);
      p.textAlign(p.CENTER, p.TOP);
      const areaRatio = angle / p.TWO_PI;
      p.text(
        'Area = ' + (areaRatio * 100).toFixed(1) + '% of πL²  =  ' + area.toFixed(0) + ' px²',
        0,
        needleLen + 20
      );

    } else {
      // Besicovitch trick — narrow overlapping triangles
      const segLen = (2 * needleLen) / level;
      // Draw each split segment as a narrow triangle
      for (let i = 0; i < level; i++) {
        const a0 = (angle * i) / level;
        const a1 = (angle * (i + 1)) / level;
        const midAngle = (a0 + a1) / 2;

        // Each segment is a thin triangle from origin to the arc
        p.fill(248, 113, 102, 15);
        p.noStroke();
        p.beginShape();
        for (let a = a0; a <= a1; a += 0.01) {
          p.vertex(needleLen * p.cos(a), needleLen * p.sin(a));
        }
        p.vertex(0, 0);
        p.endShape(p.CLOSE);

        // Triangle outline
        p.stroke('#f78166');
        p.strokeWeight(0.8);
        p.noFill();
        p.beginShape();
        p.vertex(needleLen * p.cos(a0), needleLen * p.sin(a0));
        p.vertex(needleLen * p.cos(a1), needleLen * p.sin(a1));
        p.vertex(0, 0);
        p.endShape(p.CLOSE);
      }

      // Show the zero-area construction reference
      const estArea = (Math.PI * needleLen * needleLen) / (level * 2);
      p.fill('#f78166');
      p.textSize(13);
      p.textAlign(p.CENTER, p.TOP);
      p.text(
        'Subdivisions: ' + level + '  |  Area ≈ ' + estArea.toFixed(0) + ' px²  (→ 0 as level ↑)',
        0,
        needleLen + 20
      );
    }

    // Needle (thick line)
    p.push();
    p.rotate(angle);
    // Shadow
    p.stroke('#0a0e14');
    p.strokeWeight(7);
    p.line(-needleLen, 0, needleLen, 0);
    // Blue needle
    p.stroke('#58a6ff');
    p.strokeWeight(4);
    p.line(-needleLen, 0, needleLen, 0);
    // Center dot
    p.fill('#58a6ff');
    p.noStroke();
    p.circle(0, 0, 8);
    p.pop();

    // Drag handle at tip (right side of needle)
    const ex = needleLen * p.cos(angle);
    const ey = needleLen * p.sin(angle);

    // Check hover
    const mx = p.mouseX - p.width / 2;
    const my = p.mouseY - p.height / 2;
    hoverHandle = p.dist(mx, my, ex, ey) < 16;

    if (hoverHandle || dragging) {
      p.fill('#ffd33d');
      p.noStroke();
      p.circle(ex, ey, 16);
      p.fill(255, 221, 61, 30);
      p.circle(ex, ey, 28);
      p.fill('#0d1117');
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('drag', ex, ey);
    } else {
      p.fill('#f78166');
      p.noStroke();
      p.circle(ex, ey, 14);
    }

    // Info panel
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      'Angle: ' + ((angle * 180) / Math.PI).toFixed(0) + '°  |  L = ' + needleLen,
      -p.width / 2 + 14,
      -p.height / 2 + 8
    );
    p.text(
      mode === 'naive'
        ? 'Naive: sweep a circle → area = (θ/2π) · πL²'
        : 'Besicovitch trick: split needle → overlap → area → 0  (level=' + level + ')',
      -p.width / 2 + 14,
      -p.height / 2 + 28
    );
  };

  p.mousePressed = () => {
    const mx = p.mouseX - p.width / 2;
    const my = p.mouseY - p.height / 2;
    const ex = needleLen * p.cos(angle);
    const ey = needleLen * p.sin(angle);
    if (p.dist(mx, my, ex, ey) < 20) {
      dragging = true;
    }
  };

  p.mouseReleased = () => { dragging = false; };

  p.mouseDragged = () => {
    if (!dragging) return;
    const mx = p.mouseX - p.width / 2;
    const my = p.mouseY - p.height / 2;
    angle = Math.atan2(my, mx);
    if (angle < 0) angle += p.TWO_PI;
    angle = p.constrain(angle, 0.01, Math.PI - 0.01);
  };
};

new p5(sketch);
