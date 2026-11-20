/* =========================================================
   TWINKLE CAM — DATA TEMPLATE GAMBAR (dibuat dari website kelompok)
   Tiap template punya DUA berkas gambar di assets/images/template/:
     <id>.webp    = bingkai transparan (area foto bolong) -> dipakai "susunan asli"
     <id>-bg.jpg  = versi latar (lubang sudah diisi warna sekitar) -> dipakai di SEMUA tata letak
   Properti: id, name, cat (standar), n (jumlah foto di susunan asli),
             w/h (ukuran gambar), slots = [[x,y,lebar,tinggi]] pecahan 0-1,
             ins = [kiri,atas,kanan,bawah] pecahan pinggiran template (dipakai nineSlice untuk latar di semua tata letak)
             c1/c2 (warna atas/bawah, dipakai sebagai cadangan), ink (warna teks di atas latar)
   Tambah template baru = tambah satu objek di sini + taruh dua gambarnya di folder template.
   ========================================================= */
/* rev15: template PORTRAIT/persegi (jendela foto lebih tinggi dari lebar) dihapus karena tidak cocok dengan kamera landscape. Hanya template dengan jendela landscape (rasio >= 1,2) yang dipakai. */
window.TIMG = [
 {
  "id": "coastal-sardines-2x1",
  "name": "Coastal Sardines",
  "cat": "standar",
  "n": 2,
  "w": 709,
  "h": 1063,
  "ov": "coastal-sardines-2x1.webp",
  "bg": "coastal-sardines-2x1-bg.jpg",
  "slots": [
   [
    0.0752,
    0.1075,
    0.8496,
    0.35
   ],
   [
    0.0789,
    0.5,
    0.8383,
    0.3525
   ]
  ],
  "c1": "#798ca8",
  "c2": "#6b809b",
  "ink": "#ffffff",
  "ins": [
   0.0752,
   0.1075,
   0.0752,
   0.1475
  ]
 },
 {
  "id": "edgy-doodle-stars-2x1",
  "name": "Edgy Doodle Stars",
  "cat": "standar",
  "n": 2,
  "w": 709,
  "h": 1063,
  "ov": "edgy-doodle-stars-2x1.webp",
  "bg": "edgy-doodle-stars-2x1-bg.jpg",
  "slots": [
   [
    0.0752,
    0.1075,
    0.8496,
    0.3525
   ],
   [
    0.0752,
    0.5,
    0.8496,
    0.3525
   ]
  ],
  "c1": "#28221e",
  "c2": "#46413b",
  "ink": "#ffffff",
  "ins": [
   0.0752,
   0.1075,
   0.0752,
   0.1475
  ]
 },
 {
  "id": "minimalist-checkered-2x1",
  "name": "Minimalist Checkered",
  "cat": "standar",
  "n": 2,
  "w": 709,
  "h": 1063,
  "ov": "minimalist-checkered-2x1.webp",
  "bg": "minimalist-checkered-2x1-bg.jpg",
  "slots": [
   [
    0.0752,
    0.1075,
    0.8496,
    0.3525
   ],
   [
    0.0752,
    0.5,
    0.8496,
    0.3525
   ]
  ],
  "c1": "#2a5337",
  "c2": "#345c40",
  "ink": "#ffffff",
  "ins": [
   0.0752,
   0.1075,
   0.0752,
   0.1475
  ]
 },
 {
  "id": "90s-scrapbook-3x1",
  "name": "90s Scrapbook",
  "cat": "standar",
  "n": 3,
  "w": 800,
  "h": 1484,
  "ov": "90s-scrapbook-3x1.webp",
  "bg": "90s-scrapbook-3x1-bg.jpg",
  "slots": [
   [
    0.0791,
    0.085,
    0.8419,
    0.25
   ],
   [
    0.0791,
    0.375,
    0.8419,
    0.25
   ],
   [
    0.0791,
    0.665,
    0.8419,
    0.25
   ]
  ],
  "c1": "#ab8e78",
  "c2": "#b2abae",
  "ink": "#1c1433",
  "ins": [
   0.0791,
   0.085,
   0.079,
   0.085
  ]
 },
 {
  "id": "cottagecore-picnic-3x1",
  "name": "Cottagecore Picnic",
  "cat": "standar",
  "n": 3,
  "w": 800,
  "h": 1484,
  "ov": "cottagecore-picnic-3x1.webp",
  "bg": "cottagecore-picnic-3x1-bg.jpg",
  "slots": [
   [
    0.0791,
    0.085,
    0.8419,
    0.25
   ],
   [
    0.0791,
    0.375,
    0.8419,
    0.25
   ],
   [
    0.0791,
    0.665,
    0.8419,
    0.25
   ]
  ],
  "c1": "#687642",
  "c2": "#7a884b",
  "ink": "#ffffff",
  "ins": [
   0.0791,
   0.085,
   0.079,
   0.085
  ]
 },
 {
  "id": "midnight-lace-3x1",
  "name": "Midnight Lace",
  "cat": "standar",
  "n": 3,
  "w": 800,
  "h": 1484,
  "ov": "midnight-lace-3x1.webp",
  "bg": "midnight-lace-3x1-bg.jpg",
  "slots": [
   [
    0.0791,
    0.085,
    0.8419,
    0.25
   ],
   [
    0.0791,
    0.375,
    0.8419,
    0.25
   ],
   [
    0.0791,
    0.665,
    0.8419,
    0.25
   ]
  ],
  "c1": "#2d3148",
  "c2": "#343649",
  "ink": "#ffffff",
  "ins": [
   0.0791,
   0.085,
   0.079,
   0.085
  ]
 },
 {
  "id": "pastel-dreamland-3x1",
  "name": "Pastel Dreamland",
  "cat": "standar",
  "n": 3,
  "w": 800,
  "h": 1484,
  "ov": "pastel-dreamland-3x1.webp",
  "bg": "pastel-dreamland-3x1-bg.jpg",
  "slots": [
   [
    0.0791,
    0.085,
    0.8419,
    0.25
   ],
   [
    0.0791,
    0.375,
    0.8419,
    0.25
   ],
   [
    0.0791,
    0.665,
    0.8419,
    0.25
   ]
  ],
  "c1": "#e0dbc1",
  "c2": "#e3dba1",
  "ink": "#1c1433",
  "ins": [
   0.0791,
   0.085,
   0.079,
   0.085
  ]
 },
 {
  "id": "retro-denim-lace-3x1",
  "name": "Retro Denim Lace",
  "cat": "standar",
  "n": 3,
  "w": 800,
  "h": 1484,
  "ov": "retro-denim-lace-3x1.webp",
  "bg": "retro-denim-lace-3x1-bg.jpg",
  "slots": [
   [
    0.0791,
    0.085,
    0.8419,
    0.2575
   ],
   [
    0.0791,
    0.375,
    0.8419,
    0.25
   ],
   [
    0.0791,
    0.6625,
    0.8419,
    0.2525
   ]
  ],
  "c1": "#642b2a",
  "c2": "#693434",
  "ink": "#ffffff",
  "ins": [
   0.0791,
   0.085,
   0.079,
   0.085
  ]
 },
 {
  "id": "black-polkadot-4x1",
  "name": "Black Polkadot",
  "cat": "standar",
  "n": 4,
  "w": 354,
  "h": 944,
  "ov": "black-polkadot-4x1.webp",
  "bg": "black-polkadot-4x1-bg.jpg",
  "slots": [
   [
    0.0533,
    0.0375,
    0.8933,
    0.1975
   ],
   [
    0.0533,
    0.25,
    0.8933,
    0.195
   ],
   [
    0.0533,
    0.4625,
    0.8933,
    0.1975
   ],
   [
    0.0533,
    0.675,
    0.8933,
    0.1975
   ]
  ],
  "c1": "#e1dbd8",
  "c2": "#c4c1b9",
  "ink": "#1c1433",
  "ins": [
   0.0533,
   0.0375,
   0.0534,
   0.1275
  ]
 },
 {
  "id": "blackwith-stars-4x1",
  "name": "Black with Stars",
  "cat": "standar",
  "n": 4,
  "w": 533,
  "h": 1600,
  "ov": "blackwith-stars-4x1.webp",
  "bg": "blackwith-stars-4x1-bg.jpg",
  "slots": [
   [
    0.0526,
    0.035,
    0.8947,
    0.2025
   ],
   [
    0.0526,
    0.2575,
    0.8947,
    0.2025
   ],
   [
    0.0526,
    0.48,
    0.8947,
    0.205
   ],
   [
    0.0526,
    0.7025,
    0.8947,
    0.205
   ]
  ],
  "c1": "#2e2e31",
  "c2": "#3c3839",
  "ink": "#ffffff",
  "ins": [
   0.0526,
   0.035,
   0.0527,
   0.0925
  ]
 },
 {
  "id": "blue-chess-4x1",
  "name": "Blue Chess",
  "cat": "standar",
  "n": 4,
  "w": 533,
  "h": 1600,
  "ov": "blue-chess-4x1.webp",
  "bg": "blue-chess-4x1-bg.jpg",
  "slots": [
   [
    0.0451,
    0.0325,
    0.9023,
    0.205
   ],
   [
    0.0451,
    0.255,
    0.9023,
    0.2075
   ],
   [
    0.0451,
    0.48,
    0.9023,
    0.205
   ],
   [
    0.0451,
    0.7025,
    0.9023,
    0.205
   ]
  ],
  "c1": "#96b2be",
  "c2": "#96b2bc",
  "ink": "#1c1433",
  "ins": [
   0.0451,
   0.0325,
   0.0526,
   0.0925
  ]
 },
 {
  "id": "brown-leaves-4x1",
  "name": "Brown Leaves",
  "cat": "standar",
  "n": 4,
  "w": 533,
  "h": 1600,
  "ov": "brown-leaves-4x1.webp",
  "bg": "brown-leaves-4x1-bg.jpg",
  "slots": [
   [
    0.0451,
    0.0325,
    0.9098,
    0.2075
   ],
   [
    0.0451,
    0.255,
    0.9098,
    0.2075
   ],
   [
    0.0451,
    0.48,
    0.9098,
    0.205
   ],
   [
    0.0451,
    0.7025,
    0.9098,
    0.205
   ]
  ],
  "c1": "#3e2624",
  "c2": "#432826",
  "ink": "#ffffff",
  "ins": [
   0.0451,
   0.0325,
   0.0451,
   0.0925
  ]
 },
 {
  "id": "midnight-lavender-4x1",
  "name": "Midnight Lavender",
  "cat": "standar",
  "n": 4,
  "w": 354,
  "h": 944,
  "ov": "midnight-lavender-4x1.webp",
  "bg": "midnight-lavender-4x1-bg.jpg",
  "slots": [
   [
    0.0533,
    0.0375,
    0.8933,
    0.1975
   ],
   [
    0.0533,
    0.25,
    0.8933,
    0.195
   ],
   [
    0.0533,
    0.4625,
    0.8933,
    0.1975
   ],
   [
    0.0533,
    0.675,
    0.8933,
    0.1975
   ]
  ],
  "c1": "#34204e",
  "c2": "#352645",
  "ink": "#ffffff",
  "ins": [
   0.0533,
   0.0375,
   0.0534,
   0.1275
  ]
 },
 {
  "id": "navy-coquette-4x1",
  "name": "Navy Coquette",
  "cat": "standar",
  "n": 4,
  "w": 354,
  "h": 944,
  "ov": "navy-coquette-4x1.webp",
  "bg": "navy-coquette-4x1-bg.jpg",
  "slots": [
   [
    0.0533,
    0.0375,
    0.8933,
    0.195
   ],
   [
    0.0533,
    0.25,
    0.8933,
    0.195
   ],
   [
    0.0533,
    0.4625,
    0.8933,
    0.195
   ],
   [
    0.0533,
    0.675,
    0.8933,
    0.1975
   ]
  ],
  "c1": "#343a55",
  "c2": "#3c4456",
  "ink": "#ffffff",
  "ins": [
   0.0533,
   0.0375,
   0.0534,
   0.1275
  ]
 },
 {
  "id": "sweat-pinkand-yellow-4x1",
  "name": "Sweat Pink and Yellow",
  "cat": "standar",
  "n": 4,
  "w": 533,
  "h": 1600,
  "ov": "sweat-pinkand-yellow-4x1.webp",
  "bg": "sweat-pinkand-yellow-4x1-bg.jpg",
  "slots": [
   [
    0.0451,
    0.0325,
    0.9098,
    0.2075
   ],
   [
    0.0451,
    0.255,
    0.9098,
    0.2075
   ],
   [
    0.0451,
    0.4775,
    0.9098,
    0.2075
   ],
   [
    0.0451,
    0.7025,
    0.9098,
    0.205
   ]
  ],
  "c1": "#e5c7ac",
  "c2": "#eac7b2",
  "ink": "#1c1433",
  "ins": [
   0.0451,
   0.0325,
   0.0451,
   0.0925
  ]
 },
 {
  "id": "yellowmess-4x1",
  "name": "Yellow Mess",
  "cat": "standar",
  "n": 4,
  "w": 354,
  "h": 944,
  "ov": "yellowmess-4x1.webp",
  "bg": "yellowmess-4x1-bg.jpg",
  "slots": [
   [
    0.0533,
    0.0375,
    0.8933,
    0.1975
   ],
   [
    0.0533,
    0.25,
    0.8933,
    0.195
   ],
   [
    0.0533,
    0.4625,
    0.8933,
    0.1975
   ],
   [
    0.0533,
    0.675,
    0.8933,
    0.1975
   ]
  ],
  "c1": "#f9e489",
  "c2": "#ebd777",
  "ink": "#1c1433",
  "ins": [
   0.0533,
   0.0375,
   0.0534,
   0.1275
  ]
 }
];

