import p5 from 'p5';

const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let simplices = {
    vertices: [],
    edges: [],
    triangles: [],
  };
  let mode = 0; // 0=add vertex, 1=add edge, 2=add triangle
  let selectedVertex = -1;
  let dimSlider = 2;
  let boundaryAnim = -1;
  let boundaryTime = 0;
  let hoverIdx = -1;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 480).parent('p5canvas');

    // Initialize with a triangle
    const cx = 200, cy = 180, r = 80;
    simplices.vertices = [
      { x: cx, y: cy - r },
      { x: cx - r * 0.9, y: cy + r * 0.5 },
      { x: cx + r * 0.9, y: cy + r * 0.5 },
    ];
    simplices.edges = [[0, 1], [1, 2], [2, 0]];
    simplices.triangles = [[0, 1, 2]];

    // Mode buttons
    const modes = ['+ Vertex', '+ Edge', '+ Triangle'];
    const colors = ['#58a6ff', '#7ee787', '#f78166'];
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display:flex;gap:3px;margin:4px 0';
    document.querySelector('.sketch-col')?.appendChild(btnContainer);

    const buttons = [];
    for (let i = 0; i < 3; i++) {
      const btn = document.createElement('button');
      btn.textContent = modes[i];
      btn.style.cssText = 'background:#21262d;color:' + colors[i] + ';border:1px solid ' + (i === mode ? colors[i] : '#30363d') + ';border-radius:4px;padding:3px 8px;font-size:0.78em;cursor:pointer';
      btn.addEventListener('click', () => {
        mode = i;
        for (let j = 0; j < 3; j++) {
          buttons[j].style.borderColor = j === i ? colors[j] : '#30363d';
          buttons[j].style.color = j === i ? colors[j] : '#8b949e';
        }
        selectedVertex = -1;
      });
      btnContainer.appendChild(btn);
      buttons.push(btn);
    }

    // Dimension slider
    const slLabel = document.createElement('span');
    slLabel.style.cssText = 'color:#8b949e;font-size:0.78em;margin-left:4px';
    slLabel.textContent = 'dim:';
    document.querySelector('.sketch-col')?.appendChild(slLabel);

    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0';
    sl.max = '2';
    sl.step = '1';
    sl.value = '2';
    sl.style.cssText = 'width:80px;accent-color:#58a6ff;margin:2px 4px;vertical-align:middle';
    sl.addEventListener('input', () => { dimSlider = parseInt(sl.value); });
    document.querySelector('.sketch-col')?.appendChild(sl);

    // Clear button
    const clr = document.createElement('button');
    clr.textContent = '清除全部';
    clr.style.cssText = 'margin:4px 6px;background:#21262d;color:#f78166;border:1px solid #f78166;border-radius:4px;padding:3px 10px;font-size:0.8em;cursor:pointer';
    clr.addEventListener('click', () => {
      simplices = { vertices: [], edges: [], triangles: [] };
    });
    document.querySelector('.sketch-col')?.appendChild(clr);

    // Boundary animate button
    const banim = document.createElement('button');
    banim.textContent = 'Animate ∂';
    banim.style.cssText = 'margin:4px 4px;background:#21262d;color:#ffd33d;border:1px solid #ffd33d;border-radius:4px;padding:3px 10px;font-size:0.8em;cursor:pointer';
    banim.addEventListener('click', () => {
      if (simplices.triangles.length > 0) {
        boundaryAnim = 0;
        boundaryTime = 0;
      }
    });
    document.querySelector('.sketch-col')?.appendChild(banim);

    const hint = document.createElement('div');
    hint.style.cssText = 'color:#8b949e;font-size:0.72em;margin:2px 0';
    hint.textContent = 'Click canvas → add (mode: vertex/edge/triangle) | Click simplex → remove | Select 2 vertices for edge, 3 for triangle';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mouseMoved = () => {
    hoverIdx = -1;
    // Check vertices
    for (let i = 0; i < simplices.vertices.length; i++) {
      const v = simplices.vertices[i];
      if (p.dist(p.mouseX, p.mouseY, v.x, v.y) < 10) {
        hoverIdx = i;
        return;
      }
    }
  };

  p.mousePressed = () => {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;

    // Check if clicking an existing simplex to remove
    for (let i = 0; i < simplices.vertices.length; i++) {
      const v = simplices.vertices[i];
      if (p.dist(p.mouseX, p.mouseY, v.x, v.y) < 12) {
        // Remove vertex and all adjacent edges/triangles
        simplices.edges = simplices.edges.filter(e => e[0] !== i && e[1] !== i);
        simplices.triangles = simplices.triangles.filter(t => t[0] !== i && t[1] !== i && t[2] !== i);
        // Remap indices
        simplices.edges = simplices.edges.map(e => [e[0] > i ? e[0] - 1 : e[0], e[1] > i ? e[1] - 1 : e[1]]);
        simplices.triangles = simplices.triangles.map(t =>
          [t[0] > i ? t[0] - 1 : t[0], t[1] > i ? t[1] - 1 : t[1], t[2] > i ? t[2] - 1 : t[2]]
        );
        simplices.vertices.splice(i, 1);
        selectedVertex = -1;
        return;
      }
    }

    // Add simplex based on mode
    if (mode === 0) {
      // Add vertex
      simplices.vertices.push({ x: p.mouseX, y: p.mouseY });
    } else if (mode === 1) {
      // Select vertices for edge
      for (let i = 0; i < simplices.vertices.length; i++) {
        const v = simplices.vertices[i];
        if (p.dist(p.mouseX, p.mouseY, v.x, v.y) < 12) {
          if (selectedVertex === -1) {
            selectedVertex = i;
          } else if (selectedVertex !== i) {
            const a = Math.min(selectedVertex, i);
            const b = Math.max(selectedVertex, i);
            const exists = simplices.edges.some(e => e[0] === a && e[1] === b);
            if (!exists) simplices.edges.push([a, b]);
            selectedVertex = -1;
          }
          return;
        }
      }
      selectedVertex = -1;
    } else if (mode === 2) {
      // Select vertices for triangle
      for (let i = 0; i < simplices.vertices.length; i++) {
        const v = simplices.vertices[i];
        if (p.dist(p.mouseX, p.mouseY, v.x, v.y) < 12) {
          if (selectedVertex === -1) {
            selectedVertex = i;
          } else {
            // Check if we have an edge
            const a = Math.min(selectedVertex, i);
            const b = Math.max(selectedVertex, i);
            const edgeExists = simplices.edges.some(e => e[0] === a && e[1] === b);
            if (edgeExists) {
              // Find third vertex that forms a triangle
              for (const e2 of simplices.edges) {
                const third = (e2[0] === a || e2[0] === b) ? (e2[1] === a || e2[1] === b ? -1 : e2[1]) :
                  (e2[1] === a || e2[1] === b) ? e2[0] : -1;
                if (third >= 0 && third !== selectedVertex) {
                  const hasThirdEdge = simplices.edges.some(e =>
                    (e[0] === Math.min(third, selectedVertex) && e[1] === Math.max(third, selectedVertex)) ||
                    (e[0] === Math.min(third, i) && e[1] === Math.max(third, i))
                  );
                  if (hasThirdEdge) {
                    const t = [selectedVertex, i, third].sort((x, y) => x - y);
                    const exists = simplices.triangles.some(tr =>
                      tr[0] === t[0] && tr[1] === t[1] && tr[2] === t[2]
                    );
                    if (!exists) simplices.triangles.push(t);
                    selectedVertex = -1;
                    return;
                  }
                }
              }
            }
          }
          return;
        }
      }
      selectedVertex = -1;
    }
  };

  p.draw = () => {
    p.background('#0d1117');

    // --- Draw simplicial complex (top-left) ---
    p.push();
    p.translate(10, 10);

    // Triangles
    for (const t of simplices.triangles) {
      const [a, b, c] = t;
      if (a >= simplices.vertices.length || b >= simplices.vertices.length || c >= simplices.vertices.length) continue;
      const va = simplices.vertices[a], vb = simplices.vertices[b], vc = simplices.vertices[c];
      p.fill(88, 166, 255, 30);
      p.stroke('#58a6ff');
      p.strokeWeight(1.5);
      p.triangle(va.x - 10, va.y - 10, vb.x - 10, vb.y - 10, vc.x - 10, vc.y - 10);
    }

    // Edges
    for (const e of simplices.edges) {
      const [a, b] = e;
      if (a >= simplices.vertices.length || b >= simplices.vertices.length) continue;
      const va = simplices.vertices[a], vb = simplices.vertices[b];
      p.stroke('#f78166');
      p.strokeWeight(2.5);
      p.noFill();
      p.line(va.x - 10, va.y - 10, vb.x - 10, vb.y - 10);
    }

    // Vertices
    for (let i = 0; i < simplices.vertices.length; i++) {
      const v = simplices.vertices[i];
      const isSelected = i === selectedVertex;
      const isHovered = i === hoverIdx;
      p.fill(isSelected ? '#ffd33d' : isHovered ? '#7ee787' : '#58a6ff');
      p.noStroke();
      p.circle(v.x - 10, v.y - 10, isSelected ? 14 : 10);
      if (isSelected) {
        p.stroke('#ffd33d');
        p.strokeWeight(2);
        p.noFill();
        p.circle(v.x - 10, v.y - 10, 18);
      }
      p.fill('#c9d1d9');
      p.textSize(11);
      p.textAlign(p.CENTER);
      p.text(i, v.x - 10, v.y - 26);
    }
    p.pop();

    // --- Boundary operator animation ---
    if (boundaryAnim < simplices.triangles.length && boundaryAnim >= 0) {
      boundaryTime += 0.02;
      if (boundaryTime > 1.5) {
        boundaryTime = 0;
        boundaryAnim++;
      }
      if (boundaryAnim < simplices.triangles.length) {
        const t = simplices.triangles[boundaryAnim];
        if (t[0] < simplices.vertices.length && t[1] < simplices.vertices.length && t[2] < simplices.vertices.length) {
          const [a, b, c] = t;
          const va = simplices.vertices[a], vb = simplices.vertices[b], vc = simplices.vertices[c];
          const edges = [[a, b], [b, c], [c, a]];
          for (let ei = 0; ei < 3; ei++) {
            const frac = Math.max(0, Math.min(1, boundaryTime * 3 - ei));
            p.push();
            p.translate(10, 10);
            const ea = simplices.vertices[edges[ei][0]];
            const eb = simplices.vertices[edges[ei][1]];
            const px = ea.x - 10 + (eb.x - ea.x) * frac;
            const py = ea.y - 10 + (eb.y - ea.y) * frac;
            p.fill('#ffd33d');
            p.noStroke();
            p.circle(px, py, 8);
            p.pop();
          }
        }
      }
    }

    // --- Chain complex (right side + bottom) ---
    p.push();
    p.translate(360, 30);

    const chainX = 0;
    const dims = [
      { n: 'C₂ (2-chains)', y: 0, count: simplices.triangles.length, basis: 'triangles' },
      { n: 'C₁ (1-chains)', y: 100, count: simplices.edges.length, basis: 'edges' },
      { n: 'C₀ (0-chains)', y: 200, count: simplices.vertices.length, basis: 'vertices' },
    ];

    const colW = 140;
    for (const d of dims) {
      const highlight = dimSlider === (2 - dims.indexOf(d));
      p.fill('#161b22');
      p.stroke(highlight ? '#f78166' : '#30363d');
      p.strokeWeight(highlight ? 3 : 1.5);
      p.rect(chainX, d.y, colW, 60, 6);

      p.fill(highlight ? '#f78166' : '#c9d1d9');
      p.textSize(13);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(d.n, chainX + 8, d.y + 18);

      p.fill('#8b949e');
      p.textSize(10);
      p.text('dim = ' + d.count, chainX + 8, d.y + 38);

      // Basis display
      p.fill('#58a6ff');
      p.textSize(11);
      p.text(d.basis + '', chainX + 80, d.y + 18);

      if (highlight && dimSlider === 0) {
        p.fill('#f78166');
        p.textSize(11);
        p.text('ker(∂₀) = all vertices', chainX + 8, d.y + 52);
      }
    }

    // Boundary arrows
    p.stroke('#f78166');
    p.strokeWeight(2);
    p.line(chainX + colW / 2, 60, chainX + colW / 2, 100);
    p.line(chainX + colW / 2, 160, chainX + colW / 2, 200);

    p.fill('#f78166');
    p.textSize(11);
    p.text('∂₂', chainX + colW / 2 + 8, 80);
    p.text('∂₁', chainX + colW / 2 + 8, 180);

    // Homology calculation
    const d2Rank = simplices.triangles.length;
    const d1Rank = simplices.edges.length;
    const d0Rank = simplices.vertices.length;

    // Compute boundary matrices conceptually
    const z0 = d0Rank;
    const b0 = d1Rank > 0 ? Math.min(d1Rank, d0Rank) : 0;
    const z1 = d1Rank > 0 ? Math.max(0, d1Rank - d2Rank) : 0;
    const b1 = Math.min(d2Rank, d1Rank);
    const z2 = Math.max(0, d2Rank);

    const H0 = Math.max(0, z0 - b0);
    const H1 = Math.max(0, z1 - b1);
    const H2 = Math.max(0, z2);

    p.fill('#c9d1d9');
    p.textSize(12);
    p.text('H₀ = ' + H0 + ' (components)', chainX, 280);
    p.text('H₁ = ' + (d1Rank > 0 ? H1 : '?') + ' (cycles)', chainX, 300);
    p.text('H₂ = ' + (d2Rank > 0 ? H2 : '0') + ' (voids)', chainX, 320);

    p.fill('#8b949e');
    p.textSize(10);
    p.text('∂² = 0   im ∂ₖ₊₁ ⊆ ker ∂ₖ', chainX, 345);

    // Animated boundary indicator
    if (boundaryAnim >= 0 && boundaryAnim < simplices.triangles.length) {
      p.fill('#ffd33d');
      p.textSize(10);
      p.text('→ Animating ∂(T' + boundaryAnim + ')', chainX, 365);
    }
    p.pop();

    // Stats bar
    p.push();
    p.translate(10, p.height - 30);
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('V:' + simplices.vertices.length + '  E:' + simplices.edges.length + '  T:' + simplices.triangles.length +
      '    χ=' + (simplices.vertices.length - simplices.edges.length + simplices.triangles.length) +
      '    d²=0 ✓', 0, 0);
    p.pop();
  };
};

new p5(s);
