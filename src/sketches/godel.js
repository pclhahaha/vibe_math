import p5 from 'p5';
const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let stage = 0;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(520, p.windowWidth - 40), 430).parent('p5canvas');
    p.mousePressed = () => { stage = (stage + 1) % 4; };
    const col = document.querySelector('.sketch-col');
    const lbl = document.createElement('span');
    lbl.style.cssText = 'color:#8b949e;font-size:11px;margin:4px 8px;display:block';
    lbl.textContent = 'Click canvas to step: 1=Gödel numbering → 2=diagonal → 3=self-reference';
    col.appendChild(lbl);
  };

  p.draw = () => {
    p.background('#0d1117');
    const cx = p.width / 2;

    p.fill('#c9d1d9');
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Gödel's Incompleteness: Truth > Proof", cx, 8);
    p.fill('#8b949e');
    p.textSize(12);
    p.text(`Stage ${stage} — ${['Overview', 'Gödel Numbering', 'Diagonal Argument', 'Self-Reference'][stage]}`, cx, 26);

    if (stage === 0) {
      p.translate(cx, 190);
      const levels = [['PA', 150, '#58a6ff'], ['ZFC', 110, '#f78166'], ['ZFC+LC', 70, '#7ee787']];
      for (const [n, r, c] of levels) {
        p.noFill(); p.stroke(c); p.strokeWeight(2); p.circle(0, 0, r * 2);
        p.fill(c); p.noStroke(); p.textSize(12); p.textAlign(p.CENTER, p.CENTER); p.text(n, 0, r + 12);
      }
      const t = p.frameCount * 0.015;
      p.fill('#ffd33d'); p.noStroke(); p.circle(80 * Math.cos(t), 40 * Math.sin(t), 10);
      p.fill('#ffd33d'); p.textSize(12); p.text('G:"I am unprovable"', 90 * Math.cos(t), 46 * Math.sin(t));
      p.textAlign(p.CENTER, p.TOP); p.fill('#8b949e'); p.textSize(12);
      p.text('Any consistent formal system containing arithmetic', 0, 170);
      p.text('contains true statements it cannot prove.', 0, 186);
    }

    if (stage === 1) {
      p.textAlign(p.LEFT, p.TOP); p.textSize(13);
      p.fill('#58a6ff'); p.text('Symbol  →  Gödel #', 30, 50);
      const symbols = ['0→1','S→3','=→5','¬→7','∧→9','∀→11','x→13','y→15','(→17',')→19','∃→21'];
      symbols.forEach((s, i) => {
        p.fill(i < 6 ? '#c9d1d9' : '#8b949e');
        p.text(s, 30 + (i % 5) * 92, 70 + Math.floor(i / 5) * 22);
      });
      p.fill('#f78166'); p.textSize(13);
      p.text('Formula: ¬Provable(y,y)  →  2⁷×3¹⁹×5¹³×...', 30, 120);
      p.fill('#7ee787'); p.textSize(12);
      p.text('Gödel numbering turns syntax into arithmetic', 30, 142);
      p.stroke('#30363d'); p.line(30, 160, p.width - 30, 160);
      p.fill('#8b949e'); p.textSize(12);
      p.text('Key insight: "x proves y" (metamathematics)', 30, 172);
      p.text('becomes a number relation inside the system.', 30, 190);
    }

    if (stage === 2) {
      p.textAlign(p.LEFT, p.TOP); p.textSize(13);
      p.fill('#58a6ff'); p.text('List all 1-variable formulas: F₁(x), F₂(x), F₃(x), ...', 20, 44);
      const n = 6;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const isDiag = i === j;
          p.fill(isDiag ? '#f78166' : '#8b949e');
          p.textSize(isDiag ? 13 : 11);
          p.text(isDiag ? `[F${i+1}(${j+1})]` : `F${i+1}(${j+1})`, 20 + j * 60, 64 + i * 24);
        }
      }
      p.stroke('#f78166'); p.strokeWeight(1.5);
      p.drawingContext.setLineDash([4, 4]);
      p.line(18, 64, 40 + (n - 1) * 60, 64 + (n - 1) * 24);
      p.drawingContext.setLineDash([]);
      p.fill('#7ee787'); p.textSize(12);
      p.text('The diagonal: apply each formula to its own number', 20, 64 + n * 24 + 6);
      p.fill('#8b949e'); p.textSize(12);
      p.text('Define G(x) = "Fₓ(⌜Fₓ⌝) is not provable", k = ⌜G⌝', 20, 64 + n * 24 + 28);
      p.text('→ G(k) asserts its own unprovability — the heart of the proof', 20, 64 + n * 24 + 50);
    }

    if (stage === 3) {
      p.translate(cx, 150);
      p.noFill(); p.stroke('#f78166'); p.strokeWeight(3); p.circle(0, 0, 120);
      p.noFill(); p.stroke('#58a6ff'); p.strokeWeight(2); p.circle(0, 0, 140);
      const pulse = 1 + 0.08 * Math.sin(p.frameCount * 0.05);
      p.fill('#ffd33d'); p.noStroke(); p.textSize(14 * pulse);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('G: "I am not provable"', 0, 0);
      p.textAlign(p.CENTER, p.TOP);
      p.fill('#8b949e'); p.textSize(12);
      p.text('If G provable → system proves false → INCONSISTENT', 0, 80);
      p.text('If ¬G provable → "G provable" true → INCONSISTENT', 0, 100);
      p.text('If neither → G is TRUE but UNPROVABLE → INCOMPLETE', 0, 120);
      p.fill('#7ee787'); p.textSize(13);
      p.text('2nd Theorem: No consistent system proves its own consistency', 0, 150);
    }
  };
};
new p5(sketch);
