import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let mode = 0;
  const modeNames = ['e+e- Annihilation', 'Bhabha Scattering', 'Compton', 'Pair Production'];
  let tAnim = 0;
  let hoverIdx = -1;

  // Interactive vertices for each mode: [x, y, label, color, isVertex]
  function getDiagram(m) {
    const cx = 240, cy = 180;
    switch (m) {
      case 0: // e+e- annihilation -> μ+μ-
        return {
          lines: [
            { x1: 40, y1: 0, x2: 120, y2: 120, col: '#58a6ff', label: 'e⁻', lblX: 70, lblY: 50 },
            { x1: 440, y1: 0, x2: 360, y2: 120, col: '#58a6ff', label: 'e⁺', lblX: 400, lblY: 50 },
            { x1: 120, y1: 120, x2: 360, y2: 120, col: '#ffd33d', label: 'γ*/Z⁰', lblX: 230, lblY: 100, dash: true },
            { x1: 120, y1: 120, x2: 40, y2: 240, col: '#f78166', label: 'μ⁻', lblX: 70, lblY: 200 },
            { x1: 360, y1: 120, x2: 440, y2: 240, col: '#f78166', label: 'μ⁺', lblX: 400, lblY: 200 },
          ],
          vtx: [{ x: 120, y: 120, col: '#7ee787' }, { x: 360, y: 120, col: '#7ee787' }],
          timeArrow: { x1: 440, y1: 310, x2: 440, y2: 330 },
        };
      case 1: // Bhabha scattering (e+e- -> e+e-)
        return {
          lines: [
            { x1: 40, y1: 0, x2: 120, y2: 100, col: '#58a6ff', label: 'e⁻', lblX: 70, lblY: 40 },
            { x1: 440, y1: 0, x2: 360, y2: 100, col: '#58a6ff', label: 'e⁺', lblX: 400, lblY: 40 },
            { x1: 120, y1: 100, x2: 240, y2: 180, col: '#58a6ff', label: 'e⁻', lblX: 160, lblY: 140 },
            { x1: 360, y1: 100, x2: 240, y2: 180, col: '#58a6ff', label: 'e⁻', lblX: 310, lblY: 140 },
            { x1: 120, y1: 100, x2: 360, y2: 100, col: '#ffd33d', label: 'γ', lblX: 230, lblY: 80, dash: true },
            { x1: 240, y1: 180, x2: 40, y2: 290, col: '#58a6ff', label: 'e⁻', lblX: 120, lblY: 250 },
            { x1: 240, y1: 180, x2: 440, y2: 290, col: '#58a6ff', label: 'e⁺', lblX: 350, lblY: 250 },
          ],
          vtx: [{ x: 120, y: 100, col: '#7ee787' }, { x: 360, y: 100, col: '#7ee787' }, { x: 240, y: 180, col: '#7ee787' }],
          timeArrow: { x1: 440, y1: 315, x2: 440, y2: 335 },
        };
      case 2: // Compton scattering
        return {
          lines: [
            { x1: 40, y1: 60, x2: 200, y2: 140, col: '#58a6ff', label: 'e⁻', lblX: 110, lblY: 90 },
            { x1: 40, y1: 290, x2: 200, y2: 140, col: '#ffd33d', label: 'γ', lblX: 100, lblY: 240, dash: true },
            { x1: 440, y1: 60, x2: 200, y2: 140, col: '#58a6ff', label: "e⁻'", lblX: 340, lblY: 90 },
            { x1: 440, y1: 290, x2: 200, y2: 140, col: '#ffd33d', label: "γ'", lblX: 320, lblY: 240, dash: true },
          ],
          vtx: [{ x: 200, y: 140, col: '#7ee787' }],
          timeArrow: { x1: 440, y1: 315, x2: 440, y2: 335 },
        };
      case 3: // Pair production
        return {
          lines: [
            { x1: 40, y1: 290, x2: 240, y2: 140, col: '#ffd33d', label: 'γ', lblX: 130, lblY: 240, dash: true },
            { x1: 240, y1: 140, x2: 440, y1: 60, col: '#58a6ff', label: 'e⁻', lblX: 350, lblY: 90 },
            { x1: 240, y1: 140, x2: 440, y1: 290, col: '#58a6ff', label: 'e⁺', lblX: 350, lblY: 240 },
          ],
          vtx: [{ x: 240, y: 140, col: '#7ee787' }],
          timeArrow: { x1: 440, y1: 315, x2: 440, y2: 335 },
        };
      default:
        return { lines: [], vtx: [], timeArrow: { x1: 440, y1: 315, x2: 440, y2: 335 } };
    }
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    const c = p.createCanvas(500, 380);
    c.parent('p5canvas');

    // Mode buttons
    modeNames.forEach((name, i) => {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;margin:3px;font-size:0.78em';
      btn.addEventListener('click', () => {
        mode = i;
        document.querySelectorAll('.sketch-col button').forEach((b, j) => {
          if (j < modeNames.length) b.style.borderColor = j === i ? '#58a6ff' : '#30363d';
        });
      });
      document.querySelector('.sketch-col')?.appendChild(btn);
    });
  };

  p.draw = () => {
    p.background('#0d1117');
    tAnim += 0.03;

    const diag = getDiagram(mode);

    // Time axis
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.line(440, 0, 440, 340);
    p.fill('#484f58');
    p.textSize(10);
    p.text('t →', 410, 18);

    // Draw lines
    diag.lines.forEach((l, i) => {
      if (l.dash) {
        p.drawingContext.setLineDash([5, 5]);
        p.strokeWeight(2);
      } else {
        p.drawingContext.setLineDash([]);
        p.strokeWeight(2.5);
      }
      p.stroke(l.col);
      p.line(l.x1, l.y1, l.x2, l.y2);
      p.drawingContext.setLineDash([]);

      // Animated propagation pulse
      const pulse = (tAnim * 60 + i * 30) % 60;
      const frac = pulse / 60;
      const px = p.lerp(l.x1, l.x2, frac);
      const py = p.lerp(l.y1, l.y2, frac);
      p.fill(l.col);
      p.noStroke();
      p.circle(px, py, 4);

      // Label
      if (l.label) {
        p.fill('#8b949e');
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(l.label, l.lblX, l.lblY);
      }
    });

    // Draw vertices
    diag.vtx.forEach((v, i) => {
      p.stroke(v.col);
      p.strokeWeight(2);
      p.fill('#0d1117');
      const r = 7;
      p.circle(v.x, v.y, r * 2);

      // Glow on hover
      const mx = p.mouseX;
      const my = p.mouseY;
      if (p.dist(mx, my, v.x, v.y) < r + 5) {
        p.noFill();
        p.stroke('#58a6ff');
        p.strokeWeight(1);
        p.circle(v.x, v.y, r * 2 + 8);
        hoverIdx = i;
      }
    });

    // Title
    p.fill('#c9d1d9');
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(modeNames[mode], 20, 20);

    // Info bar
    p.fill('#8b949e');
    p.textSize(12);
    p.text('g-2: QED = experiment to 12 digits | Nobel: Tomonaga, Schwinger, Feynman (1965)', 20, 350);

    // Legend
    p.fill('#58a6ff');
    p.circle(20, 45, 6);
    p.fill('#8b949e');
    p.textSize(10);
    p.text('fermion', 30, 46);
    p.fill('#ffd33d');
    p.circle(85, 45, 6);
    p.fill('#8b949e');
    p.text('boson', 94, 46);
    p.stroke('#7ee787');
    p.strokeWeight(2);
    p.noFill();
    p.circle(150, 45, 12);
    p.fill('#8b949e');
    p.text('vertex (click!)', 160, 46);
  };

  p.mousePressed = () => {
    const diag = getDiagram(mode);
    diag.vtx.forEach((v) => {
      if (p.dist(p.mouseX, p.mouseY, v.x, v.y) < 12) {
        // Cycle to a random mode on vertex click
        mode = (mode + 1) % modeNames.length;
        document.querySelectorAll('.sketch-col button').forEach((b, j) => {
          if (j < modeNames.length) b.style.borderColor = j === mode ? '#58a6ff' : '#30363d';
        });
      }
    });
  };
};

new p5(sketch);
