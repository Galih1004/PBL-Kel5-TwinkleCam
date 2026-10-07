const $=s=>document.querySelector(s);
const W=480,H=360,P=32,G=20,F=100,M=12;
const LAY={s4:{n:4,c:1,name:'Strip 4'},s3:{n:3,c:1,name:'Strip 3'},g4:{n:4,c:2,name:'Kotak 2×2'},d4:{n:8,c:2,name:'4×2 (8 foto)'},d3:{n:6,c:2,name:'3×2 (6 foto)'},l4:{n:4,c:2,dup:true,name:'Life4Cuts (kembar)'},p1:{n:1,c:1,F:150,name:'Polaroid 1 foto'},p2:{n:2,c:1,F:150,name:'Polaroid 2 foto'}};
const FR=[
 {name:'🍬 Permen',bg:'#ffb3d6',fg:'#ffffff',pat:'dots',ink:'#2d1b69'},
 {name:'📰 Koran',bg:'#e8e0cc',fg:'#8a8272',pat:'news',ink:'#1e1a14'},
 {name:'📒 Buku tulis',bg:'#fffdf2',fg:'#7ab8ff',pat:'notes',ink:'#2d1b69'},
 {name:'🎞️ Film',bg:'#15121c',fg:'#f5f0e1',pat:'film',ink:'#f5f0e1'},
 {name:'🪩 Holo',bg:'#d9c8ff',fg:'#fff',pat:'holo',ink:'#2d1b69'},
 {name:'🌌 Langit bintang',bg:'#241a5e',fg:'#ffe14d',pat:'sky',ink:'#fff8d6'},
 {name:'🌈 Pelangi',bg:'#fff',fg:'',pat:'rainbow',ink:'#2d1b69'},
 {name:'🧈 Mentega',bg:'#ffe27a',fg:'#ffc21a',pat:'stripes',ink:'#2d1b69'},
 {name:'🍵 Mint',bg:'#9debd2',fg:'#ffffff',pat:'stars',ink:'#2d1b69'},
 {name:'🍇 Anggur',bg:'#b9a6ff',fg:'#ffffff',pat:'hearts',ink:'#2d1b69'},
 {name:'🧺 Piknik',bg:'#ffffff',fg:'#ff9cc0',pat:'checker',ink:'#2d1b69'},
 {name:'🤍 Polaroid',bg:'#fbf7ee',fg:'',pat:'none',ink:'#2d1b69'},
 {name:'👖 Denim',bg:'#4a6fa5',fg:'',pat:'denim',ink:'#fff8e0'},
 {name:'✉️ Surat jadul',bg:'#f1e6c8',fg:'',pat:'mail',ink:'#4a3b22'},
 {name:'💗 Heartline',bg:'#ffd1e3',fg:'',pat:'heart',ink:'#b0143f'},
 {name:'🎂 Ulang tahun',bg:'#fff6d6',fg:'',pat:'party',ink:'#2d1b69'},
 {name:'🌙 Lebaran',bg:'#0f5c3a',fg:'',pat:'raya',ink:'#ffe9a8'},
 {name:'🎄 Natal',bg:'#c62839',fg:'',pat:'xmas',ink:'#ffffff'}
];
const FI=[
 {name:'🌼 Asli',css:'none'},
 {name:'🪩 Y2K glow',css:'brightness(1.1) contrast(1.05) saturate(1.6) hue-rotate(-8deg)'},
 {name:'🇰🇷 Korea soft',css:'brightness(1.12) contrast(.92) saturate(1.1) sepia(.08)'},
 {name:'🤍 Clean girl',css:'brightness(1.1) contrast(1.05) saturate(.85)'},
 {name:'🎬 Sinema',css:'contrast(1.25) saturate(1.1) sepia(.15) brightness(.95)'},
 {name:'📸 Polaroid',css:'sepia(.2) contrast(.95) brightness(1.1) saturate(1.3)'},
 {name:'📼 Film 90an',css:'sepia(.35) contrast(1.1) saturate(1.1) hue-rotate(-15deg) brightness(1.05)'},
 {name:'🌆 Golden hour',css:'sepia(.3) saturate(1.6) brightness(1.05) hue-rotate(-8deg)'},
 {name:'💜 Neon',css:'hue-rotate(-30deg) saturate(2) contrast(1.15)'},
 {name:'☁️ Dreamy',css:'brightness(1.15) saturate(1.4) blur(.7px)'},
 {name:'🐼 Mono',css:'grayscale(1) contrast(1.15)'},
 {name:'🎨 Pop',css:'contrast(1.3) saturate(1.8)'}
];
const ST=[{name:'Polos',e:[]},
 {name:'🦋 Y2K',e:['🦋','💿','⭐','🪩']},{name:'🎀 Coquette',e:['🎀','🤍','🩰','🌷']},
 {name:'🧋 Boba',e:['🧋','🍰','🍡','🍓']},{name:'🍵 Matcha',e:['🍵','🌿','🍙','🐸']},
 {name:'💜 K-pop',e:['💜','🪩','🎤','✨']},{name:'👽 Alien',e:['👽','🛸','💫','🌙']},
 {name:'🧸 Lucu',e:['🧸','🐰','🐱','🌸']},{name:'👑 Bling',e:['👑','💎','💖','✨']}];
const rnd=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
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

