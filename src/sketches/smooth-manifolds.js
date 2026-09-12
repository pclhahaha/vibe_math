// Smooth Manifolds — stereographic charts on S², tangent plane, and the "locally R^n" idea
import p5 from 'p5';

const sketch = (p) => {
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  const R = 80;
  const TH_MIN = 0.7, TH_MAX = Math.PI - 0.7;
  let theta = 1.15;
  let phi = 0.7;
  let chart = 'N';           // 'N' north chart | 'S' south chart
  let showTangent = true;
  let rotX = 0.5, rotY = -0.55;
  let dragging = false, prevX = 0, prevY = 0;

  const Pof = () => {
    const st = Math.sin(theta), ct = Math.cos(theta);
    return { x: R * st * Math.cos(phi), y: R * st * Math.sin(phi), z: R * ct };
  };
  const pole = () => (chart === 'N' ? { x: 0, y: 0, z: R } : { x: 0, y: 0, z: -R });
  // stereographic projection onto the equatorial plane z = 0
  const proj = () => {
    const P = Pof();
    const t = chart === 'N' ? R / (R - P.z) : R / (R + P.z);
    return { x: t * P.x, y: t * P.y, z: 0 };
  };
  // chart coordinates in units of R: north = cot(theta/2), south = tan(theta/2)
  const chartUV = () => {
    const st = Math.sin(theta);
    const k = chart === 'N' ? (1 + Math.cos(theta)) / st : (1 - Math.cos(theta)) / st;
    return { u: k * Math.cos(phi), v: k * Math.sin(phi) };
  };

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(Math.min(560, p.windowWidth - 40), 500, p.WEBGL).parent('p5canvas');

    const mkBtn = (label, colr, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        'background:#161b22;color:' + colr + ';border:1px solid #30363d;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:0.78em;margin:3px';
      b.addEventListener('click', () => fn(b));
      document.querySelector('.sketch-col')?.appendChild(b);
      return b;
    };
    mkBtn('图卡：北 (N)', '#58a6ff', (b) => {
      chart = chart === 'N' ? 'S' : 'N';
      b.textContent = chart === 'N' ? '图卡：北 (N)' : '图卡：南 (S)';
    });
    mkBtn('切平面：开', '#7ee787', (b) => {
      showTangent = !showTangent;
      b.textContent = showTangent ? '切平面：开' : '切平面：关';
    });

    const mkSlider = (label, min, max, val, step, setter) => {
      const sl = p.createSlider(min, max, val, step);
      sl.style('width', '130px');
      sl.style('accent-color', '#58a6ff');
      sl.style('margin', '0 2px');
      sl.parent('p5canvas');
      const span = document.createElement('span');
      span.style.cssText = 'color:#58a6ff;min-width:34px;display:inline-block;text-align:right';
      span.textContent = val.toFixed(2);
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:0.76em;color:#8b949e;margin:4px 6px 0 0';
      wrap.append(label + ' ', span);
      document.querySelector('.sketch-col')?.appendChild(wrap);
      sl.elt.parentNode.insertBefore(wrap, sl.elt);
      sl.input(() => {
        const v = sl.value();
        setter(v);
        span.textContent = v.toFixed(2);
      });
    };
    mkSlider('θ', TH_MIN, TH_MAX, theta, 0.01, (v) => { theta = v; });
    mkSlider('φ', 0, p.TWO_PI, phi, 0.01, (v) => { phi = v; });

    const hint = document.createElement('p');
    hint.style.cssText = 'color:#484f58;font-size:0.72em;margin:4px;line-height:1.5';
    hint.textContent =
      '拖动画布旋转视角；滑块移动球面上的点 P。北图卡在北极失效、南图卡在南极失效——两幅图卡合起来覆盖整个 S²，重叠区的坐标满足 v = 1/u。';
    document.querySelector('.sketch-col')?.appendChild(hint);
  };

  p.draw = () => {
    p.background('#0d1117');
    p.rotateX(rotX);
    p.rotateY(rotY);

    const P = Pof();
    const Q = proj();
    const Np = pole();

    // equatorial plane grid (z = 0)
    const E = R * 2.9, gstep = R * 0.6;
    p.stroke('#151b24');
    p.strokeWeight(0.5);
    for (let g = -Math.floor(E / gstep) * gstep; g <= E + 1e-6; g += gstep) {
      p.line(g, -E, 0, g, E, 0);
      p.line(-E, g, 0, E, g, 0);
    }

    // sphere wireframe
    p.stroke('#1f2630');
    p.strokeWeight(0.5);
    p.noFill();
    p.sphere(R, 26, 16);

    // poles
    p.noStroke();
    p.fill(chart === 'N' ? '#f78166' : '#30363d');
    p.push(); p.translate(0, 0, R); p.sphere(5); p.pop();
    p.fill(chart === 'S' ? '#f78166' : '#30363d');
    p.push(); p.translate(0, 0, -R); p.sphere(5); p.pop();

    // stereographic ray: active pole -> P -> plane
    p.stroke('#f778ba');
    p.strokeWeight(1.4);
    p.drawingContext.setLineDash([5, 6]);
    p.line(Np.x, Np.y, Np.z, Q.x, Q.y, Q.z);
    p.drawingContext.setLineDash([]);

    // tangent plane + basis
    const eph = { x: -Math.sin(phi), y: Math.cos(phi), z: 0 };
    const eth = { x: Math.cos(theta) * Math.cos(phi), y: Math.cos(theta) * Math.sin(phi), z: -Math.sin(theta) };
    if (showTangent) {
      const L = R * 0.8;
      p.fill(88, 166, 255, 26);
      p.stroke('#58a6ff');
      p.strokeWeight(1);
      p.beginShape();
      for (const ab of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const a = ab[0], b = ab[1];
        p.vertex(
          P.x + a * L * eph.x + b * L * eth.x,
          P.y + a * L * eph.y + b * L * eth.y,
          P.z + a * L * eph.z + b * L * eth.z
        );
      }
      p.endShape(p.CLOSE);

      // radius (normal direction)
      p.stroke('#484f58');
      p.strokeWeight(1);
      p.line(0, 0, 0, P.x, P.y, P.z);

      // tangent basis arrows
      const TL = R * 0.78;
      p.stroke('#7ee787');
      p.strokeWeight(2.5);
      p.line(P.x, P.y, P.z, P.x + TL * eph.x, P.y + TL * eph.y, P.z + TL * eph.z);
      p.stroke('#ffd33d');
      p.line(P.x, P.y, P.z, P.x + TL * eth.x, P.y + TL * eth.y, P.z + TL * eth.z);
      p.noStroke();
      p.fill('#7ee787');
      p.push(); p.translate(P.x + TL * eph.x, P.y + TL * eph.y, P.z + TL * eph.z); p.sphere(4); p.pop();
      p.fill('#ffd33d');
      p.push(); p.translate(P.x + TL * eth.x, P.y + TL * eth.y, P.z + TL * eth.z); p.sphere(4); p.pop();
    }

    // projected point Q
    p.noStroke();
    p.fill('#f778ba');
    p.push(); p.translate(Q.x, Q.y, Q.z); p.sphere(6); p.pop();

    // point P
    p.fill('#f78166');
    p.push(); p.translate(P.x, P.y, P.z); p.sphere(7); p.pop();

    // ---------- 2D overlay ----------
    const uv = chartUV();
    const dot = (P.x * eph.x + P.y * eph.y) / R; // P · e_phi / R, exactly 0 up to float error
    p.push();
    p.resetMatrix();
    p.translate(p.width / 2, p.height / 2);
    const x0 = -p.width / 2 + 12, y0 = -p.height / 2 + 12;
    p.noStroke();
    p.fill(13, 17, 23, 220);
    p.rect(x0, y0, 268, 132, 6);
    p.textAlign(p.LEFT, p.TOP);
    p.fill('#c9d1d9');
    p.textSize(12.5);
    p.text('S² 的图卡（球极投影）', x0 + 10, y0 + 8);
    p.fill(chart === 'N' ? '#58a6ff' : '#ffd33d');
    p.text(chart === 'N' ? '北图卡：从 N 投影，U_N = S²∖{N}' : '南图卡：从 S 投影，U_S = S²∖{S}', x0 + 10, y0 + 28);
    p.fill('#8b949e');
    p.text('θ = ' + ((theta * 180) / Math.PI).toFixed(0) + '°   φ = ' + ((phi * 180) / Math.PI).toFixed(0) + '°', x0 + 10, y0 + 48);
    p.fill('#f778ba');
    p.text('坐标 (u, v) = (' + uv.u.toFixed(2) + ', ' + uv.v.toFixed(2) + ')', x0 + 10, y0 + 68);
    p.fill('#7ee787');
    p.text('切向量 p·v = ' + (Math.abs(dot) < 1e-9 ? '0' : dot.toFixed(4)) + '   (T_pS² = {p·v = 0})', x0 + 10, y0 + 88);
    p.fill('#484f58');
    p.textSize(10.5);
    p.text('绿/黄箭头张成切平面 T_pS² · 粉点 = 投影坐标', x0 + 10, y0 + 110);
    p.pop();
  };

  p.mousePressed = () => { dragging = true; prevX = p.mouseX; prevY = p.mouseY; };
  p.mouseReleased = () => { dragging = false; };
  p.mouseDragged = () => {
    if (!dragging) return;
    rotY += (p.mouseX - prevX) * 0.008;
    rotX += (p.mouseY - prevY) * 0.008;
    rotX = p.constrain(rotX, -1.4, 1.4);
    prevX = p.mouseX;
    prevY = p.mouseY;
  };
};

new p5(sketch);
