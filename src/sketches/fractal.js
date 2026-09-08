import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let cx = -0.5, cy = 0, zoom = 1.2;
  let needsRedraw = true;
  let graphicBuffer = null;
  let dragging = false, dragStartX = 0, dragStartY = 0;
  let dragCx = 0, dragCy = 0;
  let recomputeTimeout = null;

  function computeMandelbrot() {
    const w = p.width, h = p.height;
    if (!graphicBuffer) {
      graphicBuffer = p.createGraphics(w, h);
      graphicBuffer.pixelDensity(1);
    }
    graphicBuffer.loadPixels();
    const maxIter = p.constrain(Math.floor(50 + 100 / (1 + Math.log2(1 / zoom + 1))), 60, 200);

    for (let px = 0; px < w; px++) {
      for (let py = 0; py < h; py++) {
        const x0 = p.map(px, 0, w, cx - zoom, cx + zoom);
        const y0 = p.map(py, 0, h, cy - zoom * (h / w), cy + zoom * (h / w));
        let x = 0, y = 0, iter = 0;
        while (x * x + y * y <= 4 && iter < maxIter) {
          const xt = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xt;
          iter++;
        }
        const idx = 4 * (py * w + px);
        if (iter === maxIter) {
          graphicBuffer.pixels[idx] = 5;
          graphicBuffer.pixels[idx + 1] = 2;
          graphicBuffer.pixels[idx + 2] = 10;
        } else {
          const t = iter / (maxIter * 0.6);
          graphicBuffer.pixels[idx] = p.constrain(20 + 60 * t, 0, 255);
          graphicBuffer.pixels[idx + 1] = p.constrain(8 + 200 * t * t, 0, 255);
          graphicBuffer.pixels[idx + 2] = p.constrain(40 + 180 * t, 0, 255);
        }
        graphicBuffer.pixels[idx + 3] = 255;
      }
    }
    graphicBuffer.updatePixels();
    needsRedraw = false;
  }

  p.setup = () => {
    const c = p.createCanvas(Math.min(520, p.windowWidth - 50), Math.min(450, p.windowWidth - 50));
    c.parent('p5canvas');
    p.pixelDensity(1);
    computeMandelbrot();

    // Zoom slider
    const slWrap = document.createElement('div');
    slWrap.style.cssText = 'display:flex;align-items:center;gap:6px;margin:4px 0';
    const slLabel = document.createElement('span');
    slLabel.textContent = 'Zoom:';
    slLabel.style.cssText = 'color:#8b949e;font-size:0.78em';
    slWrap.appendChild(slLabel);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0.002';
    sl.max = '2.5';
    sl.step = '0.001';
    sl.value = String(zoom);
    sl.style.cssText = 'width:140px;accent-color:#58a6ff';
    sl.addEventListener('input', () => {
      zoom = parseFloat(sl.value);
      needsRedraw = true;
      if (recomputeTimeout) clearTimeout(recomputeTimeout);
      recomputeTimeout = setTimeout(() => computeMandelbrot(), 200);
    });
    slWrap.appendChild(sl);
    const slVal = document.createElement('span');
    slVal.style.cssText = 'color:#58a6ff;font-size:0.75em;min-width:50px';
    slVal.textContent = zoom.toFixed(3);
    slWrap.appendChild(slVal);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '重置';
    resetBtn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 12px;border-radius:6px;cursor:pointer;margin:0 4px;font-size:0.78em';
    resetBtn.addEventListener('click', () => {
      cx = -0.5; cy = 0; zoom = 1.2;
      sl.value = '1.2';
      slVal.textContent = '1.200';
      needsRedraw = true;
      if (recomputeTimeout) clearTimeout(recomputeTimeout);
      computeMandelbrot();
    });
    slWrap.appendChild(resetBtn);
    document.querySelector('.sketch-col')?.appendChild(slWrap);

    // Store slider references
    p._zoomSlider = sl;
    p._zoomLabel = slVal;
  };

  p.draw = () => {
    p.background('#0d1117');

    // If computed, draw the cached graphic buffer
    if (graphicBuffer && !needsRedraw) {
      p.image(graphicBuffer, 0, 0);
    } else if (needsRedraw) {
      // While computing, show a text indicator
      p.fill('#8b949e');
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('Computing...', p.width / 2, p.height / 2);
    }

    // Zoom level indicator
    const magLevel = Math.log2(1.2 / zoom).toFixed(1);
    p.fill('#8b949e');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Mandelbrot  |  Zoom: ' + zoom.toFixed(3) + '  |  Mag: ' + (magLevel >= 0 ? '+' + magLevel : magLevel), 10, 8);
    p.text('Scroll=zoom  |  Drag=pan  |  Hausdorff dim(boundary) = 2', 10, 26);

    // Crosshair at center
    p.stroke('#ffd33d');
    p.strokeWeight(0.5);
    p.drawingContext.setLineDash([3, 6]);
    p.line(p.width / 2, 0, p.width / 2, p.height);
    p.line(0, p.height / 2, p.width, p.height / 2);
    p.drawingContext.setLineDash([]);
    p.fill('#ffd33d');
    p.textSize(10);
    p.text('c=' + cx.toFixed(4) + '+' + cy.toFixed(4) + 'i', p.width / 2 + 6, p.height / 2 + 4);
  };

  p.mouseWheel = (e) => {
    e.preventDefault();
    // Zoom toward cursor position
    const factor = e.delta > 0 ? 1.4 : 1 / 1.4;
    const mx = p.map(p.mouseX, 0, p.width, cx - zoom, cx + zoom);
    const my = p.map(p.mouseY, 0, p.height, cy - zoom * (p.height / p.width), cy + zoom * (p.height / p.width));
    zoom *= factor;
    zoom = p.constrain(zoom, 0.001, 2.5);
    cx = mx + (cx - mx) / factor;
    cy = my + (cy - my) / factor;
    needsRedraw = true;
    if (p._zoomSlider) { p._zoomSlider.value = zoom; }
    if (p._zoomLabel) { p._zoomLabel.textContent = zoom.toFixed(3); }
    if (recomputeTimeout) clearTimeout(recomputeTimeout);
    recomputeTimeout = setTimeout(() => computeMandelbrot(), 150);
    return false;
  };

  p.mousePressed = () => {
    dragging = true;
    dragStartX = p.mouseX;
    dragStartY = p.mouseY;
    dragCx = cx;
    dragCy = cy;
  };

  p.mouseReleased = () => {
    dragging = false;
    // Recompute at full quality after panning stops
    if (needsRedraw) {
      if (recomputeTimeout) clearTimeout(recomputeTimeout);
      computeMandelbrot();
    }
  };

  p.mouseDragged = () => {
    if (!dragging) return;
    const dx = p.mouseX - dragStartX;
    const dy = p.mouseY - dragStartY;
    const scale = (2 * zoom) / p.width;
    cx = dragCx - dx * scale;
    cy = dragCy - dy * scale * (p.height / p.width);
    needsRedraw = true;
    if (recomputeTimeout) clearTimeout(recomputeTimeout);
    recomputeTimeout = setTimeout(() => computeMandelbrot(), 300);
  };
};

new p5(sketch);
