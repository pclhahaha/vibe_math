import p5 from 'p5';
const s=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };

let truth=[],meas=[],est=[],Pvals=[],P=1,Q=0.1,R=2,x=0,xEst=0,started=false;

p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
p.createCanvas(500,380).parent('p5canvas');
const btn=document.createElement('button');btn.textContent='开始';btn.style.cssText='background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:6px 14px;border-radius:6px;cursor:pointer;margin:4px';btn.addEventListener('click',()=>{started=true;});document.querySelector('.sketch-col')?.appendChild(btn);
const qRow=document.createElement('div');qRow.style.cssText='display:flex;align-items:center;gap:6px;margin:2px 4px;flex-wrap:wrap';
const qLabel=document.createElement('span');qLabel.textContent='Process noise Q:';qLabel.style.cssText='color:#8b949e;font-size:0.8em';
const qVal=document.createElement('span');qVal.textContent='0.10';qVal.style.cssText='color:#ffd33d;font-size:0.8em;min-width:30px';
const qSl=document.createElement('input');qSl.type='range';qSl.min='0.01';qSl.max='3';qSl.step='0.01';qSl.value='0.1';qSl.style.cssText='width:130px;accent-color:#58a6ff;margin:4px';qSl.addEventListener('input',()=>{Q=parseFloat(qSl.value);qVal.textContent=Q.toFixed(2);});
qRow.appendChild(qLabel);qRow.appendChild(qSl);qRow.appendChild(qVal);document.querySelector('.sketch-col')?.appendChild(qRow);
};

p.draw=()=>{
p.background('#0d1117');p.translate(30,30);const w=p.width-60,h=p.height-60;p.stroke('#30363d');p.strokeWeight(1);p.line(0,h/2,w,h/2);
if(started){x+=p.randomGaussian(0,0.3);truth.push(x);const z=x+p.randomGaussian(0,Math.sqrt(R));meas.push(z);P+=Q;const K=P/(P+R);xEst+=K*(z-xEst);P=(1-K)*P;est.push(xEst);Pvals.push(P);if(truth.length>w){truth.shift();meas.shift();est.shift();Pvals.shift();}}
const drawLine=(arr,col)=>{if(arr.length<2)return;p.stroke(col);p.strokeWeight(2);p.noFill();p.beginShape();for(let i=0;i<arr.length;i++){const px=p.map(i,0,Math.max(arr.length-1,1),0,w);p.vertex(px,h/2-arr[i]*20);}p.endShape();};
drawLine(truth,'#555');drawLine(meas,'#f78166');drawLine(est,'#58a6ff');
// Covariance ellipse band
if(est.length>0&&Pvals.length>0){const lastP=Pvals[Pvals.length-1];const sigma=Math.sqrt(lastP);const lastEst=est[est.length-1];const px=p.map(est.length-1,0,Math.max(est.length-1,1),0,w);const bandH=sigma*20;p.fill(88,166,255,15);p.noStroke();p.rect(px-30,h/2-lastEst*20-bandH,60,2*bandH,4);p.stroke('#58a6ff');p.strokeWeight(1);p.drawingContext.setLineDash([3,3]);p.line(px-20,h/2-lastEst*20-bandH,px+20,h/2-lastEst*20-bandH);p.line(px-20,h/2-lastEst*20+bandH,px+20,h/2-lastEst*20+bandH);p.drawingContext.setLineDash([]);}
p.fill('#8b949e');p.textSize(13);p.text('Gray=true Red=noisy Blue=Kalman Q='+Q.toFixed(2),20,25);
if(est.length>0){const lastP=Pvals[Pvals.length-1];p.text('Est uncertainty σ='+Math.sqrt(lastP).toFixed(3)+' | Cov ellipse shown',20,42);}
};
};
new p5(s);
