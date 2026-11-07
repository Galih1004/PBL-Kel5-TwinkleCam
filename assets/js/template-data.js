/* =========================================================
   TWINKLE CAM — Registri Template Bingkai (rev5)
   Satu-satunya tempat yang perlu diubah saat menambah / menghapus
   template. Dipakai oleh assets/js/flow.js untuk:
     - Koleksi Bingkai di halaman Templates (menu/templates.html, assets/js/template-gallery.js),
     - filter template per ukuran di Langkah 3,
     - penempatan foto ke dalam bingkai (Langkah 4-6).

   Properti tiap template:
     id          : kode unik (huruf kecil, tanpa spasi)
     nama        : nama yang tampil di kartu
     ukuran      : "1x1" | "2x1" | "2x2" | "3x1" | "3x2" | "4x1" | "4x2" | "custom"
                   (harus sama dengan id ukuran di GRIDS pada flow.js)
     kategori    : "standar" | "custom"
     url_gambar  : lokasi gambar, relatif terhadap folder assets/
     tipe_area   : bagaimana area foto ditandai pada gambar
                   "transparan" = bagian bolong/transparan (PNG)
                   "hitam"      = kotak hitam; dilubangi otomatis saat dipakai
     slots       : (opsional) posisi tiap area foto [x, y, lebar, tinggi],
                   berupa pecahan 0-1 dari lebar/tinggi gambar, urut atas -> bawah.
                   Jika dihilangkan, flow.js mendeteksinya otomatis dari gambar
                   (tipe_area dibaca otomatis juga).

   Catatan: 16 file template standar berekstensi .jpg padahal isinya PNG
   transparan. Browser tetap membacanya dengan benar, tetapi sebaiknya
   diganti namanya menjadi .png (jangan lupa ubah url_gambar di sini).

   Template ber-ukuran "custom" muncul pada pilihan "Custom / Upload Bingkai"
   (nama file berakhiran _CustomTemplate). Jumlah foto yang diambil mengikuti
   jumlah area foto pada gambar.
   ========================================================= */
