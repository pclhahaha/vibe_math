import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  // A simplicial complex: a triangle (2-simplex) with its 3 edges and 3 vertices
  // Chain groups: C_2 = span{triangle}, C_1 = span{edges}, C_0 = span{vertices}
  // ∂_2(triangle) = e1 + e2 + e3, ∂_1(e_i) = v_j - v_i

  const vertices = [
    { x: 250, y: 80, label: 'v₀' },
    { x: 120, y: 240, label: 'v₁' },
    { x: 380, y: 240, label: 'v₂' },
  ];

  const edges = [
    { from: 0, to: 1, label: 'e₀₁', midX: 0, midY: 0 },
    { from: 1, to: 2, label: 'e₁₂', midX: 0, midY: 0 },
    { from: 2, to: 0, label: 'e₂₀', midX: 0, midY: 0 },
  ];

  // Compute edge midpoints
  for (const e of edges) {
    e.midX = (vertices[e.from].x + vertices[e.to].x) / 2;
    e.midY = (vertices[e.from].y + vertices[e.to].y) / 2;
  }

  const triCenter = {
    x: (vertices[0].x + vertices[1].x + vertices[2].x) / 3,
    y: (vertices[0].y + vertices[1].y + vertices[2].y) / 3,
  };

  let selectedEdge = -1;
  let showBoundary = false;
  let boundaryAnim = 0;
  let pulseVert = -1;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(520, p.windowWidth - 30), 410).parent('p5canvas');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:4px 0';

    const bndBtn = document.createElement('button');
    bndBtn.textContent = 'Show ∂(triangle)';
    bndBtn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.8em';
    bndBtn.addEventListener('click', () => {
      showBoundary = !showBoundary;
      boundaryAnim = showBoundary ? 0 : 1;
      bndBtn.textContent = showBoundary ? 'Hide ∂(triangle)' : 'Show ∂(triangle)';
      bndBtn.style.color = showBoundary ? '#7ee787' : '#58a6ff';
    });
    btnRow.appendChild(bndBtn);

    const hint = document.createElement('span');
    hint.style.cssText = 'color:#484f58;font-size:0.7em;margin-left:4px';
    hint.textContent = '点击边查看它的边界顶点';
    btnRow.appendChild(hint);
    document.querySelector('.sketch-col')?.appendChild(btnRow);
  };

  p.draw = () => {
    p.background('#0d1117');
    const cx = p.width / 2;

    if (showBoundary && boundaryAnim < 1) boundaryAnim += 0.02;
    if (!showBoundary && boundaryAnim > 0) boundaryAnim -= 0.02;

    // Triangle fill
    if (boundaryAnim > 0) {
      p.fill(88, 166, 255, 8 * boundaryAnim);
      p.noStroke();
      p.beginShape();
      for (const v of vertices) p.vertex(v.x, v.y);
      p.endShape(p.CLOSE);
    }

    // ========== C_2: draw the 2-simplex (triangle) ==========
    // Triangle edges
    p.stroke('#30363d');
    p.strokeWeight(2);
    p.noFill();
    p.beginShape();
    for (const v of vertices) p.vertex(v.x, v.y);
    p.endShape(p.CLOSE);

    // Label C_2
    p.fill('#7ee787');
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('σ (2-simplex)', triCenter.x - 60, triCenter.y - 10);
    p.text('C₂ = span{σ}', triCenter.x - 60, triCenter.y + 8);

    // ========== C_1: draw edges with boundary info ==========
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const v1 = vertices[e.from], v2 = vertices[e.to];
      const isSel = selectedEdge === i;

      // Edge highlight
      if (isSel) {
        p.stroke('#ffd33d');
        p.strokeWeight(4);
        p.line(v1.x, v1.y, v2.x, v2.y);
      }

      // Edge label
      p.fill(isSel ? '#ffd33d' : '#8b949e');
      p.textSize(13);
      p.textAlign(p.CENTER, p.CENTER);
      const offX = i === 0 ? 0 : i === 1 ? 10 : -10;
      const offY = i === 0 ? 20 : i === 1 ? -20 : -20;
      p.text(e.label, e.midX + offX, e.midY + offY);

      // Boundary operator on hover
      if (isSel) {
        // ∂_1(e) = v_to - v_from
        p.stroke('#f78166');
        p.strokeWeight(2);
        p.drawingContext.setLineDash([3, 4]);
        // arrow to v_from with minus sign
        p.line(e.midX, e.midY, v1.x, v1.y);
        p.line(e.midX, e.midY, v2.x, v2.y);
        p.drawingContext.setLineDash([]);

        // + and - signs
        p.fill('#f78166');
        p.textSize(14);
        p.text('−', (e.midX + v1.x) / 2, (e.midY + v1.y) / 2 - 10);
        p.text('+', (e.midX + v2.x) / 2, (e.midY + v2.y) / 2 - 10);

        // Formula
        p.fill('#ffd33d');
        p.textSize(12);
        const midXC = cx + 160;
        p.text('∂₁(' + e.label + ')', midXC, 120);
        p.text('  = ' + v2.label + ' − ' + v1.label, midXC, 140);
      }
    }

    // ========== C_0: draw vertices ==========
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      const hover = p.dist(p.mouseX, p.mouseY, v.x, v.y) < 16;

      p.fill(hover || pulseVert === i ? '#f78166' : '#58a6ff');
      p.noStroke();
      p.circle(v.x, v.y, hover ? 14 : 10);

      p.fill('#c9d1d9');
      p.textSize(13);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(v.label, v.x, v.y - 14);
    }

    // ∂₂(triangle) = e0 + e1 + e2
    if (showBoundary) {
      const alpha = Math.min(1, boundaryAnim);
      for (let i = 0; i < 3; i++) {
        const e = edges[i];
        const arrowPos = 0.5 + 0.3 * Math.sin(p.frameCount * 0.06 + i);
        const ax = p.lerp(triCenter.x, e.midX, arrowPos);
        const ay = p.lerp(triCenter.y, e.midY, arrowPos);

        p.stroke('#7ee787');
        p.strokeWeight(2);
        p.drawingContext.setLineDash([4, 4]);
        p.line(triCenter.x, triCenter.y, e.midX, e.midY);
        p.drawingContext.setLineDash([]);
        p.fill('#7ee787');
        p.noStroke();
        p.circle(ax, ay, 4);
      }

      p.fill('#7ee787');
      p.textSize(13);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('∂₂(σ) = e₀₁ + e₁₂ + e₂₀', triCenter.x, triCenter.y + 40);
    }

    // H_1 = ker ∂₁ / im ∂₂
    // For a triangle: ker ∂₁ = span{e₀₁ + e₁₂ + e₂₀} (1-dimensional)
    // im ∂₂ = span{e₀₁ + e₁₂ + e₂₀} (1-dimensional, same!)
    // So H_1 = 0 (triangle is simply connected)
    const vs = vertices, es = edges;

    // Sidebar: Homology computation
    const sx = 10, sy = 300;
    p.fill('#0d1117');
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(sx, sy, 320, 105, 6);

    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Homology of a triangle:', sx + 8, sy + 8);

    p.fill('#8b949e');
    p.textSize(11);
    p.text('ker ∂₁ = span{e₀₁ + e₁₂ + e₂₀}  (1-cycle = boundary of triangle)', sx + 8, sy + 28);
    p.text('im ∂₂ = span{e₀₁ + e₁₂ + e₂₀}  (boundary of the 2-cell)', sx + 8, sy + 46);

    p.fill('#ffd33d');
    p.textSize(13);
    p.text('H₁ = ker ∂₁ / im ∂₂ = 0  (triangle ~ point, trivial homology)', sx + 8, sy + 68);

    p.fill('#7ee787');
    p.text('∂² = 0:  boundary of a boundary is ZERO!', sx + 8, sy + 86);

    // Chain complex at very top
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    const tc = triCenter;
    p.text('Chain complex:  C₂ → C₁ → C₀  (∂₂∘∂₁ = 0)', tc.x, tc.y - 30);
  };

  p.mouseClicked = () => {
    // Check edge clicks
    selectedEdge = -1;
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      // Check if click is near the edge line
      const v1 = vertices[e.from], v2 = vertices[e.to];
      const d = p.distToSegment(p.mouseX, p.mouseY, v1.x, v1.y, v2.x, v2.y);
      if (d < 18) {
        selectedEdge = i;
        return;
      }
    }
  };

  // Distance from point to line segment
  p.distToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return p.dist(px, py, x1, y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = p.constrain(t, 0, 1);
    return p.dist(px, py, x1 + t * dx, y1 + t * dy);
  };
};

new p5(sketch);
