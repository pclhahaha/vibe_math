import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let verts = [{ x: 0, y: -70 }, { x: 80, y: -30 }, { x: 60, y: 50 }, { x: -60, y: 50 }];
  let dragIdx = -1;
  let ballR = 20;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 420).parent('p5canvas');

    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = 0; sl.max = 60; sl.value = 20; sl.step = 1;
    sl.style.cssText = 'margin: 6px 8px; vertical-align: middle; width: 120px;';
    const lbl = document.createElement('span');
    lbl.textContent = ' Ball radius: 20';
    lbl.style.cssText = 'color: #8b949e; font-size: 12px;';
    sl.oninput = () => { ballR = parseInt(sl.value); lbl.textContent = ' Ball radius: ' + ballR; };

    const rst = document.createElement('button');
    rst.textContent = '重置';
    rst.style.cssText = 'margin: 6px 8px; padding: 4px 12px; background: #21262d; color: #58a6ff; border: 1px solid #30363d; border-radius: 4px; cursor: pointer; font-size: 12px;';
    rst.onclick = () => { verts = [{ x: -80, y: -60 }, { x: 80, y: -40 }, { x: 60, y: 70 }, { x: -60, y: 50 }]; };

    const div = document.createElement('div');
    div.style.cssText = 'margin: 4px 0;';
    div.appendChild(rst);
    div.appendChild(sl);
    div.appendChild(lbl);
    document.querySelector('.sketch-col')?.appendChild(div);
  };

  function convexHull(pts) {
    if (pts.length <= 2) return pts;
    const sorted = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [];
    for (const pt of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
      lower.push(pt);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const pt = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
      upper.push(pt);
    }
    upper.pop(); lower.pop();
    return lower.concat(upper);
  }

  function polygonArea(poly) {
    let a = 0;
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      a += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
    }
    return Math.abs(a) / 2;
  }

  function perimeter(poly) {
    let perim = 0;
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      perim += p.dist(poly[i].x, poly[i].y, poly[j].x, poly[j].y);
    }
    return perim;
  }

  function drawOffsetPolygon(poly, r) {
    p.noFill(); p.stroke('#f78166'); p.strokeWeight(1.5);
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      const dx = poly[j].x - poly[i].x, dy = poly[j].y - poly[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len, ny = dx / len;
      p.beginShape();
      p.vertex(poly[i].x + nx * r, poly[i].y + ny * r);
      p.vertex(poly[j].x + nx * r, poly[j].y + ny * r);
      p.vertex(poly[j].x - nx * r, poly[j].y - ny * r);
      p.vertex(poly[i].x - nx * r, poly[i].y - ny * r);
      p.endShape(p.CLOSE);
    }
  }

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);

    p.stroke('#1a1f2b'); p.strokeWeight(0.5);
    for (let i = -5; i <= 5; i++) { p.line(i * 50, -200, i * 50, 200); p.line(-200, i * 50, 200, i * 50); }

    const hull = convexHull(verts);
    const area = polygonArea(hull);
    const perim = perimeter(hull);

    const W0 = area;
    const W1 = perim / 2;
    const W2 = Math.PI;

    const areaA = Math.sqrt(area);
    const areaB = Math.sqrt(Math.PI * ballR * ballR);
    const areaAB = Math.sqrt(area + perim * ballR + Math.PI * ballR * ballR);
    const bmHolds = areaAB >= areaA + areaB;

    drawOffsetPolygon(hull, ballR);

    p.stroke('#58a6ff'); p.strokeWeight(2.5); p.noFill();
    p.beginShape();
    for (const v of hull) p.vertex(v.x, v.y);
    p.endShape(p.CLOSE);

    for (let i = 0; i < hull.length; i++) {
      const v = hull[i];
      p.noStroke(); p.fill(i === dragIdx ? '#f78166' : '#58a6ff');
      p.circle(v.x, v.y, 12);
    }

    p.fill('#8b949e'); p.textSize(11);
    p.text('Brunn-Minkowski: vol(A+B)\u00B9\u207F \u2265 vol(A)\u00B9\u207F + vol(B)\u00B9\u207F', -240, -190);
    p.text('\u221Aarea(A+B\u1D63): ' + areaAB.toFixed(1) + '  \u221Aarea(A): ' + areaA.toFixed(1) + '  \u221Aarea(B\u1D63): ' + areaB.toFixed(1), -240, -174);
    p.text('Holds: ' + (bmHolds ? '\u2713 Yes' : '\u2717 No'), -240, -160);
    p.text('Quermassintegrals (2D): W\u2080=' + W0.toFixed(0) + ' (area)  W\u2081=' + W1.toFixed(1) + ' (perim/2)  W\u2082=' + W2.toFixed(2), -240, -144);
    p.text('Area: ' + area.toFixed(0) + ' px\u00B2  Perimeter: ' + perim.toFixed(1) + ' px', -240, -128);
  };

  p.mousePressed = () => {
    const mx = p.mouseX - p.width / 2, my = p.mouseY - p.height / 2;
    for (let i = 0; i < verts.length; i++) {
      if (p.dist(mx, my, verts[i].x, verts[i].y) < 12) { dragIdx = i; return; }
    }
    dragIdx = -1;
  };
  p.mouseReleased = () => { dragIdx = -1; };
  p.mouseDragged = () => {
    if (dragIdx >= 0) {
      verts[dragIdx].x = p.mouseX - p.width / 2;
      verts[dragIdx].y = p.mouseY - p.height / 2;
    }
  };
};
new p5(s);
