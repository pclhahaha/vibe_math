// Graph Theory — Euler trails: click edges to walk the Königsberg bridges
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  // ---------- presets ----------
  const PRESETS = {
    konigsberg: {
      name: '柯尼斯堡七桥',
      verts: [
        { id: 'N', x: 105, y: 80 },
        { id: 'K', x: 250, y: 215 },
        { id: 'S', x: 105, y: 350 },
        { id: 'L', x: 430, y: 215 },
      ],
      edges: ['N-K', 'N-K', 'N-L', 'S-K', 'S-K', 'S-L', 'K-L'],
    },
    allEven: {
      name: '全偶双桥方形',
      verts: [
        { id: 'A', x: 130, y: 105 },
        { id: 'B', x: 410, y: 105 },
        { id: 'C', x: 410, y: 325 },
        { id: 'D', x: 130, y: 325 },
      ],
      edges: ['A-B', 'A-B', 'B-C', 'B-C', 'C-D', 'C-D', 'D-A', 'D-A'],
    },
    twoOdd: {
      name: '三角加尾巴',
      verts: [
        { id: 'A', x: 150, y: 115 },
        { id: 'B', x: 410, y: 145 },
        { id: 'C', x: 275, y: 320 },
        { id: 'D', x: 455, y: 330 },
      ],
      edges: ['A-B', 'B-C', 'C-A', 'C-D'],
    },
  };

  let V = [];
  let E = [];
  let trail = null; // {start, cur, taken:Set}
  let hoverEdge = null;
  let flashMsg = '';
  let flashUntil = 0;
  let statusEl = null;
  let presetName = '柯尼斯堡七桥';

  const keyOf = (a, b) => (a < b ? a + b : b + a);
  const degOf = (id) => E.filter((e) => e.a === id || e.b === id).length;
  const oddIds = () => V.filter((v) => degOf(v.id) % 2 === 1).map((v) => v.id);

  function loadPreset(name) {
    const pr = PRESETS[name];
    presetName = pr.name;
    V = pr.verts.map((v) => ({ ...v }));
    const groups = {};
    pr.edges.forEach((pair, i) => {
      const [a, b] = pair.split('-');
      const k = keyOf(a, b);
      (groups[k] = groups[k] || []).push(i);
    });
    E = pr.edges.map((pair, i) => {
      const [a, b] = pair.split('-');
      const k = keyOf(a, b);
      const g = groups[k];
      const slot = g.indexOf(i) - (g.length - 1) / 2;
      return { id: 'e' + i, a, b, slot };
    });
    trail = null;
    hoverEdge = null;
    if (statusEl) statusEl.textContent = '点击任意一条边开始走；之后每次点击必须接着当前顶点。绿色 = 已走。';
  }

  // ---------- setup ----------
  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(560, p.windowWidth - 40), 460).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    Object.entries(PRESETS).forEach(([key, pr]) => {
      const b = document.createElement('button');
      b.textContent = pr.name;
      b.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:2px';
      b.addEventListener('click', () => loadPreset(key));
      ctrl.appendChild(b);
    });
    const reset = document.createElement('button');
    reset.textContent = '↺ 重置';
    reset.style.cssText =
      'background:#161b22;color:#8b949e;border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:2px';
    reset.addEventListener('click', () => {
      trail = null;
      if (statusEl) statusEl.textContent = '已重置。点击任意一条边开始走。';
    });
    ctrl.appendChild(reset);
    const solve = document.createElement('button');
    solve.textContent = '⚡ 自动求解（Hierholzer）';
    solve.style.cssText =
      'background:#161b22;color:#3fb950;border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:2px';
    solve.addEventListener('click', () => {
      autoSolve();
    });
    ctrl.appendChild(solve);
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    statusEl = document.createElement('p');
    statusEl.style.cssText = 'color:#8b949e;font-size:0.78em;line-height:1.5;margin:4px 2px 0;max-width:520px';
    statusEl.textContent = '点击任意一条边开始走；之后每次点击必须接着当前顶点。绿色 = 已走。';
    document.querySelector('.sketch-col')?.appendChild(statusEl);

    loadPreset('konigsberg');
  };

  // ---------- geometry helpers ----------
  function controlPoint(e) {
    const A = V.find((v) => v.id === e.a);
    const B = V.find((v) => v.id === e.b);
    const mx = (A.x + B.x) / 2;
    const my = (A.y + B.y) / 2;
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.hypot(dx, dy) || 1;
    const off = e.slot * 16;
    return { x: mx - (dy / len) * off, y: my + (dx / len) * off };
  }

  function hitEdge(mx, my) {
    let best = null;
    let bestD = p.__touch ? 26 : 13;
    for (const e of E) {
      if (trail && trail.taken.has(e.id)) continue;
      const A = V.find((v) => v.id === e.a);
      const B = V.find((v) => v.id === e.b);
      const C = controlPoint(e);
      for (let t = 0; t <= 1; t += 0.04) {
        const x = (1 - t) * (1 - t) * A.x + 2 * t * (1 - t) * C.x + t * t * B.x;
        const y = (1 - t) * (1 - t) * A.y + 2 * t * (1 - t) * C.y + t * t * B.y;
        const d = p.dist(mx, my, x, y);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
    }
    return best;
  }

  // ---------- trail logic ----------
  function step(e) {
    if (!trail) {
      trail = { start: e.a, cur: e.b, taken: new Set([e.id]) };
      statusEl.textContent = `起点 = ${e.a}，现在在 ${e.b}。继续点击与 ${e.b} 相连的未走边。`;
      return;
    }
    if (e.a === trail.cur) trail.cur = e.b;
    else if (e.b === trail.cur) trail.cur = e.a;
    else {
      flashMsg = '✗ 这条边不接当前顶点！';
      flashUntil = p.millis() + 1200;
      return;
    }
    trail.taken.add(e.id);
    const remaining = E.length - trail.taken.size;
    if (remaining === 0) {
      statusEl.textContent =
        trail.cur === trail.start
          ? `✓ 欧拉回路完成！走遍全部 ${E.length} 条边并回到起点 ${trail.start}。`
          : `✓ 欧拉路径完成！从 ${trail.start} 走到 ${trail.cur}，走遍全部 ${E.length} 条边。`;
      return;
    }
    const canGo = E.some((x) => !trail.taken.has(x.id) && (x.a === trail.cur || x.b === trail.cur));
    if (!canGo) {
      statusEl.textContent = `✗ 卡住了：在 ${trail.cur} 无路可走，还剩 ${remaining} 条边。奇点个数决定了这是必然（见正文欧拉判据）。点「重置」再试。`;
      return;
    }
    statusEl.textContent = `现在在 ${trail.cur}，还剩 ${remaining} 条边。`;
  }

  function autoSolve() {
    const odds = oddIds();
    if (odds.length > 2) {
      statusEl.textContent = `✗ 本图有 ${odds.length} 个奇度顶点（${odds.join('、')}），欧拉定理断言：不存在走遍每条边恰一次的路线。`;
      return;
    }
    // Hierholzer on a copied multigraph
    const adj = {};
    V.forEach((v) => (adj[v.id] = []));
    E.forEach((e) => {
      adj[e.a].push({ id: e.id, to: e.b });
      adj[e.b].push({ id: e.id, to: e.a });
    });
    const start = odds.length === 2 ? odds[0] : V[0].id;
    const stack = [start];
    const circuit = [];
    while (stack.length) {
      const v = stack[stack.length - 1];
      if (adj[v].length) {
        const e = adj[v].pop();
        adj[e.to] = adj[e.to].filter((x) => x.id !== e.id);
        stack.push(e.to);
      } else {
        circuit.push(v);
        stack.pop();
      }
    }
    if (circuit.length !== E.length + 1) {
      statusEl.textContent = '✗ 图不连通（或数据异常），无法一笔画。';
      return;
    }
    const path = circuit.reverse().join(' → ');
    trail = null;
    // color everything visited
    trail = { start: odds.length === 2 ? odds[0] : start, cur: null, taken: new Set(E.map((e) => e.id)), solvedPath: path };
    statusEl.textContent =
      odds.length === 0
        ? `✓ 欧拉回路（自动）：从 ${start} 出发 —— ${path}。`
        : `✓ 欧拉路径（自动）：必须从奇点 ${odds[0]} 出发 —— ${path}。`;
  }

  // ---------- mouse ----------
  p.mousePressed = () => {
    if (p.mouseX < 0 || p.mouseY < 0 || p.mouseX > p.width || p.mouseY > p.height) return;
    const e = hitEdge(p.mouseX, p.mouseY);
    if (e) step(e);
  };

  p.mouseMoved = () => {
    hoverEdge = hitEdge(p.mouseX, p.mouseY);
  };

  // ---------- draw ----------
  p.draw = () => {
    p.background('#0d1117');
    p.stroke('#141920');
    p.strokeWeight(0.4);
    for (let i = 0; i < p.width; i += 30) {
      p.line(i, 0, i, p.height);
      p.line(0, i, p.width, i);
    }

    // edges
    for (const e of E) {
      const A = V.find((v) => v.id === e.a);
      const B = V.find((v) => v.id === e.b);
      const C = controlPoint(e);
      const visited = trail && trail.taken.has(e.id);
      p.noFill();
      if (visited) {
        p.stroke('#3fb950');
        p.strokeWeight(3.4);
      } else if (hoverEdge === e) {
        p.stroke('#8b949e');
        p.strokeWeight(2.8);
      } else {
        p.stroke('#2d333b');
        p.strokeWeight(1.8);
      }
      p.beginShape();
      p.vertex(A.x, A.y);
      p.quadraticVertex(C.x, C.y, B.x, B.y);
      p.endShape();
    }

    // vertices
    for (const v of V) {
      const odd = degOf(v.id) % 2 === 1;
      const isCur = trail && trail.cur === v.id;
      const isStart = trail && trail.start === v.id && trail.taken.size < E.length;
      p.fill(odd ? '#f78166' : '#58a6ff');
      p.noStroke();
      p.circle(v.x, v.y, 34);
      p.fill('#0d1117');
      p.textSize(15);
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.text(v.id, v.x, v.y + 0.5);
      p.textStyle(p.NORMAL);
      if (isCur) {
        p.noFill();
        p.stroke('#ffd33d');
        p.strokeWeight(3);
        p.circle(v.x, v.y, 46);
      } else if (isStart) {
        p.noFill();
        p.stroke('#ffd33d');
        p.strokeWeight(1.6);
        p.setLineDash([4, 4]);
        p.circle(v.x, v.y, 46);
        p.setLineDash([]);
      }
    }

    // degree readout
    const odds = oddIds();
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      `${presetName}  |  度数：${V.map((v) => v.id + '=' + degOf(v.id)).join('  ')}  |  奇点：${odds.length}`,
      12,
      12
    );
    p.textStyle(p.NORMAL);

    // flash message
    if (p.millis() < flashUntil) {
      p.fill('#f85149');
      p.textSize(15);
      p.textAlign(p.CENTER, p.TOP);
      p.text(flashMsg, p.width / 2, p.height - 34);
    }
  };
};

new p5(sketch);
