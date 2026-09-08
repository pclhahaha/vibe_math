import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let strucConst = 0.5;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(480, 400, p.WEBGL).parent('p5canvas');
    const col = document.querySelector('.sketch-col');

    const mkLbl = (t) => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = 'color:#8b949e;font-size:10px;margin:0 2px 0 8px'; col.appendChild(s); };
    const mkSl = (min, max, step, val, accent, cb) => {
      const sl = document.createElement('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = val;
      sl.style.cssText = `width:100px;accent-color:${accent};margin:2px`;
      sl.addEventListener('input', () => cb(parseFloat(sl.value)));
      col.appendChild(sl);
    };

    mkLbl('Struct.const λ:'); mkSl('0', '1', '0.01', '0.5', '#58a6ff', v => { strucConst = v; });
    mkLbl('(drag to rotate)');
  };

  p.draw = () => {
    p.background('#0d1117');
    p.orbitControl();

    p.noFill(); p.stroke('#1a1f2b'); p.strokeWeight(0.5); p.sphere(140, 24, 16);

    p.stroke('#58a6ff'); p.strokeWeight(3); p.line(0, 0, 0, 130, 0, 0);
    p.stroke('#f78166'); p.strokeWeight(3); p.line(0, 0, 0, 0, 130, 0);
    p.stroke('#7ee787'); p.strokeWeight(3); p.line(0, 0, 0, 0, 0, 130);

    const t = p.frameCount * 0.02;
    p.stroke('#ffd33d'); p.strokeWeight(3);
    const x = 130 * Math.cos(t), y = 130 * strucConst * Math.sin(t);
    p.line(0, 0, 0, x, y, 0);

    const roots = [[1, 0], [-1, 0]];
    for (const [rx, ry] of roots) {
      p.push();
      p.translate(rx * 130, ry * 130, 0);
      p.fill('#f78166'); p.noStroke(); p.sphere(6);
      p.pop();
    }

    p.push();
    p.translate(0, 0, 130 * strucConst);
    p.fill('#ffd33d'); p.noStroke(); p.sphere(5);
    p.pop();

    p.push();
    p.resetMatrix();
    p.translate(-p.width / 2, -p.height / 2);
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#8b949e'); p.textSize(12);
    p.text('[Jx,Jy]=iJz — so(3) Lie algebra (angular momentum)', 12, 12);
    p.text(`λ=${strucConst.toFixed(2)} · Root system: {+α,−α} — irreducible rep of Poincaré`, 12, 32);
    p.pop();
  };
};
new p5(s);
