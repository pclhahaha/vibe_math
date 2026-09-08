import p5 from 'p5';const sketch=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };
let pts=[];
p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));p.createCanvas(480,380).parent('p5canvas');for(let i=0;i<200;i++)pts.push({x:Math.random()*100+20,y:Math.random()*380,vx:Math.random()*4-2,vy:Math.random()*4-2});
const btn=document.createElement('button');btn.textContent='Reset: All Left';btn.style.cssText='background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 12px;border-radius:4px;cursor:pointer;margin:4px';btn.addEventListener('click',()=>{for(const pt of pts){pt.x=Math.random()*100+20;pt.y=Math.random()*380;pt.vx=Math.random()*4-2;pt.vy=Math.random()*4-2;}});document.querySelector('.sketch-col')?.appendChild(btn);};
p.draw=()=>{p.background('#0d1117');let L=0,R=0;
for(const pt of pts){pt.x+=pt.vx;pt.y+=pt.vy;if(pt.x<0||pt.x>480)pt.vx*=-1;if(pt.y<0||pt.y>380)pt.vy*=-1;if(pt.x<240)L++;else R++;p.noStroke();p.fill('#58a6ff',150);p.circle(pt.x,pt.y,4);}
p.stroke('#f78166');p.strokeWeight(2);p.line(240,0,240,380);const tot=L+R,pl=L/tot,pr=R/tot;const S=-(pl*Math.log2(Math.max(pl,0.0001))+pr*Math.log2(Math.max(pr,0.0001)));
p.fill('#8b949e');p.textSize(14);p.text(`Left: ${L}  Right: ${R}  S=${S.toFixed(2)} bits`,20,25);p.text('S=k log W — 2nd Law: entropy never decreases',20,48);p.text('Click Reset -> S=0 (all left). Then watch S increase!',20,70);};};new p5(sketch);