/* [REVISI CEPAT] API penyimpanan: TCDB.add/list/get/del. Nama database: "twinkle-cam" (IndexedDB), store "meta" (info/thumbnail) dan "files" (foto/video/GIF). */
/* TWINKLE CAM — Penyimpanan album (IndexedDB): foto, video, dan GIF. Dipakai photobooth.js dan album.js */
const TCDB=(()=>{
  const idb=()=>new Promise((ok,no)=>{const r=indexedDB.open('twinkle-cam',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('meta',{keyPath:'id'});d.createObjectStore('files',{keyPath:'id'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
  const req=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
  const fin=t=>new Promise((ok,no)=>{t.oncomplete=ok;t.onerror=t.onabort=()=>no(t.error)});
  let seq=0;
  return{
    async add(owner,photo,gif,thumb,lay,vid,vext,t){const d=await idb(),tx=d.transaction(['meta','files'],'readwrite'),time=t||Date.now(),id=time*1000+(seq++%1000);
      tx.objectStore('meta').put({id,t:time,owner,lay,thumb,gif:!!gif,vid:!!vid});tx.objectStore('files').put({id,photo,gif,vid,vext});await fin(tx);return id},
    async list(owner){const d=await idb();return(await req(d.transaction('meta').objectStore('meta').getAll())).filter(m=>m.owner===owner).sort((a,b)=>b.t-a.t)},
    async get(id){const d=await idb();return req(d.transaction('files').objectStore('files').get(id))},
    async del(id){const d=await idb(),tx=d.transaction(['meta','files'],'readwrite');tx.objectStore('meta').delete(id);tx.objectStore('files').delete(id);await fin(tx)}
  }})();
