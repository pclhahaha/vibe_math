import p5 from 'p5';const s=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };
let pts=[],Hhist=[];
p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));p.createCanvas(500,380).parent('p5canvas');for(let i=0;i<80;i++)pts.push({x:Math.random()*400-200,y:Math.random()*360-180,vx:Math.random()*4-2,vy:Math.random()*4-2});
const btn=document.createElement('button');btn.textContent='Reverse All Velocities!';btn.style.cssText='background:#161b22;color:#f78166;border:1px solid #30363d;padding:6px 14px;border-radius:6px;cursor:pointer;margin:4px';btn.addEventListener('click',()=>{for(const pt of pts){pt.vx*=-1;pt.vy*=-1;}Hhist=[];});document.querySelector('.sketch-col')?.appendChild(btn);};
p.draw=()=>{p.background('#0d1117');p.translate(p.width/2,p.height/2);
let vxSum=0;for(const pt of pts){pt.x+=pt.vx;pt.y+=pt.vy;if(Math.abs(pt.x)>240)pt.vx*=-1;if(Math.abs(pt.y)>200)pt.vy*=-1;p.noStroke();p.fill('#58a6ff',150);p.circle(pt.x,pt.y,3);vxSum+=pt.vx*pt.vx+pt.vy*pt.vy;}
const H=vxSum/pts.length;Hhist.push(H);if(Hhist.length>200)Hhist.shift();
p.push();p.translate(-240,0);p.stroke('#1a1f2b');p.strokeWeight(1);p.line(0,-50,200,-50);p.stroke('#f78166');p.strokeWeight(2);p.noFill();p.beginShape();for(let i=0;i<Hhist.length;i++)p.vertex(i,Hhist[i]*3-50);p.endShape();p.pop();
p.fill('#8b949e');p.textSize(13);p.text('H(t) = entropy proxy — dH/dt <= 0 (Boltzmann H-theorem)',-230,-180);p.text('Click Reverse -> SHOULD increase (Loschmidt paradox!)',-230,-160);};};new p5(s);