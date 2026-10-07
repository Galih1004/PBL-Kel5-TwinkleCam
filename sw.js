/* Twinkle Cam service worker: app bisa dibuka offline. Naikkan angka V saat ada update besar. */
const V='twinkle-v7';
const SHELL=['./','index.html','css/style.css','js/app.js','js/templates.js','js/template-images.js','js/vendor/qrcode.js','js/vendor/peerjs.min.js','favicon.svg','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(u.origin!==location.origin&&!/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))return;
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(r);
    const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res}).catch(()=>hit);
    return hit||net;
  }));
});
