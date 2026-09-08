// PDE — Heat vs Wave: finite-difference evolution of the same initial profile
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  // ---------- physics parameters ----------
  const L = Math.PI; // rod / string length
  const ALPHA = 0.15; // heat diffusivity
  const C = 1.0; // wave speed
  const T_MAX = 6.4; // shared time axis
  const N = 240; // spatial cells
  const FRAMES = 200;

  let shape = 'pulse'; // pulse | bump | sine
  let playing = true;
  let tFrac = 0;

  // stored frame stacks: heatFrames[f][i], waveFrames[f][i]
  let heatFrames = [];
  let waveFrames = [];
  let initHeat = [];
  let playingBtn = null;

  const dx = L / N;

  // ---------- initial profiles (zero at both ends, height <= 1) ----------
  function buildInit() {
    const f = new Array(N + 1);
    const center = (a, b, h) => {
      for (let i = 0; i <= N; i++) {
        const x = i * dx;
        f[i] = x >= a && x <= b ? h : 0;
      }
    };
    if (shape === 'pulse') {
      center(L * 0.28, L * 0.62, 1);
    } else if (shape === 'bump') {
      // smooth bump: sin^2 shaped, zero at endpoints of its support
      for (let i = 0; i <= N; i++) {
        const x = i * dx;
        const t = p.constrain((x - L * 0.2) / (L * 0.6 - L * 0.2), 0, 1);
        f[i] = Math.sin(Math.PI * t) ** 2;
      }
    } else {
      // half sine wave
      for (let i = 0; i <= N; i++) {
        const x = i * dx;
        f[i] = Math.sin((Math.PI * x) / L);
      }
    }
    return f;
  }

  // ---------- solvers ----------
  function solveHeat(f0) {
    const frames = [];
    const u = f0.slice();
    const dt = (0.45 * dx * dx) / ALPHA; // stable: alpha*dt/dx^2 <= 0.5
    const total = Math.round(T_MAX / dt);
    const perFrame = Math.max(1, Math.round(total / FRAMES));
    let step = 0;
    const scratch = new Array(N + 1);
    for (let f = 0; f < FRAMES; f++) {
      for (let s = 0; s < perFrame && step < total; s++, step++) {
        for (let i = 1; i < N; i++) {
          scratch[i] = u[i] + (ALPHA * dt) / (dx * dx) * (u[i + 1] - 2 * u[i] + u[i - 1]);
        }
        scratch[0] = 0;
        scratch[N] = 0;
        for (let i = 0; i <= N; i++) u[i] = scratch[i];
      }
      frames.push(u.slice());
    }
    return frames;
  }

  // ---- correct wave solver: leapfrog (Verlet) with zero-velocity start ----
  function solveWaveVerlet(f0) {
    const frames = [];
    let uPrev = f0.slice();
    let uCurr = f0.slice();
    const dt = 0.9 * dx / C;
    const nu = (C * C * dt * dt) / (dx * dx);
    const total = Math.round(T_MAX / dt);
    const perFrame = Math.max(1, Math.round(total / FRAMES));
    let step = 0;
    frames.push(uCurr.slice());
    // first step: velocity 0 => u(t+dt)=u(t)+0.5*a*dt^2 style; use u(t+dt)=u + (dt^2/2) u_xx for first step then leapfrog
    for (let f = 1; f < FRAMES; f++) {
      for (let s = 0; s < perFrame && step < total; s++, step++) {
        const uNext = new Array(N + 1).fill(0);
        if (step === 0) {
          for (let i = 1; i < N; i++) {
            uNext[i] = uCurr[i] + (nu / 2) * (uCurr[i + 1] - 2 * uCurr[i] + uCurr[i - 1]);
          }
        } else {
          for (let i = 1; i < N; i++) {
            uNext[i] =
              2 * uCurr[i] - uPrev[i] + nu * (uCurr[i + 1] - 2 * uCurr[i] + uCurr[i - 1]);
          }
        }
        uNext[0] = 0;
        uNext[N] = 0;
        uPrev = uCurr;
        uCurr = uNext;
      }
      frames.push(uCurr.slice());
    }
    return frames;
  }

  function recompute() {
    const f0 = buildInit();
    initHeat = f0.slice();
    heatFrames = solveHeat(f0);
    waveFrames = solveWaveVerlet(f0);
  }

  // ---------- setup ----------
  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(560, p.windowWidth - 40), 470).parent('p5canvas');

    const ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:6px 0';
    [
      ['pulse', '方波脉冲'],
      ['bump', '光滑鼓包'],
      ['sine', '正弦半波'],
    ].forEach(([key, label]) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        'background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:2px';
      b.addEventListener('click', () => {
        shape = key;
        tFrac = 0;
        recompute();
        if (sl) sl.value = 0;
        playing = true;
      });
      ctrl.appendChild(b);
    });
    playingBtn = document.createElement('button');
    playingBtn.textContent = '⏸ 暂停';
    playingBtn.style.cssText =
      'background:#161b22;color:#ffd33d;border:1px solid #30363d;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:2px';
    playingBtn.addEventListener('click', () => {
      playing = !playing;
      playingBtn.textContent = playing ? '⏸ 暂停' : '▶ 播放';
    });
    ctrl.appendChild(playingBtn);
    document.querySelector('.sketch-col')?.appendChild(ctrl);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin:4px 2px';
    const lab = document.createElement('span');
    lab.style.cssText = 'color:#8b949e;font-size:0.78em';
    lab.textContent = '时间 t：';
    row.appendChild(lab);
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0';
    sl.max = '1';
    sl.step = '0.001';
    sl.value = '0';
    sl.style.cssText = 'width:180px;accent-color:#58a6ff;cursor:pointer';
    sl.addEventListener('input', () => {
      playing = false;
      playingBtn.textContent = '▶ 播放';
      tFrac = parseFloat(sl.value);
    });
    row.appendChild(sl);
    const val = document.createElement('span');
    val.style.cssText = 'color:#58a6ff;font-size:0.78em;width:70px';
    row.appendChild(val);
    document.querySelector('.sketch-col')?.appendChild(row);

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.7em;margin:2px 4px';
    hint.textContent =
      '同一初值，分别按热方程（上，不可逆）与波动方程（下，可逆）演化。拖动时间轴或播放对比。虚线 = 初始形状。';
    document.querySelector('.sketch-col')?.appendChild(hint);

    recompute();
  };

  // ---------- drawing ----------
  function panelHeader(y, title, note) {
    p.noStroke();
    p.fill('#c9d1d9');
    p.textSize(12.5);
    p.textAlign(p.LEFT, p.TOP);
    p.text(title, 10, y);
    p.fill('#8b949e');
    p.textSize(11);
    p.text(note, p.width * 0.42, y);
  }

  function plotCurve(frames, init, y0, H, color, label) {
    const frame = frames[Math.min(frames.length - 1, Math.floor(tFrac * (frames.length - 1)))];
    // axis baseline
    p.stroke('#2d333b');
    p.strokeWeight(1);
    p.line(24, y0 + H, p.width - 24, y0 + H);
    // initial (dashed)
    p.stroke('#484f58');
    p.strokeWeight(1);
    p.setLineDash([3, 3]);
    p.beginShape();
    for (let i = 0; i <= N; i++) {
      p.vertex(24 + (i / N) * (p.width - 48), y0 + H - init[i] * (H - 26));
    }
    p.endShape();
    p.setLineDash([]);
    // current
    p.stroke(color);
    p.strokeWeight(2.2);
    p.noFill();
    p.beginShape();
    for (let i = 0; i <= N; i++) {
      p.vertex(24 + (i / N) * (p.width - 48), y0 + H - frame[i] * (H - 26));
    }
    p.endShape();
    // t readout
    const t = tFrac * T_MAX;
    p.noStroke();
    p.fill(color);
    p.textSize(11);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(label + ' t=' + t.toFixed(2), p.width - 28, y0 + 2);
  }

  p.draw = () => {
    p.background('#0d1117');

    if (playing) {
      tFrac += 0.0016;
      if (tFrac > 1) tFrac = 0;
    }

    // two stacked panels: heat top, wave bottom
    const H = (p.height - 20) / 2 - 26;

    panelHeader(6, '热方程  ∂u/∂t = α·∂²u/∂x²  (不可逆 · 抹平高频)', 'α=0.15');
    plotCurve(heatFrames, initHeat, 30, H, '#f78166', '热');
    panelHeader(30 + H + 14, '波动方程  ∂²u/∂t² = c²·∂²u/∂x²  (可逆 · 保形传播)', 'c=1');
    plotCurve(waveFrames, initHeat, 30 + H + 14, H, '#58a6ff', '波');
  };
};

new p5(sketch);