function back(c,fr,w,h){
  const t=fr.pat,r=rnd(7);c.textAlign='center';c.textBaseline='middle';
  if(t==='sky'||t==='holo'){
    const g=c.createLinearGradient(0,0,t==='sky'?0:w,h);
    (t==='sky'?['#1b1450','#3a1c71','#7b2f8e']:['#ffc6f2','#c6d8ff','#c6fff0','#fff3c6','#ffc6de']).forEach((s,i,a)=>g.addColorStop(i/(a.length-1),s));
    c.fillStyle=g;c.fillRect(0,0,w,h);
    for(let i=0;i<Math.round(w*h/9000);i++){c.globalAlpha=.4+r()*.6;c.fillStyle=t==='holo'||r()>.5?'#fff':'#ffe14d';c.font=(10+r()*22|0)+'px sans-serif';c.fillText(r()>.4?'✦':'•',r()*w,r()*h)}
  }else if(t==='rainbow'){
    ['#ffb3c1','#ffd6a5','#fdf2a0','#c1f2b0','#a5e3ff','#c3b1ff','#f2b5ff'].forEach((col,i)=>{c.fillStyle=col;c.fillRect(0,i*h/7,w,h/7+1)});
  }else{
    c.fillStyle=fr.bg;c.fillRect(0,0,w,h);
    if(t==='news'){
      c.fillStyle=fr.fg;c.globalAlpha=.5;
      for(let y=16;y<h;y+=16)for(let x=12;x<w-12;){const l=30+r()*90;c.fillRect(x,y,Math.min(l,w-12-x),5);x+=l+8}
      c.globalAlpha=.22;c.fillStyle='#1e1a14';c.textAlign='left';c.font='900 38px Georgia,serif';
      for(let y=50;y<h;y+=330)c.fillText('THE TWINKLE TIMES',14,y);
    }else if(t==='notes'){
      c.strokeStyle=fr.fg;c.lineWidth=2;c.globalAlpha=.6;
      for(let y=40;y<h;y+=36){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
      c.strokeStyle='#ff8fa3';c.globalAlpha=.9;c.beginPath();c.moveTo(20,0);c.lineTo(20,h);c.stroke();
    }else if(t==='film'){
      c.fillStyle=fr.fg;for(let y=10;y<h;y+=34){rr(c,9,y,14,20,4);c.fill();rr(c,w-23,y,14,20,4);c.fill()}
    }else if(t==='denim'){
      c.strokeStyle='#ffffff';c.globalAlpha=.09;c.lineWidth=2;
      for(let x=-h;x<w;x+=6){c.beginPath();c.moveTo(x,0);c.lineTo(x+h,h);c.stroke()}
      c.globalAlpha=1;c.strokeStyle='#ffd166';c.lineWidth=3;c.setLineDash([10,7]);rr(c,10,10,w-20,h-20,16);c.stroke();c.setLineDash([]);
    }else if(t==='mail'){
      c.globalAlpha=.13;c.fillStyle='#6b5a3a';c.font='700 22px Georgia,serif';
      for(let y=50;y<h;y+=90)c.fillText('AIR MAIL · PAR AVION',w/2,y);
      c.globalAlpha=1;c.lineWidth=12;c.setLineDash([26,26]);c.strokeStyle='#e0525f';rr(c,7,7,w-14,h-14,0);c.stroke();
      c.strokeStyle='#4a78d0';c.lineDashOffset=26;c.stroke();c.setLineDash([]);c.lineDashOffset=0;
    }else if(t==='heart'){
      for(let i=0;i<Math.round(w*h/5000);i++){c.globalAlpha=.35+r()*.5;c.fillStyle=['#ff5fa2','#ff8fb8','#ffffff','#e0345f'][r()*4|0];c.font=(18+r()*34|0)+'px sans-serif';c.fillText('♥',r()*w,r()*h)}
    }else if(t==='party'){
      const cs=['#ff5fa2','#7fd8ff','#ffe14d','#8b5cf6','#7ce0a3'];
      for(let i=0;i<Math.round(w*h/2500);i++){c.save();c.translate(r()*w,r()*h);c.rotate(r()*6.3);c.fillStyle=cs[r()*5|0];c.fillRect(-4,-9,8,18);c.restore()}
    }else if(t==='raya'){
      c.strokeStyle='#f2c94c';c.globalAlpha=.3;c.lineWidth=2;
      for(let y=0;y<h+40;y+=40)for(let x=(y/40%2?20:0);x<w+40;x+=40){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.strokeRect(-11,-11,22,22);c.restore()}
      c.globalAlpha=.9;c.fillStyle='#f2c94c';c.font='30px sans-serif';
      for(let i=0;i<Math.round(w*h/26000)+2;i++)c.fillText(r()>.5?'☪':'✦',r()*w,r()*h);
    }else if(t==='xmas'){
      c.fillStyle='#1f7a4c';for(let x=0;x<w;x+=60)c.fillRect(x,0,14,h);
      c.fillStyle='#fff';for(let i=0;i<Math.round(w*h/4000);i++){c.globalAlpha=.5+r()*.5;c.font=(14+r()*22|0)+'px sans-serif';c.fillText('❄',r()*w,r()*h)}
    }else if(t!=='none')pattern(c,t,w,h,fr.fg);
  }
  c.globalAlpha=1;
}
function dims(){const L=LAY[S.lay],rows=Math.ceil((L.dup?L.n*2:L.n)/L.c);if(L.tpl)return{L,w:L.tpl.w,h:L.tpl.h};return{L,w:P*2+L.c*W+(L.c-1)*G,h:P+rows*H+(rows-1)*G+(L.F||F)}}

function grab(src,sw,sh,mirror,tw=W,th=H){
  const c=document.createElement('canvas');c.width=tw;c.height=th;const g=c.getContext('2d');
  const r=tw/th;let cw=sw,ch=sh;if(sw/sh>r)cw=sh*r;else ch=sw/r;
  if(mirror){g.translate(tw,0);g.scale(-1,1)}
  g.drawImage(src,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,tw,th);return c;
}
function quant(d){const o=new Uint8Array(d.length>>2);for(let i=0,j=0;i<d.length;i+=4,j++)o[j]=(d[i]&224)|((d[i+1]&224)>>3)|(d[i+2]>>6);return o}
function lzw(px){
  const out=[];let cur=0,bits=0,nb=9,fe=258,mx=511;const dict=new Map();
  const put=c=>{cur|=c<<bits;bits+=nb;while(bits>=8){out.push(cur&255);cur>>=8;bits-=8}if(fe>mx){nb++;mx=nb===12?4096:(1<<nb)-1}};
  put(256);let p=px[0];
  for(let i=1;i<px.length;i++){
    const k=px[i],key=(p<<8)|k,v=dict.get(key);
    if(v!==undefined)p=v;
    else{put(p);if(fe<4096)dict.set(key,fe++);else{put(256);dict.clear();fe=258;nb=9;mx=511}p=k}
  }
  put(p);put(257);if(bits>0)out.push(cur&255);return out;
}
function gifEncode(frames,w,h,delay,pal){
  const o=[],u16=v=>o.push(v&255,(v>>8)&255),str=s=>[...s].forEach(ch=>o.push(ch.charCodeAt(0)));
  str('GIF89a');u16(w);u16(h);o.push(247,0,0);
  for(let i=0;i<768;i++)o.push(pal[i]);
  o.push(33,255,11);str('NETSCAPE2.0');o.push(3,1,0,0,0);
  for(const px of frames){
    o.push(33,249,4,0);u16(px.d||delay);o.push(0,0,44,0,0,0,0);u16(w);u16(h);o.push(0,8);
    const b=lzw(px);
    for(let i=0;i<b.length;i+=255){const n=Math.min(255,b.length-i);o.push(n);for(let j=0;j<n;j++)o.push(b[i+j])}
    o.push(0);
  }
  o.push(59);return new Uint8Array(o);
}
if(typeof TPL!=='undefined')TPL.forEach(t=>{if(typeof TPL_IMG!=='undefined'&&TPL_IMG[t.id])t.src=TPL_IMG[t.id];LAY['t_'+t.id]={n:t.slots.length,c:1,name:t.name,tpl:t}});
const S={lay:'s4',fr:5,fi:1,st:1,cap:'Twinkle Cam ✨',photos:[],clips:[],custom:null,mirror:true,busy:false,timer:5,tab:'fr',tips:true,free:[],sel:null,zoom:1,grow:1,capF:0};
const cv=$('#strip'),ctx=cv.getContext('2d'),video=$('#video');
let jobP=Promise.resolve(),vidBlob=null,vidUrl=null,vidExt='webm',vidTk=0,gifBlob=null,stream=null,gifUrl=null,gifTk=0,prevV='home';
const POSE=['Senyum lebar 😁','Pose peace ✌️','Bikin bentuk hati 🫶','Pura-pura kaget 😲','Gaya model 💅','Tertawa lepas 🤣','Pipi imut 🥺','Angkat tangan 🙌','Bibir manyun 😗','Gaya detektif 🕵️','Peluk diri sendiri 🤗','Tatap teman sebelahmu 👀','Pose kucing 🐱','Gaya cool 😎'];let lastPose=-1;
const load=(box,t)=>{box.innerHTML='<div class="spin"></div><p></p>';box.lastChild.textContent=t};
const waitC=async ms=>{const t=Date.now();while(Date.now()-t<ms){if(S.cancel)return true;await sleep(Math.min(50,ms))}return !!S.cancel};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const FF=()=>LAY[S.lay].F||F,cnt=()=>LAY[S.lay].n,done=()=>Array.from({length:cnt()}).every((_,i)=>S.photos[i]);
const curFr=()=>S.custom?{bg:S.custom,fg:'#ffffff',pat:'dots',ink:'#2d1b69'}:FR[S.fr];
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),3200)}

