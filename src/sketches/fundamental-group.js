import p5 from 'p5';
const s=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

let rx=0.4,ry=0.3,loops=[];

p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
p.createCanvas(480,440,p.WEBGL).parent('p5canvas');
const addBtn=document.createElement('button');addBtn.textContent='添加回路';addBtn.style.cssText='background:#161b22;color:#ffd33d;border:1px solid #30363d;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.78em;margin:2px';addBtn.addEventListener('click',()=>{const m=Math.floor(Math.random()*3)+1;const n=Math.floor(Math.random()*3);const cols=['#ffd33d','#f778ba','#7ee787','#f78166'];loops.push({m,n,color:cols[loops.length%cols.length]});});document.querySelector('.sketch-col')?.appendChild(addBtn);
const clrBtn=document.createElement('button');clrBtn.textContent='清除回路';clrBtn.style.cssText='background:#161b22;color:#8b949e;border:1px solid #30363d;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.78em;margin:2px';clrBtn.addEventListener('click',()=>{loops=[];});document.querySelector('.sketch-col')?.appendChild(clrBtn);
};

p.draw=()=>{
p.background('#0d1117');p.rotateX(rx);p.rotateY(ry);p.noFill();p.stroke('#1a1f2b');p.strokeWeight(0.4);
for(let a=0;a<Math.PI*2;a+=Math.PI/8){p.beginShape();for(let b=0;b<=Math.PI*2;b+=0.1){const R=60,r=25;const x=(R+r*Math.cos(b))*Math.cos(a),y=(R+r*Math.cos(b))*Math.sin(a),z=r*Math.sin(b);p.vertex(x,y,z);}p.endShape();}
// Generator a
p.stroke('#58a6ff');p.strokeWeight(3);p.beginShape();for(let b=0;b<=Math.PI*2;b+=0.05){const R=60,r=25;const x=(R+r*Math.cos(b))*Math.cos(0),y=(R+r*Math.cos(b))*Math.sin(0),z=r*Math.sin(b);p.vertex(x,y,z);}p.endShape();
// Generator b
p.stroke('#f78166');p.strokeWeight(3);p.beginShape();for(let a=0;a<=Math.PI*2;a+=0.05)p.vertex(60*Math.cos(a),60*Math.sin(a),0);p.endShape();
// User loops
for(const l of loops){p.stroke(l.color);p.strokeWeight(2.5);p.beginShape();for(let t=0;t<=Math.PI*2;t+=0.02){const R=60,r=25;const th=l.m*t,ph=l.n*t;const x=(R+r*Math.cos(ph))*Math.cos(th),y=(R+r*Math.cos(ph))*Math.sin(th),z=r*Math.sin(ph);p.vertex(x,y,z);}p.endShape();}
rx+=0.003;ry+=0.005;
// 2D text overlay (after all 3D drawing); (0,0) = top-left canvas corner
p.push();p.resetMatrix();p.translate(p.width/2,p.height/2);p.textAlign(p.LEFT,p.TOP);
p.fill('#c9d1d9');p.textSize(14);
p.text('π₁(T²)=Z×Z (blue=a, red=b)',20,40);
p.fill('#8b949e');
p.text('π₁(S²)=0 (contractible). π₁(S¹)=Z',20,62);
if(loops.length>0){const classes=loops.map(l=>'('+l.m+','+l.n+')').join(' ');p.fill('#ffd33d');p.textSize(12);p.text('Loops: '+classes+ ' ∈ Z×Z',20,392);}
p.fill('#8b949e');p.textSize(12);p.text('Buttons add/clear loops on torus surface',20,414);
p.pop();
};

p.mouseDragged=()=>{ry+=(p.mouseX-p.pmouseX)*0.01;rx+=(p.mouseY-p.pmouseY)*0.01;};
};
new p5(s);
