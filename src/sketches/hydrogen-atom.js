import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const orbs = [
    { name:'1s', n:1, l:0 },
    { name:'2s', n:2, l:0 },
    { name:'2p', n:2, l:1 },
    { name:'3s', n:3, l:0 },
    { name:'3p', n:3, l:1 },
    { name:'3d', n:3, l:2 },
  ];
  let idx = 0;
  let numPoints = 3000;
  let points3D = [];
  let rotX = 0, rotY = 0;
  let prevMX = 0, prevMY = 0;
  let dragging = false;
  let autoRotate = true;
  let pg;
  let dragRadial = false;
  let selectedR = 5;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(560, 480, p.WEBGL).parent('p5canvas');
    pg = p.createGraphics(150, 120);

    const sel = document.createElement('select');
    orbs.forEach((o, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = o.name;
      sel.appendChild(opt);
    });
    sel.style.cssText = 'background:#161b22;color:#c9d1d9;border:1px solid #30363d;padding:4px 8px;border-radius:4px;margin:4px';
    sel.addEventListener('change', () => { idx = parseInt(sel.value); generateCloud(); });
    document.querySelector('.sketch-col')?.appendChild(sel);

    const ptsl = document.createElement('input');
    ptsl.type = 'range';
    ptsl.min = '500';
    ptsl.max = '8000';
    ptsl.step = '500';
    ptsl.value = '3000';
    ptsl.style.cssText = 'width:200px;accent-color:#58a6ff;margin:4px';
    ptsl.addEventListener('input', () => { numPoints = parseInt(ptsl.value); generateCloud(); });
    const lbl = document.createElement('span');
    lbl.textContent = ' Points: 3000';
    lbl.style.cssText = 'color:#8b949e;font-size:13px;margin:4px';
    ptsl.addEventListener('input', () => { lbl.textContent = ' Points: ' + ptsl.value; });
    document.querySelector('.sketch-col')?.appendChild(ptsl);
    document.querySelector('.sketch-col')?.appendChild(lbl);

    generateCloud();
  };

  function generateCloud() {
    const o = orbs[idx];
    points3D = [];
    let tries = 0;
    while (points3D.length < numPoints && tries < numPoints * 15) {
      tries++;
      const r = p.random(0, 4) * 30;
      const theta = p.random(0, p.PI);
      const phi = p.random(0, p.TWO_PI);
      const R = Math.exp(-r / 30) * Math.pow(r / 30, o.l);
      const prob = R * R * r * r;
      if (p.random() < prob * 0.35) {
        points3D.push({
          x: r * Math.sin(theta) * Math.cos(phi),
          y: r * Math.sin(theta) * Math.sin(phi),
          z: r * Math.cos(theta),
          c: 200 - (150 * r) / 120,
        });
      }
    }
  }

  p.mousePressed = () => {
    const gx = 10, gy = p.height - 130;
    if (p.mouseX >= gx && p.mouseX <= gx + 150 && p.mouseY >= gy && p.mouseY <= gy + 120) {
      dragRadial = true;
      updateRFromMouse();
      return;
    }
    dragging = true;
    autoRotate = false;
    prevMX = p.mouseX;
    prevMY = p.mouseY;
  };

  p.mouseReleased = () => { dragging = false; dragRadial = false; };

  p.mouseDragged = () => {
    if (dragRadial) {
      updateRFromMouse();
      return;
    }
    if (dragging) {
      rotX += (p.mouseY - prevMY) * 0.01;
      rotY += (p.mouseX - prevMX) * 0.01;
      prevMX = p.mouseX;
      prevMY = p.mouseY;
    }
  };

  function updateRFromMouse() {
    const gx = 10, gy = p.height - 130;
    const w = 150, h = 120;
    const ml = 28, mr = 8;
    const mw = w - ml - mr;
    if (mw > 0 && p.mouseX >= gx + ml && p.mouseX <= gx + w - mr) {
      selectedR = ((p.mouseX - gx - ml) / mw) * 15;
    }
    generateCloud();
  }

  p.draw = () => {
    p.background('#0d1117');
    const o = orbs[idx];

    if (dragging) {
      rotX += (p.mouseY - prevMY) * 0.01;
      rotY += (p.mouseX - prevMX) * 0.01;
      prevMX = p.mouseX;
      prevMY = p.mouseY;
    }
    if (!dragging && autoRotate) rotY += 0.005;

    p.push();
    p.rotateX(rotX);
    p.rotateY(rotY);

    p.beginShape(p.POINTS);
    p.strokeWeight(3);
    for (const pt of points3D) {
      p.stroke(88, 166, 255, pt.c);
      p.vertex(pt.x, pt.y, pt.z);
    }
    p.endShape();

    p.stroke('#30363d');
    p.strokeWeight(0.5);
    p.line(-140, 0, 0, 140, 0, 0);
    p.line(0, -140, 0, 0, 140, 0);
    p.line(0, 0, -140, 0, 0, 140);

    p.noStroke();
    p.fill('#f78166');
    p.sphere(4);
    p.pop();

    drawRadialGraph(o);

    p.push();
    p.resetMatrix();
    p.translate(-p.width / 2, -p.height / 2);
    p.image(pg, 10, p.height - 130);

    p.fill('#ffd33d');
    p.textSize(10);
    p.text('drag graph ↑', 170, p.height - 14);

    const energy = -13.6 / (o.n * o.n);
    p.fill('#8b949e');
    p.textSize(14);
    p.text(o.name + ' orbital (n=' + o.n + ', l=' + o.l + ') — probability cloud', 10, 20);
    p.text('E_n = -13.6 / ' + (o.n * o.n) + ' = ' + energy.toFixed(2) + ' eV', 10, 40);
    p.text('Drag to rotate | Drag radial graph | Points: ' + numPoints, 10, 60);
    p.pop();
  };

  function drawRadialGraph(o) {
    pg.clear();
    pg.fill(0, 0, 0, 70);
    pg.noStroke();
    pg.rect(0, 0, pg.width, pg.height);
    pg.stroke('#30363d');
    pg.strokeWeight(1);
    pg.noFill();
    pg.rect(0, 0, pg.width, pg.height);

    const w = pg.width, h = pg.height;
    const ml = 28, mr = 8, mt = 12, mb = 18;

    pg.stroke('#30363d');
    pg.strokeWeight(0.5);
    pg.line(ml, h - mb, w - mr, h - mb);
    pg.line(ml, mt, ml, h - mb);

    let maxP = 1e-10;
    const vals = new Array(101);
    for (let i = 0; i <= 100; i++) {
      const r = (i / 100) * 15;
      const R = Math.exp(-r / 3) * Math.pow(r / 3, o.l);
      vals[i] = R * R * r * r;
      if (vals[i] > maxP) maxP = vals[i];
    }
    if (maxP === 0) maxP = 1;

    pg.stroke('#7ee787');
    pg.strokeWeight(1.5);
    pg.noFill();
    pg.beginShape();
    const mw = w - ml - mr, mh = h - mt - mb;
    for (let i = 0; i <= 100; i++) {
      pg.vertex(ml + (i / 100) * mw, h - mb - (vals[i] / maxP) * mh);
    }
    pg.endShape();

    const sx = ml + (selectedR / 15) * mw;
    const sy = h - mb - (vals[Math.round(selectedR / 15 * 100)] / maxP) * mh;
    pg.fill('#ffd33d');
    pg.noStroke();
    pg.circle(sx, sy, 5);

    pg.fill('#7ee787');
    pg.textSize(11);
    pg.text('P(r)|', ml + 2, mt + 9);
    pg.fill('#8b949e');
    pg.text('r', w - mr - 8, h - mb + 10);
  }
};
new p5(sketch);
