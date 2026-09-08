import p5 from 'p5';
const s=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

let t=0,speed=0.02,solitons=[{x0:-4,amp:1.0}];

p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
p.createCanvas(500,380).parent('p5canvas');
const slRow=document.createElement('div');slRow.style.cssText='display:flex;align-items:center;gap:6px;margin:2px 0';
const sl=document.createElement('input');sl.type='range';sl.min='0.005';sl.max='0.08';sl.step='0.001';sl.value='0.02';sl.style.cssText='width:180px;accent-color:#58a6ff;margin:4px';sl.addEventListener('input',()=>{speed=parseFloat(sl.value);document.getElementById('sol-speed').textContent=speed.toFixed(3);});
const lbl=document.createElement('span');lbl.textContent='Speed:';lbl.style.cssText='color:#8b949e;font-size:0.8em';const spVal=document.createElement('span');spVal.id='sol-speed';spVal.textContent='0.020';spVal.style.cssText='color:#58a6ff;font-size:0.8em;min-width:36px';
slRow.appendChild(lbl);slRow.appendChild(sl);slRow.appendChild(spVal);document.querySelector('.sketch-col')?.appendChild(slRow);
const collBtn=document.createElement('button');collBtn.textContent='碰撞两孤子';collBtn.style.cssText='background:#161b22;color:#f78166;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.82em;margin:4px';collBtn.addEventListener('click',()=>{solitons=[{x0:-4,amp:1.0},{x0:4,amp:0.7,speed:-0.022}];t=0;});document.querySelector('.sketch-col')?.appendChild(collBtn);
};

p.draw=()=>{
p.background('#0d1117');p.translate(10,50);const h=p.height-150;const H=0.9;
for(let i=0;i<solitons.length;i++){const sp=solitons[i].speed||speed;solitons[i].x0+=solitons[i].amp*sp;}
solitons=solitons.filter(s=>s.x0>-15&&s.x0<18);
for(let i=0;i<solitons.length;i++){const c=solitons[i];const col=i===0?'#58a6ff':'#f78166';p.noFill();p.stroke(col);p.strokeWeight(3);p.beginShape();for(let px=0;px<=480;px+=2){const x=p.map(px,0,480,-8+t,14+t);let uTotal=0;for(const s of solitons){const xx=x-s.x0;uTotal+=s.amp/Math.cosh(Math.sqrt(s.amp)*xx/2)**2;}p.vertex(px,h-uTotal*h*H);}p.endShape();}
for(let i=0;i<solitons.length;i++){const c=solitons[i];const col=i===0?'#58a6ff':'#f78166';const sp=c.speed||speed;p.fill(col);p.noStroke();p.textSize(11);p.text('soliton '+(i+1)+': A='+c.amp.toFixed(1)+' v='+(c.amp*sp).toFixed(3),370,h-5+i*14);}
p.stroke('#484f58');p.strokeWeight(1);p.line(0,h,480,h);t+=speed;
p.fill('#8b949e');p.textSize(14);p.text('KdV Soliton — nonlinear wave that never disperses',20,20);p.text('u_t + u_xxx + 6uu_x = 0 | Click: spawn | Slider: speed | Button: collide',20,45);
if(solitons.length>1){const d=Math.abs(solitons[0].x0-solitons[1].x0);p.fill(d<2?'#f778ba':'#8b949e');p.textSize(12);p.text(d<2?'Collision! Solitons pass through each other.':'Separation: '+d.toFixed(2),20,70);}
};

p.mousePressed=()=>{const h=p.height-150;const my=p.mouseY-50;if(my>-10&&my<h+10){const mx=p.mouseX-10;const amp=0.4+Math.random()*0.8;const x0=p.map(mx,0,480,-8+t,14+t);solitons.push({x0,amp:Math.round(amp*10)/10});}};
};
new p5(s);
