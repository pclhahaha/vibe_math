import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let scaleL = 1, selL = 400;
  const tempMap = [];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 400).parent('p5canvas');
    for (let i = 0; i < 500; i++) tempMap.push((Math.random() - 0.5) * 2e-5);
    const col = document.querySelector('.sketch-col');

    const mkLbl = (t) => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = 'color:#8b949e;font-size:10px;margin:0 2px 0 8px'; col.appendChild(s); };
    const mkSl = (min, max, step, val, accent, cb) => {
      const sl = document.createElement('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = val;
      sl.style.cssText = `width:100px;accent-color:${accent};margin:2px`;
      sl.addEventListener('input', () => cb(parseFloat(sl.value)));
      col.appendChild(sl);
    };

    mkLbl('Ang.scale:'); mkSl('0.3', '3', '0.05', '1', '#58a6ff', v => { scaleL = v; });
    mkLbl('ℓ (multipole):'); mkSl('2', '1000', '10', '400', '#f78166', v => { selL = v; });
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(50, 30); const w = p.width - 100, h = 200;
    p.stroke('#1a1f2b'); p.strokeWeight(0.5); p.line(0, h, w, h);
    for (let i = 0; i <= 10; i++) p.line(i * w / 10, 0, i * w / 10, h);

    p.noFill(); p.stroke('#58a6ff'); p.strokeWeight(2.5); p.beginShape();
    for (let lx = 0; lx <= w; lx += 2) {
      const l = p.map(lx, 0, w, 2 * scaleL, 1000 * scaleL);
      let power = 0;
      if (l > 10) { power = 300 * (l / 200) * Math.exp(-(l - 200) * (l - 200) / 30000) + 200 * Math.exp(-(l - 400) * (l - 400) / 20000) + 150 * Math.exp(-(l - 600) * (l - 600) / 15000) + 100 * Math.exp(-(l - 800) * (l - 800) / 12000) + 60 * Math.exp(-(l - 1000) * (l - 1000) / 10000); }
      p.vertex(lx, h - power * h / 600);
    }
    p.endShape();

    const mx = p.mouseX - 50, my = p.mouseY - 30;
    if (mx > 0 && mx < w && my > 0 && my < h) {
      const l = p.map(mx, 0, w, 2 * scaleL, 1000 * scaleL);
      p.stroke('#f78166'); p.strokeWeight(1); p.drawingContext.setLineDash([4, 4]); p.line(mx, 0, mx, h); p.drawingContext.setLineDash([]);
      p.fill('#f78166'); p.noStroke(); p.textSize(10); p.text(`ℓ≈${Math.round(l)}  P≈${(300*(l/200)*Math.exp(-(l-200)*(l-200)/30000)).toFixed(0)} μK²`, mx + 4, my - 4);
    }

    const selX = p.map(selL, 2 * scaleL, 1000 * scaleL, 0, w);
    if (selX > 0 && selX < w) { p.stroke('#7ee787'); p.strokeWeight(1.5); p.line(selX, 0, selX, h); }

    const my2 = h + 30;
    p.textSize(10); p.fill('#8b949e'); p.text('ΔT/T map (hover):', 0, my2 - 2);
    for (let i = 0; i < 500 && i < w - 20; i += 2) {
      const v = tempMap[(i + p.frameCount) % tempMap.length];
      const r = v > 0 ? p.map(v, 0, 2e-5, 0, 120) : 0;
      const b = v < 0 ? p.map(v, -2e-5, 0, 0, 120) : 0;
      p.stroke(r, 50, 50 + b); p.strokeWeight(2); p.line(i + 10, my2 + 5, i + 10, my2 + 25);
    }
    if (mx > 10 && mx < w - 10 && p.mouseY > my2 + 5 + 30 && p.mouseY < my2 + 25 + 30) {
      const idx = Math.floor(p.constrain(mx - 10, 0, 498));
      p.fill('#f78166'); p.noStroke(); p.textSize(10); p.text(`ΔT/T = ${(tempMap[idx] * 1e6).toFixed(2)} ×10⁻⁶`, mx, my2 - 2);
    }

    p.fill('#f78166'); p.noStroke(); p.textSize(11);
    p.text('1st peak → flat universe (Ωk=0)', 60, 95); p.text('2nd → baryon density', 170, 140); p.text('3rd → dark matter', 300, 165);
    p.fill('#8b949e'); p.textSize(12);
    p.text('CMB Power Spectrum — T=2.725K, ΔT/T ~ 10⁻⁵ (Planck 2018)', 20, 25);
    p.text(`Angular scale: ×${scaleL.toFixed(1)}  Selected: ℓ=${selL}`, 20, 48);
  };
};
new p5(s);
