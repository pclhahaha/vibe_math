// Linear Transform — drag sliders, see space deform in real time
import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let a = 3, b = 1, c = 0.5, d = 2;
  let vecX = 1, vecY = 0;
  let draggingVec = false;
  let lastVal = '';

  const circle = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    circle.push({ x: Math.cos(t), y: Math.sin(t) });
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(440, 440).parent('p5canvas');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin:6px 0';
    [
      ['Identity', 1, 0, 0, 1],
      ['Rot90', 0, -1, 1, 0],
      ['ShearX', 1, 1, 0, 1],
      ['Proj', 1, 0, 0, 0],
      ['RefY', -1, 0, 0, 1],
    ].forEach(([name, na, nb, nc, nd]) => {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:2px';
      btn.addEventListener('click', () => {
        a = na; b = nb; c = nc; d = nd;
        const ids = [['sa', a], ['sb', b], ['sc', c], ['sd', d]];
        ids.forEach(([id, v]) => {
          const sl = document.getElementById(id);
          if (sl) sl.value = v;
        });
        const vids = [['va', a], ['vb', b], ['vc', c], ['vd', d]];
        vids.forEach(([id, v]) => {
          const el = document.getElementById(id);
          if (el) el.textContent = v.toFixed(1);
        });
      });
      btnRow.appendChild(btn);
    });
    document.querySelector('.sketch-col')?.appendChild(btnRow);

    const slRow = document.createElement('div');
    slRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:6px 0;align-items:center';
    [['a', 3], ['b', 1], ['c', 0.5], ['d', 2]].forEach(([name, val]) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:3px;font-size:0.78em;color:#8b949e';
      wrap.textContent = name + ':';
      const span = document.createElement('span');
      span.id = 'v' + name;
      span.style.color = '#58a6ff';
      span.textContent = val.toFixed(1);
      wrap.appendChild(span);
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.id = 's' + name;
      sl.min = '-4'; sl.max = '4'; sl.step = '0.1'; sl.value = val;
      sl.style.cssText = 'width:70px;accent-color:#58a6ff;cursor:pointer';
      sl.addEventListener('input', () => {
        const v = parseFloat(sl.value);
        if (name === 'a') a = v;
        if (name === 'b') b = v;
        if (name === 'c') c = v;
        if (name === 'd') d = v;
        span.textContent = v.toFixed(1);
      });
      wrap.appendChild(sl);
      slRow.appendChild(wrap);
    });
    document.querySelector('.sketch-col')?.appendChild(slRow);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    p.scale(1, -1);
    const sc = 65;

    // Grid
    p.stroke('#1a1f2b');
    p.strokeWeight(0.5);
    for (let i = -4; i <= 4; i++) {
      p.line(i * sc, -4 * sc, i * sc, 4 * sc);
      p.line(-4 * sc, i * sc, 4 * sc, i * sc);
    }
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.line(-4 * sc, 0, 4 * sc, 0);
    p.line(0, -4 * sc, 0, 4 * sc);

    // Unit circle
    p.noFill();
    p.stroke('#58a6ff');
    p.strokeWeight(2);
    p.beginShape();
    for (const pt of circle) p.vertex(pt.x * sc, pt.y * sc);
    p.endShape(p.CLOSE);

    // Transformed ellipse
    p.stroke('#f78166');
    p.strokeWeight(2.5);
    p.beginShape();
    for (const pt of circle) p.vertex((a * pt.x + b * pt.y) * sc, (c * pt.x + d * pt.y) * sc);
    p.endShape(p.CLOSE);

    // Basis
    p.stroke('#58a6ff'); p.strokeWeight(3);
    p.line(0, 0, sc, 0); p.line(0, 0, 0, sc);
    p.stroke('#f78166'); p.strokeWeight(3);
    p.line(0, 0, a * sc, c * sc); p.line(0, 0, b * sc, d * sc);

    // Vector v (yellow)
    p.stroke('#ffd33d'); p.strokeWeight(2.5);
    p.line(0, 0, vecX * sc, vecY * sc);
    p.fill('#ffd33d'); p.noStroke(); p.circle(vecX * sc, vecY * sc, 8);

    // Av (pink)
    const ox = a * vecX + b * vecY;
    const oy = c * vecX + d * vecY;
    p.stroke('#f778ba'); p.strokeWeight(3);
    p.line(0, 0, ox * sc, oy * sc);
    p.fill('#f778ba'); p.noStroke(); p.circle(ox * sc, oy * sc, 8);

    // Flip back for text
    p.scale(1, -1);
    const det = a * d - b * c;
    p.fill('#f78166');
    p.noStroke();
    p.textSize(15);
    p.textAlign(p.LEFT, p.TOP);
    // Big, explicit readout of current matrix — if slider works, this changes
    p.text(`A = [[ ${a.toFixed(1)}, ${b.toFixed(1)} ]`, -4 * sc + 10, -4 * sc + 10);
    p.text(`      [ ${c.toFixed(1)}, ${d.toFixed(1)} ]]   det=${det.toFixed(1)}`, -4 * sc + 10, -4 * sc + 30);
  };

  p.mousePressed = () => {
    const sc = 65;
    const mx = (p.mouseX - p.width / 2) / sc;
    const my = -(p.mouseY - p.height / 2) / sc;
    if (Math.abs(mx - vecX) < 0.5 && Math.abs(my - vecY) < 0.5) draggingVec = true;
  };
  p.mouseReleased = () => { draggingVec = false; };
  p.mouseDragged = () => {
    if (!draggingVec) return;
    const sc = 65;
    vecX = p.constrain((p.mouseX - p.width / 2) / sc, -4, 4);
    vecY = p.constrain(-(p.mouseY - p.height / 2) / sc, -4, 4);
  };
};
new p5(sketch);
