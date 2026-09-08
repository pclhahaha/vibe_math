import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let paths = [], speed = 3, temp = 1, t = 0;
  const maxSteps = 400, n0 = 15;

  function genPath(sx, sy) {
    const path = [{ x: sx, y: sy }];
    let x = sx, y = sy;
    for (let s = 0; s < maxSteps; s++) {
      x += (Math.random() - 0.5) * 12 * temp;
      y += (Math.random() - 0.5) * 12 * temp;
      path.push({ x, y });
    }
    return path;
  }

  function regen() { paths = []; for (let i = 0; i < n0; i++) paths.push(genPath(250, 200)); t = 0; }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    const cnv = p.createCanvas(500, 400).parent('p5canvas');
    regen();
    const col = document.querySelector('.sketch-col');

    const mkLbl = (t, c) => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = 'color:#8b949e;font-size:10px;margin:0 2px 0 8px'; col.appendChild(s); };
    const mkSl = (min, max, step, val, accent, cb) => {
      const sl = document.createElement('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = val;
      sl.style.cssText = `width:100px;accent-color:${accent};margin:2px`;
      sl.addEventListener('input', () => cb(parseFloat(sl.value)));
      col.appendChild(sl);
    };

    mkLbl('Speed:', '#58a6ff'); mkSl('0.5', '10', '0.5', '3', '#58a6ff', v => { speed = v; });
    mkLbl('Temp:', '#f78166'); mkSl('0.2', '3', '0.1', '1', '#f78166', v => { temp = v; regen(); });

    p.mousePressed = () => { if (p.mouseX > 0 && p.mouseX < 500 && p.mouseY > 0 && p.mouseY < 400) paths.push(genPath(p.mouseX, p.mouseY)); };
  };

  p.draw = () => {
    p.background('#0d1117');
    t = Math.min(t + speed, maxSteps);
    const ti = Math.floor(t);
    for (let i = 0; i < paths.length; i++) {
      p.noFill(); p.stroke(i === 0 ? '#58a6ff' : '#1a1f2b'); p.strokeWeight(i === 0 ? 3 : 0.5);
      p.beginShape(); for (let s = 0; s <= ti && s < paths[i].length; s++) p.vertex(paths[i][s].x, paths[i][s].y); p.endShape();
    }
    p.fill('#8b949e'); p.textSize(11);
    p.text(`Brownian Motion — T=${temp.toFixed(1)}  <x²>=2Dt  Click canvas to add particles`, 20, 22);
    p.text(`Paths: ${paths.length}  Step: ${ti}/${maxSteps}  Speed: ×${speed}`, 20, 40);
  };
};
new p5(sketch);
