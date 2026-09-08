import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let pts = [], pts2 = [], rho = 28, x = 0.1, y = 0, z = 0;
  let x2 = 0.1001, y2 = 0, z2 = 0;

  function genTraj(x0, y0, z0, arr) {
    arr.length = 0;
    let xx = x0, yy = y0, zz = z0;
    for (let i = 0; i < 8000; i++) {
      const dx = 10 * (yy - xx), dy = xx * (rho - zz) - yy, dz = xx * yy - 8 * zz / 3;
      xx += dx * 0.008; yy += dy * 0.008; zz += dz * 0.008;
      if (i > 2000) arr.push({ x: xx, y: yy, z: zz });
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 440, p.WEBGL).parent('p5canvas');
    genTraj(x, y, z, pts); genTraj(x2, y2, z2, pts2);
    const col = document.querySelector('.sketch-col');

    const mkLbl = (t) => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = 'color:#8b949e;font-size:10px;margin:0 2px 0 8px'; col.appendChild(s); };
    const mkSl = (min, max, step, val, accent, cb) => {
      const sl = document.createElement('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = val;
      sl.style.cssText = `width:100px;accent-color:${accent};margin:2px`;
      sl.addEventListener('input', () => cb(parseFloat(sl.value)));
      col.appendChild(sl);
    };

    mkLbl('ρ (Rayleigh):'); mkSl('10', '40', '0.5', '28', '#58a6ff', v => { rho = v; genTraj(0.1, 0, 0, pts); genTraj(0.1001, 0, 0, pts2); });
    mkLbl('(drag to rotate)');
  };

  p.draw = () => {
    p.background('#0d1117');
    p.orbitControl();
    p.scale(8);
    p.noFill();

    p.stroke('#58a6ff'); p.strokeWeight(0.5);
    p.beginShape(); for (const pt of pts) p.vertex(pt.x, pt.y, pt.z - 25); p.endShape();

    if (pts2.length > 0) {
      p.stroke('#f78166'); p.strokeWeight(0.5);
      p.beginShape(); for (const pt of pts2) p.vertex(pt.x, pt.y, pt.z - 25); p.endShape();
    }

    p.push();
    p.resetMatrix();
    p.translate(-p.width / 2, -p.height / 2);
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#8b949e'); p.textSize(12);
    p.text(`Lorenz Attractor — Deterministic Chaos (ρ=${rho.toFixed(1)})`, 12, 12);
    p.text('Blue: x₀=0.1  ·  Red: x₀=0.1001  →  Butterfly effect', 12, 34);
    p.text('Δx₀=0.0001 → trajectories diverge exponentially (λ>0)', 12, 56);
    p.pop();
  };
};
new p5(sketch);
