import p5 from 'p5';const sketch=(p)=>{
  let __tx = -1e5, __ty = -1e5;
  p.__touch = false;
  const __sync = () => { if (p.touches && p.touches[0]) { __tx = p.touches[0].x; __ty = p.touches[0].y; } p.mouseX = __tx; p.mouseY = __ty; };
  p.touchStarted = () => { p.__touch = true; __sync(); if (typeof p.mousePressed === 'function') p.mousePressed(); return false; };
  p.touchMoved = () => { __sync(); if (typeof p.mouseDragged === 'function') p.mouseDragged(); return false; };
  p.touchEnded = () => { if (typeof p.mouseReleased === 'function') p.mouseReleased(); return false; };
let nums=[],marked={},n=2;
p.setup=()=>{
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));p.createCanvas(500,400).parent('p5canvas');for(let i=2;i<=99;i++)nums.push(i);
const btn=document.createElement('button');btn.textContent='重置';btn.style.cssText='background:#161b22;color:#58a6ff;border:1px solid #30363d;padding:4px 12px;border-radius:4px;cursor:pointer;margin:4px';btn.addEventListener('click',()=>{n=2;marked={};});document.querySelector('.sketch-col')?.appendChild(btn);};
p.draw=()=>{p.background('#0d1117');const cols=10,cw=48,ch=36;
for(const num of nums){const col=(num-2)%cols,row=Math.floor((num-2)/cols),x=5+col*cw,y=5+row*ch;
if(num===n&&!marked[num]){p.fill('#58a6ff');p.noStroke();p.rect(x,y,cw-3,ch-3,4);p.fill('#0d1117');p.textSize(14);p.textAlign(p.CENTER,p.CENTER);p.text(num,x+cw/2,y+ch/2);}
else{p.fill(marked[num]?'#30363d':'#161b22');p.noStroke();p.rect(x,y,cw-3,ch-3,4);p.fill(marked[num]?'#555':'#c9d1d9');p.textSize(13);p.textAlign(p.CENTER,p.CENTER);p.text(num,x+cw/2,y+ch/2);}}
if(p.frameCount%30===0&&n<=99){if(!marked[n]){for(let m=n*n;m<=99;m+=n)marked[m]=true;}n++;while(n<=99&&marked[n])n++;}
p.fill('#8b949e');p.textSize(14);p.textAlign(p.LEFT,p.TOP);p.text('Eratosthenes Sieve (3rd century BC) — current: '+Math.min(n,99),20,370);};};new p5(sketch);