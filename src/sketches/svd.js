// SVD — circle -> rotate(VT) -> scale(Sigma) -> rotate(U) = ellipse
import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let a = 3, b = 1, c = 0.5, d = 2;
  let dragAngle = 0;
  let dragging = false;
  let showSteps = true;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 480).parent('p5canvas');
    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:4px 0';
    [['a', 3], ['b', 1], ['c', 0.5], ['d', 2]].forEach(([name, val]) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'font-size:0.78em;color:#8b949e';
      wrap.textContent = name + ':';
      const span = document.createElement('span');
      span.style.color = '#58a6ff'; span.textContent = val.toFixed(1);
      wrap.appendChild(span);
      const sl = document.createElement('input');
      sl.type = 'range'; sl.min = '-4'; sl.max = '4'; sl.step = '0.1'; sl.value = val;
      sl.style.cssText = 'width:65px;accent-color:#58a6ff;margin-left:4px';
      sl.addEventListener('input', () => {
        const v = parseFloat(sl.value);
        if (name === 'a') a = v; if (name === 'b') b = v;
        if (name === 'c') c = v; if (name === 'd') d = v;
        span.textContent = v.toFixed(1);
      });
      wrap.appendChild(sl); slRow.appendChild(wrap);
    });
    document.querySelector('.sketch-col')?.appendChild(slRow);

    const btn = document.createElement('button');
    btn.textContent = '切换步长叠加';
    btn.style.cssText = 'font-size:0.75em;background:#21262d;color:#8b949e;border:1px solid #30363d;border-radius:4px;padding:2px 8px;cursor:pointer';
    btn.addEventListener('click', () => { showSteps = !showSteps; });
    document.querySelector('.sketch-col')?.appendChild(btn);

    p.mousePressed = () => {
      const cx = p.mouseX - p.width / 2, cy = -(p.mouseY - p.height / 2);
      if (p.dist(cx, cy, 0, 0) < 80) dragging = true;
    };
    p.mouseReleased = () => { dragging = false; };
    p.mouseDragged = () => {
      if (!dragging) return;
      const cx = p.mouseX - p.width / 2, cy = -(p.mouseY - p.height / 2);
      dragAngle = p.atan2(cy, cx);
    };
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    p.scale(1, -1);
    const sc = 45;

    // Grid
    p.stroke('#1a1f2b'); p.strokeWeight(0.5);
    for (let i = -5; i <= 5; i++) { p.line(i * sc, -5 * sc, i * sc, 5 * sc); p.line(-5 * sc, i * sc, 5 * sc, i * sc); }

    // Compute SVD with drag rotation
    const ca = Math.cos(dragAngle), sa = Math.sin(dragAngle);
    const dra = a * ca + b * sa, drb = -a * sa + b * ca;
    const drc = c * ca + d * sa, drd = -c * sa + d * ca;

    const ATA00 = dra * dra + drc * drc, ATA01 = dra * drb + drc * drd, ATA11 = drb * drb + drd * drd;
    const tr = ATA00 + ATA11, detAT = ATA00 * ATA11 - ATA01 * ATA01;
    const disc = tr * tr - 4 * detAT;
    let s1 = 0, s2 = 0, v1x = 1, v1y = 0, u1x = 0, u1y = 0;
    if (disc >= 0) {
      const l1 = (tr + Math.sqrt(disc)) / 2, l2 = Math.max(0, (tr - Math.sqrt(disc)) / 2);
      s1 = Math.sqrt(l1); s2 = Math.sqrt(l2);
      if (Math.abs(ATA01) > 0.001) { v1x = ATA01; v1y = l1 - ATA00; }
      const nv = Math.sqrt(v1x * v1x + v1y * v1y); v1x /= nv; v1y /= nv;
      u1x = (dra * v1x + drb * v1y) / s1;
      u1y = (drc * v1x + drd * v1y) / s1;
    }

    const layers = [
      { name: 'Original circle (input)', color: '#58a6ff', pts: [] },
      { name: 'After V^T rotation', color: '#8b949e', pts: [] },
      { name: 'After Σ scaling', color: '#f78166', pts: [] },
      { name: 'After U rotation (output A)', color: '#ffd33d', pts: [] },
    ];

    for (let t = 0; t <= p.TWO_PI; t += 0.05) {
      const x = Math.cos(t) + Math.cos(t) * 0, y = Math.sin(t);
      layers[0].pts.push([x * sc, y * sc]);
      const rx = v1x * x + v1y * y, ry = -v1y * x + v1x * y;
      layers[1].pts.push([rx * sc, ry * sc]);
      layers[2].pts.push([rx * s1 * sc, ry * s2 * sc]);
      const sx = rx * s1, sy = ry * s2;
      layers[3].pts.push([(u1x * sx - u1y * sy) * sc, (u1y * sx + u1x * sy) * sc]);
    }

    if (showSteps) {
      for (const layer of layers) {
        p.stroke(layer.color);
        if (layer.color === '#8b949e') { p.strokeWeight(1.5); p.drawingContext.setLineDash([3, 3]); }
        else p.strokeWeight(2);
        p.noFill();
        p.beginShape();
        for (const [px, py] of layer.pts) p.vertex(px, py);
        p.endShape(p.CLOSE);
        p.drawingContext.setLineDash([]);
      }
    } else {
      p.stroke('#58a6ff'); p.strokeWeight(2); p.noFill();
      p.beginShape(); for (const [px, py] of layers[0].pts) p.vertex(px, py); p.endShape(p.CLOSE);
      p.stroke('#ffd33d'); p.strokeWeight(2.5); p.noFill();
      p.beginShape(); for (const [px, py] of layers[3].pts) p.vertex(px, py); p.endShape(p.CLOSE);
    }

    // Singular vectors
    p.stroke('#7ee787'); p.strokeWeight(3);
    p.line(0, 0, u1x * s1 * sc, u1y * s1 * sc);

    // Drag handle
    p.fill('#ffd33d'); p.noStroke();
    const hx = Math.cos(dragAngle) * sc * 1.1, hy = Math.sin(dragAngle) * sc * 1.1;
    p.circle(hx, hy, 12);
    p.stroke('#ffd33d'); p.strokeWeight(1.5);
    p.line(0, 0, hx, hy);

    p.scale(1, -1);
    p.fill('#8b949e'); p.noStroke(); p.textSize(13); p.textAlign(p.LEFT, p.TOP);
    p.text('σ₁=' + s1.toFixed(2) + ' σ₂=' + s2.toFixed(2) + '  rank=' + ((s1 > 0.01 ? 1 : 0) + (s2 > 0.01 ? 1 : 0)) + '  cond=' + (s2 > 0.01 ? (s1 / s2).toFixed(1) : '∞'), -5 * sc + 8, -5 * sc + 8);

    // Step labels when overlay is on
    if (showSteps) {
      const lblY = -5 * sc + 26;
      p.fill('#58a6ff'); p.text('◉ Circle', -5 * sc + 8, lblY);
      p.fill('#8b949e'); p.text('◉ Vᵀ', -5 * sc + 110, lblY);
      p.fill('#f78166'); p.text('◉ Σ', -5 * sc + 175, lblY);
      p.fill('#ffd33d'); p.text('◉ U = A', -5 * sc + 225, lblY);
    }

    p.fill('#7ee787'); p.textSize(12);
    p.text('Drag yellow handle to rotate input  |  Green = u₁σ₁', -5 * sc + 8, -5 * sc + 50);
  };
};
new p5(sketch);
