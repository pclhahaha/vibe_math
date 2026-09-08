import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let knotType = 0; // 0=trefoil, 1=figure-8, 2=unknot
  let rotAngle = 0;
  let dragging = false, prevX = 0;
  const knotNames = ['Trefoil (3₁)', 'Figure-8 (4₁)', 'Unknot (0₁)'];
  const jonesData = ['t + t³ − t⁴', 't² − t + 1 − t⁻¹ + t⁻²', '1'];

  function knotPath(type, r, t) {
    const pts = [];
    if (type === 0) {
      // Trefoil in 2D projection
      for (let a = 0; a <= p.TWO_PI; a += 0.02) {
        const rr = r + 18 * Math.sin(3 * a + t);
        pts.push({ x: rr * Math.cos(a), y: rr * Math.sin(a) });
      }
    } else if (type === 1) {
      // Figure-8 knot
      for (let a = 0; a <= p.TWO_PI; a += 0.02) {
        const rr = r + 20 * Math.sin(2 * a);
        pts.push({ x: rr * Math.cos(a), y: rr * Math.sin(a + t * 0.5) });
      }
    } else {
      // Unknot (circle)
      for (let a = 0; a <= p.TWO_PI; a += 0.02) {
        pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
      }
    }
    return pts;
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(500, p.windowWidth - 40), 450).parent('p5canvas');

    // Knot type buttons
    knotNames.forEach((name, i) => {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.style.cssText =
        'background:#161b22;color:' +
        (i === 0 ? '#58a6ff' : '#8b949e') +
        ';border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:3px;font-size:0.82em';
      btn.addEventListener('click', () => {
        knotType = i;
        document.querySelectorAll('.sketch-col button').forEach((b, j) => {
          b.style.color = j === i ? '#58a6ff' : '#8b949e';
        });
      });
      document.querySelector('.sketch-col')?.appendChild(btn);
    });

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.7em;margin:2px 0 0 4px';
    hint.textContent = '左右拖动旋转纽结';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2 - 10);

    if (!dragging) rotAngle += 0.005;
    p.rotate(rotAngle);

    const r = 70;
    const pts = knotPath(knotType, r, p.frameCount * 0.02);

    // Draw knot shadow (for depth)
    p.stroke('#0a0e14');
    p.strokeWeight(10);
    p.noFill();
    p.beginShape();
    for (const pt of pts) p.vertex(pt.x, pt.y);
    p.endShape();

    // Draw knot with thick colored stroke
    p.stroke('#58a6ff');
    p.strokeWeight(6);
    p.noFill();
    p.beginShape();
    for (const pt of pts) p.vertex(pt.x, pt.y);
    p.endShape();

    // Draw crossing indicators (circles at self-intersections)
    if (knotType < 2) {
      // Simplified: draw small circles at the "tight" regions
      for (let i = 0; i < 3 + knotType; i++) {
        const idx = Math.floor((i / (3 + knotType)) * pts.length);
        const pt = pts[idx % pts.length];
        p.fill('#0d1117');
        p.stroke('#f78166');
        p.strokeWeight(2);
        p.circle(pt.x, pt.y, 12);
      }
    }

    // Info panel
    p.resetMatrix();
    p.fill('#0d1117');
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(10, 10, 205, 85, 8);

    p.fill('#c9d1d9');
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(knotNames[knotType], 20, 22);

    p.fill('#58a6ff');
    p.textSize(12);
    p.text('Jones polynomial:  ' + jonesData[knotType], 20, 46);

    p.fill('#8b949e');
    p.textSize(11);
    p.text('Jones (1984): von Neumann algebras → knot invariants', 20, 66);
    p.text('Witten (1989): Jones = Chern-Simons path integral', 20, 82);

    // Reidemeister moves hint
    p.fill('#484f58');
    p.textSize(10);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text(
      'The Jones polynomial is invariant under Reidemeister moves I, II, III',
      14,
      p.height - 8
    );
  };

  p.mousePressed = () => {
    dragging = true;
    prevX = p.mouseX;
  };
  p.mouseReleased = () => (dragging = false);
  p.mouseDragged = () => {
    if (dragging) {
      rotAngle += (p.mouseX - prevX) * 0.01;
      prevX = p.mouseX;
    }
  };
};

new p5(sketch);
