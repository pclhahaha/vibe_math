import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  // Gate definitions: each gate is a rotation axis and angle
  const gates = {
    H: { axis: [1, 0, 1], angle: Math.PI, name: 'Hadamard', desc: 'Create superposition' },
    X: { axis: [1, 0, 0], angle: Math.PI, name: 'Pauli-X', desc: 'Bit flip' },
    Y: { axis: [0, 1, 0], angle: Math.PI, name: 'Pauli-Y', desc: 'Bit + phase flip' },
    Z: { axis: [0, 0, 1], angle: Math.PI, name: 'Pauli-Z', desc: 'Phase flip' },
    S: { axis: [0, 0, 1], angle: Math.PI / 2, name: 'S (Phase)', desc: 'π/2 phase' },
    T: { axis: [0, 0, 1], angle: Math.PI / 4, name: 'T (π/8)', desc: 'π/4 phase' },
  };

  // Circuit state
  let circuit = []; // list of applied gates
  let currentState = { theta: 0, phi: 0 }; // starts at |0⟩
  let rotX = 0.4, rotY = 0.3;
  let dragging = false, prevX = 0, prevY = 0;

  // Apply a gate rotation to the current state
  function applyGate(state, gate) {
    // Convert state to Bloch vector
    const sx = Math.sin(state.theta) * Math.cos(state.phi);
    const sy = Math.sin(state.theta) * Math.sin(state.phi);
    const sz = Math.cos(state.theta);

    // Normalize axis
    const axis = gate.axis;
    const len = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
    const ax = axis[0] / len, ay = axis[1] / len, az = axis[2] / len;

    // Rodriguez rotation formula
    const a = gate.angle;
    const cosA = Math.cos(a), sinA = Math.sin(a);
    const dot = sx * ax + sy * ay + sz * az;
    const crossX = sy * az - sz * ay;
    const crossY = sz * ax - sx * az;
    const crossZ = sx * ay - sy * ax;

    const rx = sx * cosA + crossX * sinA + ax * dot * (1 - cosA);
    const ry = sy * cosA + crossY * sinA + ay * dot * (1 - cosA);
    const rz = sz * cosA + crossZ * sinA + az * dot * (1 - cosA);

    return {
      theta: Math.acos(p.constrain(rz, -1, 1)),
      phi: Math.atan2(ry, rx),
    };
  }

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(520, 510, p.WEBGL).parent('p5canvas');

    // Gate buttons — build a circuit by clicking
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin:4px 0;';
    Object.entries(gates).forEach(([key, g]) => {
      const btn = document.createElement('button');
      btn.textContent = key;
      btn.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:2px;font-size:0.82em';
      btn.addEventListener('click', () => {
        circuit.push(key);
        currentState = applyGate(currentState, g);
      });
      btnRow.appendChild(btn);
    });
    document.querySelector('.sketch-col')?.appendChild(btnRow);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '重置';
    resetBtn.style.cssText =
      'background:#161b22;color:#f78166;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:2px;font-size:0.82em';
    resetBtn.addEventListener('click', () => {
      circuit = [];
      currentState = { theta: 0, phi: 0 };
    });
    document.querySelector('.sketch-col')?.appendChild(resetBtn);

    const undoBtn = document.createElement('button');
    undoBtn.textContent = '撤销';
    undoBtn.style.cssText =
      'background:#161b22;color:#8b949e;border:1px solid #30363d;padding:5px 14px;border-radius:6px;cursor:pointer;margin:2px;font-size:0.82em';
    undoBtn.addEventListener('click', () => {
      if (circuit.length === 0) return;
      circuit.pop();
      // Recompute state from scratch
      currentState = { theta: 0, phi: 0 };
      for (const gKey of circuit) {
        currentState = applyGate(currentState, gates[gKey]);
      }
    });
    document.querySelector('.sketch-col')?.appendChild(undoBtn);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.rotateX(rotX);
    p.rotateY(rotY);

    const R = 130;

    // Sphere
    p.stroke('#141920');
    p.strokeWeight(0.5);
    p.noFill();
    p.sphere(R, 20, 12);

    // Equator
    p.stroke('#30363d');
    p.strokeWeight(1.2);
    p.noFill();
    p.beginShape();
    for (let a = 0; a <= p.TWO_PI; a += 0.03) {
      p.vertex(R * Math.cos(a), R * Math.sin(a), 0);
    }
    p.endShape();

    // Coordinate axes
    p.stroke('#484f58');
    p.strokeWeight(0.5);
    p.line(-R - 15, 0, 0, R + 15, 0, 0);
    p.line(0, -R - 15, 0, 0, R + 15, 0);
    p.line(0, 0, -R - 15, 0, 0, R + 15);

    // X-axis label
    p.fill('#f78166');
    p.textSize(13);
    p.textAlign(p.CENTER, p.CENTER);
    p.push();
    p.translate(R + 18, 0, 0);
    p.text('X', 0, 0);
    p.pop();

    // Y-axis label
    p.fill('#7ee787');
    p.push();
    p.translate(0, R + 18, 0);
    p.text('Y', 0, 0);
    p.pop();

    // Z-axis label
    p.fill('#58a6ff');
    p.push();
    p.translate(0, 0, R + 18);
    p.text('Z', 0, 0);
    p.pop();

    // |0⟩ and |1⟩ labels
    p.fill('#8b949e');
    p.textSize(14);
    p.push();
    p.translate(0, -R - 14, 0);
    p.text('|0⟩', 0, 0);
    p.pop();
    p.push();
    p.translate(0, R + 14, 0);
    p.text('|1⟩', 0, 0);
    p.pop();

    // Current state vector
    const sx = R * Math.sin(currentState.theta) * Math.cos(currentState.phi);
    const sy = R * Math.sin(currentState.theta) * Math.sin(currentState.phi);
    const sz = R * Math.cos(currentState.theta);

    p.stroke('#ffd33d');
    p.strokeWeight(4);
    p.line(0, 0, 0, sx, sy, sz);
    p.fill('#ffd33d');
    p.noStroke();
    p.push();
    p.translate(sx, sy, sz);
    p.sphere(7);
    p.pop();

    // Draw gate rotation axes (thin, color-coded)
    for (const gKey of circuit.slice(-4)) {
      const g = gates[gKey];
      const ax = g.axis[0] / Math.sqrt(g.axis[0] ** 2 + g.axis[1] ** 2 + g.axis[2] ** 2);
      const ay = g.axis[1] / Math.sqrt(g.axis[0] ** 2 + g.axis[1] ** 2 + g.axis[2] ** 2);
      const az = g.axis[2] / Math.sqrt(g.axis[0] ** 2 + g.axis[1] ** 2 + g.axis[2] ** 2);
      p.stroke('#58a6ff');
      p.strokeWeight(1.5);
      p.drawingContext.setLineDash([3, 5]);
      p.line(-ax * R * 1.1, -ay * R * 1.1, -az * R * 1.1, ax * R * 1.1, ay * R * 1.1, az * R * 1.1);
      p.drawingContext.setLineDash([]);
    }

    // UI
    p.push();
    p.resetMatrix();

    // Circuit panel
    p.fill('#0d1117');
    p.stroke('#30363d');
    p.strokeWeight(1);
    p.rect(10, 10, 210, 55, 6);

    p.fill('#7ee787');
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    const circuitStr = circuit.length > 0 ? circuit.join(' → ') : '(empty)';
    p.text('Circuit: ' + circuitStr, 20, 18);

    const lastGate = circuit.length > 0 ? circuit[circuit.length - 1] : '';
    const gateInfo = lastGate ? gates[lastGate] : null;
    p.fill('#8b949e');
    p.textSize(12);
    p.text(
      'State: |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩',
      20,
      36
    );
    p.text(
      `θ = ${((currentState.theta * 180) / Math.PI).toFixed(0)}°  φ = ${((currentState.phi * 180) / Math.PI).toFixed(0)}°  gates: ${circuit.length}`,
      20,
      52
    );

    // Gate description
    if (gateInfo) {
      p.fill('#ffd33d');
      p.textSize(11);
      p.text(lastGate + ' = ' + gateInfo.name + ': ' + gateInfo.desc, 20, 68);
    }

    p.fill('#484f58');
    p.textSize(10);
    p.text('Build a gate sequence — each gate = Bloch sphere rotation', 14, 88);
    p.pop();
  };

  p.mousePressed = () => {
    dragging = true;
    prevX = p.mouseX;
    prevY = p.mouseY;
  };
  p.mouseReleased = () => (dragging = false);
  p.mouseDragged = () => {
    if (!dragging) return;
    rotY += (p.mouseX - prevX) * 0.008;
    rotX += (p.mouseY - prevY) * 0.008;
    rotX = p.constrain(rotX, -p.PI / 2, p.PI / 2);
    prevX = p.mouseX;
    prevY = p.mouseY;
  };
};

new p5(sketch);
