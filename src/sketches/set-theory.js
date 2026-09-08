import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let hl = -1;
  let selSet = -1;
  const tiers = [
    { n: 'P(N): 2^c', y: 0.82, c: '#ffd33d', d: 'Power set of R — even larger', venC: '#ffd33d' },
    { n: 'R: c = 2^aleph0', y: 0.62, c: '#f78166', d: 'UNCOUNTABLE — Cantor diagonal (1874)', venC: '#f78166' },
    { n: 'Q: aleph0', y: 0.42, c: '#7ee787', d: 'Rationals — still countable!', venC: '#7ee787' },
    { n: 'Z: aleph0', y: 0.22, c: '#58a6ff', d: 'Integers — same size as N', venC: '#58a6ff' },
    { n: 'N: aleph0', y: 0.02, c: '#58a6ff', d: 'Natural numbers — smallest infinite set', venC: '#58a6ff' },
  ];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 460).parent('p5canvas');
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(30, 20);
    const w = p.width - 60, h = 140;

    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      p.fill(i === hl ? '#1a2332' : '#161b22');
      p.stroke(i === hl ? '#58a6ff' : '#30363d');
      p.strokeWeight(i === hl ? 2 : 1);
      p.rect(0, t.y * h, w, 26, 6);
      p.fill(t.c);
      p.noStroke();
      p.textSize(13);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(t.n, 15, t.y * h + 13);
    }

    p.fill('#8b949e');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Cantor: |P(X)| > |X| — infinitely many infinities', 20, h + 8);
    p.text('CH: 2^aleph0 = aleph1? Independent of ZFC (Cohen 1963)', 20, h + 28);

    if (selSet >= 0) {
      drawVennDiagram(h + 38, w);
    }
  };

  function drawVennDiagram(startY, w) {
    const cx = w / 2, cy = startY + 80;
    const R = 55;

    p.fill(selSet === 0 ? tiers[0].venC.replace('202020') : 'rgba(255,211,61,40)');
    p.noStroke();
    p.circle(cx, cy - 20, R * 2);

    p.fill(selSet === 1 ? tiers[1].venC.replace('202020') : 'rgba(247,129,102,40)');
    p.circle(cx - 35, cy + 15, R * 2);

    p.fill(selSet === 4 ? tiers[4].venC.replace('202020') : 'rgba(88,166,255,40)');
    p.circle(cx + 35, cy + 15, R * 2);

    p.fill('#c9d1d9');
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('P(N)', cx, cy - 25);
    p.text('R', cx - 35, cy + 15);
    p.text('N', cx + 35, cy + 15);

    p.fill('#58a6ff');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    const s = tiers[selSet];
    const selName = s.n.split(':')[0];
    p.text('Selected: ' + selName + ' — ' + s.d, 10, startY + 150);

    const relations = [];
    if (selSet === 4) {
      relations[0] = 'N ⊂ Z ⊂ Q ⊂ R ⊂ P(N) (all subsets)';
      relations[1] = 'N ∪ R = R  ·  N ∩ R = N  ·  R \\ N = irrationals';
    } else if (selSet === 3) {
      relations[0] = 'Z ⊂ Q ⊂ R ⊂ P(N)';
      relations[1] = 'Z ∪ Q = Q  ·  Z ∩ N = N  ·  Q \\ Z = fractions';
    } else if (selSet === 2) {
      relations[0] = 'Q ⊂ R ⊂ P(N)';
      relations[1] = 'Q ∪ R = R  ·  Q ∩ N = ∅ (besides naturals)';
    } else if (selSet === 1) {
      relations[0] = 'R ⊂ P(N)';
      relations[1] = 'R ∪ N = {reals} ⊂ P(N)';
    } else {
      relations[0] = 'P(N) contains all subsets of N (continuum many)';
      relations[1] = 'All other sets ⊂ P(N) by encoding';
    }
    p.fill('#8b949e');
    p.textSize(11);
    p.text(relations[0], 10, startY + 168);
    p.text(relations[1], 10, startY + 186);
  }

  p.mouseMoved = () => {
    const y = p.mouseY - 20;
    const h = 140;
    let nh = -1;
    for (let i = 0; i < tiers.length; i++) {
      if (y >= tiers[i].y * h && y < tiers[i].y * h + 26) { nh = i; break; }
    }
    if (nh !== hl) {
      hl = nh;
      const el = document.getElementById('set-info');
      if (el) el.remove();
      if (hl >= 0) {
        const d = document.createElement('p');
        d.id = 'set-info';
        d.style.cssText = 'color:#f78166;font-size:13px;margin:4px 0 0 30px';
        d.textContent = tiers[hl].d;
        document.querySelector('.sketch-col')?.appendChild(d);
      }
    }
  };

  p.mouseClicked = () => {
    const y = p.mouseY - 20;
    const h = 140;
    let nh = -1;
    for (let i = 0; i < tiers.length; i++) {
      if (y >= tiers[i].y * h && y < tiers[i].y * h + 26) { nh = i; break; }
    }
    if (nh >= 0) {
      selSet = selSet === nh ? -1 : nh;
      return false;
    }
    return false;
  };
};
new p5(s);
