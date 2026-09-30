const $=s=>document.querySelector(s);
const W=480,H=360,P=32,G=20,F=120;
const LAY={s4:{n:4,c:1,name:'Strip 4 foto'},s3:{n:3,c:1,name:'Strip 3 foto'},g4:{n:4,c:2,name:'Kotak 2×2'}};
const FR=[
 {name:'🍬 Permen',bg:'#ffb3cf',fg:'#ffffff',pat:'dots',ink:'#2b1b3d'},
 {name:'🧈 Mentega',bg:'#ffe27a',fg:'#ffc21a',pat:'stripes',ink:'#2b1b3d'},
 {name:'🍵 Mint',bg:'#9debd2',fg:'#ffffff',pat:'stars',ink:'#2b1b3d'},
 {name:'🍇 Anggur',bg:'#b9a6ff',fg:'#ffffff',pat:'hearts',ink:'#2b1b3d'},
 {name:'🧺 Piknik',bg:'#ffffff',fg:'#ff9cc0',pat:'checker',ink:'#2b1b3d'},
 {name:'🌙 Malam',bg:'#2b1b3d',fg:'#ffd84d',pat:'stars',ink:'#fff3e6'}
];
const FI=[
 {name:'🌼 Asli',css:'none'},
 {name:'🍭 Manis',css:'brightness(1.1) saturate(1.35) contrast(.95)'},
 {name:'📼 Jadul',css:'sepia(.5) contrast(.9) saturate(1.2) hue-rotate(-10deg)'},
 {name:'🐼 Hitam putih',css:'grayscale(1) contrast(1.15)'},
 {name:'☁️ Mimpi',css:'brightness(1.15) saturate(1.4) blur(.7px)'},
 {name:'🎨 Pop',css:'contrast(1.3) saturate(1.8)'},
 {name:'🧊 Dingin',css:'hue-rotate(15deg) saturate(1.2) brightness(1.05)'},
 {name:'🔥 Hangat',css:'sepia(.25) saturate(1.5) brightness(1.05)'}
];
const ST=[{name:'Polos',e:[]},{name:'🍓 Buah',e:['🍓','💖','✨']},{name:'🐰 Kelinci',e:['🐰','🌸','🎀']},{name:'🐱 Kucing',e:['🐱','🐟','⭐']},{name:'🌈 Langit',e:['🌈','☁️','⚡']}];
const S={lay:'s4',fr:0,fi:0,st:1,cap:'Cekrek bareng!',photos:[],custom:null,mirror:true,busy:false};
const cv=$('#strip'),ctx=cv.getContext('2d'),video=$('#video');
let stream=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),3200)}

function chips(id,list,key,label){
  const box=$(id);box.innerHTML='';
  list.forEach((it,i)=>{const b=document.createElement('button');b.className='chip';b.textContent=label(it);
    b.setAttribute('aria-pressed',String(S[key]===(Array.isArray(list)?i:it)));
    b.onclick=()=>{S[key]=i;if(key==='fr')S.custom=null;buildChips();render()};box.appendChild(b)});
}
function buildChips(){
  const lb=$('#cLay');lb.innerHTML='';
  Object.keys(LAY).forEach(k=>{const b=document.createElement('button');b.className='chip';b.textContent=LAY[k].name;
    b.setAttribute('aria-pressed',String(S.lay===k));b.onclick=()=>{S.lay=k;buildChips();buildThumbs();render()};lb.appendChild(b)});
  chips('#cFr',FR,'fr',x=>x.name);chips('#cFi',FI,'fi',x=>x.name);chips('#cSt',ST,'st',x=>x.name);
  if(S.custom)document.querySelectorAll('#cFr .chip').forEach(c=>c.setAttribute('aria-pressed','false'));
}
function buildThumbs(){
  const t=$('#thumbs');t.innerHTML='';
  for(let i=0;i<LAY[S.lay].n;i++){const b=document.createElement('button');b.textContent=S.photos[i]?'✓':i+1;
    if(S.photos[i])b.className='ok';b.setAttribute('aria-label','Ulang foto '+(i+1));b.onclick=()=>shoot(i);t.appendChild(b)}
  const full=LAY[S.lay].n;$('#btnDone').disabled=!Array.from({length:full}).every((_,i)=>S.photos[i]);
}

function pattern(c,type,w,h,col){
  c.fillStyle=col;c.globalAlpha=.7;
  if(type==='stripes'){for(let x=-h;x<w;x+=56){c.beginPath();c.moveTo(x,0);c.lineTo(x+22,0);c.lineTo(x+22+h,h);c.lineTo(x+h,h);c.fill()}}
  else if(type==='checker'){for(let y=0;y<h;y+=40)for(let x=0;x<w;x+=40)if(((x+y)/40)%2===0)c.fillRect(x,y,40,40)}
  else{c.textAlign='center';c.textBaseline='middle';
    for(let y=20,r=0;y<h;y+=44,r++)for(let x=(r%2?22:0);x<w+44;x+=44){
      if(type==='dots'){c.beginPath();c.arc(x,y,8,0,7);c.fill()}
      else{c.font='26px sans-serif';c.fillText(type==='stars'?'★':'♥',x,y)}}}
  c.globalAlpha=1;
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}

