import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let tape = [0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1];
  let head = 7;
  let state = 0;
  let flashTimer = 0;

  // Simple state machine: 3-state busy beaver-like
  // state 0: if read 0 → write 1, move right, go to state 1
  //         if read 1 → write 0, move left, go to state 2
  // state 1: if read 0 → write 1, move left, go to state 0
  //         if read 1 → write 1, move right, go to state 1
  // state 2: if read 0 → write 1, move right, go to state 0
  //         if read 1 → write 0, move right, go to state halt
  function step() {
    const read = tape[head];
    switch (state) {
      case 0:
        if (read === 0) { tape[head] = 1; head = Math.min(head + 1, tape.length - 1); state = 1; }
        else { tape[head] = 0; head = Math.max(head - 1, 0); state = 2; }
        break;
      case 1:
        if (read === 0) { tape[head] = 1; head = Math.max(head - 1, 0); state = 0; }
        else { tape[head] = 1; head = Math.min(head + 1, tape.length - 1); state = 1; }
        break;
      case 2:
        if (read === 0) { tape[head] = 1; head = Math.min(head + 1, tape.length - 1); state = 0; }
        else { tape[head] = 0; head = Math.min(head + 1, tape.length - 1); state = 3; }
        break;
    }
    flashTimer = 15;
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    const c = p.createCanvas(Math.min(600, p.windowWidth - 30), 400);
    c.parent('p5canvas');

    const hintRow = document.createElement('div');
    hintRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:6px 0';

    const stepBtn = document.createElement('button');
    stepBtn.textContent = '单步';
    stepBtn.style.cssText =
      'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:6px 16px;border-radius:8px;cursor:pointer;font-size:0.85em';
    stepBtn.addEventListener('click', step);
    hintRow.appendChild(stepBtn);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '重置';
    resetBtn.style.cssText =
      'background:#161b22;color:#f78166;border:1px solid #30363d;padding:6px 16px;border-radius:8px;cursor:pointer;font-size:0.85em';
    resetBtn.addEventListener('click', () => {
      tape = [0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1];
      head = 7;
      state = 0;
    });
    hintRow.appendChild(resetBtn);

    const hint = document.createElement('span');
    hint.style.cssText = 'color:#8b949e;font-size:0.78em;margin-left:4px;line-height:2.2';
    hint.textContent = 'Keyboard: Space=step  Click=flip bit  ←→ move head';
    hintRow.appendChild(hint);
    document.querySelector('.sketch-col')?.appendChild(hintRow);
  };

  p.draw = () => {
    p.background('#0d1117');
    const cw = 42;
    const sx = Math.max(5, (p.width - tape.length * cw) / 2);
    const y0 = 130;

    if (flashTimer > 0) flashTimer--;

    // Draw tape cells
    for (let i = 0; i < tape.length; i++) {
      const bx = sx + i * cw, by = y0;

      // Cell background
      if (i === head) {
        p.fill('#1a2a3a');
        p.stroke('#58a6ff');
        p.strokeWeight(2);
      } else if (tape[i] === 1) {
        p.fill('#1a2332');
        p.stroke('#30363d');
        p.strokeWeight(1);
      } else {
        p.fill('#161b22');
        p.stroke('#21262d');
        p.strokeWeight(0.8);
      }
      p.rect(bx, by, cw - 2, cw - 2, 5);

      // Cell value
      p.fill(tape[i] === 1 ? '#7ee787' : '#484f58');
      p.textSize(20);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(tape[i], bx + cw / 2, by + cw / 2);

      // Index
      p.fill('#484f58');
      p.textSize(10);
      p.text(i, bx + cw / 2, by + cw + 14);
    }

    // Head pointer — triangle above the current cell
    const hbx = sx + head * cw;
    p.fill('#f78166');
    p.noStroke();
    p.triangle(hbx + cw / 2, y0 - 16, hbx + cw / 2 - 8, y0 - 4, hbx + cw / 2 + 8, y0 - 4);

    // State info panel
    const px = 15, py = 8;
    p.fill('#0d1117');
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(px, py, 240, 72, 7);

    p.fill('#ffd33d');
    p.textSize(15);
    p.textAlign(p.LEFT, p.TOP);
    const stateNames = ['q₀', 'q₁', 'q₂', 'HALT'];
    p.text('State: ' + stateNames[state], px + 10, py + 10);

    p.fill('#c9d1d9');
    p.textSize(13);
    p.text('Head at cell ' + head + '  |  Reading: ' + tape[head], px + 10, py + 32);

    p.fill('#8b949e');
    p.textSize(11);
    p.text(
      state === 3
        ? 'HALTED — Turing demonstrated some programs NEVER halt (undecidable!)'
        : 'Space=Step  |  Click cell = flip bit  |  Arrows = move head',
      px + 10,
      py + 54
    );

    // Flash
    if (flashTimer > 0) {
      p.fill(255, 255, 255, flashTimer * 3);
      p.noStroke();
      p.rect(sx + head * cw - 2, y0 - 2, cw, cw, 5);
    }

    // Info at bottom
    p.fill('#c9d1d9');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      'Turing Machine: universal model of computation  |  Halting Problem: undecidable (Turing 1936)',
      15,
      p.height - 24
    );
  };

  p.keyPressed = () => {
    if (p.key === ' ' || p.keyCode === p.ENTER) {
      step();
    }
    if (p.keyCode === p.RIGHT_ARROW && head < tape.length - 1) {
      head++;
      flashTimer = 8;
    }
    if (p.keyCode === p.LEFT_ARROW && head > 0) {
      head--;
      flashTimer = 8;
    }
  };

  p.mousePressed = () => {
    const cw = 42;
    const sx = Math.max(5, (p.width - tape.length * cw) / 2);
    const y0 = 130;
    for (let i = 0; i < tape.length; i++) {
      const bx = sx + i * cw;
      if (
        p.mouseX >= bx &&
        p.mouseX <= bx + cw &&
        p.mouseY >= y0 &&
        p.mouseY <= y0 + cw
      ) {
        tape[i] = 1 - tape[i];
        flashTimer = 10;
        return;
      }
    }
  };
};

new p5(sketch);
