/* =====================================================================
   TWINKLE CAM — photobooth.js  (SEMUA logika halaman Photobooth)
   Diadaptasi dari twinkle_cam.zip; login & batas unduh dari rev5.
   PETA BAGIAN (cari teks "[BAGIAN]" untuk melompat):
    1. DATA        : LAY (tata letak), FR (bingkai), FI (filter), ST (set stiker), POSE (ide pose)
    2. GAMBAR      : back() latar bingkai, card() foto, caption(), paint()/render() menggambar hasil
    3. STATE & BATAS UNDUH : const S (pilihan pengguna), gate() batas guest
    4. LANGKAH 1   : buildLays()  - pilih tata letak + timer
    5. LANGKAH 2   : buildTemplates() - pilih template/bingkai
    6. LANGKAH 3   : shoot()/auto() - kamera, hitung mundur, ambil foto; startCam()
    7. LANGKAH 4   : buildTabs()/buildOpts() - hias (filter, set stiker, tempel, teks)
    8. LANGKAH 5   : showResult(), makeGif() (live photo), tombol unduh/bagikan/album
    9. ROUTER      : route() mengatur langkah mana yang tampil (hash URL)
   10. KIRIM KE HP : openQR(), serve(), startReceive() (QR + PeerJS)
   Cara revisi cepat: lihat PANDUAN-REVISI.md di folder utama.
   ===================================================================== */
/* TWINKLE CAM rev6 — Alur photobooth: Pilih > Jepret > Hias > Simpan.
   Mesin kanvas, GIF, video, dan QR diadaptasi dari twinkle_cam.zip; login/limit unduh dari rev5. */
const $=s=>document.querySelector(s);
/* [BAGIAN 1: DATA] Ukuran dasar (piksel): W,H = ukuran satu foto, P = tepi bingkai, G = jarak antar foto, F = tinggi area teks bawah, M = jumlah frame klip video */
/* [KUALITAS] K = skala ketajaman hasil. K=2 -> foto diambil 960x720 dan strip dirender 2x lebih besar (ubah ke 1 untuk mode ringan, 3 untuk lebih tajam tapi berat) */
const K=2;
/* [FITUR] rev15: RASIO FOTO MENGIKUTI KAMERA. AR = lebar/tinggi kamera (disimpan di localStorage "twinkle_cam_ar", default 16:9).
   H (tinggi satu foto) dihitung dari W dan AR, jadi foto tidak terpotong. setAr() dipanggil saat kamera menyala. */
const W=480,P=32,G=20,F=100,M=12;
let AR=(()=>{try{const v=+localStorage.getItem('twinkle_cam_ar');if(v>.5&&v<2.4)return v}catch(e){}return 16/9})();
let H=Math.round(W/AR);
/* [DATA] TATA LETAK: n = jumlah foto, c = jumlah kolom, name = nama tampil, dup = dicetak 2x (Life4Cuts), F = tinggi area teks. Tambah layout baru = tambah satu entri di sini + masukkan kuncinya ke LGROUP (langkah 1) */
const LAY={s2:{n:2,c:1,name:'Strip 2'},s4:{n:4,c:1,name:'Strip 4'},s3:{n:3,c:1,name:'Strip 3'},g4:{n:4,c:2,name:'Kotak 2×2'},d4:{n:8,c:2,name:'4×2'},d3:{n:6,c:2,name:'3×2'},l4:{n:4,c:2,dup:true,name:'Life4Cuts'},p1:{n:1,c:1,F:150,name:'Polaroid 1 foto'},p2:{n:2,c:1,F:150,name:'Polaroid 2 foto'}};
/* [DATA] BINGKAI/TEMPLATE (bg, fg = warna; pat = pola; ink = warna teks). 18 bingkai bawaan + 5 template dari layout.js ditambahkan di bawah. Tambah bingkai = tambah satu objek */
const FR=window.TFRAMES.map(f=>({...f})); // data bingkai polos ada di frames-data.js
TC.TEMPLATES.forEach(t=>FR.push({id:t.id,name:t.name,bg:t.c1,fg:t.c2,pat:t.bg?'photo':'grad',ink:t.text,img:t.bg?TC.asset(t.bg):null,shots:t.shots}));

/* [DATA] TEMPLATE GAMBAR (dari website kelompok, data di assets/js/template-images.js).
   Tiap template menghasilkan 2 hal:
   1) BINGKAI pat:'timg' -> latar gambar yang dipakai di SEMUA tata letak (lihat back())
   2) LAYOUT 't_<id>'   -> "susunan asli template": foto masuk ke jendela template (lihat paintT(), flag over) */
const TW=560; // lebar kanvas susunan asli (satuan tata letak; hasil akhir dirender K kali lebih besar)
(window.TIMG||[]).forEach(t=>{
  const th=Math.round(TW*t.h/t.w);
  FR.push({id:'ti-'+t.id,tpl:t.id,ti:true,name:t.name,n:t.n,cat:t.cat,bg:t.c1,fg:t.c2,pat:'timg',ink:t.ink,ins:t.ins,img:TC.asset('images/template/'+t.bg)});
  LAY['t_'+t.id]={n:t.n,c:1,name:t.name+' (asli)',tpl:{id:t.id,name:t.name,src:TC.asset('images/template/'+t.ov),w:TW,h:th,over:true,
    slots:t.slots.map(([x,y,w,h])=>{const sx=x*TW,sy=y*th,sw=w*TW,sh=h*th;return{cx:sx+sw/2,cy:sy+sh/2,w:sw,h:sh,a:0,poly:[[sx,sy],[sx+sw,sy],[sx+sw,sy+sh],[sx,sy+sh]]}})}};
});
const FIm={};
/* [GAMBAR] nineSlice(): LATAR dari template gambar untuk tata letak APA PUN (strip, kotak, polaroid, dst).
   Sudut + pinggiran template dipakai ulang di tepi kanvas (pinggiran diulang/tile), bagian tengah diregangkan.
   ins = [kiri,atas,kanan,bawah] pecahan pinggiran template (data di template-images.js). Margin tujuan: lihat dL/dB di bawah */
function nineSlice(c,im,ins,w,h){
  const iw=im.naturalWidth,ih=im.naturalHeight,L=ins[0]*iw,T=ins[1]*ih,R=ins[2]*iw,B=ins[3]*ih,sw=iw-L-R,sh=ih-T-B;
  const dL=Math.min(Math.max(w*.07,28),70),dR=dL,dT=dL,dB=Math.min(Math.max(h*.12,60),140),bs=B*.45; // bs: hanya sepotong atas area bawah (tanpa tulisan merek) yang diulang
  c.drawImage(im,L,T,sw,sh,dL,dT,w-dL-dR,h-dT-dB);
  const tile=(sx,sy,sW,sH,dx,dy,dW,dH,horiz)=>{c.save();c.beginPath();c.rect(dx,dy,dW,dH);c.clip();
    if(horiz){const k=dH/sH,tw=sW*k;for(let x=dx;x<dx+dW;x+=tw)c.drawImage(im,sx,sy,sW,sH,x,dy,tw,dH)}
    else{const k=dW/sW,th=sH*k;for(let y=dy;y<dy+dH;y+=th)c.drawImage(im,sx,sy,sW,sH,dx,y,dW,th)}
    c.restore()};
  tile(L,0,sw,T,dL,0,w-dL-dR,dT,true);tile(L,ih-B,sw,bs,dL,h-dB,w-dL-dR,dB,true);
  tile(0,T,L,sh,0,dT,dL,h-dT-dB,false);tile(iw-R,T,R,sh,w-dR,dT,dR,h-dT-dB,false);
  c.drawImage(im,0,0,L,T,0,0,dL,dT);c.drawImage(im,iw-R,0,R,T,w-dR,0,dR,dT);
  c.drawImage(im,0,ih-B,L,bs,0,h-dB,dL,dB);c.drawImage(im,iw-R,ih-B,R,bs,w-dR,h-dB,dR,dB)}
/* [FITUR] frLoad(f): menunggu gambar latar bingkai selesai dimuat (dipakai agar pratinjau tidak kosong) */
function frLoad(f){return new Promise(r=>{if(!f.img)return r();frImg(f);const e=FIm[f.id];if(e.complete)return r();e.addEventListener('load',()=>r());e.addEventListener('error',()=>r())})}
function frImg(f){let e=FIm[f.id];if(!e){e=FIm[f.id]=new Image();e.onload=()=>{const v=document.body.dataset.view;if(v==='edit')render();else if(v==='template')tplSummary()};e.src=f.img}return e.complete&&e.naturalWidth?e:null}
/* [DATA] FILTER FOTO: css = nilai CSS filter (dipakai pratinjau kamera dan hasil). Tambah filter = tambah {name, css} */
const FI=[
 {name:'Asli',css:'none'},
 {name:'Y2K glow',css:'brightness(1.1) contrast(1.05) saturate(1.6) hue-rotate(-8deg)'},
 {name:'Korea soft',css:'brightness(1.12) contrast(.92) saturate(1.1) sepia(.08)'},
 {name:'Clean girl',css:'brightness(1.1) contrast(1.05) saturate(.85)'},
 {name:'Sinema',css:'contrast(1.25) saturate(1.1) sepia(.15) brightness(.95)'},
 {name:'Polaroid',css:'sepia(.2) contrast(.95) brightness(1.1) saturate(1.3)'},
 {name:'Film 90an',css:'sepia(.35) contrast(1.1) saturate(1.1) hue-rotate(-15deg) brightness(1.05)'},
 {name:'Golden hour',css:'sepia(.3) saturate(1.6) brightness(1.05) hue-rotate(-8deg)'},
 {name:'Neon',css:'hue-rotate(-30deg) saturate(2) contrast(1.15)'},
 {name:'Dreamy',css:'brightness(1.15) saturate(1.4) blur(.7px)'},
 {name:'Mono',css:'grayscale(1) contrast(1.15)'},
 {name:'Pop',css:'contrast(1.3) saturate(1.8)'}
];
/* [DATA] SET STIKER OTOMATIS di pojok foto (e = daftar emoji) */
const ST=[{name:'Polos',e:[]},
 {name:'Y2K',e:['🦋','💿','⭐','🪩']},{name:'Coquette',e:['🎀','🤍','🩰','🌷']},
 {name:'Boba',e:['🧋','🍰','🍡','🍓']},{name:'Matcha',e:['🍵','🌿','🍙','🐸']},
 {name:'K-pop',e:['💜','🪩','🎤','✨']},{name:'Alien',e:['👽','🛸','💫','🌙']},
 {name:'Lucu',e:['🧸','🐰','🐱','🌸']},{name:'Bling',e:['👑','💎','💖','✨']}];
