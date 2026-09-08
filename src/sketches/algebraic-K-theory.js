import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 380).parent('p5canvas');
  };
  p.draw = () => {
    p.background('#0d1117');
    p.translate(30, 30);
    const w = p.width - 60;
    const groups = [
      { name: 'K0(R)', y: 50, col: '#58a6ff', desc: 'Projective modules / Grothendieck' },
      { name: 'K1(R)', y: 130, col: '#f78166', desc: 'GL(R)/[GL,GL] / Determinant' },
      { name: 'K2(R)', y: 210, col: '#7ee787', desc: 'Milnor / Steinberg relations' },
      { name: 'Kn(R)', y: 290, col: '#ffd33d', desc: 'Quillen / pi_n(BGL+) — Fields 1978' },
    ];
    for (const g of groups) {
      p.fill(g.col);
      p.noStroke();
      p.rect(20, g.y, w - 20, 50, 8);
      p.fill('#0d1117');
      p.textSize(16);
      p.text(g.name, 40, g.y + 20);
      p.textSize(11);
      p.text(g.desc, 40, g.y + 38);
    }
    for (let i = 0; i < groups.length - 1; i++) {
      p.stroke('#8b949e');
      p.strokeWeight(2);
      p.line(w / 2, groups[i].y + 50, w / 2, groups[i + 1].y);
    }
  };
  p.mouseMoved = () => {
    const el = document.getElementById('info-algebraic-K-theory');
    if (!el) {
      const d = document.createElement('p');
      d.id = 'info-algebraic-K-theory';
      d.style.cssText = 'color:#8b949e;font-size:12px;margin:2px 0 0 4px';
      d.textContent = '移动鼠标探索';
      document.querySelector('.sketch-col')?.appendChild(d);
    }
  };
};
new p5(s);