/* =========================================================
   [DATA] UKURAN (GRID) BINGKAI — dipakai photobooth.js (filter langkah Template) dan templates.js
   TSIZE   : kunci tata letak (LAY di photobooth.js) -> kategori ukuran bingkai
   tsizeOf : kategori ukuran sebuah template gambar (dari jumlah foto)
   Aturan: tata letak 3x1 HANYA menampilkan template 3x1; 2x2/3x2/4x2/1x1 menampilkan bingkai polos (frames-data.js).
   ========================================================= */
window.TSIZE = { p1: "1x1", s2: "2x1", p2: "2x1", s3: "3x1", s4: "4x1", g4: "2x2", l4: "2x2", d3: "3x2", d4: "4x2" };
window.TSIZE_PLAIN = ["1x1", "2x2", "3x2", "4x2"]; // ukuran yang memakai bingkai polos
window.tsizeOf = (t) => ({ 1: "1x1", 2: "2x1", 3: "3x1", 4: "4x1" })[t.n];
/* Tata letak default untuk tiap ukuran (dipakai tombol "Pakai template" di halaman Templates) */
window.TSIZE_LAY = { "1x1": "p1", "2x1": "s2", "3x1": "s3", "4x1": "s4", "2x2": "g4", "3x2": "d3", "4x2": "d4" };