const rnd=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
/* [GAMBAR] pola latar bingkai (titik, garis, bintang, dll) */
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

/* [GAMBAR] MENGGAMBAR LATAR BINGKAI. Jenis pola ada di fr.pat; "grad" dan "photo" = template dari layout.js */
function back(c,fr,w,h){
  const t=fr.pat,r=rnd(7);c.textAlign='center';c.textBaseline='middle';
  if(t==='timg'){ // [FITUR] LATAR DARI TEMPLATE GAMBAR: dipakai di semua tata letak (gambar dipotong 'cover' agar memenuhi kanvas)
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,fr.bg);g.addColorStop(1,fr.fg);c.fillStyle=g;c.fillRect(0,0,w,h);
    const im=frImg(fr);if(im){if(fr.ins)nineSlice(c,im,fr.ins,w,h);else{const k=Math.max(w/im.naturalWidth,h/im.naturalHeight);c.drawImage(im,(w-im.naturalWidth*k)/2,(h-im.naturalHeight*k)/2,im.naturalWidth*k,im.naturalHeight*k)}} // template bawaan: 9-slice; unggahan: cover
    c.globalAlpha=1;return}
  if(t==='grad'||t==='photo'){const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,fr.bg);g.addColorStop(1,fr.fg);c.fillStyle=g;c.fillRect(0,0,w,h);
    const im=t==='photo'?frImg(fr):null;if(im){c.save();if('filter' in c)c.filter='blur(5px)';const k=Math.max((w+40)/im.naturalWidth,(h+40)/im.naturalHeight);c.drawImage(im,(w-im.naturalWidth*k)/2,(h-im.naturalHeight*k)/2,im.naturalWidth*k,im.naturalHeight*k);c.restore();const o=c.createLinearGradient(0,0,0,h);o.addColorStop(0,'rgba(14,10,26,.15)');o.addColorStop(1,'rgba(76,29,149,.7)');c.fillStyle=o;c.fillRect(0,0,w,h)}
    c.globalAlpha=1;return}
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
/* [GAMBAR] menghitung ukuran kanvas hasil dari tata letak aktif */
function dims(){const L=LAY[LK()],rows=Math.ceil((L.dup?L.n*2:L.n)/L.c);if(L.tpl)return{L,w:L.tpl.w,h:L.tpl.h};return{L,w:P*2+L.c*W+(L.c-1)*G,h:P+rows*H+(rows-1)*G+(L.F||F)}}

/* [KAMERA] mengambil satu frame dari video/gambar menjadi canvas (mirror = efek cermin) */
function grab(src,sw,sh,mirror,tw=W,th=H){
  const c=document.createElement('canvas');c.width=tw;c.height=th;const g=c.getContext('2d');g.imageSmoothingQuality='high';
  const r=tw/th;let cw=sw,ch=sh;if(sw/sh>r)cw=sh*r;else ch=sw/r;
  if(mirror){g.translate(tw,0);g.scale(-1,1)}
  g.drawImage(src,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,tw,th);return c;
}
/* [GIF] pembuat GIF buatan sendiri: quant/lzw/gifEncode (tidak perlu pustaka luar) */
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
/* [BAGIAN 3: STATE] semua pilihan pengguna: lay (tata letak), fr (bingkai), fi (filter), st (stiker), cap (teks), timer (3/5), photos (hasil jepretan) */
/* [FITUR] LK() = kunci tata letak yang AKTIF. Jika kamu mencentang "susunan foto asli template" (S.native) dan bingkai terpilih adalah template gambar, hasilnya t_<id>; selain itu tata letak dari langkah 1 (S.lay). Semua kode memakai LAY[LK()] */
/* rev14: template gambar SELALU memakai susunan aslinya, jadi hasil akhir persis seperti gambar template (bingkai di atas foto) */
const LK=()=>{const f=FR[S.fr];return !S.custom&&f&&f.ti?'t_'+f.tpl:S.lay};
const S={native:false,cntPrev:null,lay:'s4',fr:FR.findIndex(f=>f.id==='twinkle'),fi:1,st:1,cap:'Twinkle Cam ✨',photos:[],clips:[],custom:null,mirror:true,busy:false,timer:3,tab:'fi',tips:true,free:[],sel:null,zoom:1,grow:1,capF:0};
/* [FITUR] ?template=<id>[&grid=<kunci LAY>] dari halaman Templates: mengisi tata letak + bingkai terpilih */
{const sp=new URLSearchParams(location.search),q=sp.get('template'),g=sp.get('grid'),i=FR.findIndex(f=>f.id===q);if(i>=0){const f=FR[i];S.fr=i;
  if(f.ti)S.lay=window.TSIZE_LAY[window.tsizeOf({n:f.n})]||'s4';
  else S.lay=LAY[g]&&window.TSIZE_PLAIN.includes(window.TSIZE[g])?g:'g4'}}
const cv=$('#strip'),ctx=cv.getContext('2d'),video=$('#video');
let jobP=Promise.resolve(),gifBlob=null,stream=null,gifUrl=null,gifTk=0,prevV='setup';
/* [DATA] IDE POSE yang muncul di kamera saat menghitung mundur. Tambah/ubah kalimat di sini */
const POSE=['Senyum lebar 😁','Pose peace ✌️','Bikin bentuk hati 🫶','Pura-pura kaget 😲','Gaya model 💅','Tertawa lepas 🤣','Pipi imut 🥺','Angkat tangan 🙌','Bibir manyun 😗','Gaya detektif 🕵️','Peluk diri sendiri 🤗','Tatap teman sebelahmu 👀','Pose kucing 🐱','Gaya cool 😎'];let lastPose=-1;
const load=(box,t)=>{box.innerHTML='<div class="spin"></div><p></p>';box.lastChild.textContent=t};
const waitC=async ms=>{const t=Date.now();while(Date.now()-t<ms){if(S.cancel)return true;await sleep(Math.min(50,ms))}return !!S.cancel};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const FF=()=>LAY[LK()].F||F,cnt=()=>LAY[LK()].n,done=()=>Array.from({length:cnt()}).every((_,i)=>S.photos[i]);
const curFr=()=>S.custom?{bg:S.custom,fg:'#ffffff',pat:'dots',ink:'#2d1b69'}:FR[S.fr];
const toast=t=>TC.toast(t);

/* ---------- Batas unduhan guest (foto, live photo, dan kirim ke HP dihitung sama) ---------- */
/* [FITUR] BATAS UNDUH GUEST: FREE = jumlah unduhan gratis (sekarang 1). Login = tanpa batas. Hitungan disimpan di localStorage "twinkle_downloads" */
const FREE=1,DK='twinkle_downloads';let memDl=0;
const used=()=>Math.max(TC.store.get(DK,0),memDl),left=()=>TC.auth.isLoggedIn()?Infinity:Math.max(0,FREE-used());
/* [FITUR] syncCount(): jika jumlah foto berubah (mis. pindah ke susunan asli template), foto lama dihapus agar tidak tercampur */
function syncCount(){const n=cnt();if(S.cntPrev!==null&&S.cntPrev!==n){S.photos=[];S.clips=[]}S.cntPrev=n}
function renderLimit(){const l=left(),h=$('#limitHint');h.textContent=l===Infinity?'Kamu sudah login, unduh sepuasnya.':l>0?'Guest hanya bisa 1x unduh gratis (foto, live photo, atau kirim ke HP). Login untuk tanpa batas.':'Jatah unduh gratis habis. Login untuk lanjut tanpa batas.'}
/* [FITUR] gate(fn) membungkus tombol unduh/bagikan/QR agar mengikuti batas guest */
function gate(fn){
  // hitungan dinaikkan DULU (agar klik ganda cepat tidak lolos), dibatalkan jika unduhan gagal
  return(...a)=>{
    if(left()===0)return TC.requireLogin({title:'Jatah unduh gratis habis',text:'Guest hanya bisa mengunduh sekali. Login untuk unduh tanpa batas!',next:'booth'});
    const pre=left()!==Infinity;
    if(pre){memDl=used()+1;TC.store.set(DK,memDl);renderLimit()}
    const undo=()=>{if(pre){memDl=Math.max(0,used()-1);TC.store.set(DK,memDl);renderLimit()}};
    const fin=v=>{if(v===false)undo();else toast(pre?'Terunduh! Itu jatah unduh gratismu. Login untuk lanjut tanpa batas.':'Terunduh');return v};
    let r;try{r=fn(...a)}catch(e){undo();throw e}
    return r&&r.then?r.then(fin,e=>{undo();throw e}):fin(r)}}

/* ---------- gambar ---------- */
/* [GAMBAR] menggambar satu foto di dalam bingkai (termasuk stiker otomatis) */
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
/* [DATA] GAYA HURUF untuk tulisan di bawah foto */
const CAPF=[{n:'Bricolage Grotesque',w:800,sz:46,l:'Modern'},{n:'Pacifico',w:400,sz:42,l:'Script'},{n:'Caveat',w:700,sz:58,l:'Tulisan tangan'},{n:'Fredoka',w:700,sz:46,l:'Bulat'}];
function caption(c,fr,w,h){const f=CAPF[S.capF]||CAPF[0];c.fillStyle=fr.ink;c.textAlign='center';c.textBaseline='middle';c.font=f.w+' '+f.sz+'px "'+f.n+'",sans-serif';c.fillText(S.cap||' ',w/2,h-FF()/2+4)}
const tImgs={};
function tplImg(t){let e=tImgs[t.id];if(!e){e=tImgs[t.id]=new Image();e.onload=()=>{const v=document.body.dataset.view;if(v==='edit')render();else if(v==='template')tplSummary()}; // gambar siap -> gambar ulang pratinjau
    e.src=t.src}return e.complete&&e.naturalWidth?e:null}
