import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let sigma = 0.8;
  let extendAnim = 0;
  let showExtend = false;
  let draggingHole = false;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(520, p.windowWidth - 40), 400).parent('p5canvas');

    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0.1'; sl.max = '0.95'; sl.step = '0.01'; sl.value = '0.8';
    sl.style.cssText = 'width:120px;accent-color:#58a6ff;margin:4px 6px';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8b949e;font-size:0.75em';
    lbl.textContent = 'hole size: 0.80';
    sl.addEventListener('input', () => { sigma = parseFloat(sl.value); lbl.textContent = 'hole size: ' + sigma.toFixed(2); });
    document.querySelector('.sketch-col')?.appendChild(sl);
    document.querySelector('.sketch-col')?.appendChild(lbl);

    const btn = document.createElement('button');
    btn.textContent = '显示延拓';
    btn.style.cssText = 'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.82em';
    btn.addEventListener('click', () => { showExtend = !showExtend; extendAnim = 0; });
    document.querySelector('.sketch-col')?.appendChild(btn);
  };

  p.mousePressed = () => {
    const cx = p.width / 2;
    const cy = p.height / 2;
    const holeR = sigma * 140 * 0.55;
    if (p.dist(p.mouseX, p.mouseY, cx - 160, cy) < holeR + 10) {
      draggingHole = true;
    }
  };

  p.mouseReleased = () => { draggingHole = false; };

  p.mouseDragged = () => {
    if (draggingHole) {
      const dx = p.mouseX - (p.width / 2 - 160);
      const dy = p.mouseY - p.height / 2;
      sigma = p.constrain(Math.sqrt(dx * dx + dy * dy) / (140 * 0.55), 0.1, 0.95);
    }
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);
    if (showExtend && extendAnim < 1) extendAnim += 0.02;

    const R = 140;
    const holeR = sigma * R * 0.55;

    p.push();
    p.translate(-160, 0);

    p.stroke('#58a6ff');
    p.strokeWeight(2);
    p.noFill();
    p.circle(0, 0, R);

    p.fill('#f78166');
    p.noStroke();
    p.circle(0, 0, holeR);

    p.stroke('#ffd33d');
    p.strokeWeight(1.5);
    p.noFill();
    for (let r2 = holeR + 5; r2 < R; r2 += 18) {
      p.circle(0, 0, r2 * 1.05);
    }

    p.fill('#f78166');
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('1/z', 0, 0);

    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.CENTER, p.TOP);
    p.text('C¹: Hole blocks extension', 0, R / 2 + 14);
    p.fill('#8b949e');
    p.textSize(11);
    p.text('f = 1/z cannot extend through 0', 0, R / 2 + 34);

    if (draggingHole) {
      p.fill('#ffd33d');
      p.textSize(11);
      p.text('drag hole', 0, -holeR - 14);
    }
    p.pop();

    p.push();
    p.translate(160, 0);

    p.stroke('#7ee787');
    p.strokeWeight(2);
    p.noFill();
    p.circle(0, 0, R);

    const hAlpha = Math.min(extendAnim, 1);
    p.fill(248, 113, 102, p.map(hAlpha, 0, 1, 180, 20));
    p.noStroke();
    p.circle(0, 0, holeR * (1 - hAlpha * 0.7));

    for (let r = 0; r < R; r += 14) {
      const alpha = r < holeR * (1 - hAlpha) ? hAlpha : 1;
      if (alpha < 0.05) continue;
      p.stroke('#7ee787');
      p.strokeWeight(1);
      p.noFill();
      p.circle(0, 0, r);
    }

    if (hAlpha > 0.3) {
      p.fill('#7ee787');
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('extends!', 0, -holeR - 20);
    }

    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Cⁿ (n≥2): Hole filled!', 0, R / 2 + 14);
    p.fill('#8b949e');
    p.textSize(11);
    p.text("Hartogs: codim ≥ 2 singularities removable", 0, R / 2 + 34);
    p.pop();

    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Holomorphic f on Ω\\K extends to Ω when n ≥ 2', 0, p.height / 2 - 12);
    p.text('No isolated singularities in Cⁿ! Drag hole to resize', 0, p.height / 2 + 6);
  };
};

new p5(sketch);
