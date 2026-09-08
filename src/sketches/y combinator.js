import p5 from 'p5';
const s=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

let step=0;
p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
p.createCanvas(480,360).parent('p5canvas');
const btn=document.createElement('button');btn.textContent='单步';btn.style.cssText='background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 12px;border-radius:4px;cursor:pointer;margin:4px';btn.addEventListener('click',()=>{step=(step+1)%5;});document.querySelector('.sketch-col')?.appendChild(btn);
const rst=document.createElement('button');rst.textContent='重置';rst.style.cssText='background:#161b22;color:#8b949e;border:1px solid #30363d;padding:4px 12px;border-radius:4px;cursor:pointer;margin:4px';rst.addEventListener('click',()=>{step=0;});document.querySelector('.sketch-col')?.appendChild(rst);
};
p.draw=()=>{
p.background('#0d1117');p.translate(40,30);
const dn=(x,y,label,col,r)=>{p.fill(col);p.noStroke();p.circle(x,y,r||14);p.fill('#0d1117');p.textSize(11);p.textAlign(p.CENTER,p.CENTER);p.text(label,x,y);};
dn(100,150,'Y','#58a6ff');dn(200,100,'F','#f78166');dn(200,200,'YF','#f78166');dn(300,150,'F(YF)','#7ee787');
if(step>=4){dn(400,120,'f','#f778ba',22);dn(400,180,'YF','#f778ba',22);}
p.stroke('#30363d');p.strokeWeight(1.5);
if(step>=0){p.line(114,150,186,110);p.line(114,150,186,190);}
if(step>=1){p.line(214,100,286,145);}
if(step>=2){p.line(214,190,286,155);p.stroke('#ffd33d');p.strokeWeight(2);p.line(190,195,190,130);p.fill('#ffd33d');p.noStroke();p.textSize(10);p.textAlign(p.LEFT);p.text('YF = F(YF)',180,170);}
if(step>=3){p.stroke('#f778ba');p.strokeWeight(2);p.line(314,150,386,130);p.line(314,150,386,170);}
if(step>=4){p.stroke('#f778ba');p.strokeWeight(1.5);p.line(414,125,414,175);}
p.fill('#8b949e');p.textSize(14);p.textAlign(p.LEFT,p.TOP);
p.text('Y = lambda f.(lambda x.f(xx))(lambda x.f(xx))',20,280);
const steps=['Y of the lambda calculus','YF = (lambda x.F(xx))(lambda x.F(xx))','YF = F((lambda x.F(xx))(lambda x.F(xx))) = F(YF)','YF = F(F(YF)) recursion begins','f applied to YF = Fixed point'];
p.fill(step>=4?'#f778ba':'#58a6ff');
p.text('Step '+step+': '+steps[step],20,305);
p.fill('#8b949e');p.textSize(12);
p.text('Click canvas or Step button. Y enables recursion in pure lambda calculus.',20,330);
};
p.mousePressed=()=>{if(p.mouseX>0&&p.mouseX<p.width&&p.mouseY>0&&p.mouseY<p.height)step=(step+1)%5;};
};
new p5(s);