/* ---------- gambar ---------- */
function card(c,x,y,src,i){
  const em=ST[S.st].e;
  c.save();c.shadowColor='rgba(45,27,105,.35)';c.shadowOffsetY=6;c.shadowBlur=12;c.fillStyle='#fff';rr(c,x-8,y-8,W+16,H+16,20);c.fill();c.restore();
  c.save();rr(c,x,y,W,H,14);c.clip();
  if(src){if('filter' in c)c.filter=FI[S.fi].css;const z=S.zoom||1;
    if(z>1){const sw=src.width/z,sh=src.height/z;c.drawImage(src,(src.width-sw)/2,(src.height-sh)*.4,sw,sh,x,y,W,H)}else c.drawImage(src,x,y,W,H);c.filter='none'}
  else{c.fillStyle='#f3e4ff';c.fillRect(x,y,W,H);c.fillStyle='#ff5fa2';c.font='800 90px "Bricolage Grotesque",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x+W/2,y+H/2)}
  c.restore();
  if(em.length){c.font='60px sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.save();c.translate(x+W-22,y+8);c.rotate(.3);c.fillText(em[i%em.length],0,0);c.restore();
    c.save();c.translate(x+24,y+H-6);c.rotate(-.3);c.fillText(em[(i+2)%em.length],0,0);c.restore()}
}
const CAPF=[{n:'Bricolage Grotesque',w:800,sz:46,l:'Modern'},{n:'Pacifico',w:400,sz:42,l:'Script'},{n:'Caveat',w:700,sz:58,l:'Tulisan tangan'},{n:'Fredoka',w:700,sz:46,l:'Bulat'}];
function caption(c,fr,w,h){const f=CAPF[S.capF]||CAPF[0];c.fillStyle=fr.ink;c.textAlign='center';c.textBaseline='middle';c.font=f.w+' '+f.sz+'px "'+f.n+'",sans-serif';c.fillText(S.cap||' ',w/2,h-FF()/2+4)}
const tImgs={};
function tplImg(t){let e=tImgs[t.id];if(!e){e=tImgs[t.id]=new Image();e.onload=()=>{const v=document.body.dataset.view;if(v==='edit')render()};e.src=t.src}return e.complete&&e.naturalWidth?e:null}
function paintT(c,t,upTo,cur){
  const im=tplImg(t);
  if(im)c.drawImage(im,0,0,t.w,t.h);else{c.fillStyle='#d9c8ff';c.fillRect(0,0,t.w,t.h)}
  t.slots.forEach((s,i)=>{
    const src=i<upTo?S.photos[i]:(i===upTo?cur:null);if(!src)return;
    const g=S.grow||1,z=S.zoom||1;
    c.save();c.beginPath();s.poly.forEach(([x,y],k)=>{const px=s.cx+(x-s.cx)*g,py=s.cy+(y-s.cy)*g;k?c.lineTo(px,py):c.moveTo(px,py)});c.closePath();c.clip();
    c.translate(s.cx,s.cy);c.rotate(s.a);
    const k=Math.max((s.w*1.06*g+10)/src.width,(s.h*1.06*g+10)/src.height)*z,dw=src.width*k,dh=src.height*k,by=(dh-s.h*g)*.08;
    if('filter' in c)c.filter=FI[S.fi].css;c.drawImage(src,-dw/2,-dh/2+by,dw,dh);c.filter='none';
    c.restore();
  });
}
function paint(c,ui){const{L,w,h}=dims();if(L.tpl){paintT(c,L.tpl,L.n,null);drawFree(c,ui);return}const fr=curFr();back(c,fr,w,h);
  for(let i=0;i<(L.dup?L.n*2:L.n);i++){const pi=L.dup?Math.floor(i/L.c):i;card(c,P+(i%L.c)*(W+G),P+Math.floor(i/L.c)*(H+G),S.photos[pi],pi)}caption(c,fr,w,h);drawFree(c,ui)}
function paintOne(c,src,i){const w=P*2+W,h=P+H+FF(),fr=curFr();back(c,fr,w,h);card(c,P,P,src,i);caption(c,fr,w,h)}
const rat=()=>cv.width/(cv.getBoundingClientRect().width||cv.width);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function drawFree(c,ui){
  S.free.forEach((s,i)=>{
    c.save();c.translate(s.x,s.y);c.rotate(s.r);c.font=s.s+'px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(s.e,0,0);
    if(ui&&i===S.sel){const h=s.s/2,k=rat(),hr=11*k;
      c.strokeStyle='#ff5fa2';c.lineWidth=3*k;c.setLineDash([8*k,6*k]);c.strokeRect(-h,-h,s.s,s.s);c.setLineDash([]);c.lineWidth=2*k;c.strokeStyle='#fff';
      c.fillStyle='#ff5fa2';c.beginPath();c.arc(h,h,hr,0,7);c.fill();c.stroke();
      c.fillStyle='#2d1b69';c.beginPath();c.arc(-h,-h,hr,0,7);c.fill();c.stroke();
      c.fillStyle='#fff';c.font='700 '+hr*1.3+'px sans-serif';c.fillText('✕',-h,-h+1)}
    c.restore()});
}
function render(ui=true){const{w,h}=dims();if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;paint(ctx,ui)}

/* ---------- halaman 1: pilih ---------- */
function buildLays(){
  const b=$('#lays'),tb=$('#tpls');b.innerHTML='';tb.innerHTML='';
  Object.entries(LAY).forEach(([k,L])=>{const x=document.createElement('button');x.className='lay';x.setAttribute('aria-pressed',String(S.lay===k));
    x.innerHTML=L.tpl?`<img class="tt" src="${L.tpl.src}" alt=""><b>${L.name}</b><small>${L.n} foto</small>`:`<i class="mini" style="--c:${L.c}">${'<u></u>'.repeat(L.dup?L.n*2:L.n)}</i><b>${L.name}</b><small>${L.n} foto</small>`;
    x.onclick=()=>{if(LAY[k].n!==cnt()){S.photos=[];S.clips=[]}S.lay=k;S.zoom=LAY[k].tpl?1.3:1;S.grow=1;if(LAY[k].tpl)tplImg(LAY[k].tpl);buildLays()};(L.tpl?tb:b).appendChild(x)});
}
function setTimer(v){S.timer=v;document.querySelectorAll('[data-timer]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.timer===v)))}
document.querySelectorAll('[data-timer]').forEach(b=>b.onclick=()=>setTimer(+b.dataset.timer));

function setupTab(t){$('#lays').hidden=t;$('#tpls').hidden=!t;$('#tabLay').setAttribute('aria-pressed',String(!t));$('#tabTpl').setAttribute('aria-pressed',String(t))}
$('#tabLay').onclick=()=>setupTab(false);$('#tabTpl').onclick=()=>setupTab(true);
/* ---------- halaman 2: jepret ---------- */
function buildSlots(){
  const t=$('#thumbs');t.innerHTML='';
  for(let i=0;i<cnt();i++){
    const d=document.createElement('div'),has=!!S.photos[i];d.className='slot'+(has?' ok':'');
    if(has){
      const c=document.createElement('canvas');c.width=160;c.height=120;c.getContext('2d').drawImage(S.photos[i],0,0,160,120);d.appendChild(c);
      const x=document.createElement('button');x.type='button';x.className='rt';x.textContent='✕';x.title='Ulangi foto '+(i+1);x.setAttribute('aria-label','Ulangi foto '+(i+1));
      x.onclick=e=>{e.stopPropagation();shoot(i)};d.appendChild(x);
    }
    const s=document.createElement('b');s.textContent=has?i+1:'+'+(i+1);d.appendChild(s);t.appendChild(d);
  }
  const dn=done();$('#btnNext').disabled=!dn;$('#btnNext').classList.toggle('pulse',dn);
  $('#btnRetakeLast').disabled=!S.photos.some((p,i)=>p&&i<cnt());
  {const f=S.photos.filter(Boolean).length;$('#prog').textContent=f+'/'+cnt()+' foto';$('#barI').style.width=(100*f/cnt())+'%'}
}
async function shoot(i){
  if(!stream){toast('Nyalakan kamera dulu, atau unggah foto ya');return}
  if(S.busy)return;S.busy=true;S.cancel=false;
  const c=$('#count'),cam=$('#cam'),clip=[],vw=video.videoWidth,vh=video.videoHeight;
  document.body.classList.add('shooting');cam.classList.add('busy');
  const end=()=>{c.classList.remove('on');$('#pose').classList.remove('on');cam.classList.remove('busy');document.body.classList.remove('shooting');S.busy=false;S.cancel=false};
  if(S.tips){let k;do{k=Math.random()*POSE.length|0}while(k===lastPose);lastPose=k;$('#pose').textContent='💡 '+POSE[k];$('#pose').classList.add('on')}
  for(let t=S.timer;t>0;t--){
    c.textContent=t;c.classList.remove('on');void c.offsetWidth;c.classList.add('on');
    if(t>1){if(await waitC(1000)){end();toast('Dibatalkan');return false}}
    else for(let k=0;k<M;k++){clip.push(grab(video,vw,vh,S.mirror));if(await waitC(80)){end();toast('Dibatalkan');return false}}
  }
  c.classList.remove('on');$('#pose').classList.remove('on');
  const f=$('#flash');f.classList.add('on');
  const photo=grab(video,vw,vh,S.mirror);
  S.photos[i]=photo;clip.push(photo);S.clips[i]=clip;
  await sleep(80);f.classList.remove('on');
  end();buildSlots();return true;
}
async function auto(){
  if(!stream)return toast('Nyalakan kamera dulu ya');
  if(done())return toast('Semua foto sudah terisi. Ketuk ✕ di foto untuk mengulang');
  for(let i=0;i<cnt();i++){if(!S.photos[i]){const ok=await shoot(i);if(ok===false)return;await sleep(600)}}
  toast('Semua foto masuk! Lanjut hias ✨');
}
async function startCam(){
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
    video.srcObject=stream;$('#hint').style.display='none';$('#btnAuto').disabled=false;$('#btnCam').textContent='Kamera nyala ✓';
  }catch(e){toast('Kamera tidak bisa dibuka');const h=$('#hint');h.style.display='';h.innerHTML='<b>🚫</b>Kamera belum diizinkan. Klik ikon gembok di address bar, izinkan kamera, lalu tekan Nyalakan kamera. Atau pakai Unggah foto.'}
}
function stopCam(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;$('#hint').style.display='';$('#hint').innerHTML='<b>📷</b>Izinkan akses kamera saat browser meminta, atau unggah foto.';$('#btnAuto').disabled=true;$('#btnCam').textContent='Nyalakan kamera'}

/* ---------- halaman 3: hias ---------- */
const TABS=[['fr','🖼️ Bingkai'],['fi','✨ Filter'],['zm','🔍 Zoom'],['st','🎀 Set stiker'],['fs','📌 Tempel'],['tx','✏️ Teks']];
const EMO=['🦋','💿','⭐','🪩','🎀','🤍','🩰','🌷','🧋','🍰','🍡','🍓','🍒','🍵','🌿','🐸','💜','🎤','✨','👽','🛸','💫','🌙','🧸','🐰','🐱','🐻','🦄','🌸','🌻','👑','💎','💖','🔥','😎','🥹','🫶','💌','💋','🌈','☁️','⚡','🫧','🕶️','🎧','📸','🥂','🍀','🪐','😂'];
function buildTabs(){
  const t=$('#tabs');t.innerHTML='';
  const tabs=LAY[S.lay].tpl?TABS.filter(x=>x[0]==='fi'||x[0]==='zm'||x[0]==='fs'):TABS;
  if(!tabs.some(x=>x[0]===S.tab))S.tab=tabs[0][0];
  tabs.forEach(([k,l])=>{const b=document.createElement('button');b.className='chip';b.textContent=l;b.setAttribute('aria-pressed',String(S.tab===k));b.onclick=()=>{S.tab=k;buildTabs()};t.appendChild(b)});
  buildOpts();
}
function tile(label,h,draw,on,pick){
  const b=document.createElement('button');b.className='tile';b.setAttribute('aria-pressed',String(on));
  const c=document.createElement('canvas');c.width=192;c.height=h;draw(c.getContext('2d'));
  const s=document.createElement('span');s.textContent=label;b.append(c,s);
  b.onclick=()=>{pick();document.querySelectorAll('#opts .tile').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');render()};return b;
}
function buildOpts(){
  const o=$('#opts');o.innerHTML='';o.className='opts';
  if(S.tab==='fr'){
    FR.forEach((f,i)=>o.appendChild(tile(f.name,256,g=>back(g,f,192,256),!S.custom&&S.fr===i,()=>{S.fr=i;S.custom=null})));
    const l=document.createElement('label');l.className='tile';l.innerHTML='<span style="font-size:2rem">🎨</span><input type="color" value="#ffb3d6" aria-label="Warna bingkai sendiri"><span>Warna sendiri</span>';
    l.querySelector('input').oninput=e=>{S.custom=e.target.value;document.querySelectorAll('#opts .tile').forEach(x=>x.setAttribute('aria-pressed','false'));l.setAttribute('aria-pressed','true');render()};o.appendChild(l);
  }else if(S.tab==='fi'){
    FI.forEach((f,i)=>o.appendChild(tile(f.name,144,g=>{const p=S.photos[0];if(p){if('filter' in g)g.filter=f.css;g.drawImage(p,0,0,192,144)}else{g.fillStyle='#c9b6ff';g.fillRect(0,0,192,144)}},S.fi===i,()=>{S.fi=i})));
  }else if(S.tab==='st'){
    ST.forEach((s,i)=>o.appendChild(tile(s.name,100,g=>{g.fillStyle='#f3e4ff';g.fillRect(0,0,192,100);g.font='40px sans-serif';g.textAlign='center';g.textBaseline='middle';
      if(s.e.length)s.e.slice(0,3).forEach((e,j)=>g.fillText(e,36+j*60,52));else g.fillText('∅',96,52)},S.st===i,()=>{S.st=i})));
  }else if(S.tab==='zm'){
    const Tp=!!LAY[S.lay].tpl;o.className='opts txt';
    o.innerHTML='<label class="rg">🔍 Zoom orang <b id="zV"></b><input type="range" id="zm" min="100" max="250" step="5"></label>'+(Tp?'<label class="rg">⬛ Perbesar area foto <b id="gV"></b><input type="range" id="gr" min="100" max="140" step="1"></label>':'')+'<p class="hint2">Geser zoom supaya orang di dalam foto tampil lebih besar.'+(Tp?' Area foto bisa diperbesar melewati lubang bingkai kalau fotonya masih terasa kecil.':'')+'</p><button class="sm" id="zReset" style="margin-top:10px">Atur ulang</button>';
    const z=$('#zm'),g=$('#gr');z.value=Math.round(S.zoom*100);$('#zV').textContent=z.value+'%';
    z.oninput=e=>{S.zoom=e.target.value/100;$('#zV').textContent=e.target.value+'%';render()};
    if(g){g.value=Math.round(S.grow*100);$('#gV').textContent=g.value+'%';g.oninput=e=>{S.grow=e.target.value/100;$('#gV').textContent=e.target.value+'%';render()}}
    $('#zReset').onclick=()=>{S.zoom=Tp?1.3:1;S.grow=1;buildOpts();render()};
  }else if(S.tab==='fs'){
    o.className='opts emos';
    o.innerHTML='<p class="hint2">Ketuk emoji untuk menempel di foto. Geser untuk memindah, tarik titik pink untuk memperbesar dan memutar (atau cubit dengan dua jari), ketuk ✕ untuk hapus. Stiker tempel hanya muncul di foto, tidak di video GIF.</p><div class="ctl"><button class="sm" id="fsOne">🗑️ Hapus terpilih</button><button class="sm" id="fsDel">Hapus semua</button></div>';
    EMO.forEach(e=>{const b=document.createElement('button');b.className='emo';b.textContent=e;b.setAttribute('aria-label','Tempel '+e);b.onclick=()=>addFree(e);o.appendChild(b)});
    $('#fsOne').onclick=()=>{if(S.sel==null)return toast('Ketuk stiker di foto dulu ya');S.free.splice(S.sel,1);S.sel=null;render()};
    $('#fsDel').onclick=()=>{S.free=[];S.sel=null;render()};
  }else{
    o.className='opts txt';o.innerHTML='<label>Tulisan di bawah foto<input type="text" id="cap" maxlength="28"></label><h3 style="margin:16px 0 8px">Gaya huruf</h3><div class="chips" id="capf"></div>';
    const i=$('#cap');i.value=S.cap;i.oninput=e=>{S.cap=e.target.value;render()};
    CAPF.forEach((f,k)=>{const b=document.createElement('button');b.className='chip';b.style.fontFamily='"'+f.n+'"';b.style.fontWeight=f.w;b.textContent=f.l;b.setAttribute('aria-pressed',String(S.capF===k));
      b.onclick=async()=>{S.capF=k;try{await document.fonts.load(f.w+' 40px "'+f.n+'"')}catch(e){}document.querySelectorAll('#capf .chip').forEach((x,q)=>x.setAttribute('aria-pressed',String(q===k)));render()};$('#capf').appendChild(b)});
  }
}

/* ---------- halaman 4: simpan ---------- */
/* ---------- video (MediaRecorder) ---------- */
function pickMimes(){
  if(!window.MediaRecorder)return[];
  const ok=l=>l.find(t=>MediaRecorder.isTypeSupported(t));
  return[ok(['video/mp4;codecs=avc1.42E01F','video/mp4;codecs=avc1.4D401F','video/mp4;codecs=avc1.640028','video/mp4']),
         ok(['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'])].filter(Boolean);
}
async function recordOnce(mime,T,w,h,vw,vh,tk,box){
  const n=cnt(),mk=(a,b)=>{const c=document.createElement('canvas');c.width=a;c.height=b;return c};
  const full=mk(w,h),fc=full.getContext('2d'),rec=mk(vw,vh),rc=rec.getContext('2d');
  const draw=(s,i)=>{T?paintT(fc,T,i,s):paintOne(fc,s,i);rc.drawImage(full,0,0,vw,vh)};
  const stream=rec.captureStream(30),chunks=[];let failed=false;
  const mr=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4e6});
  mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};mr.onerror=()=>{failed=true};
  const stopped=new Promise(r=>mr.onstop=r),end=()=>{try{mr.stop()}catch(e){}stream.getTracks().forEach(t=>t.stop())};
  draw(S.clips[0]?S.clips[0][0]:S.photos[0],0);mr.start(250);
  for(let i=0;i<n;i++){
    const cl=S.clips[i];
    if(cl)for(let k=0;k<cl.length;k++){draw(cl[k],i);await sleep(k===cl.length-1?1000:80)}
    else{draw(S.photos[i],i);await sleep(1300)}
    load(box,'Merekam video… '+(i+1)+'/'+n);
    if(tk!==vidTk){end();return null}
  }
  await sleep(250);end();await Promise.race([stopped,sleep(4000)]);
  const blob=new Blob(chunks,{type:(chunks[0]&&chunks[0].type)||mime.split(';')[0]});
  return failed||blob.size<2000?undefined:blob;
}
async function makeVideo(){
  const tk=++vidTk,box=$('#vidBox'),btn=$('#btnVid'),list=pickMimes();btn.disabled=true;vidBlob=null;vidUrl=null;
  if(!list.length){box.textContent='Browser ini belum mendukung perekaman video. Pakai GIF ya.';return}
  load(box,'Merekam video… tetap di halaman ini ya');await sleep(60);
  const T=LAY[S.lay].tpl,w=T?T.w:P*2+W,h=T?T.h:P+H+FF(),sc=Math.min(1,720/w,1000/h),vw=Math.round(w*sc/2)*2,vh=Math.round(h*sc/2)*2;
  let blob;
  for(const mime of list){
    try{blob=await recordOnce(mime,T,w,h,vw,vh,tk,$('#vidBox'))}catch(e){console.warn('rekam gagal',mime,e);blob=undefined}
    if(blob===null)return;
    if(blob)break;
  }
  if(tk!==vidTk)return;
  if(!blob){box.textContent='Video belum bisa dibuat di perangkat ini. Foto dan GIF tetap bisa diunduh.';return}
  vidExt=blob.type.includes('mp4')?'mp4':'webm';vidBlob=blob;vidUrl=URL.createObjectURL(blob);
  box.innerHTML='';const v=document.createElement('video');v.src=vidUrl;v.controls=true;v.loop=true;v.muted=true;v.autoplay=true;v.playsInline=true;box.appendChild(v);v.play().catch(()=>{});
  $('#vidExt').textContent=vidExt.toUpperCase();btn.disabled=false;
}
/* ---------- GIF berkualitas: palet median-cut + dithering ---------- */
function makePalette(frames){
  const hist=new Uint32Array(32768);
  for(const d of frames)for(let i=0;i<d.length;i+=16)hist[((d[i]>>3)<<10)|((d[i+1]>>3)<<5)|(d[i+2]>>3)]++;
  const cols=[];for(let i=0;i<32768;i++)if(hist[i])cols.push(i);
  const ch=(c,a)=>a===0?(c>>10)&31:a===1?(c>>5)&31:c&31;
  const boxes=[cols];
  while(boxes.length<256){
    let bi=-1,best=0;
    boxes.forEach((b,i)=>{if(b.length>1){let pop=0;for(const c of b)pop+=hist[c];if(pop>best){best=pop;bi=i}}});
    if(bi<0)break;
    const b=boxes[bi],mn=[31,31,31],mx=[0,0,0];
    for(const c of b)for(let a=0;a<3;a++){const v=ch(c,a);if(v<mn[a])mn[a]=v;if(v>mx[a])mx[a]=v}
    const a=[0,1,2].sort((x,y)=>(mx[y]-mn[y])-(mx[x]-mn[x]))[0];
    b.sort((p,q)=>ch(p,a)-ch(q,a));
    let tot=0;for(const c of b)tot+=hist[c];
    let acc=0,cut=1;for(let i=0;i<b.length;i++){acc+=hist[b[i]];if(acc>=tot/2){cut=Math.min(Math.max(i+1,1),b.length-1);break}}
    boxes.splice(bi,1,b.slice(0,cut),b.slice(cut));
  }
  const pal=new Uint8Array(768);
  boxes.forEach((b,i)=>{let r=0,g=0,bl=0,t=0;for(const c of b){const k=hist[c];r+=((c>>10)&31)*k;g+=((c>>5)&31)*k;bl+=(c&31)*k;t+=k}t=t||1;
    pal[i*3]=Math.min(255,r/t*8+4);pal[i*3+1]=Math.min(255,g/t*8+4);pal[i*3+2]=Math.min(255,bl/t*8+4)});
  return pal;
}
function makeLut(pal){
  const lut=new Uint8Array(32768);
  for(let c=0;c<32768;c++){const r=((c>>10)&31)*8+4,g=((c>>5)&31)*8+4,b=(c&31)*8+4;let bd=1e9,bi=0;
    for(let p=0;p<256;p++){const dr=r-pal[p*3],dg=g-pal[p*3+1],db=b-pal[p*3+2],d=dr*dr*2+dg*dg*4+db*db*3;if(d<bd){bd=d;bi=p}}lut[c]=bi}
  return lut;
}
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function dither(d,w,h,lut){
  const o=new Uint8Array(w*h);
  for(let y=0,j=0;y<h;y++)for(let x=0;x<w;x++,j++){
    const i=j*4,t=(BAY[(y&3)*4+(x&3)]-7.5)*1.6;
    let r=d[i]+t,g=d[i+1]+t,b=d[i+2]+t;r=r<0?0:r>255?255:r;g=g<0?0:g>255?255:g;b=b<0?0:b>255?255:b;
    o[j]=lut[((r>>3)<<10)|((g>>3)<<5)|(b>>3)];
  }
  return o;
}
async function makeGif(){
  const tk=++gifTk,box=$('#gifBox'),btn=$('#btnGif');btn.disabled=true;gifUrl=null;gifBlob=null;
  load(box,'Lagi bikin GIF…');await sleep(60);
  const T=LAY[S.lay].tpl,w=T?T.w:P*2+W,h=T?T.h:P+H+FF(),n=cnt(),total=n*(S.clips.some(Boolean)?7:1);
  const gw=Math.round(Math.min(480,Math.sqrt(14e6*w/(h*total)))/2)*2,gh=Math.round(h*gw/w);
  const full=document.createElement('canvas');full.width=w;full.height=h;const fc=full.getContext('2d');
  const sm=document.createElement('canvas');sm.width=gw;sm.height=gh;const sx=sm.getContext('2d',{willReadFrequently:true});
  sx.imageSmoothingQuality='high';
  const raw=[],dl8=[];
  for(let i=0;i<n;i++){
    const cl=S.clips[i],idx=cl?Array.from({length:7},(_,q)=>Math.round(q*(cl.length-1)/6)):[null];
    idx.forEach((k,j)=>{const s=cl?cl[k]:S.photos[i];T?paintT(fc,T,i,s):paintOne(fc,s,i);sx.drawImage(full,0,0,gw,gh);
      raw.push(sx.getImageData(0,0,gw,gh).data);dl8.push(j===idx.length-1?60:16)});
    load(box,'Lagi bikin GIF… '+(i+1)+'/'+n);await sleep(0);if(tk!==gifTk)return;
  }
  load(box,'Lagi bikin GIF… menyusun warna');await sleep(30);
  const pal=makePalette(raw),lut=makeLut(pal);
  const frames=raw.map((d,i)=>{const q=dither(d,gw,gh,lut);q.d=dl8[i];return q});
  await sleep(0);if(tk!==gifTk)return;
  gifBlob=new Blob([gifEncode(frames,gw,gh,16,pal)],{type:'image/gif'});gifUrl=URL.createObjectURL(gifBlob);
  box.innerHTML='';const im=new Image();im.src=gifUrl;im.alt='Hasil GIF';box.appendChild(im);btn.disabled=false;
}
function showResult(){S.sel=null;render(false);$('#btnAlbum').disabled=false;$('#btnAlbum').textContent='💾 Simpan ke album';$('#out').src=cv.toDataURL('image/png');jobP=(async()=>{
    try{await makeVideo()}catch(e){console.error(e);$('#vidBox').textContent='Video gagal dibuat. Foto dan GIF tetap bisa diunduh.'}
    try{await makeGif()}catch(e){console.error(e);$('#gifBox').textContent='GIF gagal dibuat.'}
  })()}

