import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let dragging = false, dragX = 0, dragY = 0;
  let showTransform = true;
  let points = [{ x: 0.3, y: 0.8 }]; // point in upper half-plane (Im > 0)
  let selectedPt = -1;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(540, p.windowWidth - 40), 460).parent('p5canvas');

    const btn = document.createElement('button');
    btn.textContent = '添加点';
    btn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.82em';
    btn.addEventListener('click', () => {
      points.push({ x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.5 });
    });
    document.querySelector('.sketch-col')?.appendChild(btn);

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '清除';
    clearBtn.style.cssText =
      'background:#161b22;color:#f78166;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:4px;font-size:0.82em';
    clearBtn.addEventListener('click', () => { points = []; });
    document.querySelector('.sketch-col')?.appendChild(clearBtn);
  };

  // SL(2,Z) generators: S: τ → -1/τ, T: τ → τ+1
  function mobiusS(tau) {
    const d = tau.x * tau.x + tau.y * tau.y;
    return { x: -tau.x / d, y: tau.y / d };
  }
  function mobiusT(tau) {
    return { x: tau.x + 1, y: tau.y };
  }

  p.draw = () => {
    p.background('#0d1117');
    p.translate(60, 40);
    const w = p.width - 100, h = p.height - 80;

    // Clip to upper half-plane region
    const xRange = 1.5;
    function toScreen(z) {
      return { x: w / 2 + (z.x / xRange) * w * 0.38, y: h - (z.y * h * 0.8) };
    }

    // Grid lines (vertical lines at integers)
    for (let n = -2; n <= 2; n++) {
      p.stroke('#141920');
      p.strokeWeight(0.4);
      const sx = w / 2 + (n / xRange) * w * 0.38;
      p.line(sx, 0, sx, h);
    }
    // Horizontal line at y=1, y=0.5 etc
    for (let r = 0.5; r <= 2; r += 0.5) {
      p.stroke('#141920');
      p.strokeWeight(0.3);
      if (r === 1) { p.stroke('#21262d'); p.strokeWeight(0.8); }
      const sy = h - (r * h * 0.8);
      p.line(0, sy, w, sy);
    }

    // Real axis
    p.stroke('#484f58');
    p.strokeWeight(2);
    p.line(0, h, w, h);
    p.fill('#8b949e');
    p.textSize(11);
    p.text('ℝ (real axis)', -40, h + 4);

    // Fundamental domain of SL(2,Z): {|τ| ≥ 1, |Re(τ)| ≤ 1/2}
    p.fill(88, 166, 255, 12);
    p.noStroke();
    p.beginShape();
    const arcR = toScreen({ x: 0, y: 0 });
    // Left boundary: Re = -1/2
    const leftX = w / 2 + (-0.5 / xRange) * w * 0.38;
    const rightX = w / 2 + (0.5 / xRange) * w * 0.38;
    const topY = 0;
    const bottomY = h; // |τ| = 1 arc
    // Arc from exp(iπ/3) to exp(2iπ/3) — semicircle of radius 1
    p.beginShape();
    for (let a = Math.PI / 3; a <= 2 * Math.PI / 3; a += 0.03) {
      const z = { x: Math.cos(a), y: Math.sin(a) };
      const s = toScreen(z);
      p.vertex(s.x, s.y);
    }
    p.vertex(rightX, topY);
    p.vertex(rightX, bottomY);
    p.vertex(leftX, bottomY);
    p.endShape(p.CLOSE);

    // Fundamental domain arc
    p.stroke('#58a6ff');
    p.strokeWeight(2.5);
    p.noFill();
    p.beginShape();
    for (let a = Math.PI / 3; a <= 2 * Math.PI / 3; a += 0.03) {
      const z = { x: Math.cos(a), y: Math.sin(a) };
      const s = toScreen(z);
      p.vertex(s.x, s.y);
    }
    p.endShape();

    // Vertical boundaries
    p.stroke('#58a6ff');
    p.strokeWeight(2);
    p.line(leftX, arcR.y, leftX, topY);
    p.line(rightX, arcR.y, rightX, topY);

    // Label fundamental domain
    p.fill('#58a6ff');
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Fundamental Domain', w * 0.35, h * 0.15);
    p.text('of SL(2,Z)', w * 0.35, h * 0.20);

    // Draw points and their images under S and T
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (pt.y <= 0) continue;
      const s = toScreen(pt);

      // Original point
      p.fill(i === selectedPt ? '#f78166' : '#ffd33d');
      p.noStroke();
      p.circle(s.x, s.y, i === selectedPt ? 10 : 7);

      // T-image: z+1 (shift right)
      if (showTransform) {
        const tImg = mobiusT(pt);
        const ts = toScreen(tImg);
        p.stroke('#f78166');
        p.strokeWeight(1.5);
        p.drawingContext.setLineDash([3, 5]);
        p.line(s.x, s.y, ts.x, ts.y);
        p.drawingContext.setLineDash([]);
        p.fill('#f78166');
        p.noStroke();
        p.circle(ts.x, ts.y, 5);
        p.textSize(11);
        p.text('T(z)', ts.x + 8, ts.y - 4);

        // S-image: -1/z
        const sImg = mobiusS(pt);
        const ss = toScreen(sImg);
        if (sImg.x > -2 && sImg.x < 2 && sImg.y < 2.5) {
          p.stroke('#7ee787');
          p.strokeWeight(1.5);
          p.drawingContext.setLineDash([3, 5]);
          p.line(s.x, s.y, ss.x, ss.y);
          p.drawingContext.setLineDash([]);
          p.fill('#7ee787');
          p.noStroke();
          p.circle(ss.x, ss.y, 5);
          p.textSize(11);
          p.text('S(z)', ss.x + 8, ss.y - 4);
        }
      }
    }

    // Legend
    p.fill('#0d1117');
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(10, 10, 140, 72, 6);
    p.fill('#58a6ff');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('SL(2,Z) = ⟨S, T⟩', 18, 16);
    p.fill('#f78166');
    p.text('T: τ → τ + 1', 18, 32);
    p.fill('#7ee787');
    p.text('S: τ → −1/τ', 18, 48);
    p.fill('#8b949e');
    p.text('S² = (ST)³ = I', 18, 64);
  };

  p.mousePressed = () => {
    const w = p.width - 100, h = p.height - 80;
    const mx = p.mouseX - 60, my = p.mouseY - 40;
    // Check if clicking near a point
    for (let i = 0; i < points.length; i++) {
      const s = { x: w / 2 + (points[i].x / 1.5) * w * 0.38, y: h - (points[i].y * h * 0.8) };
      if (p.dist(mx, my, s.x, s.y) < 15) {
        selectedPt = i;
        dragging = true;
        dragX = mx;
        dragY = my;
        return;
      }
    }
    // Click to add a new point
    const xMap = ((mx - w / 2) / (w * 0.38)) * 1.5;
    const yMap = ((h - my) / (h * 0.8));
    if (yMap > 0 && yMap < 2.5 && xMap > -1.5 && xMap < 1.5) {
      points.push({ x: xMap, y: yMap });
      selectedPt = points.length - 1;
    }
  };

  p.mouseReleased = () => { dragging = false; };
  p.mouseDragged = () => {
    if (!dragging || selectedPt < 0) return;
    const w = p.width - 100, h = p.height - 80;
    const mx = p.mouseX - 60, my = p.mouseY - 40;
    const xMap = Math.max(-1.5, Math.min(1.5, ((mx - w / 2) / (w * 0.38)) * 1.5));
    const yMap = Math.max(0.02, Math.min(2.5, ((h - my) / (h * 0.8))));
    points[selectedPt].x = xMap;
    points[selectedPt].y = yMap;
  };
};

new p5(sketch);
