import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let selGroup = -1;
  let hlGroup = -1;

  const groups = [
    { name: 'SU(3)', r: 100, color: '#58a6ff', particles: 'Quarks (u,d,s,c,b,t), 8 Gluons', detail: 'QCD: asymptotic freedom, confinement. Color charge: r,g,b. Lagrangian: -¼G_μν G^μν + Σ q̄(iD̸-m)q', force: 'Strong' },
    { name: 'SU(2)', r: 160, color: '#f78166', particles: 'W^±, Z bosons, left-handed doublets', detail: 'Weak force: V-A structure. Gauge bosons acquire mass via Higgs mechanism. θ_W = 29° (Weinberg angle).', force: 'Weak' },
    { name: 'U(1)', r: 220, color: '#7ee787', particles: 'Photon (γ), hypercharge Y', detail: 'Electromagnetism: U(1)_Y × SU(2)_L broken to U(1)_em. Q = T_3 + Y/2. γ remains massless.', force: 'EM' },
  ];

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 420).parent('p5canvas');
  };

  p.draw = () => {
    p.background('#0d1117');
    p.translate(p.width / 2, p.height / 2);

    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const isSel = selGroup === i;
      const isHl = hlGroup === i;
      p.stroke(isSel ? g.color : (isHl ? g.color : g.color));
      p.strokeWeight(isSel ? 3 : (isHl ? 2.5 : 2));
      if (!isSel && !isHl) {
        const cc = p.color(g.color);
        cc.setAlpha(100);
        p.stroke(cc);
      }
      p.noFill();
      p.circle(0, 0, g.r);

      if (isSel) {
        p.fill(g.color);
        p.textSize(11);
        p.textAlign(p.CENTER, p.CENTER);
        const labelX = g.r * 0.65 * Math.cos(-Math.PI / 3);
        const labelY = g.r * 0.65 * Math.sin(-Math.PI / 3);
        p.text(g.name, labelX, labelY);
      }
    }

    p.fill('#8b949e');
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('SU(3) — Strong (8 gluons, QCD)', 0, groups[0].r / 2 - 14);
    p.text('SU(2) — Weak (W,Z bosons)', 0, groups[1].r / 2 - 14);
    p.text('U(1) — EM (photon)', 0, groups[2].r / 2 - 14);
    p.text('Standard Model = SU(3) × SU(2) × U(1)', 0, groups[2].r / 2 + 24);
    p.text('19 free parameters. Dark matter? Neutrino masses?', 0, groups[2].r / 2 + 44);

    if (selGroup >= 0) {
      const g = groups[selGroup];
      p.fill(g.color);
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.text('═══ ' + g.force + ' Force ═══', 0, groups[2].r / 2 + 72);
      p.fill('#c9d1d9');
      p.textSize(11);
      p.text(g.particles, 0, groups[2].r / 2 + 92);
      p.fill('#8b949e');
      p.textSize(10);
      const words = g.detail.split('. ');
      words.forEach((w, j) => {
        p.text(w, 0, groups[2].r / 2 + 112 + j * 16);
      });
    }
  };

  p.mouseMoved = () => {
    const r = p.dist(0, 0, p.mouseX - p.width / 2, p.mouseY - p.height / 2);
    let nh = -1;
    for (let i = 0; i < groups.length - 1; i++) {
      if (r >= groups[i].r / 2 - 10 && r <= groups[i].r / 2 + 10) { nh = i; break; }
    }
    if (r >= groups[2].r / 2 - 10 && r <= groups[2].r / 2 + 10) nh = 2;
    if (nh !== hlGroup) {
      hlGroup = nh;
      const el = document.getElementById('sm-info');
      if (el) el.remove();
      if (hlGroup >= 0) {
        const d = document.createElement('p');
        d.id = 'sm-info';
        d.style.cssText = 'color:' + groups[hlGroup].color + ';font-size:13px;margin:4px';
        d.textContent = groups[hlGroup].name + ': ' + groups[hlGroup].particles;
        document.querySelector('.sketch-col')?.appendChild(d);
      }
    }
  };

  p.mouseClicked = () => {
    const r = p.dist(0, 0, p.mouseX - p.width / 2, p.mouseY - p.height / 2);
    for (let i = 0; i < groups.length; i++) {
      if (r >= groups[i].r / 2 - 14 && r <= groups[i].r / 2 + 14) {
        selGroup = selGroup === i ? -1 : i;
        return false;
      }
    }
    return false;
  };
};
new p5(s);