/* ---------- navigasi antar halaman ---------- */
const VIEWS=['home','setup','shoot','edit','result','album','terima'];
function route(){
  let note='';let[v,arg]=location.hash.slice(2).split('/');v=v||'';if(!VIEWS.includes(v))v='home';
  if((v==='edit'||v==='result')&&!done()){v='shoot';note='Selesaikan semua foto dulu ya 📸';history.replaceState(null,'','#/shoot')}
  if(prevV==='shoot'&&v!=='shoot')stopCam();
  if(prevV==='result'&&v!=='result'){vidTk++;gifTk++;$('#qrModal').classList.remove('on');closePeer()}
  if(prevV==='terima'&&v!=='terima')closePeer();
  VIEWS.forEach(x=>$('#v-'+x).hidden=x!==v);
  document.body.dataset.view=v;
  const at=VIEWS.indexOf(v)-1;
  document.querySelectorAll('#steps li').forEach((li,i)=>li.className=i===at?'on':i<at?'past':'');
  try{
    if(v==='setup'){buildLays();setupTab(!!LAY[S.lay].tpl)}
    if(v==='shoot'){buildSlots();if(!stream)startCam()}
    if(v==='edit'){buildTabs();render()}
    if(v==='result')showResult();
    if(v==='album')buildAlbum();
    if(v==='terima')startReceive(arg);
  }catch(e){console.error(e);note='Ups, ada kendala'+(e&&e.name?' ('+e.name+')':'')+'. Coba ulangi ya'}
  prevV=v;scrollTo(0,0);$('#toast').classList.remove('on');if(note)toast(note);
}
addEventListener('hashchange',route);
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g&&!g.disabled)location.hash='#/'+g.dataset.go});

