/* [REVISI CEPAT] Daftar album: build() | Penampil Foto/Video/GIF: openViewer() | Migrasi album lama (localStorage): migrate() | Data diambil dari albumdb.js (TCDB) */
/* TWINKLE CAM — Riwayat Album (khusus login): foto dan live photo dari IndexedDB */
const $=s=>document.querySelector(s);
const dl=(u,n)=>{const a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove()};
const locked=$('#locked');
function showLockedState(){locked.hidden=false;$('#albumGrid').hidden=$('#empty').hidden=true;TC.requireLogin({next:'album'})}
const KEY=TC.auth.albumKey();
/* Pindahkan album lama (localStorage, rev5) ke penyimpanan baru */
async function migrate(){const old=TC.store.get(KEY,[]);if(!old.length)return;
  try{for(const a of old.slice().reverse()){const b=await (await fetch(a.img)).blob();await TCDB.add(KEY,b,null,a.img,a.tpl,null,null,new Date(a.date).getTime())}TC.store.set(KEY,[])}catch(e){}}
async function build(){
  const g=$('#albumGrid');let list=[];
  try{list=await TCDB.list(KEY)}catch(e){TC.toast('Album tidak bisa dibuka di browser ini')}
  g.innerHTML='';$('#empty').hidden=list.length>0;
  list.forEach(m=>{const b=document.createElement('button'),d=new Date(m.t).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
    b.className='album-item';b.type='button';b.innerHTML='<img alt=""><span></span>';b.firstChild.src=m.thumb;b.firstChild.alt='Strip foto '+d;
    b.lastChild.textContent=d+' · '+m.lay+(m.vid||m.gif?' · live photo':'');b.onclick=()=>openViewer(m.id);g.appendChild(b)});
}
let vid=null,vi=0,vUrls=[],vItems=[];
function setV(i){
  vi=i;const x=vItems[i],im=$('#vImg'),vv=$('#vVid');
  if(x.t==='vid'){im.hidden=true;vv.hidden=false;vv.src=x.u;vv.play().catch(()=>{})}
  else{vv.pause();vv.hidden=true;vv.removeAttribute('src');im.hidden=false;im.src=x.u}
  document.querySelectorAll('#vTabs button').forEach((b,k)=>b.setAttribute('aria-pressed',String(k===i)));$('#vDel').textContent='Hapus';
}
async function openViewer(id){
  const f=await TCDB.get(id);if(!f)return;
  vUrls.forEach(u=>URL.revokeObjectURL(u));
  vItems=[{l:'Foto',b:f.photo,n:'twinkle-cam.png',t:'img'}];
  if(f.vid)vItems.push({l:'Video',b:f.vid,n:'twinkle-cam.'+(f.vext||'webm'),t:'vid'});
  if(f.gif)vItems.push({l:'Live photo',b:f.gif,n:'twinkle-live-photo.gif',t:'img'});
  vItems.forEach(x=>x.u=URL.createObjectURL(x.b));vUrls=vItems.map(x=>x.u);
  vid=id;const tabs=$('#vTabs');tabs.innerHTML='';tabs.hidden=vItems.length<2;
  vItems.forEach((x,i)=>{const b=document.createElement('button');b.textContent=x.l;b.onclick=()=>setV(i);tabs.appendChild(b)});
  setV(0);$('#viewer').showModal();
}
$('#vSave').onclick=()=>dl(vItems[vi].u,vItems[vi].n);
$('#vClose').onclick=()=>{$('#vVid').pause();$('#viewer').close()};
$('#vDel').onclick=async e=>{
  if(e.target.textContent.includes('Yakin')){await TCDB.del(vid);$('#viewer').close();build();TC.toast('Foto dihapus')}
  else e.target.textContent='Yakin hapus?';
};

$('#viewer').addEventListener('click',e=>{if(e.target===$('#viewer'))$('#vClose').click()});
if(TC.auth.isLoggedIn())migrate().then(build);else showLockedState();
