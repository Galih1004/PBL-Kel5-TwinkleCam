# Twinkle Cam

Website photobooth statis (HTML + CSS + JavaScript murni, tanpa build). Bisa dipasang sebagai PWA.

## Fitur
| Kebutuhan | Fitur | File utama |
|---|---|---|
| Akses kamera | Kamera depan/belakang, tombol ganti kamera, unggah foto | `camera.js`, `capture.js` |
| Timer otomatis | 3 atau 5 detik, jepret semua slot otomatis, tombol Batal | `camera.js` |
| Filter dan efek | 12 filter, 5 efek yang bisa ditumpuk (vinyet, grain, kilau, light leak, VHS) | `config.js`, `effects.js` |
| Stiker | Emoji, 10 stiker gambar, unggah stiker sendiri; geser, putar, besarkan | `editor.js`, `stickers.js` |
| Hasil PNG, MP4, GIF | PNG, GIF, video (MP4 bila browser mendukung, selain itu WebM) | `result.js`, `video.js`, `gif.js` |
| Bingkai dan susunan | 18 bingkai, 8 tata letak, 5 template bergambar | `config.js`, `setup.js`, `canvas.js` |
| Retake | Tombol ✕ di foto, Ulang foto terakhir, atau Ulangi di preview | `camera.js`, `capture.js` |
| Preview foto | Preview tiap foto (Pakai / Ulangi / Batal) dan preview hasil | `capture.js` |
| Pilih mode | Klasik dan Puzzle | `modes.js` |
| Unduh | Unduh PNG/GIF/video, ukuran cetak, bagikan, album lokal | `result.js`, `album.js` |
| Kirim hasil ke HP (QR) | QR di halaman Simpan, file dikirim langsung ke HP | `qrsend.js` |
| HP jadi kamera (QR) | Scan QR, kamera HP dikirim ke laptop lewat WebRTC | `remote.js` |
| Mode puzzle | Foto harus disusun dulu sebelum bisa dipakai | `puzzle.js` |

## Struktur
```
index.html, sw.js, manifest.webmanifest, vercel.json
css/style.css      tampilan utama
css/extra.css      modal, puzzle, dialog QR, layar kamera HP
js/vendor/         peerjs.min.js (WebRTC), qrcode.js (pembuat QR)
js/config.js       konstanta: tata letak, bingkai, filter, set stiker
js/state.js        state global S dan helper
js/ui.js           modal dan helper UI
js/canvas.js       menggambar bingkai, foto, dan hasil
js/gif.js          encoder GIF
js/video.js        perekaman video
js/setup.js        halaman 1: pilih layout dan timer
js/camera.js       halaman 2: kamera, jepret, retake
js/editor.js       halaman 3: bingkai, filter, stiker, teks
js/result.js       halaman 4: hasil dan unduhan
js/album.js        album (IndexedDB)
js/qrsend.js       kirim hasil ke HP lewat QR dan halaman terima
js/modes.js        pilihan mode
js/puzzle.js       mode puzzle
js/effects.js      efek foto
js/stickers.js     stiker gambar
js/capture.js      preview per foto dan gerbang puzzle
js/remote.js       HP jadi kamera (QR)
js/app.js          router, tema, PWA, inisialisasi
```
Semua file dimuat sebagai script biasa (tanpa bundler) dan berbagi scope global, jadi **urutan tag `<script>` di `index.html` penting**. `capture.js`, `modes.js`, `effects.js`, `stickers.js`, dan `remote.js` membungkus fungsi bawaan (`shoot`, `buildLays`, `buildOpts`, `card`, `startCam`), jadi harus dimuat setelah modul aslinya dan sebelum `app.js`.

## Jalankan lokal
Kamera butuh localhost atau HTTPS. Jangan buka lewat file://
```
npx serve .
```

## Deploy ke Vercel
1. Upload folder ke GitHub, lalu di vercel.com pilih Add New > Project > Import repo.
2. Framework Preset: Other. Build Command dan Output Directory dikosongkan.
3. Klik Deploy.

## HP jadi kamera
1. Di laptop, buka halaman jepret lalu klik **📱 HP jadi kamera**.
2. Scan QR dengan HP, izinkan akses kamera.
3. Video HP tampil di layar laptop dan dipakai seperti kamera biasa (timer, filter, puzzle tetap jalan).

Syarat: situs harus dibuka lewat **HTTPS** yang bisa diakses HP (misalnya Vercel). `localhost` tidak bisa dibuka dari HP; untuk uji lokal pakai tunnel seperti ngrok. Jaringan yang memblokir koneksi peer-to-peer (sebagian Wi-Fi kampus) butuh server TURN. Server penghubung sendiri bisa diatur lewat `window.PEER_OPTS` (dipakai bersama fitur Kirim ke HP).

## Mode puzzle
Di halaman Pilih, pilih mode Puzzle dan tingkat 3×3, 4×4, atau 5×5. Setiap foto yang diambil (atau diunggah) harus disusun dulu dengan menukar kepingan. Foto baru dihitung setelah puzzle selesai, jadi tombol "Lanjut hias" baru aktif setelah semua foto beres. Tombol Intip menampilkan gambar asli sebentar, dan Foto ulang membatalkan foto itu.

## Menambah mode baru
1. Daftarkan di `MODES` (`js/modes.js`).
2. Tangani perilakunya di `shoot()` pada `js/capture.js`.

## Menambah template bingkai sendiri
1. Taruh gambar di `frames/` (lubang foto berwarna hitam pekat atau putih pekat).
2. Tambahkan datanya di `js/templates.js`: `poly` (4 sudut lubang), `cx/cy` (pusat), `w/h` (ukuran), `a` (sudut putar dalam radian). Urutan slot = urutan foto.
3. Ubah gambarnya menjadi data URL di `js/template-images.js` (kunci = id template).
4. Daftarkan file di `sw.js` (daftar SHELL) dan naikkan angka `V`.

## Catatan penting
- Gambar template disematkan di `js/template-images.js` (data URL) supaya kanvas tidak diblokir browser. Folder `frames/` berisi file aslinya sebagai arsip.
- Saat dibuka lewat `file://`, kamera dan PWA bisa terbatas. Gunakan hosting (Vercel) atau `npx serve`.
- Efek belum berlaku untuk template bergambar.
- Di mode puzzle, video dan GIF hasil tetap memakai rekaman asli saat memotret (puzzle hanya gerbang sebelum foto dipakai).

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