function paintT(c,t,upTo,cur){
  const im=tplImg(t);
  if(t.over){c.fillStyle='#fff';c.fillRect(0,0,t.w,t.h)} // template bergaris transparan: foto digambar DULU, bingkai di atasnya
  else if(im)c.drawImage(im,0,0,t.w,t.h);else{c.fillStyle='#d9c8ff';c.fillRect(0,0,t.w,t.h)}
  t.slots.forEach((s,i)=>{
    const src=i<upTo?S.photos[i]:(i===upTo?cur:null);if(!src)return;
    const g=S.grow||1,z=S.zoom||1;
    c.save();c.beginPath();s.poly.forEach(([x,y],k)=>{const px=s.cx+(x-s.cx)*g,py=s.cy+(y-s.cy)*g;k?c.lineTo(px,py):c.moveTo(px,py)});c.closePath();c.clip();
    c.translate(s.cx,s.cy);c.rotate(s.a);
    const k=Math.max((s.w*1.06*g+10)/src.width,(s.h*1.06*g+10)/src.height)*z,dw=src.width*k,dh=src.height*k,by=(dh-s.h*g)*.08;
    if('filter' in c)c.filter=FI[S.fi].css;c.drawImage(src,-dw/2,-dh/2+by,dw,dh);c.filter='none';
    c.restore();
  });
  if(t.over&&im)c.drawImage(im,0,0,t.w,t.h);
}
/* [GAMBAR] paint() = menggambar SELURUH hasil (bingkai + foto + teks + stiker tempel). render() = paint ke kanvas pratinjau #strip */
function paint(c,ui){const{L,w,h}=dims();if(L.tpl){paintT(c,L.tpl,L.n,null);drawFree(c,ui);return}const fr=curFr();back(c,fr,w,h);
  for(let i=0;i<(L.dup?L.n*2:L.n);i++){const pi=L.dup?Math.floor(i/L.c):i;card(c,P+(i%L.c)*(W+G),P+Math.floor(i/L.c)*(H+G),S.photos[pi],pi)}caption(c,fr,w,h);drawFree(c,ui)}
function paintOne(c,src,i){const w=P*2+W,h=P+H+FF(),fr=curFr();back(c,fr,w,h);card(c,P,P,src,i);caption(c,fr,w,h)}
const rat=()=>cv.width/K/(cv.getBoundingClientRect().width||cv.width);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function drawFree(c,ui){
  S.free.forEach((s,i)=>{
    c.save();c.translate(s.x,s.y);c.rotate(s.r);c.font=s.s+'px sans-serif';c.textAlign='center';c.textBaseline='middle';if(s.img){const k=Math.min(s.s/s.img.width,s.s/s.img.height);c.drawImage(s.img,-s.img.width*k/2,-s.img.height*k/2,s.img.width*k,s.img.height*k)}else c.fillText(s.e,0,0); // stiker gambar (unggahan) atau emoji
    if(ui&&i===S.sel){const h=s.s/2,k=rat(),hr=11*k;
      c.strokeStyle='#ff5fa2';c.lineWidth=3*k;c.setLineDash([8*k,6*k]);c.strokeRect(-h,-h,s.s,s.s);c.setLineDash([]);c.lineWidth=2*k;c.strokeStyle='#fff';
      c.fillStyle='#ff5fa2';c.beginPath();c.arc(h,h,hr,0,7);c.fill();c.stroke();
      c.fillStyle='#2d1b69';c.beginPath();c.arc(-h,-h,hr,0,7);c.fill();c.stroke();
      c.fillStyle='#fff';c.font='700 '+hr*1.3+'px sans-serif';c.fillText('✕',-h,-h+1)}
    c.restore()});
}
function render(ui=true){const{w,h}=dims();if(cv.width!==w*K)cv.width=w*K;if(cv.height!==h*K)cv.height=h*K;ctx.setTransform(K,0,0,K,0,0);ctx.imageSmoothingQuality='high';paint(ctx,ui);ctx.setTransform(1,0,0,1,0,0)}

/* ---------- halaman 1: pilih ---------- */
/* [BAGIAN 4: LANGKAH 1] pengelompokan kartu tata letak. Format: [nama grup, [kunci LAY]]. LDESC = deskripsi di panel ringkasan */
const LGROUP=[['Strip',['s2','s3','s4']],['Kotak',['g4','l4']],['Banyak foto',['d3','d4']],['Polaroid',['p1','p2']]];
const LDESC={s2:'Dua foto vertikal',s3:'Tiga foto vertikal',s4:'Empat foto vertikal, klasik',g4:'Empat foto dalam kotak 2×2',l4:'Empat pose, dicetak dua kali',d3:'Enam foto, 3 baris × 2 kolom',d4:'Delapan foto, 4 baris × 2 kolom',p1:'Satu foto besar gaya polaroid',p2:'Dua foto bergaya polaroid'};
/* [FITUR] pratinjau SVG tata letak (proporsi sama persis dengan hasil asli) */
function miniHTML(k){const L=LAY[k],n=L.dup?L.n*2:L.n,rows=Math.ceil(n/L.c),w=P*2+L.c*W+(L.c-1)*G,h=P+rows*H+(rows-1)*G+(L.F||F);
  let r='';for(let i=0;i<n;i++)r+='<rect class="c" x="'+(P+(i%L.c)*(W+G))+'" y="'+(P+Math.floor(i/L.c)*(H+G))+'" width="'+W+'" height="'+H+'" rx="18"/>';
  return '<svg class="mini" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><rect class="bg" width="'+w+'" height="'+h+'" rx="28"/>'+r+'</svg>'}
