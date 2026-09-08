import p5 from 'p5';const s=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };
let verts=[],edges=[],n=6;
p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));p.createCanvas(500,400).parent('p5canvas');for(let i=0;i<n;i++)verts.push({x:Math.random()*380+60,y:Math.random()*300+50});for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.random()<0.4)edges.push([i,j]);
const btn=document.createElement('button');btn.textContent='新随机图';btn.style.cssText='background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 12px;border-radius:4px;cursor:pointer;margin:4px';btn.addEventListener('click',()=>{edges=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.random()<0.4)edges.push([i,j]);});document.querySelector('.sketch-col')?.appendChild(btn);};
p.draw=()=>{p.background('#0d1117');p.stroke('#1a1f2b');p.strokeWeight(1);for(const[i,j]of edges){p.line(verts[i].x,verts[i].y,verts[j].x,verts[j].y);}
for(let i=0;i<verts.length;i++){p.fill('#58a6ff');p.noStroke();p.circle(verts[i].x,verts[i].y,14);p.fill('#fff');p.textSize(11);p.textAlign(p.CENTER,p.CENTER);p.text(i,verts[i].x,verts[i].y);}
p.fill('#8b949e');p.textSize(14);p.textAlign(p.LEFT,p.TOP);p.text('V='+n+' E='+edges.length+' Max='+(n*(n-1)/2)+' Sum deg = '+2*edges.length,20,20);p.text('Handshake Lemma: sum deg(v) = 2|E|. Drag vertices!',20,42);};
p.mouseDragged=()=>{for(let i=0;i<verts.length;i++){if(p.dist(p.mouseX,p.mouseY,verts[i].x,verts[i].y)<20){verts[i].x=p.mouseX;verts[i].y=p.mouseY;break;}}};};new p5(s);