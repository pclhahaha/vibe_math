import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let maxDepth = 4;
  let nodes = [];
  let expandedNodes = new Set();
  let hoveredNode = null;
  let clickedNode = null;

  const buildTree = () => {
    nodes = [];
    expandedNodes = new Set();
    function addNode(x, y, angle, len, depth, parentId, path) {
      if (depth <= 0) return;
      const nx = x + len * Math.cos(angle);
      const ny = y + len * Math.sin(angle);
      const id = nodes.length;
      const isExpanded = depth <= 2;
      nodes.push({ x: nx, y: ny, depth: maxDepth - depth, angle, parent: parentId, id, expanded: isExpanded, path: path || '' });
      if (isExpanded) expandedNodes.add(id);
      const cl = len * 0.72;
      addNode(nx, ny, angle - 0.55, cl, depth - 1, id, (path || 'e') + 'a');
      addNode(nx, ny, angle + 0.55, cl, depth - 1, id, (path || 'e') + 'b');
    }
    addNode(0, 0, Math.PI / 2, 80, maxDepth, null, 'e');
    for (const n of nodes) {
      if (n.depth <= 1 || n.expanded) expandedNodes.add(n.id);
    }
  };

  const isVisible = (node) => {
    if (node.parent === null) return true;
    let current = node;
    while (current.parent !== null) {
      if (!expandedNodes.has(current.parent)) return false;
      current = nodes.find(n => n.id === current.parent);
      if (!current) return false;
    }
    return true;
  };

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(500, p.windowWidth - 40), 420).parent('p5canvas');
    buildTree();
    const col = document.querySelector('.sketch-col');

    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '2'; sl.max = '6'; sl.step = '1'; sl.value = '4';
    sl.style.cssText = 'width:120px;accent-color:#58a6ff;margin:4px 6px';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8b949e;font-size:0.75em';
    lbl.textContent = 'Depth: ' + maxDepth;
    sl.addEventListener('input', () => {
      maxDepth = parseInt(sl.value);
      lbl.textContent = 'Depth: ' + maxDepth;
      buildTree();
      clickedNode = null; hoveredNode = null;
    });
    col?.appendChild(sl); col?.appendChild(lbl);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, 30);

    // Draw edges (only for visible nodes)
    p.stroke('#21262d'); p.strokeWeight(1);
    for (const node of nodes) {
      if (node.parent !== null && isVisible(node)) {
        const par = nodes.find((n) => n.id === node.parent);
        if (par && isVisible(par)) p.line(par.x, par.y, node.x, node.y);
      }
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!isVisible(node)) continue;
      const r = 3 + node.depth * 1.2;
      const hl = hoveredNode === i;
      const expanded = expandedNodes.has(i);

      if (node.parent === null) {
        p.fill('#ffd33d'); p.noStroke();
        p.circle(node.x, node.y, r + 3);
        p.fill('#0d1117'); p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('F\u2082', node.x, node.y);
      } else {
        p.fill(hl ? '#ffd33d' : (clickedNode === i ? '#7ee787' : expanded ? '#58a6ff' : '#f78166'));
        p.noStroke();
        p.circle(node.x, node.y, r);
        if (hl || clickedNode === i) {
          p.stroke('#ffd33d'); p.strokeWeight(1); p.noFill();
          p.circle(node.x, node.y, r + 4);
        }
      }

      // Clickable hint for collapsed nodes
      if (!expanded && node.depth < maxDepth - 1) {
        p.fill('#484f58'); p.textSize(10); p.textAlign(p.CENTER, p.CENTER);
        p.text('+', node.x + r + 4, node.y);
      }
      if (expanded && node.depth < maxDepth - 1) {
        p.fill('#484f58'); p.textSize(10); p.textAlign(p.CENTER, p.CENTER);
        p.text('\u2212', node.x + r + 4, node.y);
      }

      if (node.depth === maxDepth - 1) {
        p.fill('#484f58'); p.textSize(11);
        p.textAlign(p.LEFT, p.CENTER);
        p.text('gen', node.x + 8, node.y);
      }
    }

    // Hover tooltip: word metrics
    if (hoveredNode !== null && isVisible(nodes[hoveredNode])) {
      const node = nodes[hoveredNode];
      const tx = p.width / 2 + node.x + 15;
      const ty = node.y + 25 + 10;

      p.fill('#21262d'); p.stroke('#58a6ff'); p.strokeWeight(1);
      p.rect(tx - 80, ty - 32, 155, 38, 4);

      p.fill('#c9d1d9'); p.textSize(11); p.textAlign(p.LEFT, p.TOP); p.noStroke();
      const wordLen = node.path ? node.path.length - 1 : 0;
      const distFromRoot = node.depth;
      p.text('|w| = ' + wordLen + '  d(e,w) = ' + distFromRoot, tx - 75, ty - 28);
      p.fill('#58a6ff'); p.textSize(10);
      const word = node.path || 'e';
      p.text('w = ' + (word.length > 20 ? word.slice(0, 20) + '...' : word), tx - 75, ty - 14);
    }

    // Info
    p.fill('#8b949e'); p.textSize(13); p.textAlign(p.LEFT, p.TOP);
    p.text('Cayley Graph of Free Group F\u2082', -p.width / 2 + 10, -p.height / 2 + 4);
    p.text('Click nodes to expand/collapse | Hover for word metrics', -p.width / 2 + 10, -p.height / 2 + 24);
    p.textSize(11);
    p.text(
      'Gromov (1987): polynomial growth \u21d4 virtually nilpotent',
      -p.width / 2 + 10,
      p.height - 40
    );
  };

  p.mouseClicked = () => {
    const mx = p.mouseX - p.width / 2;
    const my = p.mouseY - 30;
    clickedNode = null;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (!isVisible(n)) continue;
      if (p.dist(mx, my, n.x, n.y) < 12) {
        if (expandedNodes.has(i)) {
          expandedNodes.delete(i);
        } else {
          expandedNodes.add(i);
        }
        clickedNode = expandedNodes.has(i) ? i : null;
        return false;
      }
    }
    return true;
  };

  p.mouseMoved = () => {
    const mx = p.mouseX - p.width / 2;
    const my = p.mouseY - 30;
    hoveredNode = null;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (!isVisible(n)) continue;
      if (p.dist(mx, my, n.x, n.y) < 12) {
        hoveredNode = i;
        break;
      }
    }
  };
};

new p5(sketch);
