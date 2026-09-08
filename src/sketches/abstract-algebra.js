import p5 from 'p5';const s=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };
let layer=0;
p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));p.createCanvas(500,420).parent('p5canvas');
['Groups','Rings','Fields'].forEach((n,i)=>{const b=document.createElement('button');b.textContent=n;b.style.cssText='background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:6px 14px;border-radius:6px;cursor:pointer;margin:4px';b.addEventListener('click',()=>{layer=i;});document.querySelector('.sketch-col')?.appendChild(b);});};
p.draw=()=>{p.background('#0d1117');p.translate(30,60);const w=p.width-60;
const layers=['GROUPS: 1 operation, invertible','RINGS: 2 operations (+, x)','FIELDS: 4 operations (+,-,x,/) all closed'];
const colors=['#58a6ff','#f78166','#7ee787'];
const examples=[['S3 D4 Z6 A4 — symmetries','Lagrange: |H| divides |G|'],['Z, Z_n, R[x], M_n(R)','Ideals, quotient rings, Noetherian'],['Q, R, C, F_p — arithmetic','Every nonzero element has inverse']];
for(let i=0;i<3;i++){const y=i*100;const active=i===layer;p.fill(active?'#1a2332':'#0d1117');p.stroke(active?colors[i]:'#30363d');p.strokeWeight(active?2:1);p.rect(0,y,w-10,85,8);p.fill(colors[i]);p.noStroke();p.textSize(14);p.text(layers[i],15,y+14);p.fill('#8b949e');p.textSize(12);for(let j=0;j<examples[i].length;j++)p.text('• '+examples[i][j],20,y+32+j*16);if(i<2){p.fill('#555');p.textSize(16);p.text('+ more structure =>',w/3,y+93);}}
p.fill('#c9d1d9');p.textSize(14);p.text('Algebra: Groups < Rings < Fields — click layers',20,-38);};};new p5(s);