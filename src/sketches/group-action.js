import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let angle = 0, speed = 0.008, selVert = -1, orbitAng = 0, clickPoint = null;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(460, 420).parent('p5canvas');
    const col = document.querySelector('.sketch-col');

    const mkLbl = (t) => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = 'color:#8b949e;font-size:10px;margin:0 2px 0 8px'; col.appendChild(s); };
    const mkSl = (min, max, step, val, accent, cb) => {
      const sl = document.createElement('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = val;
      sl.style.cssText = `width:100px;accent-color:${accent};margin:2px`;
      sl.addEventListener('input', () => cb(parseFloat(sl.value)));
      col.appendChild(sl);
    };

    mkLbl('Speed:'); mkSl('0', '0.04', '0.001', '0.008', '#58a6ff', v => { speed = v; });
    mkLbl('Param θ:'); mkSl('0', '1', '0.01', '0', '#f78166', v => { orbitAng = v * Math.PI * 2; });

    p.mousePressed = () => {
      const cx = 230, cy = 210;
      const verts = []; for (let i = 0; i < 3; i++) { const a = angle + i * Math.PI * 2 / 3; verts.push({ x: cx + 100 * Math.cos(a), y: cy + 100 * Math.sin(a) }); }
      let found = -1;
      for (let i = 0; i < 3; i++) { const d = p.dist(p.mouseX, p.mouseY, verts[i].x, verts[i].y); if (d < 20) found = i; }
      if (found >= 0) selVert = selVert === found ? -1 : found;
      else { clickPoint = { x: p.mouseX - cx, y: p.mouseY - cy }; selVert = -1; }
    };
  };

  p.draw = () => {
    p.background('#0d1117'); p.translate(230, 210);
    const verts = []; for (let i = 0; i < 3; i++) { const a = angle + i * Math.PI * 2 / 3; verts.push({ x: 100 * Math.cos(a), y: 100 * Math.sin(a) }); }

    if (selVert >= 0) {
      const orbit = []; for (let j = 0; j < 3; j++) { const a = angle + selVert * Math.PI * 2 / 3 + j * Math.PI * 2 / 3; orbit.push({ x: 100 * Math.cos(a), y: 100 * Math.sin(a) }); }
      p.stroke('#f78166'); p.strokeWeight(1); p.drawingContext.setLineDash([3, 5]);
      p.noFill(); p.beginShape(); for (const o of orbit) p.vertex(o.x, o.y); p.endShape(p.CLOSE);
      p.drawingContext.setLineDash([]);
      for (let j = 0; j < 3; j++) { p.fill('#f78166'); p.noStroke(); p.circle(orbit[j].x, orbit[j].y, 10); }
      p.fill('#f78166'); p.textSize(10);
      p.text(`Orbit of ${String.fromCharCode(65 + selVert)}: |Orb|=3`, verts[selVert].x + 12, verts[selVert].y - 18);
    }

    if (clickPoint && selVert < 0) {
      const orbit = []; for (let j = 0; j < 3; j++) {
        const a = Math.atan2(clickPoint.y, clickPoint.x) + orbitAng + j * Math.PI * 2 / 3;
        orbit.push({ x: Math.sqrt(clickPoint.x * clickPoint.x + clickPoint.y * clickPoint.y) * Math.cos(a), y: Math.sqrt(clickPoint.x * clickPoint.x + clickPoint.y * clickPoint.y) * Math.sin(a) });
      }
      p.stroke('#7ee787'); p.strokeWeight(1); p.drawingContext.setLineDash([3, 5]);
      p.noFill(); p.beginShape(); for (const o of orbit) p.vertex(o.x, o.y); p.endShape(p.CLOSE);
      p.drawingContext.setLineDash([]);
      for (const o of orbit) { p.fill('#7ee787'); p.noStroke(); p.circle(o.x, o.y, 7); }
      p.fill('#7ee787'); p.textSize(11); p.text('Orbit of clicked point', clickPoint.x + 8, clickPoint.y + 5);
    }

    p.stroke('#58a6ff'); p.strokeWeight(2.5); p.noFill(); p.beginShape(); for (const v of verts) p.vertex(v.x, v.y); p.endShape(p.CLOSE);
    for (let i = 0; i < 3; i++) {
      p.fill(selVert === i ? '#f78166' : '#c9d1d9'); p.noStroke(); p.textSize(15);
      p.text(String.fromCharCode(65 + i), verts[i].x * 1.15, verts[i].y * 1.15);
    }

    p.fill('#8b949e'); p.textSize(12);
    p.text('D₃ = {e,r,r²,s,sr,sr²}  |D₃|=6  |Orb(x)|·|Stab(x)|=|G|', -210, -185);
    p.text(`Click vertices/points → see orbits  Θ=${(orbitAng/Math.PI).toFixed(2)}π`, -210, -165);
    angle += speed;
  };
};
new p5(s);
