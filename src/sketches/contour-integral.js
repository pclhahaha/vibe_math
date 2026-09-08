import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let poleX = 0, poleY = 0;
  let radius = 85;
  let draggingPole = false;
  let secondPole = false;
  let p2x = 160, p2y = 0;
  let mx = 0, my = 0;

  const phaseAngle = (t) => {
    // winding angle along contour
    return t;
  };

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(580, 480).parent('p5canvas');
    const wrap = document.querySelector('.sketch-col');

    // Radius slider
    const rs = document.createElement('input');
    rs.type = 'range'; rs.min = '30'; rs.max = '160'; rs.step = '1'; rs.value = '85';
    rs.style.cssText = 'width:150px;accent-color:#58a6ff;margin:2px';
    rs.addEventListener('input', () => { radius = parseInt(rs.value); });

    // Second pole toggle
    const tog = document.createElement('button');
    tog.textContent = '2nd Pole: OFF';
    tog.style.cssText =
      'padding:3px 10px;border:1px solid #30363d;border-radius:4px;background:#0d1117;color:#58a6ff;cursor:pointer;font-size:0.8em;margin:2px;';
    tog.addEventListener('click', () => {
      secondPole = !secondPole;
      tog.textContent = '2nd Pole: ' + (secondPole ? 'ON' : 'OFF');
      tog.style.background = secondPole ? '#1f2a3a' : '#0d1117';
    });

    wrap?.appendChild(rs);
    wrap?.appendChild(tog);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);

    // Background grid
    p.stroke('#1a1f2b'); p.strokeWeight(0.5);
    for (let i = -5; i <= 5; i++) {
      p.line(i * 50, -5 * 50, i * 50, 5 * 50);
      p.line(-5 * 50, i * 50, 5 * 50, i * 50);
    }

    // Contour circle
    p.stroke('#58a6ff'); p.strokeWeight(3); p.noFill();
    p.beginShape();
    for (let a = 0; a <= p.TWO_PI; a += 0.04)
      p.vertex(radius * p.cos(a), radius * p.sin(a));
    p.endShape(p.CLOSE);

    // Moving point on contour
    const t = p.frameCount * 0.02;
    const cx = radius * p.cos(t), cy = radius * p.sin(t);
    p.fill('#58a6ff'); p.noStroke();
    p.circle(cx, cy, 10);

    // --- dz vector following mouse along contour ---
    // Project mouse to nearest contour point & show tangent dz
    const distM = p.dist(mx, my, 0, 0);
    const nearR = p.constrain(distM, 0.1, 200);
    const nearX = (mx / nearR) * radius;
    const nearY = (my / nearR) * radius;
    const angTan = Math.atan2(nearY, nearX) + p.HALF_PI; // tangent direction
    const dzLen = 25;
    p.stroke('#f78166'); p.strokeWeight(2);
    p.line(nearX - dzLen * p.cos(angTan), nearY - dzLen * p.sin(angTan),
      nearX + dzLen * p.cos(angTan), nearY + dzLen * p.sin(angTan));
    // Arrowhead
    const tipX = nearX + dzLen * p.cos(angTan);
    const tipY = nearY + dzLen * p.sin(angTan);
    p.fill('#f78166');
    p.noStroke();
    p.triangle(
      tipX, tipY,
      tipX - 7 * p.cos(angTan - 2.1), tipY - 7 * p.sin(angTan - 2.1),
      tipX - 7 * p.cos(angTan + 2.1), tipY - 7 * p.sin(angTan + 2.1)
    );
    p.fill('#f78166');
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('dz', nearX + 32 * p.cos(angTan), nearY + 32 * p.sin(angTan));

    // --- Pole 1 (draggable) ---
    p.fill('#f78166'); p.noStroke();
    p.circle(poleX, poleY, 11);
    p.fill('#ff0000'); p.circle(poleX, poleY, 7);

    // --- Pole 2 (if on) ---
    if (secondPole) {
      p.fill('#f0883e'); p.noStroke();
      p.circle(p2x, p2y, 11);
      p.fill('#dd0000'); p.circle(p2x, p2y, 7);
    }

    // --- Integral computation ---
    // ∮ f(z) dz = 2πi * (sum of residues inside contour)
    // f(z) = 1/z (pole1) + 1/(z-p2) (pole2 if on)
    // For z0 inside contour, residue = 1
    const inside1 = p.dist(poleX, poleY, 0, 0) < radius;
    const inside2 = secondPole && p.dist(p2x, p2y, 0, 0) < radius;

    let totalResidue = 0;
    if (inside1) totalResidue += 1;
    if (inside2) totalResidue += 1;

    // Text display
    p.textSize(13);
    p.textAlign(p.CENTER, p.TOP);
    p.fill('#58a6ff');
    p.text(`∮ 1/z dz`, 0, -200);
    p.fill('#8b949e');
    p.text(`Contour radius: ${radius}px`, 0, -178);

    p.fill('#f78166');
    p.text(`∮ f(z) dz = 2πi × (sum of residues enclosed)`, 0, -155);

    const color1 = inside1 ? '#58a6ff' : '#8b949e';
    const color2 = inside2 ? '#58a6ff' : '#8b949e';
    p.fill(color1);
    p.text(`Pole at (${poleX.toFixed(0)}, ${poleY.toFixed(0)}) → residue = ${inside1 ? '1 (inside)' : '0 (outside)'}`, 0, -130);
    if (secondPole) {
      p.fill(color2);
      p.text(`Pole at (${p2x.toFixed(0)}, ${p2y.toFixed(0)}) → residue = ${inside2 ? '1 (inside)' : '0 (outside)'}`, 0, -110);
    }

    p.fill('#58a6ff');
    p.textSize(15);
    p.text(`Result = 2πi × ${totalResidue} = ${totalResidue === 0 ? '0' : '2πi'}`, 0, secondPole ? -85 : -105);
    p.textSize(11);
    p.fill('#8b949e');
    p.text('(contour-independent! only poles inside matter — Residue Theorem)', 0, secondPole ? -65 : -85);
  };

  p.mousePressed = () => {
    mx = p.mouseX - p.width / 2;
    my = p.mouseY - p.height / 2;
    if (p.dist(mx, my, poleX, poleY) < 20) {
      draggingPole = true;
    }
  };
  p.mouseReleased = () => {
    draggingPole = false;
  };
  p.mouseDragged = () => {
    mx = p.mouseX - p.width / 2;
    my = p.mouseY - p.height / 2;
    if (draggingPole) {
      poleX = mx; poleY = my;
    }
  };
  p.mouseMoved = () => {
    mx = p.mouseX - p.width / 2;
    my = p.mouseY - p.height / 2;
  };
};
new p5(sketch);
