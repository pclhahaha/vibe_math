import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let selectedPoint = -1;
  const nPoints = 12;
  let activeEval = null;

  const sampleFunc = (t) => Math.sin(2 * Math.PI * t) + t * t;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(530, p.windowWidth - 30), 400).parent('p5canvas');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:4px 0';

    const gnsBtn = document.createElement('button');
    gnsBtn.textContent = 'GNS 图';
    gnsBtn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.8em';
    gnsBtn.addEventListener('click', () => {
      activeEval = activeEval === 'gns' ? null : 'gns';
      gnsBtn.style.color = activeEval === 'gns' ? '#7ee787' : '#58a6ff';
    });
    btnRow.appendChild(gnsBtn);

    const hint = document.createElement('span');
    hint.style.cssText = 'color:#484f58;font-size:0.7em;margin-left:4px';
    hint.textContent = '点击谱线上的点求值';
    btnRow.appendChild(hint);

    document.querySelector('.sketch-col')?.appendChild(btnRow);
  };

  p.draw = () => {
    p.background('#0d1117');
    const ox = 35, oy = 30;
    p.translate(ox, oy);
    const w = p.width - ox * 2;
    const h = p.height - oy - 20;

    // Title
    p.fill('#c9d1d9');
    p.textSize(15);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Gelfand Spectrum of C([0,1])', 0, 0);

    // Spectrum line
    const ySpec = h - 120;
    if (activeEval === 'gns') { /* less space for GNS */ }

    p.stroke('#484f58');
    p.strokeWeight(2);
    p.line(0, ySpec, w, ySpec);

    // Endpoint labels
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text('0', -2, ySpec + 5);
    p.text('1', w + 2, ySpec + 5);
    p.text('Spectrum Ω(C[0,1]) ≅ [0,1]', w / 2, ySpec + 22);

    // Spectrum points
    const mx = p.mouseX - ox;
    const my = p.mouseY - oy;
    let hoverPt = -1;

    for (let i = 0; i <= nPoints; i++) {
      const x = (i / nPoints) * w;
      const isSel = selectedPoint === i;
      const dist = p.dist(mx, my, x, ySpec);

      if (dist < 16) hoverPt = i;

      p.fill(isSel ? '#f78166' : '#58a6ff');
      p.noStroke();
      p.circle(x, ySpec, isSel || dist < 14 ? 13 : 9);

      if (isSel) {
        // Function evaluation graph
        const val = sampleFunc(i / nPoints);
        const graphY = 50;
        const graphH = 80;

        // Graph box
        p.fill('#0d1117');
        p.stroke('#30363d');
        p.strokeWeight(1);
        p.rect(0, graphY, w, graphH, 5);

        // Function curve
        p.stroke('#58a6ff');
        p.strokeWeight(2);
        p.noFill();
        p.beginShape();
        for (let xx = 0; xx <= w; xx += 2) {
          p.vertex(xx, graphY + graphH / 2 - sampleFunc(xx / w) * 30);
        }
        p.endShape();

        // Evaluation point
        p.fill('#f78166');
        p.noStroke();
        p.circle(x, graphY + graphH / 2 - val * 30, 6);

        // Vertical drop line
        p.stroke('#f78166');
        p.strokeWeight(1);
        p.drawingContext.setLineDash([3, 4]);
        p.line(x, graphY + graphH / 2 - val * 30, x, ySpec);
        p.drawingContext.setLineDash([]);

        // Evaluation label
        p.fill('#ffd33d');
        p.textSize(12);
        p.textAlign(p.LEFT, p.TOP);
        p.text(
          'f(' + (i / nPoints).toFixed(2) + ') = ' + val.toFixed(3),
          10,
          graphY + graphH + 6
        );
      }
    }

    // GNS diagram
    if (activeEval === 'gns') {
      const dy = ySpec + 45;
      p.fill('#0d1117');
      p.stroke('#30363d');
      p.strokeWeight(1);
      p.rect(0, dy - 10, w, 75, 5);

      p.fill('#58a6ff');
      p.textSize(12);
      p.textAlign(p.LEFT, p.TOP);
      p.text('GNS Construction', 10, dy);

      p.textSize(11);
      p.fill('#8b949e');
      p.text('State ω → cyclic rep π_ω: A → B(H_ω) with Ω (cyclic vector)', 10, dy + 20);
      p.text('ω(T) = ⟨TΩ, Ω⟩  |  H_ω = completion of A/N_ω', 10, dy + 40);
    }

    // Hover cursor
    if (hoverPt >= 0) {
      p.fill('#ffd33d');
      p.textSize(10);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text('t=' + (hoverPt / nPoints).toFixed(2), (hoverPt / nPoints) * w, ySpec - 10);
    }

    // Bottom caption
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      'Pure states of C([0,1]) ↔ characters ↔ maximal ideals ↔ points of [0,1]',
      0,
      p.height - oy - 20
    );
  };

  p.mouseClicked = () => {
    const ox = 35, oy = 30;
    const w = p.width - ox * 2;
    const h = p.height - oy - 20;
    const ySpec = h - 120;
    const mx = p.mouseX - ox, my = p.mouseY - oy;

    if (Math.abs(my - ySpec) < 20) {
      const t = mx / w;
      if (t >= 0 && t <= 1) {
        let best = 0;
        for (let i = 0; i <= nPoints; i++) {
          if (Math.abs(i / nPoints - t) < Math.abs(best / nPoints - t)) best = i;
        }
        selectedPoint = selectedPoint === best ? -1 : best;
      }
    }
  };
};

new p5(sketch);
