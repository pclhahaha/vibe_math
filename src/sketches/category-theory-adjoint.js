import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  // Objects: 3 sets on top (category C=Set), 3 groups on bottom (category D=Grp)
  const sets = [
    { x: 100, y: 80, label: '{a,b}', size: 2, id: 'X' },
    { x: 260, y: 60, label: '{x,y,z}', size: 3, id: 'Y' },
    { x: 420, y: 90, label: '{p}', size: 1, id: 'Z' },
  ];
  const groups = [
    { x: 100, y: 270, label: 'Z/2Z', order: 2, id: 'FX' },
    { x: 260, y: 250, label: 'S₃', order: 6, id: 'FY' },
    { x: 420, y: 280, label: 'Z', order: Infinity, id: 'FZ' },
  ];

  let selectedSet = -1;
  let selectedGroup = -1;
  let showMorphism = false;
  let morphAnim = 0;
  let pulseTimer = 0;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(540, p.windowWidth - 30), 420).parent('p5canvas');

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:2px 0 0 4px';
    hint.textContent = 'Click objects above (Set) or below (Grp) — see F ⊣ G correspondence';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    if (pulseTimer > 0) pulseTimer--;
    if (showMorphism) morphAnim = p.constrain(morphAnim + 0.03, 0, 1);

    // Category labels
    p.fill('#8b949e');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Category C (Set)', 20, 18);
    p.text('Category D (Grp)', 20, 198);

    // Divider line
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.line(10, 180, p.width - 10, 180);

    // Functor labels
    p.fill('#8b949e');
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('F: Free Group ↓', p.width / 2 - 80, 190);
    p.text('G: Forgetful (underlying set) ↑', p.width / 2 + 80, 190);

    // Draw sets (top)
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      drawSet(s, i);
    }

    // Draw groups (bottom)
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      drawGroup(g, i);
    }

    // Draw functor connections (F: set → free group)
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i], g = groups[i];
      p.stroke('#58a6ff');
      p.strokeWeight(1.5);
      p.drawingContext.setLineDash([3, 6]);
      const midX = (s.x + g.x) / 2;
      const midY = (s.y + 35 + g.y - 35) / 2;
      p.line(s.x, s.y + 35, g.x, g.y - 35);
      p.fill('#58a6ff');
      p.noStroke();
      p.textSize(10);
      p.text('F', midX + 10, midY);
      p.drawingContext.setLineDash([]);
    }

    // Draw adjunction bijection if objects are selected
    if (selectedSet >= 0 && selectedGroup >= 0) {
      const s = sets[selectedSet];
      const g = groups[selectedGroup];
      drawAdjunction(s, g);
    }

    // Legend
    p.fill('#8b949e');
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text('F ⊣ G  ⇔  Hom_D(FX, Y) ≅ Hom_C(X, GY)', 20, p.height - 30);
  };

  function drawSet(s, i) {
    const r = 22 + s.size * 4;
    const mx = p.mouseX, my = p.mouseY;
    const hover = p.dist(mx, my, s.x, s.y) < r;

    // Circle
    if (i === selectedSet) {
      p.fill('#f78166');
      p.noStroke();
    } else if (hover) {
      p.fill('#1a2a3a');
      p.stroke('#58a6ff');
      p.strokeWeight(2);
    } else {
      p.fill('#161b22');
      p.stroke('#30363d');
      p.strokeWeight(1);
    }
    p.circle(s.x, s.y, r * 2);

    // Elements inside
    p.fill('#7ee787');
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(s.label, s.x, s.y);

    // Size marker
    p.fill('#8b949e');
    p.textSize(10);
    p.text('|' + s.id + '|=' + s.size, s.x, s.y + r + 14);
  }

  function drawGroup(g, i) {
    const r = 25;
    const mx = p.mouseX, my = p.mouseY;
    const hover = p.dist(mx, my, g.x, g.y) < r;

    if (i === selectedGroup) {
      p.fill('#f78166');
      p.noStroke();
    } else if (hover) {
      p.fill('#1a2a3a');
      p.stroke('#58a6ff');
      p.strokeWeight(2);
    } else {
      p.fill('#161b22');
      p.stroke('#30363d');
      p.strokeWeight(1);
    }
    p.circle(g.x, g.y, r * 2);

    p.fill('#58a6ff');
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(g.label, g.x, g.y);

    // Order
    p.fill('#8b949e');
    p.textSize(10);
    p.text(
      '|' + g.id + '|=' + (g.order === Infinity ? '∞' : g.order),
      g.x,
      g.y + r + 14
    );
  }

  function drawAdjunction(s, g) {
    // Show the natural bijection
    const midY = (s.y + 35 + g.y - 35) / 2;
    const midX = p.width / 2;
    const topY = midY - 60;
    const botY = midY + 40;

    // Hom sets as boxes
    p.fill('#0d1117');
    p.stroke('#58a6ff');
    p.strokeWeight(1.5);
    p.rect(midX - 110, topY - 16, 220, 30, 6);

    p.fill('#0d1117');
    p.stroke('#f78166');
    p.strokeWeight(1.5);
    p.rect(midX - 110, botY - 16, 220, 30, 6);

    // Labels
    p.fill('#58a6ff');
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Hom_D(F' + s.id + ', ' + g.id + ')', midX, topY);

    p.fill('#f78166');
    p.text('Hom_C(' + s.id + ', G' + g.id + ')', midX, botY);

    // Bijection arrow
    const arrowY = (topY + botY) / 2;
    p.stroke('#ffd33d');
    p.strokeWeight(2);
    p.line(midX - 80, topY + 20, midX - 80, botY - 20);

    // Arrow animation
    const arrowPos = 0.5 + 0.4 * p.sin(p.frameCount * 0.08);
    const aY = p.map(arrowPos, 0, 1, topY + 18, botY - 18);
    p.fill('#ffd33d');
    p.noStroke();
    p.circle(midX - 80, aY, 5);
    // Arrowhead
    p.triangle(
      midX - 80, botY - 20,
      midX - 86, botY - 28,
      midX - 74, botY - 28
    );

    p.fill('#ffd33d');
    p.textSize(10);
    p.text('≅', midX - 60, (topY + botY) / 2);

    // Explanation
    p.fill('#8b949e');
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(
      'Every group homomorphism FX → ' + g.id + ' corresponds to',
      midX,
      topY + 40
    );
    p.text(
      'a unique set function ' + s.id + ' → G' + g.id + ' (underlying set)',
      midX,
      topY + 56
    );
  }

  p.mousePressed = () => {
    // Check set clicks
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      if (p.dist(p.mouseX, p.mouseY, s.x, s.y) < 30) {
        selectedSet = i;
        morphAnim = 0;
        return;
      }
    }
    // Check group clicks
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (p.dist(p.mouseX, p.mouseY, g.x, g.y) < 30) {
        selectedGroup = i;
        morphAnim = 0;
        return;
      }
    }
  };
};

new p5(sketch);