(() => {
  "use strict";

  /* Folder gambar template, relatif terhadap assets/ */
  const DIR = "images/template/";

  /* Urutan ukuran bingkai untuk galeri & filter (samakan dengan GRIDS di flow.js).
     Ukuran yang belum punya template otomatis dilewati. */
  window.TWINKLE_SIZE_ORDER = ["1x1", "2x1", "2x2", "3x1", "3x2", "4x1", "4x2", "custom"];

  window.TWINKLE_TEMPLATES = [
    /* ---------- Bingkai 2x1 ---------- */
    {
      id: "coastal-sardines-2x1",
      nama: "Coastal Sardines",
      ukuran: "2x1",
      kategori: "standar",
      url_gambar: DIR + "CoastalSardines2x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0752, 0.1075, 0.8496, 0.35], [0.0789, 0.5, 0.8383, 0.3525]],
    },
    {
      id: "edgy-doodle-stars-2x1",
      nama: "Edgy Doodle Stars",
      ukuran: "2x1",
      kategori: "standar",
      url_gambar: DIR + "EdgyDoodleStars2x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0752, 0.1075, 0.8496, 0.3525], [0.0752, 0.5, 0.8496, 0.3525]],
    },
    {
      id: "minimalist-checkered-2x1",
      nama: "Minimalist Checkered",
      ukuran: "2x1",
      kategori: "standar",
      url_gambar: DIR + "MinimalistCheckered2x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0752, 0.1075, 0.8496, 0.3525], [0.0752, 0.5, 0.8496, 0.3525]],
    },
    /* ---------- Bingkai 3x1 ---------- */
    {
      id: "90s-scrapbook-3x1",
      nama: "90s Scrapbook",
      ukuran: "3x1",
      kategori: "standar",
      url_gambar: DIR + "90sScrapbook3x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0791, 0.085, 0.8419, 0.25], [0.0791, 0.375, 0.8419, 0.25], [0.0791, 0.665, 0.8419, 0.25]],
    },
    {
      id: "cottagecore-picnic-3x1",
      nama: "Cottagecore Picnic",
      ukuran: "3x1",
      kategori: "standar",
      url_gambar: DIR + "CottagecorePicnic3x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0791, 0.085, 0.8419, 0.25], [0.0791, 0.375, 0.8419, 0.25], [0.0791, 0.665, 0.8419, 0.25]],
    },
    {
      id: "midnight-lace-3x1",
      nama: "Midnight Lace",
      ukuran: "3x1",
      kategori: "standar",
      url_gambar: DIR + "MidnightLace3x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0791, 0.085, 0.8419, 0.25], [0.0791, 0.375, 0.8419, 0.25], [0.0791, 0.665, 0.8419, 0.25]],
    },
    {
      id: "pastel-dreamland-3x1",
      nama: "Pastel Dreamland",
      ukuran: "3x1",
      kategori: "standar",
      url_gambar: DIR + "PastelDreamland3x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0791, 0.085, 0.8419, 0.25], [0.0791, 0.375, 0.8419, 0.25], [0.0791, 0.665, 0.8419, 0.25]],
    },
    {
      id: "retro-denim-lace-3x1",
      nama: "Retro Denim Lace",
      ukuran: "3x1",
      kategori: "standar",
      url_gambar: DIR + "RetroDenimLace3x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0791, 0.085, 0.8419, 0.2575], [0.0791, 0.375, 0.8419, 0.25], [0.0791, 0.6625, 0.8419, 0.2525]],
    },
    /* ---------- Bingkai 4x1 ---------- */
    {
      id: "black-polkadot-4x1",
      nama: "Black Polkadot",
      ukuran: "4x1",
      kategori: "standar",
      url_gambar: DIR + "BlackPolkadot4x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0533, 0.0375, 0.8933, 0.1975], [0.0533, 0.25, 0.8933, 0.195], [0.0533, 0.4625, 0.8933, 0.1975], [0.0533, 0.675, 0.8933, 0.1975]],
    },
    {
      id: "blackwith-stars-4x1",
      nama: "Black with Stars",
      ukuran: "4x1",
      kategori: "standar",
      url_gambar: DIR + "BlackwithStars4x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0526, 0.035, 0.8947, 0.2025], [0.0526, 0.2575, 0.8947, 0.2025], [0.0526, 0.48, 0.8947, 0.205], [0.0526, 0.7025, 0.8947, 0.205]],
    },
    {
      id: "blue-chess-4x1",
      nama: "Blue Chess",
      ukuran: "4x1",
      kategori: "standar",
      url_gambar: DIR + "BlueChess4x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0451, 0.0325, 0.9023, 0.205], [0.0451, 0.255, 0.9023, 0.2075], [0.0451, 0.48, 0.9023, 0.205], [0.0451, 0.7025, 0.9023, 0.205]],
    },
    {
      id: "brown-leaves-4x1",
      nama: "Brown Leaves",
      ukuran: "4x1",
      kategori: "standar",
      url_gambar: DIR + "BrownLeaves4x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0451, 0.0325, 0.9098, 0.2075], [0.0451, 0.255, 0.9098, 0.2075], [0.0451, 0.48, 0.9098, 0.205], [0.0451, 0.7025, 0.9098, 0.205]],
    },
    {
      id: "midnight-lavender-4x1",
      nama: "Midnight Lavender",
      ukuran: "4x1",
      kategori: "standar",
      url_gambar: DIR + "MidnightLavender4x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0533, 0.0375, 0.8933, 0.1975], [0.0533, 0.25, 0.8933, 0.195], [0.0533, 0.4625, 0.8933, 0.1975], [0.0533, 0.675, 0.8933, 0.1975]],
    },
    {
      id: "navy-coquette-4x1",
      nama: "Navy Coquette",
      ukuran: "4x1",
      kategori: "standar",
      url_gambar: DIR + "NavyCoquette4x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0533, 0.0375, 0.8933, 0.195], [0.0533, 0.25, 0.8933, 0.195], [0.0533, 0.4625, 0.8933, 0.195], [0.0533, 0.675, 0.8933, 0.1975]],
    },
    {
      id: "sweat-pinkand-yellow-4x1",
      nama: "Sweat Pink and Yellow",
      ukuran: "4x1",
      kategori: "standar",
      url_gambar: DIR + "SweatPinkandYellow4x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0451, 0.0325, 0.9098, 0.2075], [0.0451, 0.255, 0.9098, 0.2075], [0.0451, 0.4775, 0.9098, 0.2075], [0.0451, 0.7025, 0.9098, 0.205]],
    },
    {
      id: "yellowmess-4x1",
      nama: "Yellow Mess",
      ukuran: "4x1",
      kategori: "standar",
      url_gambar: DIR + "Yellowmess4x1.jpg",
      tipe_area: "transparan",
      slots: [[0.0533, 0.0375, 0.8933, 0.1975], [0.0533, 0.25, 0.8933, 0.195], [0.0533, 0.4625, 0.8933, 0.1975], [0.0533, 0.675, 0.8933, 0.1975]],
    },
    /* ---------- Custom (area foto berwarna hitam) ---------- */
    {
      id: "snoopy-love-letter-custom",
      nama: "Snoopy Love Letter",
      ukuran: "custom",
      kategori: "custom",
      url_gambar: DIR + "SnoopyLoveLetter_CustomTemplate.jpg",
      tipe_area: "hitam",
      slots: [[0.3556, 0.1525, 0.5333, 0.315], [0.0667, 0.49, 0.5556, 0.355]],
    },
    {
      id: "snoopy-starry-custom",
      nama: "Snoopy Starry",
      ukuran: "custom",
      kategori: "custom",
      url_gambar: DIR + "SnoopyStarry_CustomTemplate.jpg",
      tipe_area: "hitam",
      slots: [[0.1511, 0.195, 0.68, 0.49]],
    },
    {
      id: "starry-night-cat-custom",
      nama: "Starry Night Cat",
      ukuran: "custom",
      kategori: "custom",
      url_gambar: DIR + "StarryNightCat_CustomTemplate.jpg",
      tipe_area: "hitam",
      slots: [[0.5378, 0.0425, 0.3956, 0.215], [0.0178, 0.24, 0.4356, 0.24], [0.1467, 0.6325, 0.4489, 0.255]],
    },
    {
      id: "the1975-retro-custom",
      nama: "The 1975 Retro",
      ukuran: "custom",
      kategori: "custom",
      url_gambar: DIR + "The1975Retro_CustomTemplate.jpg",
      tipe_area: "hitam",
      slots: [[0.2311, 0.3425, 0.3956, 0.22], [0.1867, 0.5525, 0.4, 0.22], [0.1467, 0.765, 0.3956, 0.2225]],
    },
  ];
})();
