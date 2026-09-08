import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let th = Math.PI / 2;
  let dragging = false;
  let autoPlay = true;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(520, p.windowWidth - 40), 420).parent('p5canvas');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:6px 0';

    const autoBtn = document.createElement('button');
    autoBtn.textContent = 'Auto: ON';
    autoBtn.style.cssText =
      'background:#161b22;color:#7ee787;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;font-size:0.82em';
    autoBtn.addEventListener('click', () => {
      autoPlay = !autoPlay;
      autoBtn.textContent = autoPlay ? 'Auto: ON' : 'Auto: OFF';
      autoBtn.style.color = autoPlay ? '#7ee787' : '#8b949e';
    });
    btnRow.appendChild(autoBtn);

    const hint = document.createElement('span');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin-left:4px';
    hint.textContent = 'Drag the orange ball | Cycloid = fastest descent';
    btnRow.appendChild(hint);
    document.querySelector('.sketch-col')?.appendChild(btnRow);
  };

  p.draw = () => {
    p.background('#0d1117');

    // Origin at top-left area, curve goes right and down
    const ox = 70, oy = 55;
    p.translate(ox, oy);

    if (autoPlay) {
      th = (p.frameCount * 0.012) % (Math.PI * 1.85);
      if (th < 0.05) th = 0.05;
    }

    const R = 75;
    const maxTh = Math.PI;

    // Cycloid parametric: x = R(θ - sin θ), y = R(1 - cos θ) — goes UP from origin
    // We flip y to go DOWN: y_offset = R(1 - cos θ) (positive downward)
    function cycloidX(a) { return R * (a - Math.sin(a)); }
    function cycloidY(a) { return R * (1 - Math.cos(a)); }

    const endX = cycloidX(maxTh); // R * π
    const endY = cycloidY(maxTh); // R * 2

    // Straight line from origin to endpoint for comparison
    p.stroke('#30363d');
    p.strokeWeight(2);
    p.drawingContext.setLineDash([5, 6]);
    p.line(0, 0, endX, endY);
    p.drawingContext.setLineDash([]);
    p.fill('#484f58');
    p.textSize(10);
    p.text('straight line', endX * 0.55, endY * 0.6);

    // Draw the cycloid curve (brachistochrone)
    p.stroke('#58a6ff');
    p.strokeWeight(3.5);
    p.noFill();
    p.beginShape();
    for (let a = 0; a <= maxTh; a += 0.02) {
      p.vertex(cycloidX(a), cycloidY(a));
    }
    p.endShape();

    // Endpoint markers
    p.fill('#ffd33d');
    p.noStroke();
    p.circle(0, 0, 8); // start
    p.circle(endX, endY, 8); // end

    p.fill('#8b949e');
    p.textSize(11);
    p.text('A', -16, -8);
    p.text('B', endX + 10, endY + 4);

    // Rolling circle (visual aid)
    const circleCX = R * th;
    const circleCY = R;
    if (th > 0.1) {
      p.stroke('#1a3a3a');
      p.strokeWeight(1);
      p.noFill();
      p.circle(circleCX, circleCY, R * 2);

      // Point on the circle that generates the cycloid
      const genAngle = th - Math.PI / 2;
      const gx = circleCX + R * Math.cos(genAngle);
      const gy = circleCY + R * Math.sin(genAngle);

      // Radius line from circle center to generating point
      p.stroke('#1a3a3a');
      p.strokeWeight(0.8);
      p.line(circleCX, circleCY, gx, gy);
    }

    // Ball on cycloid
    const bx = cycloidX(th);
    const by = cycloidY(th);

    p.fill('#f78166');
    p.noStroke();
    p.circle(bx, by, 12);
    p.fill(248, 113, 102, 40);
    p.circle(bx, by, 24);

    // Info text
    p.fill('#c9d1d9');
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Brachistochrone — Fastest Descent Problem', 0, -40);

    p.fill('#58a6ff');
    p.textSize(13);
    p.text('Cycloid = path of a point on a rolling circle', 0, -20);

    p.fill('#8b949e');
    p.textSize(12);
    p.text(
      'Cycloid: x = R(θ − sin θ), y = R(1 − cos θ)',
      0,
      endY + 20
    );
    p.text(
      'Euler-Lagrange:  ∂L/∂y − d/dx(∂L/∂y\') = 0',
      0,
      endY + 38
    );
    p.text(
      'Bernoulli (1696) — Newton, Leibniz, l\'Hopital, Johann & Jacob Bernoulli all solved it',
      0,
      endY + 56
    );
  };

  p.mousePressed = () => {
    const ox = 70, oy = 55;
    const R = 75;
    const mx = p.mouseX - ox;
    const my = p.mouseY - oy;
    const bx = R * (th - Math.sin(th));
    const by = R * (1 - Math.cos(th));
    if (p.dist(mx, my, bx, by) < 22) {
      dragging = true;
      autoPlay = false;
    }
  };

  p.mouseReleased = () => { dragging = false; };

  p.mouseDragged = () => {
    if (!dragging) return;
    const ox = 70, oy = 55;
    const R = 75;
    const mx = p.mouseX - ox;
    // Map mouse X to theta along the cycloid
    // x = R(θ - sin θ) — monotonic, invert roughly
    let t = mx / R;
    // Approximate θ from x/R = θ - sin θ  (for small θ, θ³/6)
    if (t < 0) t = 0.05;
    if (t > Math.PI) t = Math.PI - 0.05;
    // Simple approximation: θ ≈ x/R for small x, θ ≈ x/R + 1 for larger
    let guess = t;
    if (t > 0.5) guess = t + 0.5;
    guess = p.constrain(guess, 0.05, Math.PI * 0.95);
    th = guess;
  };
};

new p5(sketch);