$('#btnCam').onclick=startCam;
$('#btnAuto').onclick=auto;
$('#file').onchange=async e=>{
  const n=cnt();let idx=0;
  for(const f of e.target.files){
    while(idx<n&&S.photos[idx])idx++;if(idx>=n)idx=n-1;
    const img=new Image();img.src=URL.createObjectURL(f);await img.decode();
    S.photos[idx]=grab(img,img.naturalWidth,img.naturalHeight,false);S.clips[idx]=null;idx++;
  }
  e.target.value='';buildSlots();
};
$('#btnMirror').onclick=e=>{S.mirror=!S.mirror;e.target.setAttribute('aria-pressed',String(S.mirror));
  e.target.textContent='🪞 Cermin: '+(S.mirror?'nyala':'mati');$('#cam').classList.toggle('nomirror',!S.mirror)};
$('#btnTips').onclick=e=>{S.tips=!S.tips;e.target.setAttribute('aria-pressed',String(S.tips));e.target.textContent='💡 Ide pose: '+(S.tips?'nyala':'mati')};
$('#btnCancel').onclick=()=>{S.cancel=true};
$('#btnRetakeLast').onclick=()=>{let k=-1;S.photos.forEach((p,i)=>{if(p&&i<cnt())k=i});if(k>=0)shoot(k)};
$('#btnReset').onclick=()=>{S.photos=[];S.clips=[];buildSlots()};
$('#btnNew').onclick=()=>{S.photos=[];S.clips=[];S.free=[];S.sel=null;location.hash='#/setup'};
function outUrl(){
  const v=$('#size').value;if(v==='0')return cv.toDataURL('image/png');
  let[tw,th]=v.split('x').map(Number);if((cv.width>cv.height)!==(tw>th))[tw,th]=[th,tw];
  const c=document.createElement('canvas');c.width=tw;c.height=th;const g=c.getContext('2d');
  if(LAY[S.lay].tpl){g.fillStyle='#fff';g.fillRect(0,0,tw,th)}else back(g,curFr(),tw,th);
  const m=Math.round(Math.min(tw,th)*.03),s=Math.min((tw-2*m)/cv.width,(th-2*m)/cv.height),dw=cv.width*s,dh=cv.height*s;
  g.imageSmoothingQuality='high';g.drawImage(cv,(tw-dw)/2,(th-dh)/2,dw,dh);return c.toDataURL('image/png');
}
const dl=(u,n)=>{const a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove()};
$('#btnSave').onclick=()=>dl(outUrl(),'twinkle-cam-'+$('#size').value+'.png');
$('#btnGif').onclick=()=>gifUrl&&dl(gifUrl,'twinkle-cam.gif');
$('#btnShare').onclick=async()=>{try{
  const b=await (await fetch(outUrl())).blob(),f=new File([b],'twinkle-cam.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],title:'Twinkle Cam'});
  else toast('Perangkat ini belum mendukung bagikan langsung. Pakai tombol Unduh ya');
}catch(e){}};
/* ---------- stiker tempel: geser, besar/putar, cubit ---------- */
function addFree(e){
  if(S.free.length>=40)return toast('Maksimal 40 stiker ya');
  const{w,h}=dims();S.free.push({e,x:w/2+(Math.random()-.5)*120,y:h/2+(Math.random()-.5)*160,s:Math.round(Math.max(120,46*rat())),r:(Math.random()-.5)*.5});S.sel=S.free.length-1;render();
}
const ptr=new Map();let drag=null,rq=0;
const rerender=()=>{if(!rq)rq=requestAnimationFrame(()=>{rq=0;render()})};
const pt=e=>{const r=cv.getBoundingClientRect(),k=cv.width/r.width;return{x:(e.clientX-r.left)*k,y:(e.clientY-r.top)*k,k}};
function hit(x,y){
  for(let i=S.free.length-1;i>=0;i--){const s=S.free[i],dx=x-s.x,dy=y-s.y,co=Math.cos(-s.r),si=Math.sin(-s.r),lx=dx*co-dy*si,ly=dx*si+dy*co,h=s.s*.6;
    if(Math.abs(lx)<=h&&Math.abs(ly)<=h)return i}
  return -1;
}
cv.addEventListener('pointerdown',e=>{
  if(document.body.dataset.view!=='edit')return;
  const p=pt(e);ptr.set(e.pointerId,p);cv.setPointerCapture(e.pointerId);
  if(ptr.size===2&&S.sel!=null){const[a,b]=[...ptr.values()],s=S.free[S.sel];drag={m:'pinch',d0:Math.hypot(a.x-b.x,a.y-b.y)||1,a0:Math.atan2(b.y-a.y,b.x-a.x),s0:s.s,r0:s.r};return}
  const sel=S.sel!=null?S.free[S.sel]:null;
  if(sel){
    const h=sel.s/2,co=Math.cos(sel.r),si=Math.sin(sel.r),hr=Math.min(14*p.k,sel.s*.35);
    if(Math.hypot(p.x-(sel.x+h*co-h*si),p.y-(sel.y+h*si+h*co))<hr){drag={m:'rot'};return}
    if(Math.hypot(p.x-(sel.x-h*co+h*si),p.y-(sel.y-h*si-h*co))<hr){S.free.splice(S.sel,1);S.sel=null;ptr.clear();drag=null;return render()}
  }
  const i=hit(p.x,p.y);
  if(i>=0){const s=S.free.splice(i,1)[0];S.free.push(s);S.sel=S.free.length-1;drag={m:'move',ox:p.x-s.x,oy:p.y-s.y}}
  else{S.sel=null;drag=null}
  render();
});
cv.addEventListener('pointermove',e=>{
  if(!ptr.has(e.pointerId)){if(document.body.dataset.view==='edit'){const p=pt(e);cv.style.cursor=hit(p.x,p.y)>=0?'grab':'default'}return}
  const p=pt(e);ptr.set(e.pointerId,p);
  if(S.sel==null||!drag)return;const s=S.free[S.sel];
  if(drag.m==='pinch'&&ptr.size>=2){const[a,b]=[...ptr.values()];s.s=clamp(drag.s0*Math.hypot(a.x-b.x,a.y-b.y)/drag.d0,30,500);s.r=drag.r0+Math.atan2(b.y-a.y,b.x-a.x)-drag.a0}
  else if(drag.m==='rot'){const dx=p.x-s.x,dy=p.y-s.y;s.s=clamp(Math.hypot(dx,dy)*Math.SQRT2,30,500);s.r=Math.atan2(dy,dx)-Math.PI/4}
  else if(drag.m==='move'){const d=dims();s.x=clamp(p.x-drag.ox,0,d.w);s.y=clamp(p.y-drag.oy,0,d.h)}
  rerender();
});
const endPtr=e=>{ptr.delete(e.pointerId);if(!ptr.size||(drag&&drag.m==='pinch'))drag=null};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
addEventListener('keydown',e=>{if((e.key==='Delete'||e.key==='Backspace')&&S.sel!=null&&document.body.dataset.view==='edit'&&!/INPUT|SELECT/.test(document.activeElement.tagName)){S.free.splice(S.sel,1);S.sel=null;render()}});
/* ---------- album lokal (IndexedDB) ---------- */
const idb=()=>new Promise((ok,no)=>{const r=indexedDB.open('twinkle-cam',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('meta',{keyPath:'id'});d.createObjectStore('files',{keyPath:'id'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const req=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const done2=t=>new Promise((ok,no)=>{t.oncomplete=ok;t.onerror=t.onabort=()=>no(t.error)});
async function albumAdd(photo,gif,thumb,lay,vid,vext){const d=await idb(),t=d.transaction(['meta','files'],'readwrite'),id=Date.now();
  t.objectStore('meta').put({id,t:id,lay,thumb,gif:!!gif,vid:!!vid});t.objectStore('files').put({id,photo,gif,vid,vext});await done2(t);return id}
async function albumList(){const d=await idb();return(await req(d.transaction('meta').objectStore('meta').getAll())).reverse()}
async function albumGet(id){const d=await idb();return req(d.transaction('files').objectStore('files').get(id))}
async function albumDel(id){const d=await idb(),t=d.transaction(['meta','files'],'readwrite');t.objectStore('meta').delete(id);t.objectStore('files').delete(id);await done2(t)}
async function saveAlbum(){
  const b=$('#btnAlbum');b.disabled=true;
  try{
    if(!gifBlob||!vidBlob)toast('Menunggu video selesai…');
    await jobP;
    const pb=await new Promise(r=>cv.toBlob(r,'image/png')),t=document.createElement('canvas');
    t.width=200;t.height=Math.round(200*cv.height/cv.width);t.getContext('2d').drawImage(cv,0,0,t.width,t.height);
    await albumAdd(pb,gifBlob,t.toDataURL('image/jpeg',.7),LAY[S.lay].name,vidBlob,vidExt);
    b.textContent='Tersimpan ✓';toast('Tersimpan di album 🎉');
  }catch(e){b.disabled=false;toast('Gagal menyimpan. Penyimpanan browser mungkin penuh atau diblokir.')}
}
async function buildAlbum(){
  const g=$('#albumGrid');let list=[];
  try{list=await albumList()}catch(e){toast('Album tidak bisa dibuka di browser ini')}
  g.innerHTML='';$('#albumEmpty').hidden=list.length>0;$('#albumCount').textContent=list.length?'('+list.length+')':'';
  list.forEach(m=>{const b=document.createElement('button'),d=new Date(m.t).toLocaleDateString('id-ID',{day:'numeric',month:'short'});
    b.className='ph';b.innerHTML='<img alt="Foto '+d+'"><span>'+d+(m.vid||m.gif?' 🎬':'')+'</span>';b.firstChild.src=m.thumb;b.onclick=()=>openViewer(m.id);g.appendChild(b)});
}
let vid=null,vi=0,vUrls=[],vItems=[];
function setV(i){
  vi=i;const x=vItems[i],im=$('#vImg'),vv=$('#vVid');
  if(x.t==='vid'){im.hidden=true;vv.hidden=false;vv.src=x.u;vv.play().catch(()=>{})}
  else{vv.pause();vv.hidden=true;vv.removeAttribute('src');im.hidden=false;im.src=x.u}
  document.querySelectorAll('#vTabs button').forEach((b,k)=>b.setAttribute('aria-pressed',String(k===i)));$('#vDel').textContent='🗑️ Hapus';
}
async function openViewer(id){
  const f=await albumGet(id);if(!f)return;
  vUrls.forEach(u=>URL.revokeObjectURL(u));
  vItems=[{l:'📷 Foto',b:f.photo,n:'twinkle-cam.png',t:'img'}];
  if(f.vid)vItems.push({l:'🎬 Video',b:f.vid,n:'twinkle-cam.'+(f.vext||'webm'),t:'vid'});
  if(f.gif)vItems.push({l:'🎞️ GIF',b:f.gif,n:'twinkle-cam.gif',t:'img'});
  vItems.forEach(x=>x.u=URL.createObjectURL(x.b));vUrls=vItems.map(x=>x.u);
  vid=id;const tabs=$('#vTabs');tabs.innerHTML='';tabs.hidden=vItems.length<2;
  vItems.forEach((x,i)=>{const b=document.createElement('button');b.textContent=x.l;b.onclick=()=>setV(i);tabs.appendChild(b)});
  setV(0);$('#viewer').classList.add('on');
}
$('#vSave').onclick=()=>dl(vItems[vi].u,vItems[vi].n);
$('#vClose').onclick=()=>{$('#vVid').pause();$('#viewer').classList.remove('on')};
$('#btnVid').onclick=()=>vidUrl&&dl(vidUrl,'twinkle-cam.'+vidExt);
$('#vDel').onclick=async e=>{
  if(e.target.textContent.includes('Yakin')){await albumDel(vid);$('#viewer').classList.remove('on');buildAlbum();toast('Foto dihapus')}
  else e.target.textContent='Yakin hapus?';
};
$('#btnAlbum').onclick=saveAlbum;
/* ---------- galeri template, statistik, tema ---------- */
function buildGallery(){
  if(typeof TPL==='undefined')return;
  const g=$('#gal');
  TPL.forEach(t=>{const b=document.createElement('button');b.className='gcard';b.innerHTML='<img alt="" loading="lazy"><b></b><small></small>';
    b.querySelector('img').src=t.src;b.querySelector('b').textContent=t.name;b.querySelector('small').textContent=t.slots.length+' foto';
    b.onclick=()=>{const k='t_'+t.id;if(LAY[k].n!==cnt()){S.photos=[];S.clips=[]}S.lay=k;S.zoom=1.3;S.grow=1;tplImg(t);location.hash='#/setup'};g.appendChild(b)});
  $('#stT').textContent=TPL.length;
}
$('#stF').textContent=FR.length;$('#stI').textContent=FI.length;buildGallery();
$('#btnTheme').onclick=()=>{
  const r=document.documentElement,cur=r.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),nx=cur==='dark'?'light':'dark';
  r.dataset.theme=nx;try{localStorage.setItem('tc-theme',nx)}catch(e){}
  document.querySelector('meta[name=theme-color]').content=nx==='dark'?'#0d0a22':'#6c5ce7';
};
/* ---------- PWA ---------- */
let dip=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;$('#btnInstall').hidden=false});
$('#btnInstall').onclick=async()=>{if(!dip)return;dip.prompt();await dip.userChoice;dip=null;$('#btnInstall').hidden=true};
addEventListener('appinstalled',()=>{$('#btnInstall').hidden=true;toast('Twinkle Cam terpasang 🎉')});
if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!navigator.standalone)$('#iosHint').hidden=false;
if('serviceWorker' in navigator&&isSecureContext)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
if(document.fonts)CAPF.forEach(f=>document.fonts.load(f.w+' 24px "'+f.n+'"').then(()=>{if(document.body.dataset.view==='edit')render()}).catch(()=>{}));
if(location.protocol==='file:')$('#fileNote').hidden=false;
/* ---------- Kirim ke HP: QR + transfer langsung antar perangkat (WebRTC lewat PeerJS) ---------- */
const PEER_OPTS=window.PEER_OPTS||{},CHUNK=64*1024;
let qPeer=null;
const setQ=(t,bad)=>{const e=$('#qrStat');e.textContent=t;e.classList.toggle('bad',!!bad)};
function closePeer(){if(qPeer){try{qPeer.destroy()}catch(e){}qPeer=null}}
function qrDraw(text){
  const qr=qrcode(0,'M');qr.addData(text);qr.make();
  const n=qr.getModuleCount(),q=4,s=Math.max(3,Math.floor(560/(n+q*2))),cv2=$('#qrCanvas');cv2.width=cv2.height=s*(n+q*2);
  const g=cv2.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv2.width,cv2.height);g.fillStyle='#1c1740';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))g.fillRect((c+q)*s,(r+q)*s,s,s);
}
async function collectFiles(){
  const out=[];
  try{out.push({name:'twinkle-cam.png',blob:await (await fetch(outUrl())).blob()})}catch(e){}
  if(vidBlob)out.push({name:'twinkle-cam.'+vidExt,blob:vidBlob});
  if(gifBlob)out.push({name:'twinkle-cam.gif',blob:gifBlob});
  return out;
}
async function serve(conn){
  conn.on('open',async()=>{
    setQ('HP terhubung. Menyiapkan file…');
    try{await jobP}catch(e){}
    try{
      const files=await collectFiles();conn.send(JSON.stringify({t:'start',n:files.length}));
      for(const f of files){
        const buf=await f.blob.arrayBuffer();conn.send(JSON.stringify({t:'file',name:f.name,mime:f.blob.type||'application/octet-stream',size:buf.byteLength}));
        for(let o=0;o<buf.byteLength;o+=CHUNK){conn.send(buf.slice(o,o+CHUNK));while(conn.dataChannel&&conn.dataChannel.bufferedAmount>1e6)await sleep(30)}
      }
      conn.send(JSON.stringify({t:'done'}));setQ('Terkirim ke HP ✓ Kamu bisa menutup jendela ini, atau biarkan terbuka untuk HP lain.');
    }catch(e){console.error(e);setQ('Pengiriman terputus. Pindai ulang QR-nya.',true)}
  });
  conn.on('error',()=>setQ('Koneksi ke HP bermasalah. Pindai ulang QR-nya.',true));
}
function openQR(){
  $('#qrModal').classList.add('on');$('#qrLink').value='';closePeer();
  const cv2=$('#qrCanvas');cv2.getContext('2d').clearRect(0,0,cv2.width,cv2.height);
  if(typeof Peer==='undefined'||typeof qrcode==='undefined'){setQ('Library QR belum termuat. Muat ulang halaman.',true);return}
  setQ('Menghubungkan…');
  const id='tc'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4),p=qPeer=new Peer(id,PEER_OPTS);
  p.on('open',()=>{
    const url=location.href.split('#')[0]+'#/terima/'+id;$('#qrLink').value=url;qrDraw(url);
    const local=location.protocol==='file:'||/^(localhost|127\.|\[::1\])/.test(location.hostname);
    setQ(local?'QR siap, tapi alamat web ini hanya bisa dibuka di perangkat ini. Buka lewat alamat online (Vercel) agar HP bisa memindainya.':'Menunggu HP memindai QR… jangan tutup halaman ini.',local);
  });
  p.on('connection',serve);
  p.on('disconnected',()=>{try{p.reconnect()}catch(e){}});
  p.on('error',e=>setQ('Gagal menyambung ('+(e.type||e.message)+'). Cek internet lalu coba lagi.',true));
}
$('#btnQR').onclick=openQR;
$('#qrClose').onclick=()=>{$('#qrModal').classList.remove('on');closePeer()};
$('#qrCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('#qrLink').value);toast('Link disalin')}catch(e){$('#qrLink').select();toast('Tekan Salin manual (Ctrl+C)')}};
/* sisi HP: menerima file */
function startReceive(id){
  closePeer();const st=$('#recvStat'),items=$('#recvItems'),bar=$('#recvBar');items.innerHTML='';bar.style.width='0';
  const fail=m=>{st.textContent=m;st.classList.add('bad');items.innerHTML='<button class="pri" id="recvRetry">Coba lagi</button>';$('#recvRetry').onclick=()=>startReceive(id)};
  st.classList.remove('bad');st.textContent='Menghubungkan ke perangkat pengirim…';
  if(!id||typeof Peer==='undefined'){fail('Link tidak valid.');return}
  const p=qPeer=new Peer(PEER_OPTS);let opened=false,cur=null,total=0,doneN=0;
  const to=setTimeout(()=>{if(!opened)fail('Tidak bisa terhubung. Pastikan halaman di komputer masih terbuka, lalu pindai ulang QR-nya.')},30000);
  p.on('error',e=>{clearTimeout(to);fail('Gagal menyambung ('+(e.type||e.message)+'). Pastikan halaman pengirim masih terbuka.')});
  p.on('open',()=>{
    const c=p.connect(id,{reliable:true});
    c.on('open',()=>{opened=true;clearTimeout(to);st.textContent='Terhubung. Menyiapkan file…'});
    c.on('error',()=>fail('Koneksi terputus. Pindai ulang QR-nya.'));
    c.on('data',d=>{
      if(typeof d==='string'){
        const m=JSON.parse(d);
        if(m.t==='start'){total=m.n;st.textContent='Menerima '+total+' file…'}
        else if(m.t==='file'){const el=document.createElement('figure');el.className='card';el.innerHTML='<figcaption></figcaption><div class="gifbox"><div class="spin"></div></div><div class="bar2"><i></i></div>';
          el.firstChild.textContent=m.name;items.appendChild(el);cur={m,parts:[],got:0,el}}
        else if(m.t==='done'){st.textContent='Selesai! Simpan file di bawah ini.';bar.style.width='100%'}
      }else if(cur){
        cur.parts.push(d);cur.got+=d.byteLength;cur.el.querySelector('.bar2 i').style.width=Math.min(100,100*cur.got/cur.m.size)+'%';
        if(cur.got>=cur.m.size){
          const blob=new Blob(cur.parts,{type:cur.m.mime}),url=URL.createObjectURL(blob),el=cur.el,isV=cur.m.mime.startsWith('video');
          const box=el.querySelector('.gifbox');box.innerHTML='';
          const media=document.createElement(isV?'video':'img');media.src=url;if(isV){media.controls=true;media.loop=true;media.muted=true;media.playsInline=true;media.autoplay=true}else media.alt=cur.m.name;box.appendChild(media);
          el.querySelector('.bar2').remove();
          const a=document.createElement('a');a.className='btn pri sm';a.href=url;a.download=cur.m.name;a.textContent='⬇️ Simpan '+cur.m.name.split('.').pop().toUpperCase();
          const r=document.createElement('div');r.className='row';r.appendChild(a);el.appendChild(r);
          doneN++;bar.style.width=(100*doneN/Math.max(total,1))+'%';cur=null;
        }
      }
    });
  });
}
setTimer(5);route();
