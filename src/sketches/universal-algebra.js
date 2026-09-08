import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let step = 0;
  let selectedEl = -1;
  let composed = false;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(520, p.windowWidth - 40), 400).parent('p5canvas');

    const names = ['Start: Set', '+ Homomorphic images', '+ Subalgebras', '+ Products', '= Variety'];
    names.forEach((n, i) => {
      const btn = document.createElement('button');
      btn.textContent = n;
      btn.style.cssText = 'background:#161b22;color:' + (i === 0 ? '#58a6ff' : '#8b949e') +
        ';border:1px solid #30363d;padding:4px 8px;border-radius:6px;cursor:pointer;margin:2px;font-size:0.72em';
      btn.addEventListener('click', () => { step = i; selectedEl = -1; composed = false; });
      document.querySelector('.sketch-col')?.appendChild(btn);
    });
  };

  p.mouseClicked = () => {
    const cx = p.width / 2, cy = p.height / 2;
    const mx = p.mouseX - cx;
    const my = p.mouseY - cy;
    const elements = [
      { x: -40, y: 30 }, { x: 40, y: 30 }, { x: -60, y: -40 }, { x: 20, y: -50 }, { x: 60, y: -20 },
    ];
    let nh = -1;
    for (let i = 0; i < elements.length; i++) {
      if (p.dist(mx, my, elements[i].x, elements[i].y) < 16) { nh = i; break; }
    }
    if (nh >= 0) {
      if (selectedEl === nh) {
        selectedEl = -1;
        composed = false;
      } else if (selectedEl >= 0) {
        composed = true;
      } else {
        selectedEl = nh;
        composed = false;
      }
      return false;
    }
    return false;
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);

    const elements = [
      { x: -40, y: 30, name: 'a', op: '·a' },
      { x: 40, y: 30, name: 'b', op: '·b' },
      { x: -60, y: -40, name: 'c', op: '+c' },
      { x: 20, y: -50, name: 'd', op: '+d' },
      { x: 60, y: -20, name: 'e', op: 'inv' },
    ];

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const isSel = selectedEl === i;
      p.fill(isSel ? '#ffd33d' : '#58a6ff');
      p.noStroke();
      p.circle(el.x, el.y, isSel ? 18 : 14);
      p.fill('#0d1117');
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(el.name, el.x, el.y);
    }

    if (composed && selectedEl >= 0) {
      const sel = elements[selectedEl];
      for (const el of elements) {
        if (el.name === sel.name) continue;
        p.stroke('#ffd33d');
        p.strokeWeight(1);
        p.drawingContext.setLineDash([3, 4]);
        p.line(sel.x, sel.y, el.x, el.y);
        p.drawingContext.setLineDash([]);
        const mx = (sel.x + el.x) / 2, my = (sel.y + el.y) / 2;
        p.fill('#ffd33d');
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(sel.op + el.name, mx, my - 6);
      }
      p.fill('#ffd33d');
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.text('Term algebra: composed ' + sel.name + ' with all elements', 0, 75);
      p.fill('#8b949e');
      p.textSize(10);
      p.text('Free algebra on generators: all well-formed terms', 0, 93);
    }

    if (step >= 1) {
      for (let i = 0; i < 2; i++) {
        const el = elements[i];
        p.fill('#f78166');
        p.noStroke();
        p.circle(el.x + 80, el.y - 20, 10);
        p.fill('#0d1117');
        p.textSize(11);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('h(' + el.name + ')', el.x + 80, el.y - 22);
      }
      p.stroke('#f78166');
      p.strokeWeight(1);
      p.drawingContext.setLineDash([3, 4]);
      p.line(elements[0].x + 8, elements[0].y, elements[0].x + 80, elements[0].y - 20);
      p.line(elements[1].x + 8, elements[1].y, elements[1].x + 80, elements[1].y - 20);
      p.drawingContext.setLineDash([]);
    }

    if (step >= 2) {
      p.fill('#7ee787');
      p.noStroke();
      p.circle(elements[2].x, elements[2].y + 60, 11);
      p.circle(elements[3].x, elements[3].y + 60, 11);
      p.stroke('#7ee787');
      p.strokeWeight(1.5);
      p.drawingContext.setLineDash([3, 4]);
      p.line(elements[2].x, elements[2].y + 10, elements[2].x, elements[2].y + 52);
      p.line(elements[3].x, elements[3].y + 10, elements[3].x, elements[3].y + 52);
      p.drawingContext.setLineDash([]);
      p.fill('#7ee787');
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text('subalg', elements[2].x, elements[2].y + 62);
    }

    if (step >= 3) {
      p.fill('#ffd33d');
      p.noStroke();
      for (let i = 0; i < elements.length; i++) {
        for (let j = 0; j < elements.length; j++) {
          if (i === j) continue;
          p.circle(elements[i].x - 90, elements[j].y - 10, 5);
        }
      }
      p.fill('#ffd33d');
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text('products', -90, -70);
    }

    const labels = ['V (a set of algebras)', '+ H(V) — all quotients', '+ S(V) — all subalgebras', '+ P(V) — all products', 'HSP(V) = Variety'];
    p.fill('#c9d1d9');
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text(labels[step], 0, 90);

    p.fill('#8b949e');
    p.textSize(11);
    p.text('Birkhoff HSP Theorem (1935): V is an equational variety ⇔ V = HSP(V)', 0, 114);
    p.text('Groups, Rings, Vector Spaces — all varieties. Fields — NOT a variety.', 0, 134);

    if (selectedEl >= 0 && !composed) {
      p.fill('#ffd33d');
      p.textSize(11);
      p.text('Click another element to compose (term algebra)', 0, 152);
    }
  };
};

new p5(sketch);