/* [FITUR] membangun kartu pemilih tata letak + panel ringkasan */
function buildLays(){
  const b=$('#lays');b.innerHTML='';$('#tpls').innerHTML='';
  LGROUP.forEach(([g,ks])=>{const s=document.createElement('div');s.className='lay-group';s.innerHTML='<h3>'+g+'</h3><div class="lay-row"></div>';
    ks.forEach(k=>{const L=LAY[k],x=document.createElement('button');x.type='button';x.className='lay';x.setAttribute('aria-pressed',String(S.lay===k));
      x.innerHTML='<span class="lp">'+miniHTML(k)+'</span><b>'+L.name+'</b><small>'+L.n+' foto</small>';
      x.onclick=()=>{if(LAY[k].n!==cnt()){S.photos=[];S.clips=[]}S.lay=k;S.zoom=1;S.grow=1;buildLays()};s.lastChild.appendChild(x)});
    b.appendChild(s)});
  const L=LAY[S.lay];$('#sumPrev').innerHTML=miniHTML(S.lay);$('#sumName').textContent=L.name;$('#sumInfo').textContent=LDESC[S.lay]||(L.n+' foto');
}
/* [FITUR] TIMER 3/5 DETIK: menyimpan ke S.timer dan menyinkronkan semua tombol timer + chip di kamera (#camTimer) */
function setTimer(v){S.timer=v;{const t=$('#camTimer');if(t)t.textContent='Timer '+v+' dtk'}document.querySelectorAll('[data-timer]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.timer===v)))}
document.querySelectorAll('[data-timer]').forEach(b=>b.onclick=()=>setTimer(+b.dataset.timer));

function setupTab(t){$('#lays').hidden=t;$('#tpls').hidden=!t;$('#tabLay').setAttribute('aria-pressed',String(!t));$('#tabTpl').setAttribute('aria-pressed',String(t))}


/* ---------- halaman 2: template (bingkai) setelah memilih tata letak ---------- */
// Pratinjau = tata letak pilihan + bingkai tertentu + foto contoh, digambar kecil (skala s) agar cepat
/* [BAGIAN 5: LANGKAH 2] TEMPLATE: pratinjau = tata letak pilihan + bingkai + foto contoh. previewCanvas(idx,skala) menggambar versi kecil */
/* [FITUR] KOTAK KOSONG BERNOMOR: pratinjau template TIDAK memakai foto. Tiap slot = warna polos + angka urutan pengambilan foto (1, 2, 3, ...). Ubah warna/ukuran angka di numberedCanvases() */
/* setAr(a): ubah rasio foto (mis. 16/9 atau 4/3) sesuai kamera. Mengembalikan true jika berubah */
function setAr(a){a=Math.max(.5,Math.min(2.4,Math.round(a*1000)/1000));if(!(a>0)||Math.abs(a-AR)<.01)return false;
  AR=a;H=Math.round(W/a);NUMC=null;SMPC=null;try{localStorage.setItem('twinkle_cam_ar',String(a))}catch(e){}applyAr();return true}
/* applyAr(): kotak kamera (#cam) memakai rasio yang sama dengan foto, jadi yang terlihat = yang terfoto */
function applyAr(){document.querySelectorAll('#cam').forEach(c=>c.style.setProperty('--ar',String(AR)))}
let NUMC=null;
function numberedCanvases(){
  if(!NUMC)NUMC=Array.from({length:8},(_,i)=>{const c=document.createElement('canvas');c.width=W*K;c.height=H*K;const g=c.getContext('2d');
    g.fillStyle='#e6e0f7';g.fillRect(0,0,c.width,c.height);                       // warna polos slot
    g.fillStyle='#3b1d6e';g.font='800 '+Math.round(c.height*.5)+'px Outfit,system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';
    g.fillText(String(i+1),c.width/2,c.height/2+c.height*.03);return c});           // angka urutan
  return NUMC}
let SMPC=null;
function sampleCanvases(){if(!SMPC)SMPC=SMP.map(i=>grab(i,i.naturalWidth,i.naturalHeight,false));return Array.from({length:8},(_,k)=>SMPC[k%4])}
function previewCanvas(idx,s,real){
  // real=false -> pratinjau kartu (selalu pakai tata letak pilihan langkah 1); real=true -> pratinjau besar (ikut "susunan asli")
  const keep={fr:S.fr,custom:S.custom,photos:S.photos,free:S.free,native:S.native,fi:S.fi,st:S.st},has=done(); // has: foto sudah lengkap -> pratinjau memakai fotomu
  S.fr=idx;S.custom=null;S.free=[];if(!has){S.photos=numberedCanvases();S.fi=0;S.st=0}if(!real)S.native=false; // tanpa foto: kotak bernomor, tanpa filter/stiker
  const{w,h}=dims(),off=document.createElement('canvas');off.width=Math.round(w*s);off.height=Math.round(h*s);
  const x=off.getContext('2d');x.scale(s,s);
  try{paint(x,false)}finally{Object.assign(S,keep)}
  return off}
function tplInfoText(i){const f=FR[i],nat=!!f.ti;return(f.ti?'Template gambar':f.upload?'Background unggahan':TC.TEMPLATES.some(t=>t.id===f.id)?'Template favorit':'Bingkai')+' · '+(nat?'susunan asli':LAY[S.lay].name)+' · '+(nat?f.n:LAY[S.lay].n)+' foto'}
/* [FITUR] rev15: GANTI TEMPLATE MEMPERTAHANKAN FOTO. Jika semua foto sudah ada, tombol langsung ke Hias dan tata letak tidak bisa diganti
   (hanya template yang sesuai yang tampil). */
function tplButtons(){const has=done(),go=$('#tplGo');go.textContent=has?'Pakai template ini':'Lanjut ke kamera';go.dataset.go=has?'edit':'shoot';$('#tplBack').hidden=has;$('#tplKeep').hidden=!has}
function tplSummary(){tplButtons();
  const f=FR[S.fr],p=$('#tplPrev');p.innerHTML='';p.appendChild(previewCanvas(S.fr,.7,true));
  $('#tplName').textContent=f.name;$('#tplInfo').textContent=tplInfoText(S.fr)}
/* [FITUR] FILTER TEMPLATE PER GRID (rev14): tata letak 3x1 hanya menampilkan template 3x1, dst.
   Template gambar -> ukuran sama dengan jumlah fotonya; bingkai polos -> hanya untuk 1x1, 2x2, 3x2, 4x2; unggahan -> selalu tampil */
const sizeOfLay=()=>window.TSIZE[S.lay];
function frameOk(f){const z=sizeOfLay();if(f.upload)return true;if(f.ti)return window.tsizeOf({n:f.n})===z;return window.TSIZE_PLAIN.includes(z)}
/* ensureFrame(): jika bingkai terpilih tidak cocok dengan tata letak (mis. setelah ganti grid di langkah 1), pindah ke bingkai pertama yang cocok */
function ensureFrame(){const f=FR[S.fr];if(S.custom||(f&&frameOk(f)))return;const k=FR.findIndex(x=>!x.upload&&frameOk(x));if(k>=0)S.fr=k}
/* [FITUR] UNGGAH BACKGROUND/BINGKAI SENDIRI: gambar menjadi latar di semua tata letak (PNG/JPG/WebP maks 10 MB). Warna tulisan dipilih otomatis dari terang/gelapnya bagian bawah gambar */
$('#bgFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  if(!/^image\/(png|jpe?g|webp)$/.test(f.type))return toast('Pakai gambar PNG, JPG, atau WebP ya');
  if(f.size>10*1024*1024)return toast('Ukuran maksimal 10 MB');
  const url=URL.createObjectURL(f),im=new Image();im.src=url;try{await im.decode()}catch(_){return toast('Gambar tidak bisa dibaca')}
  const c=document.createElement('canvas');c.width=c.height=8;const g=c.getContext('2d');g.drawImage(im,0,im.naturalHeight*.85,im.naturalWidth,im.naturalHeight*.15,0,0,8,8);
  const d=g.getImageData(0,0,8,8).data;let L=0;for(let i=0;i<d.length;i+=4)L+=.299*d[i]+.587*d[i+1]+.114*d[i+2];L/=64;
  const fr={id:'upload',upload:true,name:'Unggahanku',bg:'#2a2140',fg:'#4b3a7a',pat:'timg',ink:L>140?'#1c1433':'#ffffff',img:url};
  let k=FR.findIndex(x=>x.id==='upload');delete FIm.upload;if(k<0){FR.push(fr);k=FR.length-1}else FR[k]=fr;
  S.fr=k;S.custom=null;toast('Background terpasang');buildTemplates()};
/* [FITUR] membangun daftar template: 5 favorit (#tplFav), template gambar + unggah (#tplTi), bingkai lain (#tplMore); klik kartu = mengganti S.fr */
async function buildTemplates(){
  const fav=$('#tplFav'),ti=$('#tplTi'),more=$('#tplMore'),ids=TC.TEMPLATES.map(t=>t.id),todo=[];
  ensureFrame();fav.innerHTML='';ti.innerHTML='';more.innerHTML='';
  {const z=sizeOfLay();$('#tplSizeNote').textContent='Menampilkan template ukuran '+z.replace('x','×')+' ('+LAY[S.lay].name+'). Ganti tata letak di langkah 1 untuk melihat ukuran lain.'}
  const up=document.createElement('button');up.type='button';up.className='tile tpl-tile tpl-up';up.innerHTML='<span class="tpl-plus">+</span><span>Unggah background</span><small>PNG/JPG/WebP</small>';up.onclick=()=>$('#bgFile').click();ti.appendChild(up);
  FR.forEach((f,i)=>{
    if(!frameOk(f))return; // hanya template yang cocok dengan grid
    const b=document.createElement('button');b.type='button';b.className='tile tpl-tile';b.dataset.i=i;b.setAttribute('aria-pressed',String(!S.custom&&S.fr===i));
    b.innerHTML='<span class="tpl-ph"></span><span></span>';b.lastChild.textContent=f.name;if(f.ti){const s=document.createElement('small');s.textContent=f.n+' foto'+'';b.appendChild(s)}
    b.onclick=()=>{S.fr=i;S.custom=null;document.querySelectorAll('.tpl-tile').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');syncCount();tplSummary()};
    (f.ti||f.upload?ti:ids.includes(f.id)?fav:more).appendChild(b);todo.push([b,i])});
  // judul grup yang kosong disembunyikan
  [['#tplFav',fav],['#tplTi',ti],['#tplMore',more]].forEach(([id,box])=>{const h=box.previousElementSibling;if(h)h.hidden=!box.children.length});
  tplSummary();
  // gambar pratinjau satu per satu supaya halaman tetap responsif
  for(const[b,i]of todo){await frLoad(FR[i]);await new Promise(r=>setTimeout(r,0));if(document.body.dataset.view!=='template')return;b.firstChild.replaceWith(Object.assign(previewCanvas(i,.34,false),{className:'tpl-cv'}))}
  tplSummary();
}

/* ---------- halaman 3: jepret ---------- */
/* [BAGIAN 6: LANGKAH 3 JEPRET] slot foto di panel kanan (kotak kecil + tombol ✕ ulang) */
/* [FITUR] rev15: PRATINJAU TEMPLATE LANGSUNG. Setiap foto yang diambil langsung muncul di template pilihan (kanvas #liveCv).
   Tombol ↻ di pojok tiap foto mengulang HANYA foto itu. */
function livePos(i){ // posisi foto ke-i pada kanvas hasil (satuan tata letak)
  const{L,w,h}=dims();
  if(L.tpl){const q=L.tpl.slots[i];return q&&{x:q.cx-q.w/2,y:q.cy-q.h/2,w:q.w,h:q.h,cw:w,ch:h}}
  const idx=L.dup?i*L.c:i;return{x:P+(idx%L.c)*(W+G),y:P+Math.floor(idx/L.c)*(H+G),w:W,h:H,cw:w,ch:h}}
function renderLive(){
  const lc=$('#liveCv');if(!lc)return;
  const{w,h}=dims();lc.width=w;lc.height=h;const g=lc.getContext('2d');g.imageSmoothingQuality='high';
  const sel=S.sel;S.sel=null;paint(g,false);S.sel=sel;
  for(let i=0;i<cnt();i++){const p=livePos(i);if(!p||S.photos[i]||!LAY[LK()].tpl)continue; // slot kosong pada template gambar: beri nomor
    g.save();g.fillStyle='rgba(230,224,247,.85)';g.fillRect(p.x,p.y,p.w,p.h);g.fillStyle='#3b1d6e';g.font='800 '+Math.round(p.h*.45)+'px Outfit,system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(i+1),p.x+p.w/2,p.y+p.h/2);g.restore()}
  const box=$('#liveBtns');box.innerHTML='';
  for(let i=0;i<cnt();i++){if(!S.photos[i])continue;const p=livePos(i);if(!p)continue;
    const b=document.createElement('button');b.type='button';b.className='rt';b.textContent='↻';
    b.title='Ulangi foto '+(i+1)+' saja';b.setAttribute('aria-label','Ulangi foto '+(i+1));
    b.style.left=((p.x+p.w)/p.cw*100)+'%';b.style.top=(p.y/p.ch*100)+'%';
    b.onclick=e=>{e.stopPropagation();shoot(i)};box.appendChild(b)}
}
/* buildSlots(): dipanggil setiap foto berubah: gambar ulang pratinjau, progres, dan tombol */
function buildSlots(){
  renderLive();
  const dn=done();$('#btnNext').disabled=!dn;$('#btnNext').classList.toggle('pulse',dn);
  $('#btnReset').disabled=!S.photos.some((p,i)=>p&&i<cnt());
  updateInvite();
  {const f=S.photos.filter(Boolean).length;$('#prog').textContent=f+'/'+cnt()+' foto';$('#barI').style.width=(100*f/cnt())+'%'}
}
/* [FITUR] AMBIL SATU FOTO: hitung mundur (S.timer detik) di #count + cincin, ide pose, rekam klip video pendek, kilatan #flash. Batal lewat S.cancel */
async function shoot(i){
  // [FITUR] FOTO BERSAMA: dalam room, foto bergantian. Urutan 1,3,5.. kamera kamu; 2,4,6.. HP teman
  if(ROOM.peer&&guestTurn(i)){if(roomOn())return shootGuest(i);toast('Teman belum/tidak terhubung, foto ini kamu ambil sendiri')}
  if(!stream){toast('Nyalakan kamera dulu, atau pakai Foto contoh ya');return}
  if(S.busy)return;S.busy=true;S.cancel=false;
  const c=$('#count'),cam=$('#cam'),clip=[],vw=video.videoWidth,vh=video.videoHeight;
  document.body.classList.add('shooting');cam.classList.add('busy');$('#camStat').textContent='Foto '+(i+1)+' dari '+cnt();
  const end=()=>{c.classList.remove('on');$('#pose').classList.remove('on');cam.classList.remove('busy');document.body.classList.remove('shooting');S.busy=false;S.cancel=false};
  if(S.tips){let k;do{k=Math.random()*POSE.length|0}while(k===lastPose);lastPose=k;$('#pose').textContent=POSE[k];$('#pose').classList.add('on')}
  for(let t=S.timer;t>0;t--){
    $('#countNum').textContent=t;c.classList.remove('on');void c.offsetWidth;c.classList.add('on');
    if(t>1){if(await waitC(1000)){end();toast('Dibatalkan');return false}}
    else for(let k=0;k<M;k++){clip.push(grab(video,vw,vh,S.mirror));if(await waitC(80)){end();toast('Dibatalkan');return false}}
  }
  c.classList.remove('on');$('#pose').classList.remove('on');
  const f=$('#flash');f.classList.add('on');
  const photo=grab(video,vw,vh,S.mirror,W*K,H*K); // foto akhir diambil resolusi tinggi; frame klip video tetap ringan
  S.photos[i]=photo;clip.push(photo);S.clips[i]=clip;
  await sleep(80);f.classList.remove('on');
  end();buildSlots();return true;
}
/* [FITUR] tombol "Mulai jepret": ambil semua foto berurutan */
async function auto(){
  if(!stream)return toast('Nyalakan kamera dulu ya');
  if(done())return toast('Semua foto sudah terisi. Ketuk ✕ di foto untuk mengulang');
  for(let i=0;i<cnt();i++){if(!S.photos[i]){const ok=await shoot(i);if(ok===false)return;await sleep(600)}}
  toast('Semua foto masuk! Lanjut hias ✨');
}
/* [FITUR] KAMERA: pesan error ramah (izin ditolak, kamera dipakai aplikasi lain, dll) + startCam()/stopCam() + pemilih kamera */
const CAMERR={NotAllowedError:'Izin kamera ditolak. Klik ikon gembok di address bar, pilih Izinkan untuk kamera, lalu tekan Coba lagi.',PermissionDeniedError:'Izin kamera ditolak. Klik ikon gembok di address bar, pilih Izinkan untuk kamera, lalu tekan Coba lagi.',NotFoundError:'Tidak ada kamera yang terdeteksi. Sambungkan webcam atau pakai Foto contoh.',DevicesNotFoundError:'Tidak ada kamera yang terdeteksi. Sambungkan webcam atau pakai Foto contoh.',NotReadableError:'Kamera sedang dipakai aplikasi lain (Zoom, Meet, dll). Tutup aplikasi itu lalu tekan Coba lagi.',TrackStartError:'Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu tekan Coba lagi.',SecurityError:'Browser memblokir kamera di alamat ini. Buka lewat http://localhost atau HTTPS.'};
let camBusy=false;
function camHint(title,text,retry){const h=$('#hint');h.style.display='';h.innerHTML='<strong></strong><span></span>'+(retry?'<button class="btn btn--cta btn--sm" id="hintRetry" type="button">Coba lagi</button>':'');h.firstChild.textContent=title;h.children[1].textContent=text;if(retry)$('#hintRetry').onclick=()=>startCam()}
async function startCam(devId){
  if(camBusy||stream&&!devId)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    camHint('Kamera tidak bisa dipakai di sini',location.protocol==='file:'?'Browser memblokir kamera untuk file yang dibuka langsung. Jalankan jalankan-lokal.bat (Windows) atau jalankan-lokal.command (Mac/Linux), lalu buka http://localhost:5500. Di hosting HTTPS kamera langsung jalan.':'Browser hanya mengizinkan kamera lewat HTTPS atau http://localhost. Buka lewat salah satunya, atau pakai Foto contoh.',false);return}
  camBusy=true;const h=$('#hint');h.style.display='';h.innerHTML='<span class="spin"></span><span>Menyalakan kamera…</span>';
  // Coba resolusi tinggi dulu (1080p), lalu 720p, lalu apa saja yang tersedia
  const dev=devId?{deviceId:{exact:devId}}:{facingMode:'user'};
  const tries=[{video:{...dev,width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30}},audio:false},{video:{...dev,width:{ideal:1280},height:{ideal:720}},audio:false},{video:devId?{deviceId:{exact:devId}}:true,audio:false}];
  let err=null;
  for(const c of tries){try{stream=await navigator.mediaDevices.getUserMedia(c);err=null;break}catch(e){err=e;if(/NotAllowed|Permission|Security|NotReadable|NotFound/.test(e.name))break}}
  camBusy=false;
  if(err){stream=null;camHint('Kamera belum aktif',CAMERR[err.name]||'Kamera tidak bisa dibuka ('+err.name+'). Muat ulang halaman, atau pakai Foto contoh.',true);return}
  video.srcObject=stream;try{await video.play()}catch(e){}
  if(video.videoWidth&&setAr(video.videoWidth/video.videoHeight)){S.photos=[];S.clips=[];buildSlots()} // rasio kamera berbeda: ukuran foto menyesuaikan
  video.style.filter=FI[S.fi].css;h.style.display='none';$('#btnAuto').disabled=false;$('#btnCam').textContent='Kamera nyala';
  try{const ds=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput'),sel=$('#camSel');
    if(ds.length>1){sel.hidden=false;sel.innerHTML=ds.map((d,i)=>'<option></option>').join('');[...sel.options].forEach((o,i)=>{o.value=ds[i].deviceId;o.textContent=ds[i].label||'Kamera '+(i+1)});const cur=stream.getVideoTracks()[0].getSettings().deviceId;if(cur)sel.value=cur}}catch(e){}
}
function stopCam(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;camHint('Kamera belum aktif','Izinkan akses saat browser meminta, atau pakai Foto contoh.',false);$('#btnAuto').disabled=true;$('#btnCam').textContent='Nyalakan kamera'}
$('#camSel').onchange=e=>{if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;startCam(e.target.value)};

/* ---------- halaman 3: hias ---------- */
/* [BAGIAN 7: LANGKAH 4 HIAS] (bingkai/template dipilih di langkah 2, bukan di sini) daftar tab: [kunci, label]. Menghapus satu tab = hapus dari sini dan cabang-nya di buildOpts() */
const TABS=[['fi','Filter'],['st','Set stiker'],['fs','Tempel'],['tx','Teks']];
const EMO=['🦋','💿','⭐','🪩','🎀','🤍','🩰','🌷','🧋','🍰','🍡','🍓','🍒','🍵','🌿','🐸','💜','🎤','✨','👽','🛸','💫','🌙','🧸','🐰','🐱','🐻','🦄','🌸','🌻','👑','💎','💖','🔥','😎','🥹','🫶','💌','💋','🌈','☁️','⚡','🫧','🕶️','🎧','📸','🥂','🍀','🪐','😂'];
function buildTabs(){
  const t=$('#tabs');t.innerHTML='';
  const tabs=LAY[LK()].tpl?TABS.filter(x=>x[0]==='fi'||x[0]==='fs'):TABS;
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
/* [FITUR] isi panel Hias per tab: fi=filter, st=set stiker, fs=stiker tempel, tx=teks */
function buildOpts(){
  const o=$('#opts');o.innerHTML='';o.className='opts';
  if(S.tab==='fi'){
    FI.forEach((f,i)=>o.appendChild(tile(f.name,144,g=>{const p=S.photos[0];if(p){if('filter' in g)g.filter=f.css;g.drawImage(p,0,0,192,144)}else{g.fillStyle='#c9b6ff';g.fillRect(0,0,192,144)}},S.fi===i,()=>{S.fi=i})));
  }else if(S.tab==='st'){
    ST.forEach((s,i)=>o.appendChild(tile(s.name,100,g=>{g.fillStyle='#f3e4ff';g.fillRect(0,0,192,100);g.font='40px sans-serif';g.textAlign='center';g.textBaseline='middle';
      if(s.e.length)s.e.slice(0,3).forEach((e,j)=>g.fillText(e,36+j*60,52));else g.fillText('∅',96,52)},S.st===i,()=>{S.st=i})));
  }else if(S.tab==='fs'){
    o.className='opts emos';
    o.innerHTML='<p class="hint2">Ketuk emoji untuk menempel di foto. Geser untuk memindah, tarik titik pink untuk memperbesar dan memutar (atau cubit dengan dua jari), ketuk ✕ untuk hapus.</p><div class="ctl"><button class="sm" id="fsOne">Hapus terpilih</button><button class="sm" id="fsDel">Hapus semua</button></div>';
    // [FITUR] UNGGAH STIKER SENDIRI (PNG/WebP/JPG/GIF, maks 5 MB; dikecilkan ke 512 px agar ringan)
    {const up=document.createElement('div');up.className='ctl';up.innerHTML='<button class="btn btn--outline btn--sm" id="fsUp" type="button">Unggah stiker sendiri</button><input type="file" id="fsFile" accept="image/png,image/webp,image/jpeg,image/gif" hidden>';o.insertBefore(up,o.children[1]);
      $('#fsUp').onclick=()=>$('#fsFile').click();
      $('#fsFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
        if(!/^image\/(png|webp|jpe?g|gif)$/.test(f.type))return toast('Pakai gambar PNG, WebP, JPG, atau GIF ya');
        if(f.size>5*1024*1024)return toast('Ukuran stiker maksimal 5 MB');
        const u=URL.createObjectURL(f),im=new Image();im.src=u;try{await im.decode()}catch(_){URL.revokeObjectURL(u);return toast('Gambar tidak bisa dibaca')}
        const m=Math.min(1,512/Math.max(im.naturalWidth,im.naturalHeight)),cs=document.createElement('canvas');cs.width=Math.round(im.naturalWidth*m);cs.height=Math.round(im.naturalHeight*m);cs.getContext('2d').drawImage(im,0,0,cs.width,cs.height);URL.revokeObjectURL(u);addFree('',cs)}}
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
/* [BAGIAN 8: LANGKAH 5 SIMPAN] rev14: hasil = Foto (PNG) + Live Photo (GIF animasi). Fitur video (MP4/WebM) dihapus. */
/* ---------- GIF berkualitas: palet median-cut + dithering ---------- */
/* [GIF] palet warna + dithering agar GIF tidak pecah */
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
/* [FITUR] LIVE PHOTO (rev15): SEMUA foto bergerak SEKALIGUS. Tiap frame GIF = seluruh hasil (template + semua foto) pada waktu yang sama,
   memakai klip pendek tiap foto (S.clips). Foto tanpa klip (foto contoh / foto teman) diam. Frame terakhir = foto final (ditahan lebih lama). */
async function makeGif(){
  const tk=++gifTk,box=$('#gifBox'),btn=$('#btnGif');btn.disabled=true;gifUrl=null;gifBlob=null;
  load(box,'Lagi bikin live photo…');await sleep(60);
  const{w,h}=dims(),n=cnt(),moving=S.clips.some((c,i)=>c&&i<n),FRN=moving?8:1;
  const gw=Math.round(Math.min(480,Math.sqrt(14e6*w/(h*FRN)))/2)*2,gh=Math.round(h*gw/w);
  const full=document.createElement('canvas');full.width=w;full.height=h;const fc=full.getContext('2d');
  const sm=document.createElement('canvas');sm.width=gw;sm.height=gh;const sx=sm.getContext('2d',{willReadFrequently:true});
  sx.imageSmoothingQuality='high';
  const raw=[],dl8=[],saved=S.photos,sel=S.sel;S.sel=null;
  try{
    for(let k=0;k<FRN;k++){
      // frame ke-k: tiap foto memakai frame klip ke-k (semua foto bergerak bersamaan)
      S.photos=saved.map((p,i)=>{const cl=S.clips[i];return cl&&i<n?cl[Math.round(k*(cl.length-1)/Math.max(FRN-1,1))]:p});
      paint(fc,false);sx.drawImage(full,0,0,gw,gh);raw.push(sx.getImageData(0,0,gw,gh).data);dl8.push(k===FRN-1?100:12);
      load(box,'Lagi bikin live photo… '+(k+1)+'/'+FRN);await sleep(0);if(tk!==gifTk)return;
    }
  }finally{S.photos=saved;S.sel=sel}
  load(box,'Lagi bikin live photo… menyusun warna');await sleep(30);
  const pal=makePalette(raw),lut=makeLut(pal);
  const frames=raw.map((d,i)=>{const q=dither(d,gw,gh,lut);q.d=dl8[i];return q});
  await sleep(0);if(tk!==gifTk)return;
  gifBlob=new Blob([gifEncode(frames,gw,gh,16,pal)],{type:'image/gif'});gifUrl=URL.createObjectURL(gifBlob);
  box.innerHTML='';const im=new Image();im.src=gifUrl;im.alt='Hasil live photo';box.appendChild(im);btn.disabled=false;
}
/* [FITUR] menampilkan hasil: PNG, lalu membuat live photo (GIF) di latar belakang */
function showResult(){renderLimit();S.sel=null;render(false);$('#btnAlbum').disabled=false;$('#btnAlbum').textContent='Simpan ke album';cv.toBlob(b=>{if(!b)return;if(window.outObj)URL.revokeObjectURL(window.outObj);window.outObj=URL.createObjectURL(b);$('#out').src=window.outObj});jobP=(async()=>{
    try{await makeGif()}catch(e){console.error(e);$('#gifBox').textContent='Live photo gagal dibuat. Foto tetap bisa diunduh.'}
  })()}

/* ---------- navigasi antar halaman ---------- */
/* [BAGIAN 9: ROUTER] urutan langkah. Menambah langkah = tambah nama di sini + <section id="v-NAMA"> di photobooth.html + cabang di route() */
const VIEWS=['setup','template','shoot','edit','result','terima','join'];
function route(){
  ensureFrame();syncCount();
  let note='';let[v,arg]=location.hash.slice(2).split('/');v=v||'';if(!VIEWS.includes(v))v='setup';
  if((v==='edit'||v==='result')&&!done()){v='shoot';note='Selesaikan semua foto dulu ya 📸';history.replaceState(null,'','#/shoot')}
  if(prevV==='shoot'&&v!=='shoot'){stopCam();closeRoom()}
  if(prevV==='join'&&v!=='join')stopJoin();
  if(prevV==='result'&&v!=='result'){gifTk++;$('#qrModal').classList.remove('on');closePeer()}
  if(prevV==='terima'&&v!=='terima')closePeer();
  VIEWS.forEach(x=>$('#v-'+x).hidden=x!==v);
  document.body.dataset.view=v;
  const at=VIEWS.indexOf(v);
  document.querySelectorAll('#steps li').forEach((li,i)=>li.className=i===at?'on':i<at?'past':'');
  try{
    if(v==='setup'){buildLays()}
    if(v==='template')buildTemplates();
    if(v==='shoot'){buildSlots();if(!stream)startCam();updateInvite()}
    if(v==='edit'){buildTabs();render()}
    if(v==='result')showResult();
    if(v==='terima')startReceive(arg);
    if(v==='join')startJoin(arg);
  }catch(e){console.error(e);note='Ups, ada kendala'+(e&&e.name?' ('+e.name+')':'')+'. Coba ulangi ya'}
  prevV=v;scrollTo(0,0);if(note)toast(note);
}
addEventListener('hashchange',route);
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(!g||g.disabled)return;const k=g.dataset.go;
  if(k==='home')location.href=TC.link('home');else if(k==='album'){TC.auth.isLoggedIn()?location.href=TC.link('album'):TC.requireLogin({next:'album'})}else location.hash='#/'+k});

$('#btnCam').onclick=()=>startCam();
$('#btnAuto').onclick=auto;
$('#btnMirror').onclick=e=>{S.mirror=!S.mirror;e.target.setAttribute('aria-pressed',String(S.mirror));
  e.target.textContent='Cermin: '+(S.mirror?'nyala':'mati');$('#cam').classList.toggle('nomirror',!S.mirror)};
$('#btnTips').onclick=e=>{S.tips=!S.tips;e.target.setAttribute('aria-pressed',String(S.tips));e.target.textContent='Ide pose: '+(S.tips?'nyala':'mati')};
$('#btnCancel').onclick=()=>{S.cancel=true};
$('#camTimer').onclick=()=>{if(!S.busy)setTimer(S.timer===3?5:3)};
$('#btnReset').onclick=()=>{if(S.busy)return;S.photos=[];S.clips=[];buildSlots();toast('Semua foto diulang. Tekan Mulai jepret')};
$('#btnNew').onclick=()=>{S.photos=[];S.clips=[];S.free=[];S.sel=null;location.hash='#/setup'};
/* [FITUR] menghasilkan PNG sesuai ukuran pilihan (#size) */
/* [FITUR] outBlob(): membuat file PNG sesuai ukuran pilihan (#size) sebagai Blob. Blob dipakai (bukan data URL) agar unduhan besar tidak gagal */
function outBlob(){
  const v=$('#size').value;if(v==='0')return new Promise(r=>cv.toBlob(r,'image/png'));
  let[tw,th]=v.split('x').map(Number);if((cv.width>cv.height)!==(tw>th))[tw,th]=[th,tw];
  const c=document.createElement('canvas');c.width=tw;c.height=th;const g=c.getContext('2d');g.imageSmoothingQuality='high';
  if(LAY[LK()].tpl){g.fillStyle='#fff';g.fillRect(0,0,tw,th)}else back(g,curFr(),tw,th);
  const m=Math.round(Math.min(tw,th)*.03),s=Math.min((tw-2*m)/cv.width,(th-2*m)/cv.height),dw=cv.width*s,dh=cv.height*s;
  g.drawImage(cv,(tw-dw)/2,(th-dh)/2,dw,dh);return new Promise(r=>c.toBlob(r,'image/png'));
}
const dl=(u,n)=>{const url=typeof u==='string'?u:URL.createObjectURL(u);const a=document.createElement('a');a.href=url;a.download=n;document.body.appendChild(a);a.click();a.remove();if(typeof u!=='string')setTimeout(()=>URL.revokeObjectURL(url),8000)};
$('#btnSave').onclick=gate(async()=>{try{const b=await outBlob();if(!b)throw new Error('kosong');dl(b,'twinkle-cam-'+$('#size').value+'.png')}catch(e){console.error(e);toast('Gagal membuat file PNG. Coba ukuran lain atau muat ulang halaman');return false}});
$('#btnGif').onclick=gate(()=>gifUrl?dl(gifUrl,'twinkle-live-photo.gif'):false);
$('#btnShare').onclick=gate(async()=>{try{
  const b=await outBlob(),f=new File([b],'twinkle-cam.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],title:'Twinkle Cam'});
  else{toast('Perangkat ini belum mendukung bagikan langsung. Pakai tombol Unduh ya');return false}
}catch(e){return false}});
/* ---------- stiker tempel: geser, besar/putar, cubit ---------- */
/* [FITUR] STIKER TEMPEL bebas: tambah, geser, besarkan/putar, cubit dua jari */
function addFree(e,img){
  if(S.free.length>=40)return toast('Maksimal 40 stiker ya');
  const{w,h}=dims();S.free.push({e,img,x:w/2+(Math.random()-.5)*120,y:h/2+(Math.random()-.5)*160,s:Math.round(Math.max(120,46*rat())),r:(Math.random()-.5)*.5});S.sel=S.free.length-1;render();
}
const ptr=new Map();let drag=null,rq=0;
const rerender=()=>{if(!rq)rq=requestAnimationFrame(()=>{rq=0;render()})};
const pt=e=>{const r=cv.getBoundingClientRect(),k=cv.width/K/r.width;return{x:(e.clientX-r.left)*k,y:(e.clientY-r.top)*k,k}};
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
/* [FITUR] SIMPAN KE ALBUM (wajib login). Data disimpan di IndexedDB lewat albumdb.js */
async function saveAlbum(){
  if(!TC.auth.isLoggedIn())return TC.requireLogin({title:'Simpan ke album? Login dulu ya',text:'Anda harus login terlebih dahulu untuk menyimpan foto ke album.',next:'booth'});
  const b=$('#btnAlbum');b.disabled=true;
  try{
    if(!gifBlob)toast('Menunggu live photo selesai…');
    await jobP;
    const pb=await new Promise(r=>cv.toBlob(r,'image/png')),t=document.createElement('canvas');
    t.width=200;t.height=Math.round(200*cv.height/cv.width);t.getContext('2d').drawImage(cv,0,0,t.width,t.height);
    await TCDB.add(TC.auth.albumKey(),pb,gifBlob,t.toDataURL('image/jpeg',.7),LAY[LK()].name,null,null);
    b.textContent='Tersimpan';toast('Tersimpan di Riwayat Album');
  }catch(e){b.disabled=false;toast('Gagal menyimpan. Penyimpanan browser mungkin penuh atau diblokir.')}
}
$('#btnAlbum').onclick=saveAlbum;
/* [FITUR] FOTO CONTOH (tombol "Foto contoh") — gambar di assets/images/selfiecontoh1-4.jpg */
const SMP=[1,2,3,4].map(n=>{const i=new Image();i.src=TC.asset('images/selfiecontoh'+n+'.jpg');return i});
$('#btnSample').onclick=async()=>{try{await Promise.all(SMP.map(i=>i.decode()))}catch(e){}
  for(let i=0;i<cnt();i++){const s=SMP[i%4];S.photos[i]=grab(s,s.naturalWidth,s.naturalHeight,false,W*K,H*K);S.clips[i]=null}buildSlots();toast('Foto contoh dipakai')};

/* ---------- galeri template, statistik, tema ---------- */
function buildGallery(){
  if(typeof TPL==='undefined')return;
  const g=$('#gal');
  TPL.forEach(t=>{const b=document.createElement('button');b.className='gcard';b.innerHTML='<img alt="" loading="lazy"><b></b><small></small>';
    b.querySelector('img').src=t.src;b.querySelector('b').textContent=t.name;b.querySelector('small').textContent=t.slots.length+' foto';
    b.onclick=()=>{const k='t_'+t.id;if(LAY[k].n!==cnt()){S.photos=[];S.clips=[]}S.lay=k;S.zoom=1.3;S.grow=1;tplImg(t);location.hash='#/setup'};g.appendChild(b)});
  $('#stT').textContent=TPL.length;
}

if(document.fonts)CAPF.forEach(f=>document.fonts.load(f.w+' 24px "'+f.n+'"').then(()=>{if(document.body.dataset.view==='edit')render()}).catch(()=>{}));
if(location.protocol==='file:')$('#fileNote').hidden=false;
/* ---------- Kirim ke HP: QR + transfer langsung antar perangkat (WebRTC lewat PeerJS) ---------- */
const PEER_OPTS=window.PEER_OPTS||{},CHUNK=64*1024;
let qPeer=null;
const setQ=(t,bad)=>{const e=$('#qrStat');e.textContent=t;e.classList.toggle('bad',!!bad)};
function closePeer(){if(qPeer){try{qPeer.destroy()}catch(e){}qPeer=null}}
function qrDraw(text,cv2=$('#qrCanvas')){
  const qr=qrcode(0,'M');qr.addData(text);qr.make();
  const n=qr.getModuleCount(),q=4,s=Math.max(3,Math.floor(560/(n+q*2)));cv2.width=cv2.height=s*(n+q*2);
  const g=cv2.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv2.width,cv2.height);g.fillStyle='#1c1740';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))g.fillRect((c+q)*s,(r+q)*s,s,s);
}
async function collectFiles(){
  const out=[];
  try{out.push({name:'twinkle-cam.png',blob:await outBlob()})}catch(e){}
  if(gifBlob)out.push({name:'twinkle-live-photo.gif',blob:gifBlob});
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
/* [BAGIAN 10: KIRIM KE HP] membuka pop-up QR, menyiapkan server PeerJS sementara untuk mengirim file ke HP */
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
$('#btnQR').onclick=gate(openQR);
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
          const a=document.createElement('a');a.className='btn btn--cta btn--sm';a.href=url;a.download=cur.m.name;a.textContent='⬇️ Simpan '+cur.m.name.split('.').pop().toUpperCase();
          const r=document.createElement('div');r.className='row';r.appendChild(a);el.appendChild(r);
          doneN++;bar.style.width=(100*doneN/Math.max(total,1))+'%';cur=null;
        }
      }
    });
  });
}

