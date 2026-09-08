import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let level = 0;
  let expanded = false;
  let compIdx = 0;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(540, p.windowWidth - 40), 420).parent('p5canvas');

    const names = ['0-cat: Set', '1-cat: Category', '2-cat: 2-Category', '∞-cat: Quasi-cat'];
    names.forEach((n, i) => {
      const btn = document.createElement('button');
      btn.textContent = n;
      btn.style.cssText = 'background:#161b22;color:' +
        (i === 0 ? '#58a6ff' : '#8b949e') +
        ';border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;margin:2px;font-size:0.74em';
      btn.addEventListener('click', () => { level = i; expanded = false; });
      document.querySelector('.sketch-col')?.appendChild(btn);
    });
  };

  p.mouseClicked = () => {
    const cx = p.width / 2, cy = p.height / 2;
    const mx = p.mouseX - cx;
    const my = p.mouseY - cy;
    if (level === 0) {
      const objs = [{ x: -80, y: -40 }, { x: 80, y: 40 }, { x: -40, y: 60 }];
      for (const o of objs) {
        if (p.dist(mx, my, o.x, o.y) < 16) { expanded = !expanded; return false; }
      }
    } else if (level === 1) {
      const objs = [{ x: -100, y: -30 }, { x: 0, y: -60 }, { x: 100, y: -30 }];
      for (const o of objs) {
        if (p.dist(mx, my, o.x, o.y) < 16) { expanded = !expanded; compIdx = (compIdx + 1) % 2; return false; }
      }
    } else if (level === 2) {
      if (p.dist(mx, my, -100, -20) < 16 || p.dist(mx, my, 80, -20) < 16) {
        expanded = !expanded;
        return false;
      }
      if (p.abs(mx - (-8)) < 20 && p.abs(my - (-20)) < 20) {
        compIdx = (compIdx + 1) % 2;
        return false;
      }
    }
    return false;
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);

    const col1 = '#58a6ff', col2 = '#f78166', col3 = '#7ee787';

    if (level === 0) {
      const objs = [{ x: -80, y: -40 }, { x: 80, y: 40 }, { x: -40, y: 60 }];
      for (const o of objs) {
        p.fill(col1);
        p.noStroke();
        p.circle(o.x, o.y, expanded ? 24 : 20);
        p.fill('#0d1117');
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(expanded ? '∈' : '•', o.x, o.y);
      }
      p.fill('#c9d1d9');
      p.textSize(14);
      p.textAlign(p.CENTER, p.TOP);
      p.text('0-category: just objects (elements of a set)', 0, 100);
      if (expanded) {
        p.fill('#58a6ff');
        p.textSize(12);
        p.text('No morphisms — only identity (equality)', 0, 124);
      } else {
        p.fill('#8b949e');
        p.textSize(12);
        p.text('Click elements to expand — no morphisms exist', 0, 124);
      }
    } else if (level === 1) {
      const objs = [{ x: -100, y: -30 }, { x: 0, y: -60 }, { x: 100, y: -30 }];
      for (const o of objs) {
        p.fill(col1);
        p.noStroke();
        p.circle(o.x, o.y, 20);
      }
      p.stroke(col2);
      p.strokeWeight(3);
      p.line(-80, -30, -16, -54);
      p.line(16, -54, 84, -30);
      p.fill(col2);
      p.triangle(-20, -52, -12, -58, -12, -46);
      p.triangle(80, -30, 72, -24, 72, -36);
      for (const o of objs) {
        p.noFill();
        p.stroke(col2);
        p.strokeWeight(1.5);
        p.arc(o.x, o.y - 14, 14, 14, Math.PI, p.TWO_PI);
      }
      p.fill('#c9d1d9');
      p.textSize(14);
      p.textAlign(p.CENTER, p.TOP);
      p.text('1-category: objects + morphisms (arrows)', 0, 100);
      p.fill('#8b949e');
      p.textSize(12);
      p.text('Composition: g∘f  |  Identity: id_A  |  Associativity', 0, 124);

      if (expanded) {
        p.fill(col3);
        p.textSize(12);
        if (compIdx === 0) {
          p.text('g∘f: A → C (composition of arrows)', 0, 144);
          p.stroke(col3);
          p.strokeWeight(2);
          p.drawingContext.setLineDash([4, 3]);
          p.line(-80, -16, 84, -16);
          p.drawingContext.setLineDash([]);
        } else {
          p.text('id_A: A → A (identity on each object)', 0, 144);
        }
      }
    } else if (level === 2) {
      p.fill(col1);
      p.noStroke();
      p.circle(-100, -20, expanded ? 24 : 20);
      p.circle(80, -20, expanded ? 24 : 20);

      p.stroke(col2);
      p.strokeWeight(2.5);
      p.line(-84, -20, 68, -20);
      p.line(-84, 0, 68, 0);

      const an1 = 0.5 + Math.sin(p.frameCount * 0.03) * 0.2;
      const midX = -8;
      p.stroke(col3);
      p.strokeWeight(2.5);
      p.line(midX - 10, -20, midX + an1 * 10, -6 + an1 * 5);
      p.line(midX + 10, -20, midX - an1 * 10, -6 + an1 * 5);
      p.fill(col3);
      p.triangle(midX + 8, -20, midX + 14, -16, midX + 14, -24);

      p.fill('#c9d1d9');
      p.textSize(14);
      p.textAlign(p.CENTER, p.TOP);
      p.text('2-category: objects + morphisms + 2-morphisms', 0, 100);
      p.fill('#8b949e');
      p.textSize(12);
      p.text('Natural transformations = 2-morphisms between functors', 0, 124);

      if (expanded) {
        p.fill(col3);
        p.textSize(12);
        p.text('Click 2-morphism region for composition view', 0, 144);
        if (compIdx === 1) {
          p.fill('#ffd33d');
          p.text('Vertical composition: β ∘ α (compose 2-cells vertically)', 0, 162);
          p.text('Horizontal composition: β * α (compose 2-cells horizontally)', 0, 180);
        }
      }
    } else {
      for (let depth = 0; depth < 4; depth++) {
        const r = 80 - depth * 15;
        const nPts = 6 - depth;
        for (let i = 0; i < nPts; i++) {
          const a = (p.TWO_PI * i) / nPts + p.frameCount * 0.005 * depth;
          const x = r * Math.cos(a), y = r * Math.sin(a);
          if (depth === 0) { p.fill(col1); }
          else if (depth === 1) { p.fill(col2); }
          else { p.fill(col3); }
          p.noStroke();
          p.circle(x, y, 6 - depth);
          if (depth < 3 && i % 2 === 0) {
            const nextA = (p.TWO_PI * Math.floor(i / 2)) / (nPts - 1) + p.frameCount * 0.005 * (depth + 1);
            const nextR = 80 - (depth + 1) * 15;
            p.stroke(col3);
            p.strokeWeight(0.5);
            p.line(x, y, nextR * Math.cos(nextA), nextR * Math.sin(nextA));
          }
        }
      }
      p.fill('#c9d1d9');
      p.textSize(14);
      p.textAlign(p.CENTER, p.TOP);
      p.text('∞-category: n-morphisms for all n (Lurie 2009)', 0, 100);
      p.fill('#8b949e');
      p.textSize(12);
      p.text('Quasi-category: simplicial set with inner horn lifting', 0, 124);
      p.text('Derived Algebraic Geometry · Cobordism Hypothesis', 0, 144);
    }
  };
};

new p5(sketch);
