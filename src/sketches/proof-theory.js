import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let step = 0;
  let proofStep = 0;
  let cutStep = 0;
  let pulse = 0;

  const examples = [
    { prop: 'A → (B → A)', type: 'A → B → A', term: 'λa. λb. a', name: 'Const' },
    { prop: '(A → B → C) → (A → B) → A → C', type: '(A → B → C) → (A → B) → A → C', term: 'λf. λg. λx. f x (g x)', name: 'S-combinator' },
    { prop: '¬¬A → A', type: '((A → ⊥) → ⊥) → A', term: 'λk. k ??? — NOT provable!', name: 'DNE (classical)' },
  ];

  const constProofSteps = [
    ['[A]¹', 'Assume A'],
    ['──── WS', 'Weakening'],
    ['B → A', 'Implication from B'],
    ['────── →I¹', 'Discharge [A]¹'],
    ['A → (B → A)', 'Complete!'],
  ];

  const sCombProofSteps = [
    ['[A→B→C]¹  [A→B]²  [A]³', 'Three assumptions'],
    ['────────   ──────', '→ Elimination'],
    ['B→C        B', 'Resolved'],
    ['──────────────', '→ Elimination'],
    ['      C', 'Goal reached'],
    ['────── →I³', 'Discharge [A]³'],
    ['A → C', '→ Introduction'],
    ['────── →I²', 'Discharge [A→B]²'],
    ['(A→B) → A → C', '→ Introduction'],
    ['────── →I¹', 'Discharge [A→B→C]¹'],
    ['(A→B→C) → (A→B) → A → C', 'Complete!'],
  ];

  const proofTrees = step === 0 ? constProofSteps : (step === 1 ? sCombProofSteps : []);

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(540, p.windowWidth - 40), 420).parent('p5canvas');

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin:4px 0';

    examples.forEach((ex, i) => {
      const btn = document.createElement('button');
      btn.textContent = ex.name;
      btn.style.cssText =
        'background:#161b22;color:' +
        (i === 0 ? '#58a6ff' : '#8b949e') +
        ';border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;font-size:0.8em';
      btn.addEventListener('click', () => {
        step = i;
        proofStep = 0;
        cutStep = 0;
        pulse = 1;
      });
      btnRow.appendChild(btn);
    });
    document.querySelector('.sketch-col')?.appendChild(btnRow);
  };

  p.mouseClicked = () => {
    const ex = examples[step];
    if (step === 0 || step === 1) {
      if (p.mouseY > 120 && p.mouseY < 260 && p.mouseX > 20 && p.mouseX < 240) {
        proofStep = (proofStep + 1) % (proofTrees.length + 1);
        if (proofStep >= proofTrees.length) proofStep = 0;
        return false;
      }
    }
    if (step === 2) {
      if (p.mouseY > 120 && p.mouseY < 260 && p.mouseX > 20 && p.mouseX < 240) {
        cutStep = (cutStep + 1) % 4;
        return false;
      }
    }
    return false;
  };

  p.draw = () => {
    p.background('#0d1117');
    if (pulse > 0) pulse -= 0.02;
    const ex = examples[step];
    const cx = p.width / 2;

    const yProp = 55;
    p.fill('#161b22');
    p.stroke('#58a6ff');
    p.strokeWeight(2);
    p.rect(cx - 220, yProp, 440, 50, 8);

    p.fill('#58a6ff');
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Proposition:  ' + ex.prop, cx, yProp + 16);
    p.fill('#8b949e');
    p.textSize(10);
    p.text('(= Type)', cx, yProp + 38);

    p.stroke('#58a6ff');
    p.strokeWeight(2);
    p.line(cx - 60, yProp + 52, cx - 60, yProp + 82);

    const yProof = 130;
    p.fill('#161b22');
    p.stroke('#f78166');
    p.strokeWeight(2);
    p.rect(20, yProof, 220, 120, 8);

    p.fill('#f78166');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);

    if (step === 0) {
      if (proofStep === 0) {
        p.fill('#8b949e');
        p.textSize(13);
        p.text('Click proof tree →', 40, yProof + 40);
        p.text('to build step-by-step', 40, yProof + 60);
      } else {
        for (let i = 0; i < proofStep && i < constProofSteps.length; i++) {
          p.fill(i === proofStep - 1 ? '#ffd33d' : '#f78166');
          p.text(constProofSteps[i][0], 30, yProof + 10 + i * 22);
        }
        p.fill('#8b949e');
        p.textSize(11);
        p.text(constProofSteps[proofStep - 1][1], 30, yProof + 6 + (proofStep - 1) * 22 + 16);
      }
    } else if (step === 1) {
      if (proofStep === 0) {
        p.fill('#8b949e');
        p.textSize(13);
        p.text('Click proof tree →', 40, yProof + 40);
        p.text('to build step-by-step', 40, yProof + 60);
      } else {
        for (let i = 0; i < proofStep && i < sCombProofSteps.length; i++) {
          p.fill(i === proofStep - 1 ? '#ffd33d' : '#f78166');
          p.text(sCombProofSteps[i][0], 30, yProof + 10 + i * 11);
        }
        p.fill('#8b949e');
        p.textSize(11);
        p.text(sCombProofSteps[proofStep - 1][1], 30, yProof + 4 + (proofStep - 1) * 11 + 9);
      }
    } else {
      if (cutStep === 0) {
        p.fill('#f78166');
        p.text('¬¬A (assume)', 30, yProof + 10);
        p.text('── RAA', 30, yProof + 30);
        p.text('  A', 30, yProof + 50);
        p.text('─────── →I', 30, yProof + 70);
        p.text('¬¬A → A (classical!)', 30, yProof + 90);
        p.fill('#8b949e');
        p.textSize(11);
        p.text('Click for cut elimination', 30, yProof + 108);
      } else if (cutStep === 1) {
        p.fill('#f78166');
        p.textSize(11);
        p.text('Cut: proof with lemma', 30, yProof + 14);
        p.text('... ⊢ ¬¬A   [¬¬A]⊢A', 30, yProof + 34);
        p.text('──────── Cut', 30, yProof + 54);
        p.text('  ... ⊢ A', 30, yProof + 74);
        p.fill('#ffd33d');
        p.textSize(10);
        p.text('Cut Elim: push A into proof', 30, yProof + 96);
      } else if (cutStep === 2) {
        p.fill('#f78166');
        p.textSize(11);
        p.text('After elimination:', 30, yProof + 14);
        p.text('  ... ⊢ A  (direct!)', 30, yProof + 34);
        p.text('  ─── →I', 30, yProof + 54);
        p.text('¬¬A → A', 30, yProof + 74);
        p.fill('#ffd33d');
        p.textSize(10);
        p.text('Proof without cuts!', 30, yProof + 96);
      } else if (cutStep === 3) {
        p.fill('#f78166');
        p.textSize(11);
        p.text('Gentzen\'s Hauptsatz (1935):', 30, yProof + 14);
        p.text('Every proof can be transformed', 30, yProof + 34);
        p.text('into a cut-free proof.', 30, yProof + 54);
        p.fill('#ffd33d');
        p.textSize(10);
        p.text('Consistency proof for PA', 30, yProof + 96);
      }
    }

    p.stroke('#f78166');
    p.strokeWeight(2);
    const arrY = yProof + 135;
    p.line(100, arrY, 100, arrY + 30);
    p.line(100, arrY + 30, 280, arrY + 30);
    p.line(280, arrY + 30, 280, arrY + 50);

    p.fill('#161b22');
    p.stroke('#7ee787');
    p.strokeWeight(2);
    p.rect(260, yProof + 50, 220, 70, 8);

    p.fill('#7ee787');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text('λ-term (= Program)', 270, yProof + 58);
    p.fill('#c9d1d9');
    p.text(ex.term, 270, yProof + 80);

    const bridgeY = 300;
    p.fill('#161b22');
    p.stroke('#ffd33d');
    p.strokeWeight(2);
    p.rect(cx - 240, bridgeY, 480, 100, 8);

    p.fill('#ffd33d');
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Curry-Howard Isomorphism', cx, bridgeY + 10);

    p.fill('#8b949e');
    p.textSize(12);
    const table = [
      ['Proposition            ↔  Type', '#58a6ff'],
      ['Proof                  ↔  Term (program)', '#f78166'],
      ['→ Introduction        ↔  λ-abstraction', '#7ee787'],
      ['Cut Elimination        ↔  β-reduction (evaluation!)', '#ffd33d'],
    ];
    table.forEach((row, i) => {
      p.fill(row[1]);
      p.text(row[0], cx, bridgeY + 32 + i * 16);
    });

    if (pulse > 0) {
      p.fill(255, 255, 255, pulse * 40);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
    }
  };
};

new p5(sketch);