function render(){
  const L=LAY[S.lay],rows=Math.ceil(L.n/L.c);
  const w=P*2+L.c*W+(L.c-1)*G,h=P+rows*H+(rows-1)*G+F;
  cv.width=w;cv.height=h;
  const fr=S.custom?{bg:S.custom,fg:'#ffffff',pat:'dots',ink:'#2b1b3d'}:FR[S.fr];
  ctx.fillStyle=fr.bg;ctx.fillRect(0,0,w,h);pattern(ctx,fr.pat,w,h,fr.fg);
  const css=FI[S.fi].css,canF='filter' in ctx,em=ST[S.st].e;
  for(let i=0;i<L.n;i++){
    const x=P+(i%L.c)*(W+G),y=P+Math.floor(i/L.c)*(H+G);
    ctx.save();ctx.shadowColor='rgba(43,27,61,.35)';ctx.shadowOffsetY=6;ctx.shadowBlur=12;
    ctx.fillStyle='#fff';rr(ctx,x-8,y-8,W+16,H+16,20);ctx.fill();ctx.restore();
    ctx.save();rr(ctx,x,y,W,H,14);ctx.clip();
    if(S.photos[i]){if(canF)ctx.filter=css;ctx.drawImage(S.photos[i],x,y,W,H);ctx.filter='none'}
    else{ctx.fillStyle='#ffe3ef';ctx.fillRect(x,y,W,H);ctx.fillStyle='#ff6fa5';ctx.font='700 90px Fredoka,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),x+W/2,y+H/2)}
    ctx.restore();
    if(em.length){ctx.font='64px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.save();ctx.translate(i%2?x+22:x+W-22,y+8);ctx.rotate(i%2?-.3:.3);ctx.fillText(em[i%em.length],0,0);ctx.restore()}
  }
  ctx.fillStyle=fr.ink;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='700 44px Fredoka,sans-serif';ctx.fillText(S.cap||' ',w/2,h-F+40);
  ctx.font='700 24px Nunito,sans-serif';ctx.globalAlpha=.8;
  ctx.fillText(new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})+(em.length?'  '+em.join(' '):''),w/2,h-F+86);ctx.globalAlpha=1;
}

function grab(src,sw,sh,mirror){
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const r=W/H;let cw=sw,ch=sh;if(sw/sh>r)cw=sh*r;else ch=sw/r;
  if(mirror){g.translate(W,0);g.scale(-1,1)}
  g.drawImage(src,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,W,H);return c;
}
async function count(n){
  const c=$('#count');
  for(let i=n;i>0;i--){c.textContent=i;c.classList.remove('on');void c.offsetWidth;c.classList.add('on');await sleep(900)}
  c.classList.remove('on');
}
async function shoot(i){
  if(!stream){toast('Nyalakan kamera dulu, atau unggah foto ya');return}
  if(S.busy)return;S.busy=true;
  await count(3);
  const f=$('#flash');f.classList.add('on');
  S.photos[i]=grab(video,video.videoWidth,video.videoHeight,S.mirror);
  await sleep(80);f.classList.remove('on');
  buildThumbs();render();S.busy=false;
}
async function auto(){
  if(!stream)return toast('Nyalakan kamera dulu ya');
  const n=LAY[S.lay].n;
  for(let i=0;i<n;i++){if(!S.photos[i]){await shoot(i);await sleep(700)}}
  toast('Semua foto sudah masuk! Klik Simpan hasil');
}
async function startCam(){
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
    video.srcObject=stream;$('#hint').style.display='none';$('#btnAuto').disabled=false;$('#btnCam').textContent='Kamera nyala ✓';
  }catch(e){toast('Kamera tidak bisa dibuka. Izinkan akses kamera atau pakai Unggah foto.')}
}
$('#btnCam').onclick=startCam;
$('#btnAuto').onclick=auto;
$('#file').onchange=async e=>{
  const n=LAY[S.lay].n;let idx=0;
  for(const f of e.target.files){
    while(idx<n&&S.photos[idx])idx++;if(idx>=n)idx=n-1;
    const img=new Image();img.src=URL.createObjectURL(f);await img.decode();
    S.photos[idx]=grab(img,img.naturalWidth,img.naturalHeight,false);idx++;
  }
  e.target.value='';buildThumbs();render();
};
$('#btnMirror').onclick=e=>{S.mirror=!S.mirror;e.target.setAttribute('aria-pressed',String(S.mirror));
  e.target.textContent='🪞 Cermin: '+(S.mirror?'nyala':'mati');$('#cam').classList.toggle('nomirror',!S.mirror)};
$('#btnReset').onclick=()=>{S.photos=[];buildThumbs();render()};
$('#cust').oninput=e=>{S.custom=e.target.value;buildChips();render()};
$('#cap').oninput=e=>{S.cap=e.target.value;render()};
$('#btnDone').onclick=()=>{$('#out').src=cv.toDataURL('image/png');$('#modal').classList.add('on')};
$('#btnClose').onclick=()=>$('#modal').classList.remove('on');
$('#btnSave').onclick=()=>{try{const a=document.createElement('a');a.href=$('#out').src;a.download='cekrek-photobooth.png';document.body.appendChild(a);a.click();a.remove()}catch(e){}};
buildChips();buildThumbs();render();
