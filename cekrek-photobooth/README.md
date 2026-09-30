# Cekrek! Photobooth

Website photobooth statis (HTML + CSS + JavaScript murni, tanpa build).

## Struktur
```
cekrek-photobooth/
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
