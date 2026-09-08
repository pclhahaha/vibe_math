import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let theta = 0.3;
  let selComponent = 0;
  let hoverX = -1, hoverY = -1;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(530, p.windowWidth - 40), 420).parent('p5canvas');
    const col = document.querySelector('.sketch-col');

    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0'; sl.max = '1'; sl.step = '0.01'; sl.value = '0.3';
    sl.style.cssText = 'width:140px;accent-color:#58a6ff;margin:4px 6px';
    const lbl = document.createElement('span');
    lbl.id = 'nc-lbl'; lbl.style.cssText = 'color:#8b949e;font-size:0.78em';
    lbl.textContent = '\u03b8 = 0.30';
    sl.addEventListener('input', () => {
      theta = parseFloat(sl.value);
      lbl.textContent = '\u03b8 = ' + theta.toFixed(2);
    });
    col?.appendChild(sl); col?.appendChild(lbl);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.7em;margin:2px 0 0 4px';
    hint.textContent = '\u03b8=0 \u2192 commutative space  |  \u03b8>0 \u2192 noncommutative (UV = e^{2\u03c0i\u03b8} VU)';
    col?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);

    const R = 110, n = 20;

    // Left: Classical torus
    p.push();
    p.translate(-R - 30, 0);
    p.stroke('#58a6ff'); p.strokeWeight(0.6); p.noFill();
    for (let i = 0; i <= n; i++) {
      const x = p.map(i, 0, n, -R / 2, R / 2);
      p.beginShape();
      for (let j = 0; j <= n; j++) { p.vertex(x, p.map(j, 0, n, -R / 2, R / 2)); }
      p.endShape();
    }
    for (let j = 0; j <= n; j++) {
      const y = p.map(j, 0, n, -R / 2, R / 2);
      p.beginShape();
      for (let i = 0; i <= n; i++) { p.vertex(p.map(i, 0, n, -R / 2, R / 2), y); }
      p.endShape();
    }
    if (selComponent === 0) {
      p.stroke('#ffd33d'); p.strokeWeight(2); p.noFill();
      p.rect(-R / 2, -R / 2, R, R);
    }
    p.fill('#58a6ff'); p.textSize(13); p.textAlign(p.CENTER, p.TOP);
    p.text('Classical Torus', 0, R / 2 + 10);
    p.fill('#8b949e'); p.textSize(11);
    p.text('points \u00d7 points', 0, R / 2 + 30);
    p.text('(commutative algebra)', 0, R / 2 + 46);
    p.pop();

    // Right: Noncommutative torus A_\u03b8
    p.push();
    p.translate(R + 30, 0);

    if (theta < 0.01) {
      p.stroke('#f78166'); p.strokeWeight(0.6); p.noFill();
      for (let i = 0; i <= n; i++) {
        const x = p.map(i, 0, n, -R / 2, R / 2);
        p.beginShape();
        for (let j = 0; j <= n; j++) { p.vertex(x, p.map(j, 0, n, -R / 2, R / 2)); }
        p.endShape();
      }
      for (let j = 0; j <= n; j++) {
        const y = p.map(j, 0, n, -R / 2, R / 2);
        p.beginShape();
        for (let i = 0; i <= n; i++) { p.vertex(p.map(i, 0, n, -R / 2, R / 2), y); }
        p.endShape();
      }
    } else {
      for (let i = 0; i <= n; i++) {
        for (let j = 0; j <= n; j++) {
          const x = p.map(i, 0, n, -R / 2, R / 2);
          const y = p.map(j, 0, n, -R / 2, R / 2);
          const smear = theta * 20 + 2;
          const alpha = p.map(theta, 0, 1, 200, 40);
          p.fill(248, 113, 102, alpha); p.noStroke();
          p.circle(x, y, smear * 2);
          const wave = Math.sin(x * 0.3 + p.frameCount * 0.02) * Math.cos(y * 0.4 + theta * 10);
          if (Math.abs(wave) > 0.7) {
            p.fill(255, 221, 61, 80);
            p.circle(x, y, smear * 0.6);
          }
        }
      }
    }

    if (selComponent >= 1) {
      p.stroke('#ffd33d'); p.strokeWeight(2); p.noFill();
      p.rect(-R / 2, -R / 2, R, R);
    }

    p.stroke('#ffd33d'); p.strokeWeight(2);
    p.drawingContext.setLineDash([3, 4]); p.noFill();
    p.circle(0, 0, 25);
    p.drawingContext.setLineDash([]);

    p.fill('#f78166'); p.textSize(13); p.textAlign(p.CENTER, p.TOP);
    p.text('Noncommutative Torus A_\u03b8', 0, R / 2 + 10);
    p.fill('#ffd33d'); p.textSize(11);
    p.text('UV = e^{2\u03c0i\u03b8} VU', 0, R / 2 + 30);
    p.fill('#8b949e');
    p.text('\u03b8 = ' + theta.toFixed(2) + (theta > 0.01 ? ' (points do not exist!)' : ' (\u2248 classical)'), 0, R / 2 + 48);
    p.pop();

    // Hover tooltip on NC torus
    if (hoverX >= 0) {
      const rx = hoverX - (p.width / 2 + R + 30);
      const ry = hoverY - (p.height / 2);
      if (rx > -R / 2 && rx < R / 2 && ry > -R / 2 && ry < R / 2) {
        p.fill('#21262d'); p.stroke('#58a6ff'); p.strokeWeight(1);
        const tx = p.width / 2 + R + 30 + rx;
        const ty = p.height / 2 + ry - 40;
        p.rect(tx - 65, ty, 130, 35, 4);
        p.fill('#c9d1d9'); p.textSize(11); p.textAlign(p.CENTER, p.TOP); p.noStroke();
        const phase = Math.exp(2 * Math.PI * theta * rx * ry * 0.001);
        p.text('U(' + rx.toFixed(0) + ')V(' + ry.toFixed(0) + ')', tx, ty + 4);
        p.fill('#58a6ff'); p.textSize(10);
        p.text('= e^{2\u03c0i\u03b8} VU  (\u03c4 = ' + phase.toFixed(3) + ')', tx, ty + 18);
      }
    }

    // Bottom: spectral triple info
    p.fill('#0d1117'); p.stroke('#30363d'); p.strokeWeight(1);
    p.rect(-p.width / 2 + 10, p.height / 2 - 70, p.width - 20, 60, 6);

    p.fill('#c9d1d9'); p.textSize(13); p.textAlign(p.LEFT, p.TOP);
    const components = [
      'Algebra A = C\u221e(T\u00b2_\u03b8)  \u25c0 click',
      'Hilbert space H = L\u00b2-spinors \u25c0 click',
      'Dirac operator D \u25c0 click'
    ];
    const selText = selComponent === 0 ? components[0] : selComponent === 1 ? components[1] : components[2];
    const selColor = selComponent === 0 ? '#58a6ff' : selComponent === 1 ? '#f78166' : '#7ee787';
    p.fill(selColor);
    p.text('Spectral Triple (' + (['A', 'H', 'D'][selComponent]) + ' selected)', -p.width / 2 + 20, p.height / 2 - 62);

    p.fill('#8b949e'); p.textSize(11);
    p.text('Click below to explore components | Hover NC torus for state eval', -p.width / 2 + 20, p.height / 2 - 44);
    p.text(
      'Connes: Standard Model = spectral triple \u2192 Higgs emerges from geometry',
      -p.width / 2 + 20, p.height / 2 - 28
    );

    // Component buttons drawn on canvas
    p.fill(selComponent === 0 ? '#58a6ff' : '#21262d');
    p.noStroke(); p.rect(-p.width / 2 + 20, p.height / 2 - 18, 100, 14, 3);
    p.fill(selComponent === 0 ? '#0d1117' : '#8b949e'); p.textSize(10);
    p.text('Algebra A', -p.width / 2 + 25, p.height / 2 - 15);

    p.fill(selComponent === 1 ? '#f78166' : '#21262d');
    p.noStroke(); p.rect(-p.width / 2 + 130, p.height / 2 - 18, 100, 14, 3);
    p.fill(selComponent === 1 ? '#0d1117' : '#8b949e');
    p.text('Hilbert H', -p.width / 2 + 135, p.height / 2 - 15);

    p.fill(selComponent === 2 ? '#7ee787' : '#21262d');
    p.noStroke(); p.rect(-p.width / 2 + 240, p.height / 2 - 18, 100, 14, 3);
    p.fill(selComponent === 2 ? '#0d1117' : '#8b949e');
    p.text('Dirac D', -p.width / 2 + 245, p.height / 2 - 15);

    p.stroke('#30363d'); p.strokeWeight(1);
  };

  p.mouseClicked = () => {
    const bw = 100, bh = 14, bx = -p.width / 2, by = p.height / 2 - 18;
    const mx = p.mouseX - p.width / 2;
    const my = p.mouseY - p.height / 2;
    if (my > by && my < by + bh) {
      if (mx > 20 && mx < 120) { selComponent = 0; return false; }
      if (mx > 130 && mx < 230) { selComponent = 1; return false; }
      if (mx > 240 && mx < 340) { selComponent = 2; return false; }
    }
    return true;
  };

  p.mouseMoved = () => {
    hoverX = p.mouseX; hoverY = p.mouseY;
  };
};

new p5(sketch);
