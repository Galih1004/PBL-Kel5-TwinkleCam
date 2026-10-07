# Twinkle Cam

Website photobooth statis (HTML + CSS + JavaScript murni, tanpa build).

## Struktur
```
twinkle-cam/
├── index.html      halaman utama
├── css/style.css   tampilan
├── js/app.js       logika kamera, filter, bingkai, stiker
├── favicon.svg     ikon tab
├── vercel.json     pengaturan Vercel (izin kamera)
└── README.md
```

## Jalankan lokal
Kamera butuh localhost atau HTTPS. Jangan buka lewat file://
```
npx serve .
```

## Deploy ke Vercel
1. Upload folder ke GitHub, lalu di vercel.com pilih Add New > Project > Import repo.
2. Framework Preset: Other. Build Command dan Output Directory dikosongkan.
3. Klik Deploy.

Atau lewat CLI: `npm i -g vercel` lalu jalankan `vercel --prod` di dalam folder ini.

## Menambah template bingkai sendiri
1. Taruh gambar di `frames/` (lubang foto berwarna hitam pekat atau putih pekat).
2. Tambahkan datanya di `js/templates.js`: `poly` (4 sudut lubang), `cx/cy` (pusat), `w/h` (ukuran), `a` (sudut putar dalam radian). Urutan slot = urutan foto.
3. Daftarkan file gambarnya di `sw.js` (daftar SHELL) dan naikkan angka `V`.

## Catatan penting
- Gambar template disematkan di `js/template-images.js` (data URL) supaya kanvas tidak diblokir browser, termasuk saat `index.html` dibuka langsung dari folder. Folder `frames/` berisi file aslinya sebagai arsip.
- Untuk menambah template baru: tambahkan datanya di `js/templates.js`, lalu ubah gambarnya menjadi data URL di `js/template-images.js` (kunci = id template).
- Saat dibuka lewat `file://`, kamera dan PWA bisa terbatas. Untuk hasil terbaik gunakan hosting (Vercel) atau `npx serve`.

## Kirim ke HP (QR)
- Di halaman Simpan, tombol **📱 Kirim ke HP (QR)** membuat kode QR. HP memindainya, membuka halaman `#/terima/...`, lalu menerima foto, video, dan GIF langsung dari komputer (WebRTC lewat PeerJS).
- File **tidak diunggah ke server**. Layanan PeerJS (`0.peerjs.com`) hanya dipakai untuk mempertemukan kedua perangkat, jadi butuh internet di keduanya.
- Halaman di komputer harus tetap terbuka sampai unduhan di HP selesai. Beberapa HP bisa memindai sekaligus.
- Web harus dibuka lewat alamat yang bisa diakses HP (misalnya domain Vercel). Alamat `localhost` atau `file://` hanya bisa dibuka di perangkat itu sendiri.
- Pustaka bawaan ada di `js/vendor/` (PeerJS dan pembuat QR), jadi tidak butuh CDN.
- Mau memakai server penghubung sendiri? Sisipkan sebelum `js/app.js` di `index.html`:
  `<script>window.PEER_OPTS={host:'peer.situsmu.com',port:443,path:'/',secure:true}</script>`

## Retake foto
- Ketuk **✕** di pojok foto untuk mengulang foto itu, atau tombol **↻ Ulang foto terakhir**. Foto lama baru diganti setelah foto baru berhasil diambil. Tombol **✕ Batal** menghentikan hitung mundur.
