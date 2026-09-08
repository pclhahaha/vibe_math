// Model Theory — FO sentence checker on small graphs; connectivity is not first-order
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  // 5 vertices on a circle
  const V = 5;
  const verts = [];
  for (let i = 0; i < V; i++) {
    const a = (i / V) * p.TWO_PI - Math.PI / 2;
    verts.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  let edges = []; // list of [i,j] i<j
  let preset = 'custom';
  let kPath = 4; // path-length bound for the "P_k(a,b)" sentence
  const cx = 200;
  const cy = 210;
  const R = 150;

  // sentence palette: each {name, check(adj)}
  const SENT = [
    { name: '∃ 三角形', check: (adj) => { for (let i=0;i<V;i++) for (let j=i+1;j<V;j++) for (let k2=j+1;k2<V;k2++) if (adj[i][j]&&adj[j][k2]&&adj[k2][i]) return true; return false; } },
    { name: '每点度数 ≥ 1', check: (adj) => adj.every((row,i)=>row.some((e,j)=>e&&i!==j)) },
    { name: '每点度数 ≥ 2', check: (adj) => adj.every((row,i)=>row.filter((e,j)=>e&&i!==j).length>=2) },
    { name: '含孤立点', check: (adj) => adj.some((row,i)=>!row.some((e,j)=>e&&i!==j)) },
    { name: 'v0–v4 距离 ≤ k（路径）', check: (adj) => bfs(adj,0,4)<=kPath },
    { name: 'v0–v4 连通（任何距离）', check: (adj) => bfs(adj,0,4)<Infinity },
  ];

  function bfs(adj, s, t) {
    const d = new Array(V).fill(Infinity);
    d[s] = 0;
    const q = [s];
    while (q.length) {
      const u = q.shift();
      if (u === t) return d[u];
      for (let w = 0; w < V; w++) if (adj[u][w] && d[w] === Infinity) { d[w] = d[u] + 1; q.push(w); }
    }
    return Infinity;
  }
  const adjOf = () => {
    const a = Array.from({ length: V }, () => new Array(V).fill(false));
    for (const [i, j] of edges) { a[i][j] = a[j][i] = true; }
    return a;
  };
  const hasEdge = (i, j) => edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
  const toggle = (i, j) => {
    const k = Math.min(i, j);
    const l = Math.max(i, j);
    const idx = edges.findIndex(([a, b]) => a === k && b === l);
    if (idx >= 0) edges.splice(idx, 1);
    else edges.push([k, l]);
  };
  const loadEdges = (list) => { edges = list.map(([a, b]) => [Math.min(a, b), Math.max(a, b)]); };
  const vertId = (i) => (i === 0 ? 'v0=a' : i === 4 ? 'v4=b' : 'v' + i);

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(600, p.windowWidth - 40), 560).parent('p5canvas');

    // preset buttons
    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    const mk = (label, fn, col) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'background:#161b22;color:' + col + ';border:1px solid #30363d;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.74em;margin:2px';
      b.addEventListener('click', fn);
      return b;
    };
    ctrl.appendChild(mk('✎ 自定义（点击连线）', () => { preset = 'custom'; edges = []; }, '#8b949e'));
    ctrl.appendChild(mk('路径 G1（a 到 b 距离 4）', () => { preset = 'path'; loadEdges([[0,1],[1,2],[2,3],[3,4]]); }, '#58a6ff'));
    ctrl.appendChild(mk('两段分离 G2', () => { preset = 'sep'; loadEdges([[0,1],[1,2],[3,4]]); }, '#f78166'));
    ctrl.appendChild(mk('三角形+尾巴', () => { preset = 'tri'; loadEdges([[0,1],[1,2],[2,0],[3,4]]); }, '#3fb950'));
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    // path bound slider
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.75em';
    lab.textContent = '句子"a–b 距离 ≤ k"的 k：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0';
    sl.max = '8';
    sl.step = '1';
    sl.value = String(kPath);
    sl.style.cssText = 'width:150px;accent-color:#58a6ff;cursor:pointer';
    sl.addEventListener('input', () => { kPath = parseInt(sl.value); });
    row.appendChild(sl);
    const val = document.createElement('span');
    val.style.cssText = 'color:#58a6ff;font-size:0.75em;width:30px';
    val.textContent = String(kPath);
    row.appendChild(val);
    sl.addEventListener('input', () => { val.textContent = String(kPath); });
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 4px;line-height:1.5';
    hint.textContent =
      '左：在图上点击顶点之间的区域加边。右：逐个句子显示在当前图上的真值。关键对比：G1（路径，a–b 距离 4）与 G2（分离，a–b 不连通）——把 k 调到 4：G1 满足"距离≤k"而 G2 永不满足；但"连通"这个性质对任意固定 k 都无法用一阶句子表达（需要任意大的 k）。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.mousePressed = () => {
    // click near the arc between vertices? simpler: near a vertex adds an edge to nearest other vertex
    let vi = -1;
    for (let i = 0; i < V; i++) {
      if (p.dist(p.mouseX, p.mouseY, cx + verts[i].x * R, cy + verts[i].y * R) < 22) { vi = i; break; }
    }
    if (vi < 0) return;
    // find nearest other vertex within click? we just toggle between vi and previous clicked
    if (p.mouseButton === p.RIGHT) return;
    // find closest vertex to click other than vi
    let best = -1;
    let bd = 60;
    for (let j = 0; j < V; j++) {
      if (j === vi) continue;
      const d = p.dist(p.mouseX, p.mouseY, cx + verts[j].x * R, cy + verts[j].y * R);
      if (d < bd) { bd = d; best = j; }
    }
    if (best >= 0) toggle(vi, best);
  };

  p.draw = () => {
    p.background('#0d1117');
    const adj = adjOf();
    const px = 420;
    const py = 60;

    // ---- left: graph ----
    // edges
    for (let i = 0; i < V; i++) {
      for (let j = i + 1; j < V; j++) {
        if (adj[i][j]) {
          p.stroke('#58a6ff');
          p.strokeWeight(3);
        } else {
          p.stroke('#1f2833');
          p.strokeWeight(0.8);
        }
        p.line(cx + verts[i].x * R, cy + verts[i].y * R, cx + verts[j].x * R, cy + verts[j].y * R);
      }
    }
    // vertices
    for (let i = 0; i < V; i++) {
      const deg = adj[i].filter((e, j) => e && j !== i).length;
      p.noStroke();
      p.fill(i === 0 || i === 4 ? '#ffd33d' : '#c9d1d9');
      p.circle(cx + verts[i].x * R, cy + verts[i].y * R, i === 0 || i === 4 ? 30 : 24);
      p.fill('#0d1117');
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.text(vertId(i), cx + verts[i].x * R, cy + verts[i].y * R + 1);
      p.textStyle(p.NORMAL);
      // degree badge
      p.fill('#8b949e');
      p.textSize(10);
      p.text('deg=' + deg, cx + verts[i].x * R + 22, cy + verts[i].y * R - 14);
    }
    p.noStroke();
    p.fill('#484f58');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text('当前结构 ' + { custom: '自定义', path: '路径 G1', sep: '两段分离 G2', tri: '三角形+尾巴' }[preset], 40, 40);

    // ---- right: sentence verdicts ----
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('一阶句子在当前结构上的真值', px, py - 16);
    SENT.forEach((s, idx) => {
      const ok = s.check(adj);
      const y = py + idx * 34;
      // card
      p.noFill();
      p.stroke(ok ? '#3fb950' : '#f85149');
      p.strokeWeight(1);
      p.rect(px, y, 155, 26, 6);
      p.noStroke();
      p.fill(ok ? '#134a26' : '#3d1418');
      p.rect(px, y, 155, 26, 6);
      p.fill(ok ? '#3fb950' : '#f85149');
      p.textSize(15);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(ok ? '✓ 真' : '✗ 假', px + 10, y + 14);
      p.fill('#c9d1d9');
      p.textSize(10.5);
      p.text(s.name, px + 60, y + 14);
    });

    // lesson text
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#8b949e');
    p.textSize(11.5);
    const y0 = py + SENT.length * 34 + 16;
    p.text('对比 G1 与 G2（换预设）：', px, y0);
    p.fill('#c9d1d9');
    p.textSize(11);
    p.text('· "距离 ≤ k" 对每个固定 k 都写得出；', px, y0 + 20);
    p.text('· "连通"= 存在某（不定的）k —— 不是一阶句子。', px, y0 + 38);
    p.text('紧致性/完备性保证：任何尝试定义连通性的一阶', px, y0 + 56);
    p.text('公式都会被某个足够大的分离图识破。', px, y0 + 74);
  };
};

new p5(sketch);