/* =====================================================================
   [BAGIAN 11: FOTO BERSAMA (ROOM) via PeerJS] rev14
   Alur: host menekan "Undang teman" -> QR/link #/join/<id> -> teman membuka di HP, kamera HP menyala
   -> foto diambil BERGANTIAN (host: foto 1,3,5..; teman: foto 2,4,6..). Hanya aktif jika tata letak punya >= 2 foto.
   Pesan (JSON teks, dikirim lewat PeerJS DataConnection):
     host -> teman : {t:'hello',n,ar}  {t:'shoot',i,timer,n,tw,th}  {t:'cancel'}  {t:'end'}
     teman -> host : {t:'ready'}    {t:'photo',i,size} + potongan biner JPEG   {t:'fail',i,msg}
   Foto TIDAK lewat server: PeerJS hanya mempertemukan dua perangkat.
   ===================================================================== */
const ROOM={peer:null,conn:null,ready:false,wait:null,rx:null};
const guestTurn=i=>i%2===1;                                  // giliran teman: indeks ganjil (foto ke-2, 4, ...)
const roomOn=()=>!!(ROOM.conn&&ROOM.conn.open&&ROOM.ready);   // teman benar-benar siap
const setR=(t,bad)=>{const e=$('#roomStat');e.textContent=t;e.classList.toggle('bad',!!bad)};
/* [FITUR] status tombol Undang teman + catatan di panel kanan. Syarat: tata letak >= 2 foto */
function updateInvite(){
  const b=$('#btnInvite'),n=$('#roomNote'),ok=cnt()>=2;
  b.disabled=!ok||S.busy;b.title=ok?'':'Undang teman butuh tata letak 2 foto atau lebih';
  b.textContent=roomOn()?'👫 Teman terhubung ✓':ROOM.peer?'👫 Menunggu teman…':'👫 Undang teman';
  n.hidden=false;
  n.textContent=!ok?'Undang teman hanya tersedia untuk tata letak 2 foto atau lebih.':roomOn()?'Foto ke-'+Array.from({length:cnt()},(_,i)=>i+1).filter(x=>x%2===1).join(', ')+' dari kameramu, foto ke-'+Array.from({length:cnt()},(_,i)=>i+1).filter(x=>x%2===0).join(', ')+' dari HP temanmu.':'Ingin foto bareng? Tekan Undang teman, foto diambil bergantian.';
}
/* Membuka pop-up undangan; membuat room (Peer) jika belum ada */
function openRoom(){
  if(cnt()<2)return toast('Undang teman butuh tata letak 2 foto atau lebih');
  $('#roomModal').classList.add('on');
  if(ROOM.peer)return;
  if(typeof Peer==='undefined'||typeof qrcode==='undefined'){setR('Library QR belum termuat. Muat ulang halaman.',true);return}
  setR('Menghubungkan…');$('#roomLink').value='';
  const id='tcr'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4),p=ROOM.peer=new Peer(id,PEER_OPTS);
  p.on('open',()=>{
    const url=location.href.split('#')[0]+'#/join/'+id;$('#roomLink').value=url;qrDraw(url,$('#roomCanvas'));
    const local=location.protocol==='file:'||/^(localhost|127\.|\[::1\])/.test(location.hostname);
    setR(local?'QR siap, tapi alamat web ini hanya bisa dibuka di perangkat ini. Buka lewat alamat online (Vercel) agar HP temanmu bisa memindainya.':'Menunggu teman memindai QR… jangan tutup halaman ini.',local);updateInvite();
  });
  p.on('connection',roomConn);
  p.on('disconnected',()=>{try{p.reconnect()}catch(e){}});
  p.on('error',e=>setR('Gagal menyambung ('+(e.type||e.message)+'). Cek internet lalu tekan Akhiri room dan coba lagi.',true));
  updateInvite();
}
/* Satu teman per room: koneksi kedua ditolak */
function roomConn(conn){
  if(ROOM.conn&&ROOM.conn.open){try{conn.close()}catch(e){}return}
  ROOM.conn=conn;ROOM.ready=false;
  conn.on('open',()=>{conn.send(JSON.stringify({t:'hello',n:cnt(),ar:AR}));setR('Teman terhubung, menyiapkan kamera HP…')});
  conn.on('data',roomData);
  const lost=()=>{if(ROOM.conn!==conn)return;ROOM.conn=null;ROOM.ready=false;if(ROOM.wait)ROOM.wait.resolve(null);setR('Teman terputus. Minta temanmu memindai QR lagi.',true);updateInvite();toast('Teman terputus')};
  conn.on('close',lost);conn.on('error',lost);
}
/* Pesan dari teman: ready / foto (header + potongan biner) / gagal */
function roomData(d){
  if(typeof d==='string'){
    const m=JSON.parse(d);
    if(m.t==='ready'){ROOM.ready=true;setR('Teman siap! 🎉');updateInvite();toast('Teman bergabung 🎉');setTimeout(()=>$('#roomModal').classList.remove('on'),900)}
    else if(m.t==='photo')ROOM.rx={i:m.i,size:m.size,parts:[],got:0};
    else if(m.t==='fail'){if(ROOM.wait&&ROOM.wait.i===m.i)ROOM.wait.resolve(null);toast(m.msg||'Kamera teman bermasalah')}
  }else if(ROOM.rx){
    const r=ROOM.rx;r.parts.push(d);r.got+=d.byteLength;
    if(r.got>=r.size){ROOM.rx=null;if(ROOM.wait&&ROOM.wait.i===r.i)ROOM.wait.resolve(new Blob(r.parts,{type:'image/jpeg'}))}
  }
}
/* Menutup room (dipanggil saat keluar dari langkah Jepret atau menekan Akhiri room) */
function closeRoom(){
  const p=ROOM.peer;
  if(ROOM.conn){try{ROOM.conn.send(JSON.stringify({t:'end'}))}catch(e){}}
  if(p)setTimeout(()=>{try{p.destroy()}catch(e){}},400); // beri waktu pesan 'end' terkirim
  ROOM.peer=ROOM.conn=null;ROOM.ready=false;ROOM.rx=null;
  if(ROOM.wait){ROOM.wait.resolve(null);ROOM.wait=null}
  $('#roomModal').classList.remove('on');updateInvite();
}
/* Foto giliran TEMAN: kirim aba-aba, tampilkan hitung mundur yang sama, lalu tunggu foto dari HP (maks 20 dtk) */
async function shootGuest(i){
  if(S.busy)return;S.busy=true;S.cancel=false;
  const c=$('#count'),cam=$('#cam');
  document.body.classList.add('shooting');cam.classList.add('busy');$('#camStat').textContent='Foto '+(i+1)+' dari '+cnt()+' · giliran temanmu 📱';
  const end=()=>{c.classList.remove('on');$('#pose').classList.remove('on');cam.classList.remove('busy');document.body.classList.remove('shooting');S.busy=false;S.cancel=false;ROOM.wait=null;updateInvite()};
  const got=new Promise(res=>{ROOM.wait={i,resolve:res}});
  ROOM.conn.send(JSON.stringify({t:'shoot',i,timer:S.timer,n:cnt(),tw:W*K,th:H*K}));
  if(S.tips){$('#pose').textContent='Giliran temanmu! Bersiap di HP 📱';$('#pose').classList.add('on')}
  for(let t=S.timer;t>0;t--){
    $('#countNum').textContent=t;c.classList.remove('on');void c.offsetWidth;c.classList.add('on');
    if(await waitC(1000)){try{ROOM.conn.send(JSON.stringify({t:'cancel'}))}catch(e){}end();toast('Dibatalkan');return false}
  }
  c.classList.remove('on');$('#pose').classList.remove('on');
  const f=$('#flash');f.classList.add('on');
  const blob=await Promise.race([got,sleep(20000).then(()=>null)]);
  f.classList.remove('on');
  if(!blob){end();toast('Foto teman belum masuk. Coba lagi ya');return false}
  let ok=true;
  try{const im=await createImageBitmap(blob);S.photos[i]=grab(im,im.width,im.height,false,W*K,H*K);S.clips[i]=null}catch(e){ok=false}
  end();buildSlots();if(!ok){toast('Foto teman tidak terbaca. Coba lagi ya');return false}return true;
}
$('#btnInvite').onclick=openRoom;
$('#roomClose').onclick=()=>$('#roomModal').classList.remove('on');
$('#roomEnd').onclick=closeRoom;
$('#roomCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('#roomLink').value);toast('Link disalin')}catch(e){$('#roomLink').select();toast('Tekan Salin manual (Ctrl+C)')}};

/* ---------- Sisi TEMAN (HP): #/join/<id> ---------- */
const GUEST={stream:null,conn:null,cancel:false,busy:false,id:null};
/* Mengirim Blob lewat PeerJS: header JSON (nama, ukuran) lalu potongan 64 KB */
async function sendBlob(conn,meta,blob){
  const buf=await blob.arrayBuffer();conn.send(JSON.stringify({...meta,size:buf.byteLength}));
  for(let o=0;o<buf.byteLength;o+=CHUNK){conn.send(buf.slice(o,o+CHUNK));while(conn.dataChannel&&conn.dataChannel.bufferedAmount>1e6)await sleep(30)}
}
function stopJoin(){
  GUEST.cancel=true;GUEST.busy=false;
  if(GUEST.stream)GUEST.stream.getTracks().forEach(t=>t.stop());GUEST.stream=null;$('#jvideo').srcObject=null;
  if(GUEST.conn){try{GUEST.conn.close()}catch(e){}GUEST.conn=null}
  closePeer();
}
async function startJoin(id){
  stopJoin();GUEST.id=id;GUEST.cancel=false;
  const st=$('#joinStat'),turn=$('#joinTurn'),hint=$('#jhint'),retry=$('#btnJoinRetry');
  const fail=m=>{st.textContent=m;st.classList.add('bad')};
  st.classList.remove('bad');retry.hidden=true;
  if(!id||typeof Peer==='undefined'){fail('Link tidak valid.');return}
  // 1) kamera HP (selfie)
  st.textContent='Menyalakan kamera…';hint.style.display='';
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){fail('Browser ini tidak mengizinkan kamera. Buka link lewat HTTPS.');return}
  try{GUEST.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false})}
  catch(e){fail(CAMERR[e.name]||'Kamera tidak bisa dibuka ('+e.name+').');retry.hidden=false;retry.onclick=()=>startJoin(id);return}
  if(document.body.dataset.view!=='join'){GUEST.stream.getTracks().forEach(t=>t.stop());GUEST.stream=null;return}
  const jv=$('#jvideo');jv.srcObject=GUEST.stream;try{await jv.play()}catch(e){}hint.style.display='none';
  // 2) sambung ke host
  st.textContent='Menghubungkan ke temanmu…';
  const p=qPeer=new Peer(PEER_OPTS);let opened=false;
  const to=setTimeout(()=>{if(!opened){fail('Tidak bisa terhubung. Pastikan halaman temanmu masih terbuka, lalu pindai ulang QR-nya.');retry.hidden=false;retry.onclick=()=>startJoin(id)}},30000);
  p.on('error',e=>{clearTimeout(to);fail('Gagal menyambung ('+(e.type||e.message)+'). Pastikan halaman temanmu masih terbuka.');retry.hidden=false;retry.onclick=()=>startJoin(id)});
  p.on('open',()=>{
    const c=GUEST.conn=p.connect(id,{reliable:true});
    c.on('open',()=>{opened=true;clearTimeout(to);c.send(JSON.stringify({t:'ready'}));st.textContent='Terhubung ✓ Tunggu giliranmu, jangan tutup halaman ini.'});
    c.on('data',guestData);
    c.on('close',()=>{if(GUEST.conn===c){GUEST.conn=null;st.textContent='Room ditutup. Terima kasih sudah foto bareng!'}});
    c.on('error',()=>fail('Koneksi terputus. Pindai ulang QR-nya.'));
  });
}
/* Pesan dari host: hello (info jumlah foto), shoot (giliran kamu), cancel, end */
function guestData(d){
  if(typeof d!=='string')return;
  const m=JSON.parse(d),turn=$('#joinTurn');
  if(m.t==='hello'){if(m.ar)$('#jcam').style.setProperty('--ar',String(m.ar));const mine=Array.from({length:m.n},(_,i)=>i+1).filter(x=>x%2===0);turn.textContent='Giliranmu: foto ke-'+mine.join(', ')+'. Sisanya diambil temanmu.'}
  else if(m.t==='shoot')guestShoot(m);
  else if(m.t==='cancel')GUEST.cancel=true;
  else if(m.t==='end'){$('#joinStat').textContent='Sesi selesai! Terima kasih 🎉';turn.textContent='Hasil foto ada di perangkat temanmu.'}
}
/* Giliran teman: hitung mundur di HP, ambil foto (dicerminkan seperti selfie), kirim JPEG ke host */
async function guestShoot(m){
  const conn=GUEST.conn,v=$('#jvideo'),c=$('#jcount'),n=$('#jcountNum'),turn=$('#joinTurn');
  if(!conn)return;
  if(GUEST.busy||!GUEST.stream||!v.videoWidth){conn.send(JSON.stringify({t:'fail',i:m.i,msg:'Kamera teman belum siap'}));return}
  GUEST.busy=true;GUEST.cancel=false;turn.textContent='Giliranmu! Foto ke-'+(m.i+1)+'. Bersiap 📸';
  for(let t=m.timer;t>0;t--){
    n.textContent=t;c.classList.remove('on');void c.offsetWidth;c.classList.add('on');await sleep(1000);
    if(GUEST.cancel){c.classList.remove('on');GUEST.busy=false;turn.textContent='Dibatalkan. Tunggu giliranmu lagi.';return}
  }
  c.classList.remove('on');const f=$('#jflash');f.classList.add('on');setTimeout(()=>f.classList.remove('on'),100);
  try{
    const cv2=grab(v,v.videoWidth,v.videoHeight,true,m.tw||W*K,m.th||H*K),blob=await new Promise(r=>cv2.toBlob(r,'image/jpeg',.9));
    await sendBlob(conn,{t:'photo',i:m.i},blob);turn.textContent='Foto ke-'+(m.i+1)+' terkirim ✓ Tunggu giliran berikutnya.';
  }catch(e){try{conn.send(JSON.stringify({t:'fail',i:m.i,msg:'Foto teman gagal dikirim'}))}catch(_){}turn.textContent='Foto gagal dikirim. Minta temanmu mengulang.'}
  GUEST.busy=false;
}
$('#btnJoinLeave').onclick=()=>{stopJoin();$('#joinStat').textContent='Kamu sudah keluar dari room.';location.hash='#/setup'};
applyAr();setTimer(3);route();
