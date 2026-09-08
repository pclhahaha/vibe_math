import p5 from 'p5';
const s = (p) => {
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

  let selectedPrime = null;
  let targetInteger = 30;
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
  let showNSS = false;

  p.setup = () => {
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.createCanvas(500, 420).parent('p5canvas');

    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = 1; sl.max = 100; sl.value = 30; sl.step = 1;
    sl.style.cssText = 'margin: 6px 8px; vertical-align: middle; width: 120px;';
    const lbl = document.createElement('span');
    lbl.textContent = ' Integer n: 30';
    lbl.style.cssText = 'color: #8b949e; font-size: 12px;';
    sl.oninput = () => { targetInteger = parseInt(sl.value); lbl.textContent = ' Integer n: ' + targetInteger; };

    const btn = document.createElement('button');
    btn.textContent = '显示零点定理';
    btn.style.cssText = 'margin: 6px 8px; padding: 4px 12px; background: #21262d; color: #58a6ff; border: 1px solid #30363d; border-radius: 4px; cursor: pointer; font-size: 12px;';
    btn.onclick = () => { showNSS = !showNSS; btn.textContent = showNSS ? 'Hide Nullstellensatz' : '显示零点定理'; };

    const div = document.createElement('div');
    div.style.cssText = 'margin: 4px 0;';
    div.appendChild(sl);
    div.appendChild(lbl);
    div.appendChild(btn);
    document.querySelector('.sketch-col')?.appendChild(div);
  };

  function primeDivisors(n) {
    const result = new Set();
    let m = Math.abs(n);
    for (let d = 2; d * d <= m; d++) {
      while (m % d === 0) { result.add(d); m /= d; }
    }
    if (m > 1) result.add(m);
    return result;
  }

  p.draw = () => {
    p.background('#0d1117');
    p.translate(40, 40);
    const w = p.width - 80;
    const h = p.height - 80;

    const genX = w / 2, genY = 30;
    p.fill('#f78166'); p.noStroke();
    p.circle(genX, genY, 12);
    p.fill('#f78166'); p.textSize(13);
    p.text('(0) — generic point (dense)', genX - 70, genY - 10);

    p.stroke('#30363d'); p.strokeWeight(1);
    p.line(genX, genY, genX, genY + 20);

    const divs = primeDivisors(targetInteger);
    for (let i = 0; i < primes.length; i++) {
      const pr = primes[i];
      const angle = (i / primes.length) * Math.PI * 2.5;
      const rad = 80 + i * 12;
      const px = w / 2 + rad * Math.cos(angle);
      const py = 180 + rad * Math.sin(angle) * 0.7;
      const isDiv = divs.has(pr);
      const isSel = (selectedPrime !== null && selectedPrime === i);

      p.fill(isSel ? '#f78166' : (isDiv ? '#58a6ff' : '#30363d'));
      p.noStroke();
      p.circle(px, py, isSel ? 14 : 10);

      p.fill(isSel ? '#f78166' : (isDiv ? '#58a6ff' : '#484f58'));
      p.textSize(11);
      p.text('(' + pr + ')', px + 8, py + 4);
    }

    if (selectedPrime !== null) {
      const pr = primes[selectedPrime];
      const angle = (selectedPrime / primes.length) * Math.PI * 2.5;
      const rad = 80 + selectedPrime * 12;
      const px = w / 2 + rad * Math.cos(angle);
      const py = 180 + rad * Math.sin(angle) * 0.7;
      p.stroke('#f78166'); p.strokeWeight(1.5);
      p.line(genX, genY, px, py);
      p.fill('#f78166'); p.textSize(12);
      p.text('Closure: {(0), (' + pr + ')}  dim({(' + pr + ')}) = 0', 10, h - 95);
      p.text('V((' + pr + ')) = {(' + pr + ')}  is closed point', 10, h - 78);
    }

    p.fill('#8b949e'); p.textSize(13);
    p.text('Spec(Z) — Zariski Topology', 10, 22);
    p.textSize(11);
    p.text('n = ' + targetInteger, 10, 44);
    const divArr = [...divs].sort((a, b) => a - b);
    p.text('V((' + targetInteger + ')) = {primes dividing ' + targetInteger + '} = {' + divArr.join(', ') + '}', 10, 60);

    if (showNSS) {
      p.fill('#58a6ff'); p.textSize(11);
      p.text('Nullstellensatz (Z): I(V(J)) = rad(J)', 10, h - 56);
      p.text('Ideal (n) ↔ V((n)) = {prime divisors of n}', 10, h - 40);
      p.text('rad((12)) = (6)  ↔  V((12)) = V((6)) = {2,3}', 10, h - 24);
      p.text('Maximal ideals: (p) for prime p  ↔  closed points', 10, h - 8);
    }

    p.fill('#8b949e'); p.textSize(10);
    p.text('Click a prime to see its closure  |  Drag slider to change n', 10, h);
  };

  p.mouseClicked = () => {
    const mx = p.mouseX - 40, my = p.mouseY - 40;
    const w = p.width - 80;
    if (p.dist(mx, my, w / 2, 30) < 12) {
      selectedPrime = selectedPrime === -1 ? null : -1;
      return false;
    }
    for (let i = 0; i < primes.length; i++) {
      const angle = (i / primes.length) * Math.PI * 2.5;
      const rad = 80 + i * 12;
      const px = w / 2 + rad * Math.cos(angle);
      const py = 180 + rad * Math.sin(angle) * 0.7;
      if (p.dist(mx, my, px, py) < 14) {
        selectedPrime = selectedPrime === i ? null : i;
        return false;
      }
    }
    return false;
  };
};
new p5(s);
