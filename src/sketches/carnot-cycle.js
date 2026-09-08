import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let Th = 2, Tc = 1, dragPos = 0, dragging = false;
  let showWork = true;
  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 420).parent('p5canvas');
    const col = document.querySelector('.sketch-col');
    ['Th=2', 'Tc=1'].forEach(def => {
      const [n, v] = def.split('=');
      const sl = document.createElement('input');
      sl.type = 'range'; sl.min = '0.5'; sl.max = '3'; sl.step = '0.1'; sl.value = v;
      sl.style.cssText = 'width:100px;accent-color:#58a6ff;margin:4px';
      const lbl = document.createElement('span');
      lbl.style.cssText = 'color:#8b949e;font-size:0.75em;margin:0 8px 0 2px';
      lbl.textContent = n + '=' + v;
      sl.addEventListener('input', () => {
        if (n === 'Th') Th = parseFloat(sl.value);
        else Tc = parseFloat(sl.value);
        lbl.textContent = n + '=' + parseFloat(sl.value).toFixed(1);
      });
      col?.appendChild(sl);
      col?.appendChild(lbl);
    });
    const toggle = document.createElement('button');
    toggle.textContent = '切换工作区';
    toggle.style.cssText = 'background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:4px 10px;border-radius:4px;cursor:pointer;margin:4px;font-size:12px';
    toggle.addEventListener('click', () => { showWork = !showWork; });
    col?.appendChild(toggle);
  };
  p.draw = () => {
    p.background('#0d1117');
    p.translate(40, p.height - 40); p.scale(1, -1);
    const w = p.width - 80, h = p.height - 70;
    p.stroke('#30363d'); p.strokeWeight(0.5);
    for (let i = 0; i <= 6; i++) { p.line(i * w / 6, 0, i * w / 6, h); p.line(0, i * h / 6, w, i * h / 6); }
    const V1 = 0.8, V2 = 1.6, V3 = 1.3, V4 = 0.65;
    const P1 = Th, P2 = Th * V1 / V2, P3 = Tc, P4 = Tc * V4 / V1;
    const eta = 1 - Tc / Th;
    const v1v = V1 * w / 3, v2v = V2 * w / 3, v3v = V3 * w / 3, v4v = V4 * w / 3;
    const p1v = P1 * h / 3, p2v = P2 * h / 3, p3v = P3 * h / 3, p4v = P4 * h / 3;
    const corners = [[v1v, p1v], [v2v, p2v], [v3v, p3v], [v4v, p4v]];

    if (showWork) {
      p.fill('#f7816622'); p.noStroke();
      p.beginShape();
      p.vertex(v1v, p1v); p.vertex(v2v, p2v); p.vertex(v3v, p3v); p.vertex(v4v, p4v);
      p.endShape(p.CLOSE);
      const work = (Th - Tc) * (Math.log(V2 / V1));
      p.fill('#f78166'); p.textSize(12);
      p.text('W = ' + work.toFixed(3), v2v + 8, (p2v + p3v) / 2);
    }

    p.stroke('#58a6ff'); p.strokeWeight(2.5); p.noFill();
    p.beginShape();
    p.vertex(v1v, p1v); p.vertex(v2v, p2v); p.vertex(v3v, p3v); p.vertex(v4v, p4v);
    p.endShape(p.CLOSE);

    const segLengths = [
      p.dist(v1v, p1v, v2v, p2v),
      p.dist(v2v, p2v, v3v, p3v),
      p.dist(v3v, p3v, v4v, p4v),
      p.dist(v4v, p4v, v1v, p1v)
    ];
    const totalLen = segLengths.reduce((a, b) => a + b, 0);
    const segFractions = segLengths.map(l => l / totalLen);
    const cumFracs = [0];
    let cf = 0;
    for (let i = 0; i < 4; i++) { cf += segFractions[i]; cumFracs.push(cf); }

    const getPoint = (t) => {
      const tt = ((t % 1) + 1) % 1;
      let si = 0;
      while (si < 4 && tt > cumFracs[si + 1]) si++;
      const frac = (tt - cumFracs[si]) / segFractions[si];
      const a = corners[si], b = corners[(si + 1) % 4];
      return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
    };

    const pos = dragging ? dragPos : (p.frameCount * 0.005) % 4;
    const segPos = dragging ? pos : ((p.frameCount * 0.005) % 4) / 4;
    const [cx, cy] = getPoint(dragging ? dragPos : segPos);
    p.fill('#f78166'); p.noStroke(); p.circle(cx, cy, 8);
    p.stroke('#ffd33d'); p.strokeWeight(1); p.noFill();
    p.circle(cx, cy, 14);

    p.push(); p.translate(cx + 14, cy + 14); p.scale(1, -1);
    p.fill('#ffd33d'); p.textSize(10); p.text('state', 0, 0);
    p.pop();

    p.scale(1, -1);
    p.fill('#8b949e'); p.textSize(14);
    p.text('η = 1−Tc/Th = ' + eta.toFixed(3), 20, -h - 5);
    p.text('Drag the state point ● along the cycle', 220, -h - 5);
  };
  p.mousePressed = () => {
    const tx = p.mouseX - 40, ty = -(p.mouseY - (p.height - 40));
    const w = p.width - 80, h = p.height - 70;
    const V1 = 0.8, V2 = 1.6, V3 = 1.3, V4 = 0.65;
    const P1 = Th, P2 = Th * V1 / V2, P3 = Tc, P4 = Tc * V4 / V1;
    const corners = [[V1 * w / 3, P1 * h / 3], [V2 * w / 3, P2 * h / 3], [V3 * w / 3, P3 * h / 3], [V4 * w / 3, P4 * h / 3]];
    let minDist = Infinity, bestT = 0;
    for (let t = 0; t < 1; t += 0.001) {
      const seg = Math.floor(t * 4);
      const frac = (t * 4) % 1;
      const a = corners[seg], b = corners[(seg + 1) % 4];
      const px = a[0] + (b[0] - a[0]) * frac;
      const py = a[1] + (b[1] - a[1]) * frac;
      const d = p.dist(tx, ty, px, py);
      if (d < minDist) { minDist = d; bestT = t; }
    }
    if (minDist < 30) { dragging = true; dragPos = bestT; return false; }
    return true;
  };
  p.mouseDragged = () => {
    if (!dragging) return;
    const tx = p.mouseX - 40, ty = -(p.mouseY - (p.height - 40));
    const w = p.width - 80, h = p.height - 70;
    const V1 = 0.8, V2 = 1.6, V3 = 1.3, V4 = 0.65;
    const P1 = Th, P2 = Th * V1 / V2, P3 = Tc, P4 = Tc * V4 / V1;
    const corners = [[V1 * w / 3, P1 * h / 3], [V2 * w / 3, P2 * h / 3], [V3 * w / 3, P3 * h / 3], [V4 * w / 3, P4 * h / 3]];
    let minDist = Infinity, bestT = 0;
    for (let t = 0; t < 1; t += 0.001) {
      const seg = Math.floor(t * 4);
      const frac = (t * 4) % 1;
      const a = corners[seg], b = corners[(seg + 1) % 4];
      const px = a[0] + (b[0] - a[0]) * frac;
      const py = a[1] + (b[1] - a[1]) * frac;
      const d = p.dist(tx, ty, px, py);
      if (d < minDist) { minDist = d; bestT = t; }
    }
    dragPos = bestT;
  };
  p.mouseReleased = () => { dragging = false; };
};
new p5(s);
