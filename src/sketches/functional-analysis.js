import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let norm = 'L2';
  let dragAngle = 0.8;
  let dragging = false;

  const A = [[0.8, -0.6], [0.6, 0.8]];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 420).parent('p5canvas');

    const btns = {};
    ['L1', 'L2', 'L∞'].forEach(n => {
      const b = document.createElement('button');
      b.textContent = n;
      b.style.cssText = 'margin: 6px 4px; padding: 4px 10px; background: ' + (n === 'L2' ? '#30363d' : '#21262d') + '; color: #58a6ff; border: 1px solid #30363d; border-radius: 4px; cursor: pointer; font-size: 12px;';
      b.onclick = () => {
        norm = n;
        for (const k in btns) btns[k].style.background = '#21262d';
        b.style.background = '#30363d';
      };
      btns[n] = b;
    });

    const lbl = document.createElement('span');
    lbl.textContent = '  Drag point on unit ball';
    lbl.style.cssText = 'color: #8b949e; font-size: 12px;';

    const div = document.createElement('div');
    div.style.cssText = 'margin: 4px 0;';
    Object.values(btns).forEach(b => div.appendChild(b));
    div.appendChild(lbl);
    document.querySelector('.sketch-col')?.appendChild(div);
  };

  function unitBallVertex(t, n) {
    let r;
    const ct = Math.cos(t), st = Math.sin(t);
    if (n === 'L1') {
      r = 1 / (Math.abs(ct) + Math.abs(st));
    } else if (n === 'L∞') {
      r = 1 / Math.max(Math.abs(ct), Math.abs(st));
    } else {
      r = 1 / Math.sqrt(ct * ct + st * st);
    }
    return { x: r * ct, y: r * st };
  }

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    const scl = 140;

    p.stroke('#1a1f2b'); p.strokeWeight(0.5);
    for (let i = -6; i <= 6; i++) { p.line(i * 40, -200, i * 40, 200); p.line(-200, i * 40, 200, i * 40); }

    p.noFill(); p.stroke('#30363d'); p.strokeWeight(1.5);
    p.beginShape();
    for (let a = 0; a < 2 * Math.PI; a += 0.04) {
      const v = unitBallVertex(a, norm);
      p.vertex(v.x * scl, v.y * scl);
    }
    p.endShape(p.CLOSE);

    let maxNorm = 0;
    p.noFill(); p.stroke('#58a6ff'); p.strokeWeight(2.5);
    p.beginShape();
    for (let a = 0; a < 2 * Math.PI; a += 0.04) {
      const v = unitBallVertex(a, norm);
      const tx = A[0][0] * v.x + A[0][1] * v.y;
      const ty = A[1][0] * v.x + A[1][1] * v.y;
      p.vertex(tx * scl, ty * scl);
      let nrm;
      if (norm === 'L1') nrm = Math.abs(tx) + Math.abs(ty);
      else if (norm === 'L∞') nrm = Math.max(Math.abs(tx), Math.abs(ty));
      else nrm = Math.sqrt(tx * tx + ty * ty);
      let origUBN;
      if (norm === 'L1') origUBN = Math.abs(v.x) + Math.abs(v.y);
      else if (norm === 'L∞') origUBN = Math.max(Math.abs(v.x), Math.abs(v.y));
      else origUBN = Math.sqrt(v.x * v.x + v.y * v.y);
      if (origUBN > 0.001) {
        const ratio = nrm / origUBN;
        if (ratio > maxNorm) maxNorm = ratio;
      }
    }
    p.endShape(p.CLOSE);

    p.stroke('#f78166'); p.strokeWeight(1.5); p.noFill();
    p.circle(0, 0, maxNorm * scl * 2);

    const pt = unitBallVertex(dragAngle, norm);
    const tpt = { x: A[0][0] * pt.x + A[0][1] * pt.y, y: A[1][0] * pt.x + A[1][1] * pt.y };
    p.stroke('#f78166'); p.strokeWeight(1);
    p.line(pt.x * scl, pt.y * scl, tpt.x * scl, tpt.y * scl);
    p.fill('#f78166'); p.noStroke();
    p.circle(pt.x * scl, pt.y * scl, 10);
    p.circle(tpt.x * scl, tpt.y * scl, 10);

    p.fill('#8b949e'); p.textSize(12);
    p.text('Original ||·|| = 1', -240, -195);
    p.text('A·(unit ball)  (||A|| = ' + maxNorm.toFixed(3) + ')', -240, -180);
    p.text('Operator: A = [[' + A[0][0] + ',' + A[0][1] + '],[' + A[1][0] + ',' + A[1][1] + ']]', -240, -165);
  };

  p.mousePressed = () => {
    const mx = p.mouseX - p.width / 2, my = p.mouseY - p.height / 2;
    const pt = unitBallVertex(dragAngle, norm);
    if (p.dist(mx, my, pt.x * 140, pt.y * 140) < 14) dragging = true;
  };
  p.mouseReleased = () => { dragging = false; };
  p.mouseDragged = () => {
    if (dragging) {
      const mx = p.mouseX - p.width / 2, my = p.mouseY - p.height / 2;
      dragAngle = Math.atan2(my, mx);
      if (dragAngle < 0) dragAngle += 2 * Math.PI;
    }
  };
};
new p5(s);
