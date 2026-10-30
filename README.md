# Twinkle Cam

Photobooth online. Website statis (HTML + CSS + JS), tanpa build.

## Struktur
```
index.html            Beranda
akun/login.html       Login / Sign Up
menu/photobooth.html  Photobooth (kamera, 4 foto, unduh)
menu/templates.html   Pilihan frame
menu/album.html       Riwayat album
assets/css            style.css (header & hero), pages.css (halaman lain)
assets/js             layout.js (header, footer, tautan), lalu satu file per halaman
assets/images         logo.jpg, selfiecontoh1-4.jpg
```

## Menambah / memindah halaman
- Semua tautan header & footer ada di `PAGES` pada `assets/js/layout.js`.
- Setiap `<body>` punya `data-root`: `""` untuk file di root, `"../"` untuk file di dalam folder.
  Path gambar di JS memakai `TC.asset("images/...")`, tautan memakai `TC.link("album")`.

## Menjalankan
Buka `index.html`, atau pakai Live Server (VS Code) agar kamera bisa diakses.

## Fitur akses & tutorial (rev3)
| Fitur | Cara kerja | Kunci localStorage |
|---|---|---|
| Riwayat Album khusus login | Elemen ber-atribut `data-requires-login="album"` terkunci untuk guest dan memunculkan pop-up. Halaman album juga menjaga dirinya sendiri. | `twinkle_user`, `twinkle_albums_<email>` |
| Limit unduh guest | 3x unduh gratis, lalu wajib login. User login = tanpa batas. Atur di `FREE_DOWNLOADS` (`photobooth.js`). | `twinkle_downloads` |
| Tutorial newcomer | Overlay step-by-step muncul sekali di `index.html` / `photobooth.html`. Tombol "Putar ulang tutorial" untuk membukanya lagi. | `twinkle_tutorial_seen` |
| Frame Selfie Besties | Strip 3 foto, latar `assets/images/foto_selfiecontoh1.jpg`. Definisi di `TEMPLATES` (`layout.js`). | - |

Catatan: semua pengecekan di atas berjalan di browser sehingga bisa diakali (hapus localStorage, dsb).
Untuk keamanan sungguhan, login dan limit harus divalidasi di server. Titik penggantinya: objek `auth` di `layout.js`.
