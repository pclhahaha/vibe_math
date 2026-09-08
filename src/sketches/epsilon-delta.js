import p5 from 'p5';
const sketch=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

let eps=0.3,x0=2,fnType=0;
const f=(x)=>{if(fnType===0)return Math.sqrt(x)+0.3*Math.sin(3*x);if(fnType===1)return x*x/5;if(fnType===2)return x<2?x/2:2;return 0;};
const fl=()=>{if(fnType===0)return '√x+0.3sin(3x)';if(fnType===1)return 'x²/5';if(fnType===2)return 'piecewise';return '';};
p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
p.createCanvas(520,400).parent('p5canvas');
const sl=document.createElement('input');sl.type='range';sl.min='0.05';sl.max='0.8';sl.step='0.01';sl.value='0.3';sl.style.cssText='width:200px;accent-color:#58a6ff;margin:4px';sl.addEventListener('input',()=>{eps=parseFloat(sl.value);});document.querySelector('.sketch-col')?.appendChild(sl);
const btn=document.createElement('button');btn.textContent='Fn: √x+0.3sin(3x)';btn.style.cssText='background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.82em;margin:4px';btn.addEventListener('click',()=>{fnType=(fnType+1)%3;btn.textContent='Fn: '+fl();});document.querySelector('.sketch-col')?.appendChild(btn);
};
p.draw=()=>{
p.background('#0d1117');p.translate(40,30);const w=p.width-80,h=p.height-60;const delta=eps/2;
p.stroke('#58a6ff');p.strokeWeight(2.5);p.noFill();p.beginShape();for(let px=0;px<=w;px+=2){const x=p.map(px,0,w,0,4);p.vertex(px,h-f(x)*h/3.5);}p.endShape();
const fx=f(x0);const px0=p.map(x0,0,4,0,w);
p.fill(88,166,255,25);p.noStroke();p.rect(p.map(x0-delta,0,4,0,w),0,p.map(2*delta,0,4,0,w),h);
p.fill(248,113,102,25);p.noStroke();p.rect(0,h-(fx+eps)*h/3.5,w,2*eps*h/3.5);
p.fill('#f78166');p.noStroke();p.circle(px0,h-fx*h/3.5,8);
p.fill('#8b949e');p.textSize(14);p.text('eps='+eps.toFixed(2)+' delta='+delta.toFixed(2)+' | fn='+fl(),20,25);
p.text('|x-x0|<delta => |f(x)-f(x0)|<epsilon',20,48);
p.text('Drag mouse: move x0. Slider: epsilon. Button: toggle function.',20,70);
};
p.mouseDragged=()=>{x0=p.constrain(p.map(p.mouseX-40,0,p.width-80,0,4),0,4);};
};
new p5(sketch);
