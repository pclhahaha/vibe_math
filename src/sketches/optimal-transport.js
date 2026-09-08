import p5 from 'p5';
const s=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

let src=[],dst=[],distType=0;

const regenDst=()=>{
dst=[];
if(distType===0)for(let i=0;i<12;i++)dst.push({x:Math.random()*100+300,y:Math.random()*320+40});
else if(distType===1)for(let i=0;i<12;i++){const a=i/12*Math.PI*2;dst.push({x:340+Math.cos(a)*60,y:200+Math.sin(a)*60});}
else{for(let i=0;i<6;i++)dst.push({x:310+Math.random()*30,y:140+Math.random()*30});for(let i=0;i<6;i++)dst.push({x:310+Math.random()*30,y:260+Math.random()*30});}
};

p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
p.createCanvas(480,400).parent('p5canvas');
for(let i=0;i<12;i++)src.push({x:Math.random()*100+40,y:Math.random()*320+40});regenDst();
const btn=document.createElement('button');btn.textContent='Target: Random';btn.style.cssText='background:#161b22;color:#f78166;border:1px solid #30363d;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:0.82em;margin:4px';btn.addEventListener('click',()=>{distType=(distType+1)%3;btn.textContent='Target: '+(distType===0?'Random':distType===1?'Circle':'Clusters');regenDst();});document.querySelector('.sketch-col')?.appendChild(btn);
const rst=document.createElement('button');rst.textContent='重置源';rst.style.cssText='background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:0.82em;margin:4px';rst.addEventListener('click',()=>{src=[];for(let i=0;i<12;i++)src.push({x:Math.random()*100+40,y:Math.random()*320+40});});document.querySelector('.sketch-col')?.appendChild(rst);
};

p.draw=()=>{
p.background('#0d1117');
for(let i=0;i<src.length;i++){p.stroke('#30363d');p.strokeWeight(0.5);p.line(src[i].x,src[i].y,dst[i].x,dst[i].y);const dx=dst[i].x-src[i].x,dy=dst[i].y-src[i].y;const d=Math.sqrt(dx*dx+dy*dy);if(d>5){const mx=src[i].x+dx*0.5,my=src[i].y+dy*0.5;const ang=Math.atan2(dy,dx);p.fill('#484f58');p.noStroke();p.triangle(mx+Math.cos(ang)*6,my+Math.sin(ang)*6,mx+Math.cos(ang+2.5)*5,my+Math.sin(ang+2.5)*5,mx+Math.cos(ang-2.5)*5,my+Math.sin(ang-2.5)*5);}}
for(const pt of src){p.fill('#58a6ff');p.noStroke();p.circle(pt.x,pt.y,10);}for(const pt of dst){p.fill('#f78166');p.noStroke();p.circle(pt.x,pt.y,10);}
p.fill('#8b949e');p.textSize(14);p.text('Optimal Transport: Monge-Kantorovich — Drag blue points!',20,25);
const tn=distType===0?'Random':distType===1?'Circle':'Clusters';p.text('Target: '+tn+' | Wasserstein dist = min cost matching',20,48);
};

p.mouseDragged=()=>{for(let i=0;i<src.length;i++){if(p.dist(p.mouseX,p.mouseY,src[i].x,src[i].y)<15){src[i].x=p.mouseX;src[i].y=p.mouseY;break;}}};
};
new p5(s);
