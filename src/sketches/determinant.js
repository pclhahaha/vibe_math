import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let a = 2, b = 0.5, c = 0.3, d = 1.5;
  let selected = -1; // -1=none, 0=TL, 1=TR, 2=BR, 3=BL

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(460, 460).parent('p5canvas');
    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:4px 0';
    [['a', 2], ['b', 0.5], ['c', 0.3], ['d', 1.5]].forEach(([name, val]) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'font-size:0.78em;color:#8b949e';
      wrap.textContent = name + ':';
      const sp = document.createElement('span');
      sp.style.color = '#58a6ff';
      sp.textContent = val.toFixed(1);
      wrap.appendChild(sp);
      const sl = document.createElement('input');
      sl.type = 'range'; sl.min = '-3'; sl.max = '3'; sl.step = '0.1'; sl.value = val;
      sl.style.cssText = 'width:65px;accent-color:#58a6ff;margin-left:4px';
      sl.addEventListener('input', () => {
        const v = parseFloat(sl.value);
        if (name === 'a') a = v; if (name === 'b') b = v;
        if (name === 'c') c = v; if (name === 'd') d = v;
        sp.textContent = v.toFixed(1);
      });
      wrap.appendChild(sl); slRow.appendChild(wrap);
    });
    document.querySelector('.sketch-col')?.appendChild(slRow);

    p.mousePressed = () => {
      const sc = 50, cx = p.mouseX - p.width / 2, cy = -(p.mouseY - p.height / 2);
      selected = -1;
      const verts = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let i = 0; i < 4; i++) {
        const [vx, vy] = verts[i];
        const px = (a * vx + b * vy) * sc, py = (c * vx + d * vy) * sc;
        if (p.dist(cx, cy, px, py) < 18) { selected = i; break; }
      }
      if (selected === -1) {
        for (let i = 0; i < 4; i++) {
          const [vx, vy] = verts[i];
          const px = vx * sc, py = vy * sc;
          if (p.dist(cx, cy, px, py) < 15) { selected = i; break; }
        }
      }
    };
    p.mouseReleased = () => { selected = -1; };
    p.mouseDragged = () => {
      if (selected < 0) return;
      const sc = 50, cx = p.mouseX - p.width / 2, cy = -(p.mouseY - p.height / 2);
      const target = [[-1, -1], [1, -1], [1, 1], [-1, 1]][selected];
      const oa = a, ob = b, oc = c, od = d;
      const det = oa * od - ob * oc;
      if (Math.abs(det) < 0.01) return;
      const invA = od / det, invB = -ob / det, invC = -oc / det, invD = oa / det;
      const tx = invA * cx / sc + invB * cy / sc - target[0];
      const ty = invC * cx / sc + invD * cy / sc - target[1];
      // Adjust a,b,c,d so that target vertex maps to mouse
      if (selected === 0) { a += tx; c += ty; }
      else if (selected === 1) { b += tx; d += ty; }
      else if (selected === 2) { a += tx; b += tx; c += ty; d += ty; }
      else { a += tx; b += tx; c += ty; d += ty; }
    };
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    p.scale(1, -1);
    const sc = 50;
    const det = a * d - b * c;

    // Grid
    p.stroke('#1a1f2b'); p.strokeWeight(0.5);
    for (let i = -5; i <= 5; i++) { p.line(i * sc, -5 * sc, i * sc, 5 * sc); p.line(-5 * sc, i * sc, 5 * sc, i * sc); }

    // Unit square
    p.stroke('#58a6ff'); p.strokeWeight(3); p.noFill();
    p.beginShape();
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) p.vertex(cx * sc, cy * sc);
    p.endShape(p.CLOSE);

    // Transformed parallelogram
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    p.stroke('#f78166'); p.strokeWeight(3);
    p.fill(248, 113, 102, 30);
    p.beginShape();
    const tverts = [];
    for (const [cx, cy] of corners) {
      const tx = a * cx + b * cy, ty = c * cx + d * cy;
      tverts.push([tx * sc, ty * sc]);
      p.vertex(tx * sc, ty * sc);
    }
    p.endShape(p.CLOSE);

    // Eigenvector directions
    const tr = a + d;
    const detM = a * d - b * c;
    const disc = tr * tr - 4 * detM;
    if (disc >= 0) {
      const l1 = (tr + Math.sqrt(disc)) / 2, l2 = (tr - Math.sqrt(disc)) / 2;
      const drawEigen = (lambda) => {
        const vx = b, vy = lambda - a;
        const n = Math.sqrt(vx * vx + vy * vy);
        if (n < 0.001) return;
        const ex = vx / n, ey = vy / n;
        const exT = (a * ex + b * ey) * sc, eyT = (c * ex + d * ey) * sc;
        const len = Math.sqrt(exT * exT + eyT * eyT);
        if (len < 1) return;
        p.stroke('#7ee787'); p.strokeWeight(3);
        p.line(0, 0, exT * (sc * 2.5) / len, eyT * (sc * 2.5) / len);
        p.stroke('#7ee787', 80); p.strokeWeight(1);
        p.line(0, 0, ex * sc * 2.5, ey * sc * 2.5);
        p.fill('#7ee787'); p.noStroke();
        const lx = exT * (sc * 2.7) / len, ly = eyT * (sc * 2.7) / len;
        p.textSize(11); p.text('λ=' + lambda.toFixed(2), lx, ly);
      };
      drawEigen(l1);
      if (disc > 0.001) drawEigen(l2);
    }

    // Draggable handles on transformed corners
    for (let i = 0; i < 4; i++) {
      p.fill(selected === i ? '#ffd33d' : '#f78166');
      p.noStroke();
      p.circle(tverts[i][0], tverts[i][1], selected === i ? 16 : 10);
    }

    p.scale(1, -1);
    const area = Math.abs(det);
    p.fill('#8b949e'); p.noStroke(); p.textSize(15); p.textAlign(p.LEFT, p.TOP);
    p.text('det=' + det.toFixed(2) + '  Area ratio=|det|=' + area.toFixed(2) + '  Rank=' + (area < 0.01 ? 1 : 2), -5 * sc + 8, -5 * sc + 8);
    p.text(det === 0 ? 'SINGULAR — collapsed' : 'Invertible', -5 * sc + 8, -5 * sc + 26);
    p.fill('#7ee787'); p.textSize(12);
    p.text('Green = eigenvector directions  |  Drag orange corners', -5 * sc + 8, -5 * sc + 44);
  };
};
new p5(sketch);
