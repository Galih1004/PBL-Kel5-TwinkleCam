(() => {
  "use strict";
  /* =========================================================
     TWINKLE CAM — Alur Pengambilan Foto (Langkah 1–6)
     Pendekatan: multi-step dengan state sederhana.
     Setiap langkah = satu <section>; navigasi dilakukan dengan
     menambah / menghapus class ".hidden" lewat goToStep().
     ========================================================= */

  /* =========================================================
     1. KONFIGURASI DATA
     ========================================================= */

  /* Ukuran bingkai, urut sesuai permintaan.
     cols x rows menentukan susunan di layar. Contoh: "3x1" = strip vertikal 3 foto,
     "2x2" = kolase 2 kolom x 2 baris. Jumlah foto = cols * rows. */
  const GRIDS = [
    { id: "1x1", cols: 1, rows: 1 },
    { id: "2x1", cols: 1, rows: 2 },
    { id: "2x2", cols: 2, rows: 2 },
    { id: "3x1", cols: 1, rows: 3 },
    { id: "3x2", cols: 2, rows: 3 },
    { id: "4x1", cols: 1, rows: 4 },
    { id: "4x2", cols: 2, rows: 4 },
  ].map((g) => ({ ...g, label: g.id, count: g.cols * g.rows }));

  /* Opsi khusus "Custom / Upload Bingkai" (kartu terakhir di Langkah 2).
     Jumlah foto TIDAK tetap: ditentukan oleh jumlah area foto pada bingkai yang dipilih
     (lihat makeFrameGrid), jadi count/cols/rows di sini hanya nilai awal. */
  GRIDS.push({ id: "custom", label: "Custom / Upload Bingkai", custom: true, cols: 1, rows: 1, count: 1 });

  /* Lebar sel ikon pada kartu ukuran (px), menurut jumlah kolom */
  const GRID_ICON_CELL = { 1: 64, 2: 44, 3: 32, 4: 26 };

  /* Template visual. colors: 1 warna = solid, 2+ warna = gradasi diagonal. */
  const TEMPLATES = [
    { id: "pink-sparkle", name: "Pink Sparkle", colors: ["#ffd1e8", "#ff8fc7"], text: "#7a1f55" },
    { id: "midnight", name: "Midnight Purple", colors: ["#2b1f6b", "#7c5cff"], text: "#ffffff" },
    { id: "butter", name: "Butter Cream", colors: ["#fff6c9", "#ffe58a"], text: "#6b4f00" },
    { id: "mint", name: "Mint Fresh", colors: ["#d6fff0", "#8ee6c8"], text: "#0e5a43" },
    { id: "polaroid", name: "Polaroid White", colors: ["#ffffff"], text: "#0d0a22" },
    { id: "y2k", name: "Y2K Gradient", colors: ["#ff6fb1", "#7c5cff"], text: "#ffffff" },
  ];

  /* Filter. Setiap filter = daftar operasi [nama, nilai].
     Daftar yang sama dipakai untuk CSS filter (layar) dan canvas (unduhan). */
  const FILTERS = [
    { id: "none", name: "Normal", ops: [] },
    { id: "grayscale", name: "Grayscale", ops: [["grayscale", 1]] },
    { id: "sepia", name: "Sepia", ops: [["sepia", 1]] },
    { id: "bright", name: "Bright", ops: [["brightness", 1.25]] },
    { id: "contrast", name: "Contrast", ops: [["contrast", 1.35]] },
    { id: "vivid", name: "Vivid", ops: [["saturate", 1.6], ["contrast", 1.1]] },
    { id: "vintage", name: "Vintage", ops: [["sepia", 0.45], ["contrast", 1.1], ["saturate", 1.3], ["brightness", 1.05]] },
  ];

  /* Stiker bawaan (emoji) */
  const EMOJI_STICKERS = ["✨", "💖", "⭐", "🌸", "🎀", "😎", "🔥", "🦋", "🍓", "🌈", "👑", "💫"];

  /* Pengaturan sesi foto */
  const COUNTDOWN_SECONDS = 3; // hitung mundur sebelum tiap foto
  const PAUSE_BETWEEN_SHOTS_MS = 900; // jeda antar foto
  const PHOTO_W = 1024; // resolusi foto hasil jepretan
  const PHOTO_H = 768; // rasio 4:3 (sama dengan slot bingkai)
  const LIVE_INTERVAL_MS = 450; // kecepatan pergantian foto di Live Photo
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

  /* Pengaturan template bergambar & upload bingkai */
  const FRAME_UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp"]; // tipe file bingkai yang diterima
  const MAX_FRAME_UPLOAD_BYTES = 10 * 1024 * 1024; // batas ukuran file bingkai
  const MAX_FRAME_WINDOWS = 16; // batas jumlah area foto per bingkai
  const OUTPUT_MIN_WIDTH = 800; // lebar minimal hasil JPG untuk template bergambar (px)
  const FRAME_BLEED = 0.004; // foto dibuat sedikit lebih besar dari lubang (pecahan lebar bingkai)
  const DETECT_MAX_SIDE = 360; // sisi terpanjang gambar saat mendeteksi area foto (px)
  const MIN_WINDOW_AREA = 0.02; // area foto minimal (pecahan luas gambar), di bawahnya dianggap serpihan
  const DARK_DETECT_LUM = 35; // ambang "hitam" saat mendeteksi kotak hitam
  const DARK_PUNCH_LUM = 70; // ambang gelap saat melubangi area hitam
  const DARK_FRINGE_LUM = 110; // pinggiran seleret gelap yang ikut dihapus (sisa kompresi JPG)

  /* Lebar canvas hasil unduhan menurut jumlah kolom (px) */
  const OUTPUT_WIDTH = { 1: 720, 2: 1100, 3: 1400, 4: 1600 };

  /* Id <section> untuk tiap langkah */
  const STEP_IDS = {
    1: "step-start",
    2: "step-grid",
    3: "step-template",
    4: "step-capture",
    5: "step-edit",
    6: "step-result",
  };

  /* =========================================================
     2. STATE & REFERENSI DOM
     ========================================================= */

  /* Satu-satunya sumber kebenaran untuk alur foto */
  const state = {
    step: 1,
    grid: null, // dipilih di Langkah 2
    template: null, // dipilih di Langkah 3
    photos: [], // [{ src: dataURL, img: HTMLImageElement }]
    filter: FILTERS[0], // dipilih di Langkah 5
    stickers: [], // [{ id, type, content/src, img, x, y, size, rot }]
    selectedStickerId: null,
    nextStickerId: 1,
    objectUrls: [], // URL upload yang harus di-revoke saat reset
    stream: null, // MediaStream kamera
    demo: false, // true = pakai foto contoh (tanpa kamera)
    isCapturing: false,
    captureRun: 0, // penanda sesi; naik saat sesi dibatalkan
    resultMode: "jpg", // "jpg" | "live"
    liveTimer: null,
    liveIndex: 0,
    finalCanvas: null,
    editWrap: null, // elemen bingkai di Langkah 5
    frame: null, // bingkai bergambar siap pakai (hasil prepareFrame); null = template warna
    customTab: "builtin", // sub-pilihan mode Custom: "builtin" | "upload"
    pendingUpload: null, // { template, frame } hasil upload yang belum dipakai
    uploadUrl: null, // blob URL file bingkai unggahan
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const dom = {
    progress: $("#progress"),
    gridOptions: $("#gridOptions"),
    templateOptions: $("#templateOptions"),
    templateGridLabel: $("#templateGridLabel"),
    captureTotalLabel: $("#captureTotalLabel"),
    cameraVideo: $("#cameraVideo"),
    cameraPlaceholder: $("#cameraPlaceholder"),
    cameraPlaceholderText: $("#cameraPlaceholderText"),
    countdown: $("#countdown"),
    cameraFlash: $("#cameraFlash"),
    captureBadge: $("#captureBadge"),
    cameraStatus: $("#cameraStatus"),
    captureThumbs: $("#captureThumbs"),
    btnStartCapture: $("#btnStartCapture"),
    btnRetryCamera: $("#btnRetryCamera"),
    btnDemoMode: $("#btnDemoMode"),
    editStage: $("#editStage"),
    filterOptions: $("#filterOptions"),
    stickerOptions: $("#stickerOptions"),
    stickerUpload: $("#stickerUpload"),
    uploadMessage: $("#uploadMessage"),
    btnStickerSmaller: $("#btnStickerSmaller"),
    btnStickerBigger: $("#btnStickerBigger"),
    btnStickerRotate: $("#btnStickerRotate"),
    btnStickerDelete: $("#btnStickerDelete"),
    tabJpg: $("#tabJpg"),
    tabLive: $("#tabLive"),
    resultJpgPanel: $("#resultJpgPanel"),
    resultLivePanel: $("#resultLivePanel"),
    resultLoading: $("#resultLoading"),
    resultImage: $("#resultImage"),
    resultNotice: $("#resultNotice"),
    liveStage: $("#liveStage"),
    liveImage: $("#liveImage"),
    liveDots: $("#liveDots"),
    btnDownload: $("#btnDownload"),
    customChoice: $("#customChoice"),
    tabCustomBuiltin: $("#tabCustomBuiltin"),
    tabCustomUpload: $("#tabCustomUpload"),
    panelBuiltin: $("#panelBuiltin"),
    panelCustomUpload: $("#panelCustomUpload"),
    templateEmpty: $("#templateEmpty"),
    frameUpload: $("#frameUpload"),
    frameUploadMessage: $("#frameUploadMessage"),
    frameUploadPreview: $("#frameUploadPreview"),
    frameUploadImg: $("#frameUploadImg"),
    frameUploadInfo: $("#frameUploadInfo"),
    btnUseUploadedFrame: $("#btnUseUploadedFrame"),
  };

  /* =========================================================
     3. UTILITAS UMUM
     ========================================================= */

  /* Membuat elemen dengan class dan teks opsional (mengurangi kode berulang) */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* Jeda asinkron: dipakai untuk hitung mundur dan jeda antar foto */
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* Membatasi angka ke rentang [min, max] */
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /* Membuat <div> menjadi "tombol" yang bisa diaktifkan dengan Enter / Spasi */
  function makeActivatable(node, handler) {
    node.addEventListener("click", handler);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }
    });
  }

  /* Memuat gambar dari URL / dataURL dan menunggu sampai siap dipakai */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = src;
    });
  }

  /* Mengunduh Blob sebagai file */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /* Latar bingkai untuk CSS (solid / gradasi) berdasarkan warna template */
  function templateBackground(template) {
    return template.colors.length === 1
      ? template.colors[0]
      : `linear-gradient(135deg, ${template.colors.join(", ")})`;
  }

  /* Mengubah daftar operasi filter menjadi string CSS filter, mis. "sepia(0.45) contrast(1.1)" */
  function filterToCss(filter) {
    return filter.ops.length ? filter.ops.map(([name, value]) => `${name}(${value})`).join(" ") : "none";
  }

  /* =========================================================
     4. NAVIGASI ANTAR LANGKAH
     ========================================================= */

  /* Pindah ke langkah tertentu.
     - Menjaga urutan: tidak bisa lompat ke langkah yang datanya belum ada.
     - Membersihkan sumber daya langkah yang ditinggalkan (kamera, live photo).
     - Menyembunyikan semua section lalu menampilkan yang dituju via class .hidden. */
  function goToStep(target) {
    let next = target;
    if (next >= 3 && !state.grid) next = 2;
    if (next >= 4 && !state.template) next = 3;
    if (next >= 5 && state.photos.length !== photoCount()) next = 4;

    // Bersihkan langkah yang ditinggalkan
    if (state.step === 4 && next !== 4) leaveCaptureStep();
    if (state.step === 6 && next !== 6) stopLivePlayback();

    state.step = next;

    Object.entries(STEP_IDS).forEach(([number, id]) => {
      const section = document.getElementById(id);
      const isTarget = Number(number) === next;
      section.classList.toggle("hidden", !isTarget);
      // Memicu ulang animasi masuk
      if (isTarget) {
        section.style.animation = "none";
        void section.offsetWidth;
        section.style.animation = "";
      }
    });

    updateProgress(next);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Aksi saat masuk ke langkah tertentu
    if (next === 3) renderTemplateOptions();
    if (next === 4) enterCaptureStep();
    if (next === 5) renderEditor();
    if (next === 6) renderResult();

    // Pindahkan fokus ke judul langkah agar pembaca layar ikut berpindah
    const heading = document.querySelector(`#${STEP_IDS[next]} .tc-step__title`);
    if (heading) heading.focus({ preventScroll: true });
  }

  /* Memperbarui indikator progress: "done" untuk langkah lewat, "active" untuk langkah sekarang.
     Indikator disembunyikan di Langkah 1 (layar mulai). */
  function updateProgress(step) {
    dom.progress.classList.toggle("hidden", step === 1);
    $$(".tc-progress__item").forEach((item) => {
      const number = Number(item.dataset.progress);
      item.classList.toggle("is-active", number === step);
      item.classList.toggle("is-done", number < step);
    });
  }

  /* Mengembalikan seluruh alur ke kondisi awal (dipakai tombol "Kembali ke Beranda") */
  function resetFlow() {
    stopCamera();
    stopLivePlayback();
    state.captureRun += 1;
    state.isCapturing = false;
    state.grid = null;
    state.template = null;
    state.frame = null;
    clearUploadedFrame();
    state.customTab = "builtin";
    state.photos = [];
    state.filter = FILTERS[0];
    state.stickers = [];
    state.selectedStickerId = null;
    state.demo = false;
    state.finalCanvas = null;
    state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    state.objectUrls = [];
    $$(".tc-grid-card").forEach((card) => {
      card.classList.remove("is-selected");
      card.setAttribute("aria-checked", "false");
    });
  }

  /* =========================================================
     5. LANGKAH 2 — PILIH UKURAN BINGKAI
     ========================================================= */

  /* Deskripsi singkat di bawah label ukuran, mis. "3 foto · strip" */
  function describeGrid(grid) {
    if (grid.custom) return "bingkai sendiri · jumlah foto bebas";
    if (grid.count === 1) return "1 foto · single";
    if (grid.cols === 1) return `${grid.count} foto · strip`;
    return `${grid.count} foto · kolase ${grid.cols}×${grid.rows}`;
  }

  /* Membuat kartu visual untuk setiap ukuran bingkai.
     Ikon = kotak-kotak kecil yang meniru susunan kolom x baris. */
  function renderGridOptions() {
    dom.gridOptions.innerHTML = "";
    GRIDS.forEach((grid) => {
      const card = el("button", "tc-option-card tc-grid-card");
      card.type = "button";
      card.dataset.gridId = grid.id;
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", "false");

      let icon;
      if (grid.custom) {
        // Kartu Custom: ikon gambar + panah unggah, bukan kotak-kotak
        icon = el("span", "tc-grid-icon tc-grid-icon--custom");
        icon.innerHTML = "<span aria-hidden=\"true\">🖼️</span><span class=\"tc-grid-icon__plus\" aria-hidden=\"true\">＋</span>";
        card.classList.add("tc-grid-card--custom");
      } else {
        icon = el("span", "tc-grid-icon");
        icon.style.setProperty("--cols", grid.cols);
        icon.style.setProperty("--cell", `${GRID_ICON_CELL[grid.cols]}px`);
        for (let i = 0; i < grid.count; i += 1) icon.appendChild(el("span", "tc-grid-icon__cell"));
      }

      const labelClass = grid.custom ? "tc-option-card__label tc-option-card__label--sm" : "tc-option-card__label";
      card.append(icon, el("span", labelClass, grid.label), el("span", "tc-option-card__meta", describeGrid(grid)));
      card.addEventListener("click", () => selectGrid(grid));
      dom.gridOptions.appendChild(card);
    });
  }

  /* Menyimpan ukuran bingkai ke state lalu lanjut ke Langkah 3.
     Jika user mengganti ukuran, template & foto lama dibuang karena tidak cocok lagi. */
  function selectGrid(grid) {
    if (state.grid && state.grid.id !== grid.id) {
      state.template = null;
      state.frame = null;
      state.photos = [];
      state.stickers = [];
      state.selectedStickerId = null;
    }
    state.grid = grid;

    $$(".tc-grid-card").forEach((card) => {
      const active = card.dataset.gridId === grid.id;
      card.classList.toggle("is-selected", active);
      card.setAttribute("aria-checked", String(active));
    });

    // Jeda singkat agar efek "terpilih" sempat terlihat
    setTimeout(() => goToStep(3), 250);
  }

  /* =========================================================
     6. BINGKAI (dipakai Langkah 3 & 5)
     ========================================================= */

  /* Membangun elemen bingkai foto di DOM.
     opts: { grid, theme, photos: [src], filterCss, mini }
     Struktur: .tc-frame-wrap > (.tc-frame > slot + caption) + .tc-sticker-layer */
  function buildFrame({ grid, theme, frameInfo = null, photos = [], filterCss = "none", mini = false }) {
    if (frameInfo) return buildImageFrame({ frameInfo, photos, filterCss }); // template bergambar: layering foto + bingkai
    const wrap = el("div", `tc-frame-wrap${mini ? " tc-frame-wrap--mini" : ""}`);
    wrap.dataset.cols = grid.cols;
    wrap.dataset.rows = grid.rows;

    const frame = el("div", "tc-frame");
    frame.style.background = templateBackground(theme);
    frame.style.color = theme.text;

    const slots = el("div", "tc-frame__slots");
    slots.style.gridTemplateColumns = `repeat(${grid.cols}, 1fr)`;

    for (let i = 0; i < grid.count; i += 1) {
      const slot = el("div", "tc-slot");
      if (photos[i]) {
        const img = document.createElement("img");
        img.src = photos[i];
        img.alt = `Foto ${i + 1}`;
        img.draggable = false;
        img.style.filter = filterCss;
        slot.appendChild(img);
      } else {
        slot.classList.add("tc-slot--empty");
        slot.textContent = "✦";
      }
      slots.appendChild(slot);
    }

    frame.append(slots, el("div", "tc-frame__caption", "Twinkle Cam ✦"));
    wrap.append(frame, el("div", "tc-sticker-layer"));
    return wrap;
  }

  /* =========================================================
     6b. MANAJEMEN TEMPLATE BINGKAI
     Registri (template-data.js), filter per ukuran, deteksi area foto,
     dan layering: foto di BELAKANG, gambar bingkai di ATAS-nya.
     ========================================================= */

  /* Registri template: array objek dari assets/js/template-data.js
     { id, nama, ukuran, kategori, url_gambar, tipe_area, slots } */
  const FRAME_REGISTRY = Array.isArray(window.TWINKLE_TEMPLATES) ? window.TWINKLE_TEMPLATES : [];

  /* Cache hasil persiapan bingkai (agar gambar tidak diproses berulang) */
  const frameCache = new Map();

  /* Warna latar Live Photo bila template-nya berupa gambar (bukan warna) */
  const LIVE_FALLBACK_THEME = { colors: ["#ff6fb1", "#7c5cff"], text: "#ffffff" };

  /* Jumlah foto yang harus diambil: mengikuti jumlah area foto pada gambar bingkai
     (bila template bergambar), atau jumlah kotak pada ukuran bingkai (template warna). */
  function photoCount() {
    return state.frame ? state.frame.slots.length : state.grid.count;
  }

  /* Tema untuk Live Photo: template warna dipakai apa adanya, template gambar memakai warna bawaan */
  function liveTheme() {
    return state.frame ? LIVE_FALLBACK_THEME : state.template;
  }

  /* FILTER DINAMIS: hanya template yang ukurannya sama dengan ukuran bingkai terpilih.
     Contoh: filterTemplatesBySize("4x1") -> semua template 4x1, template lain disembunyikan. */
  function filterTemplatesBySize(size) {
    return FRAME_REGISTRY.filter((template) => template.ukuran === size);
  }

  /* Alamat gambar bingkai: file unggahan memakai blob URL, template bawaan lewat TC.asset (menyesuaikan folder) */
  function frameSrc(template) {
    return template.isUpload ? template.url_gambar : TC.asset(template.url_gambar);
  }

  /* Membuat objek "grid" untuk template bergambar. Jumlah foto = jumlah area foto di bingkai,
     jadi opsi Custom (yang jumlah fotonya bebas) pun bisa dipakai oleh Langkah 4-6. */
  function makeFrameGrid(size, count) {
    const base = GRIDS.find((grid) => grid.id === size);
    if (base && !base.custom && base.count === count) return base;
    return { id: size, label: base ? base.label : size, custom: size === "custom", cols: 1, rows: count, count };
  }

  /* ---------- Deteksi area foto ---------- */

  /* Menggambar gambar ke canvas sementara dan mengembalikan pikselnya.
     maxSide membatasi sisi terpanjang agar deteksi cepat. Melempar SecurityError
     bila gambar "tercemar" (situs dibuka lewat file:// bukan localhost/Live Server). */
  function readPixels(img, maxSide) {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    return { w, h, data: ctx.getImageData(0, 0, w, h).data };
  }

  /* Kecerahan (0-255) satu piksel dari array RGBA */
  const luma = (data, i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

  /* Memberi label pada tiap kumpulan piksel yang saling bersambung (4 arah).
     mask = Uint8Array 0/1. Hasil: label per piksel + daftar kumpulan { id, area, x0, y0, x1, y1 } */
  function labelRegions(mask, w, h) {
    const labels = new Int32Array(w * h);
    const stack = new Int32Array(w * h);
    const regions = [];
    for (let start = 0; start < mask.length; start += 1) {
      if (!mask[start] || labels[start]) continue;
      const id = regions.length + 1;
      const region = { id, area: 0, x0: w, y0: h, x1: 0, y1: 0 };
      let top = 0;
      stack[top++] = start;
      labels[start] = id;
      while (top) {
        const p = stack[--top];
        const x = p % w;
        const y = (p / w) | 0;
        region.area += 1;
        if (x < region.x0) region.x0 = x;
        if (x > region.x1) region.x1 = x;
        if (y < region.y0) region.y0 = y;
        if (y > region.y1) region.y1 = y;
        if (x > 0 && mask[p - 1] && !labels[p - 1]) { labels[p - 1] = id; stack[top++] = p - 1; }
        if (x < w - 1 && mask[p + 1] && !labels[p + 1]) { labels[p + 1] = id; stack[top++] = p + 1; }
        if (y > 0 && mask[p - w] && !labels[p - w]) { labels[p - w] = id; stack[top++] = p - w; }
        if (y < h - 1 && mask[p + w] && !labels[p + w]) { labels[p + w] = id; stack[top++] = p + w; }
      }
      regions.push(region);
    }
    return { labels, regions };
  }

  /* Persegi panjang terbesar yang SELURUHNYA berada di dalam satu kumpulan piksel (metode histogram).
     Dipakai bila area foto menyatu dengan area transparan lain (mis. latar bolong di sekitar motif). */
  function largestRect(labels, region, w) {
    const bw = region.x1 - region.x0 + 1;
    const bh = region.y1 - region.y0 + 1;
    const heights = new Int32Array(bw);
    const stack = [];
    let best = { area: 0, x: 0, y: 0, w: 0, h: 0 };
    for (let row = 0; row < bh; row += 1) {
      for (let col = 0; col < bw; col += 1) {
        const inside = labels[(region.y0 + row) * w + region.x0 + col] === region.id;
        heights[col] = inside ? heights[col] + 1 : 0;
      }
      stack.length = 0;
      for (let col = 0; col <= bw; col += 1) {
        const current = col < bw ? heights[col] : 0;
        let start = col;
        while (stack.length && stack[stack.length - 1].h >= current) {
          const top = stack.pop();
          const area = top.h * (col - top.x);
          if (area > best.area) best = { area, x: top.x, y: row - top.h + 1, w: col - top.x, h: top.h };
          start = top.x;
        }
        stack.push({ x: start, h: current });
      }
    }
    return { x: region.x0 + best.x, y: region.y0 + best.y, w: best.w, h: best.h };
  }

  /* Urutan baca: atas -> bawah; bila sebaris, kiri -> kanan */
  function readingOrder(a, b) {
    const sameRow = Math.abs(a.y + a.h / 2 - (b.y + b.h / 2)) < Math.min(a.h, b.h) * 0.5;
    return sameRow ? a.x - b.x : a.y - b.y;
  }

  /* DETEKSI OTOMATIS area foto pada gambar bingkai (dipakai untuk bingkai unggahan
     dan template tanpa properti `slots`).
     - Bingkai transparan: area foto = kumpulan piksel yang transparan.
     - Bingkai tanpa transparansi: area foto = kotak-kotak hitam (lebih kasar, hasil terbaik
       bila kotaknya hitam pekat dan berbentuk persegi panjang).
     Hasil: { mode: "transparan" | "hitam", slots: [{ x, y, w, h }] } (pecahan 0-1, urut baca) */
  function detectWindows(img) {
    const { w, h, data } = readPixels(img, DETECT_MAX_SIDE);
    const total = w * h;

    // 1) Coba baca sebagai bingkai transparan
    let mask = new Uint8Array(total);
    let clearCount = 0;
    for (let i = 0; i < total; i += 1) {
      if (data[i * 4 + 3] < 128) {
        mask[i] = 1;
        clearCount += 1;
      }
    }

    // 2) Tidak ada transparansi -> cari kotak hitam
    let mode = "transparan";
    if (clearCount < total * 0.01) {
      mode = "hitam";
      mask = new Uint8Array(total);
      for (let i = 0; i < total; i += 1) if (luma(data, i * 4) < DARK_DETECT_LUM) mask[i] = 1;
    }

    const { labels, regions } = labelRegions(mask, w, h);
    const slots = [];
    regions.forEach((region) => {
      const bw = region.x1 - region.x0 + 1;
      const bh = region.y1 - region.y0 + 1;
      const fill = region.area / (bw * bh); // 1 = persegi panjang sempurna
      let rect;
      if (mode === "hitam") {
        // Latar gelap yang memenuhi seluruh gambar / bentuk tidak persegi bukan area foto
        if (fill < 0.7 || (bw > w * 0.9 && bh > h * 0.9)) return;
        rect = { x: region.x0, y: region.y0, w: bw, h: bh };
      } else {
        rect = fill >= 0.9 ? { x: region.x0, y: region.y0, w: bw, h: bh } : largestRect(labels, region, w);
      }
      // Abaikan serpihan kecil (mis. pinggiran transparan)
      if (rect.w * rect.h < total * MIN_WINDOW_AREA) return;
      slots.push({ x: rect.x / w, y: rect.y / h, w: rect.w / w, h: rect.h / h });
    });
    slots.sort(readingOrder);
    return { mode, slots };
  }

  /* ---------- Melubangi area hitam (untuk template berformat JPG tanpa transparansi) ---------- */

  /* Operasi morfologi persegi pada mask 0/1: erode = mengikis, dilate = menebalkan.
     Memakai jumlah kumulatif sehingga cepat. Piksel di luar mask dianggap 0. */
  function morph(src, w, h, radius, erode) {
    const need = radius * 2 + 1;
    const mid = new Uint8Array(w * h);
    const out = new Uint8Array(w * h);
    const prefix = new Int32Array(Math.max(w, h) + 1);

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) prefix[x + 1] = prefix[x] + src[y * w + x];
      for (let x = 0; x < w; x += 1) {
        const sum = prefix[Math.min(w, x + radius + 1)] - prefix[Math.max(0, x - radius)];
        mid[y * w + x] = erode ? (sum === need ? 1 : 0) : sum > 0 ? 1 : 0;
      }
    }
    for (let x = 0; x < w; x += 1) {
      for (let y = 0; y < h; y += 1) prefix[y + 1] = prefix[y] + mid[y * w + x];
      for (let y = 0; y < h; y += 1) {
        const sum = prefix[Math.min(h, y + radius + 1)] - prefix[Math.max(0, y - radius)];
        out[y * w + x] = erode ? (sum === need ? 1 : 0) : sum > 0 ? 1 : 0;
      }
    }
    return out;
  }

  /* Membuat bagian hitam di dalam tiap area foto menjadi TRANSPARAN, sehingga gambar JPG
     bisa diperlakukan sama seperti PNG berlubang (foto di belakang, bingkai di depan).
     Langkah per area: ambil gumpalan gelap yang bersambung dengan titik tengah -> buka
     (erode lalu dilate) untuk membuang tonjolan tipis, mis. garis tepi karakter yang menyentuh
     jendela -> tebalkan 2px untuk menghapus pinggiran gelap sisa kompresi JPG. */
  function punchDarkWindows(img, slots) {
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const image = ctx.getImageData(0, 0, W, H);
    const px = image.data;

    slots.forEach((slot) => {
      const x0 = clamp(Math.floor(slot.x * W), 0, W - 1);
      const y0 = clamp(Math.floor(slot.y * H), 0, H - 1);
      const bw = clamp(Math.ceil((slot.x + slot.w) * W), x0 + 1, W) - x0;
      const bh = clamp(Math.ceil((slot.y + slot.h) * H), y0 + 1, H) - y0;
      const at = (x, y) => ((y0 + y) * W + x0 + x) * 4;

      const dark = new Uint8Array(bw * bh);
      for (let y = 0; y < bh; y += 1) {
        for (let x = 0; x < bw; x += 1) dark[y * bw + x] = luma(px, at(x, y)) < DARK_PUNCH_LUM ? 1 : 0;
      }

      // Titik awal = piksel gelap terdekat dari tengah area
      let seed = -1;
      let bestDist = Infinity;
      for (let y = 0; y < bh; y += 1) {
        for (let x = 0; x < bw; x += 1) {
          if (!dark[y * bw + x]) continue;
          const dist = (x - bw / 2) ** 2 + (y - bh / 2) ** 2;
          if (dist < bestDist) {
            bestDist = dist;
            seed = y * bw + x;
          }
        }
      }
      if (seed < 0) return;

      const { labels } = labelRegions(dark, bw, bh);
      const region = new Uint8Array(bw * bh);
      for (let i = 0; i < region.length; i += 1) region[i] = labels[i] === labels[seed] ? 1 : 0;

      const radius = Math.max(2, Math.round(Math.min(bw, bh) * 0.02));
      const opened = morph(morph(region, bw, bh, radius, true), bw, bh, radius, false);
      const grown = morph(opened, bw, bh, 2, false);

      for (let y = 0; y < bh; y += 1) {
        for (let x = 0; x < bw; x += 1) {
          const i = y * bw + x;
          if (opened[i] || (grown[i] && luma(px, at(x, y)) < DARK_FRINGE_LUM)) px[at(x, y) + 3] = 0;
        }
      }
    });

    ctx.putImageData(image, 0, 0);
    return canvas;
  }

  /* ---------- Persiapan bingkai ---------- */

  /* Menyiapkan satu template bergambar untuk dipakai:
     1) memuat gambar, 2) menentukan posisi area foto (dari `slots` di registri, atau deteksi otomatis),
     3) bila area fotonya hitam, melubanginya.
     Hasil: { image, src, width, height, slots, mode }
       image = elemen yang digambar ke canvas, src = alamat untuk <img> di layar. */
  async function prepareFrame(template) {
    if (frameCache.has(template.id)) return frameCache.get(template.id);

    const img = await loadImage(frameSrc(template));
    let slots = Array.isArray(template.slots) ? template.slots.map(([x, y, w, h]) => ({ x, y, w, h })) : null;
    let mode = template.tipe_area || "transparan";
    if (!slots) {
      const detected = detectWindows(img);
      slots = detected.slots;
      mode = detected.mode;
    }

    let image = img;
    let src = frameSrc(template);
    if (mode === "hitam" && slots.length) {
      image = punchDarkWindows(img, slots);
      src = image.toDataURL("image/png");
    }

    const frame = { image, src, width: img.naturalWidth, height: img.naturalHeight, slots, mode };
    if (!template.isUpload) frameCache.set(template.id, frame);
    return frame;
  }

  /* Memilih template bergambar: siapkan bingkainya, simpan ke state, lalu lompat ke Langkah 4.
     Dipakai oleh kartu di Langkah 3, upload bingkai, dan tombol "Pakai template" di galeri beranda. */
  async function chooseImageTemplate(template) {
    const frame = await prepareFrame(template);
    if (frame.slots.length === 0) throw new Error("NO_WINDOW");
    if (frame.slots.length > MAX_FRAME_WINDOWS) throw new Error("TOO_MANY_WINDOWS");

    state.grid = makeFrameGrid(template.ukuran, frame.slots.length);
    state.template = template;
    state.frame = frame;
    goToStep(4);
  }

  /* Pesan ramah untuk kegagalan memuat / menyiapkan bingkai */
  function reportFrameError(error) {
    const messages = {
      NO_WINDOW: "Area foto di bingkai ini tidak ditemukan. Pastikan bagian foto bolong/transparan atau berwarna hitam.",
      TOO_MANY_WINDOWS: `Area foto terlalu banyak (maks. ${MAX_FRAME_WINDOWS}).`,
    };
    const message =
      error && error.name === "SecurityError"
        ? "Browser memblokir pembacaan gambar. Buka situs lewat Live Server / localhost, bukan file://."
        : messages[error && error.message] || "Bingkai gagal dimuat. Coba lagi.";
    if (window.TC && TC.toast) TC.toast(message);
    else window.alert(message);
    return message;
  }

  /* =========================================================
     6c. LAYERING FOTO + BINGKAI DI LAYAR (DOM)
     ========================================================= */

  /* Membangun bingkai bergambar. Urutan tumpukan (z-index rendah -> tinggi):
       1. .tc-photo-layer    -> foto user, tiap foto diposisikan tepat di belakang area bolong
       2. .tc-template-layer -> gambar bingkai (PNG berlubang) DI ATAS foto
       3. .tc-sticker-layer  -> stiker, paling atas
     Karena bingkai di atas foto, foto tampak "masuk" ke dalam bingkai. */
  function buildImageFrame({ frameInfo, photos = [], filterCss = "none" }) {
    const wrap = el("div", "tc-frame-wrap tc-frame-wrap--image");
    wrap.style.setProperty("--ar", (frameInfo.width / frameInfo.height).toFixed(4));

    // Foto dibuat sedikit lebih besar dari lubangnya (bleed) supaya tidak ada celah di tepi
    const bleedX = FRAME_BLEED;
    const bleedY = (FRAME_BLEED * frameInfo.width) / frameInfo.height;

    const photoLayer = el("div", "tc-photo-layer");
    frameInfo.slots.forEach((slot, i) => {
      const box = el("div", "tc-photo-slot");
      box.style.left = `${(slot.x - bleedX) * 100}%`;
      box.style.top = `${(slot.y - bleedY) * 100}%`;
      box.style.width = `${(slot.w + bleedX * 2) * 100}%`;
      box.style.height = `${(slot.h + bleedY * 2) * 100}%`;
      if (photos[i]) {
        const img = document.createElement("img");
        img.src = photos[i];
        img.alt = `Foto ${i + 1}`;
        img.draggable = false;
        img.style.filter = filterCss;
        box.appendChild(img);
      }
      photoLayer.appendChild(box);
    });

    const overlay = document.createElement("img");
    overlay.className = "tc-template-layer";
    overlay.src = frameInfo.src;
    overlay.alt = "";
    overlay.draggable = false;

    wrap.append(photoLayer, overlay, el("div", "tc-sticker-layer"));
    return wrap;
  }

  /* =========================================================
     7. LANGKAH 3 — PILIH TEMPLATE
     ========================================================= */

  /* Pratinjau satu template bergambar untuk kartu / galeri.
     Latar gradasi situs ditaruh di belakang gambar sehingga bagian bolong terlihat jelas. */
  function buildFrameThumb(template) {
    const box = el("div", "tc-frame-thumb");
    const img = document.createElement("img");
    img.src = frameSrc(template);
    img.alt = `Template ${template.nama}`;
    img.loading = "lazy";
    img.draggable = false;
    box.appendChild(img);
    return box;
  }

  /* Berpindah antara dua sub-pilihan di mode Custom: "builtin" (template bawaan) atau "upload" */
  function setCustomTab(tab) {
    state.customTab = tab;
    const builtin = tab === "builtin";
    dom.tabCustomBuiltin.classList.toggle("is-active", builtin);
    dom.tabCustomUpload.classList.toggle("is-active", !builtin);
    dom.tabCustomBuiltin.setAttribute("aria-selected", String(builtin));
    dom.tabCustomUpload.setAttribute("aria-selected", String(!builtin));
    dom.panelBuiltin.classList.toggle("hidden", !builtin);
    dom.panelCustomUpload.classList.toggle("hidden", builtin);
  }

  /* Kartu satu template warna (cadangan untuk ukuran yang belum punya template gambar) */
  function buildColorTemplateCard(theme) {
    const card = el("div", "tc-option-card tc-template-card");
    card.tabIndex = 0;
    card.dataset.templateId = theme.id;
    card.setAttribute("role", "radio");
    card.setAttribute("aria-checked", String(state.template?.id === theme.id));
    card.setAttribute("aria-label", `Template ${theme.name}`);
    card.classList.toggle("is-selected", state.template?.id === theme.id);

    card.append(buildFrame({ grid: state.grid, theme, mini: true }), el("span", "tc-option-card__label tc-option-card__label--sm", theme.name));
    makeActivatable(card, () => selectTemplate(theme));
    return card;
  }

  /* Kartu satu template bergambar (dari registri) */
  function buildImageTemplateCard(template) {
    const card = el("div", "tc-option-card tc-template-card");
    card.tabIndex = 0;
    card.dataset.templateId = template.id;
    card.setAttribute("role", "radio");
    card.setAttribute("aria-checked", String(state.template?.id === template.id));
    card.setAttribute("aria-label", `Template ${template.nama}`);
    card.classList.toggle("is-selected", state.template?.id === template.id);

    card.append(buildFrameThumb(template), el("span", "tc-option-card__label tc-option-card__label--sm", template.nama));
    makeActivatable(card, () => selectImageTemplate(template, card));
    return card;
  }

  /* Menampilkan pilihan template di Langkah 3.
     - Ukuran biasa (mis. 4x1): HANYA template dengan ukuran itu yang tampil (filterTemplatesBySize).
     - Ukuran tanpa template gambar: tampil pesan + template warna sebagai cadangan.
     - Mode Custom: dua sub-pilihan, yaitu template custom bawaan atau upload bingkai sendiri. */
  function renderTemplateOptions() {
    const grid = state.grid;
    const isCustom = Boolean(grid.custom);
    dom.templateGridLabel.textContent = grid.label;
    dom.customChoice.classList.toggle("hidden", !isCustom);
    setCustomTab(isCustom ? state.customTab : "builtin");

    dom.templateOptions.innerHTML = "";
    dom.templateEmpty.classList.add("hidden");

    const matches = filterTemplatesBySize(grid.id);
    if (matches.length) {
      matches.forEach((template) => dom.templateOptions.appendChild(buildImageTemplateCard(template)));
      return;
    }

    dom.templateEmpty.textContent = isCustom
      ? "Belum ada template custom bawaan. Upload bingkai milikmu di tab “Upload Bingkai Sendiri”."
      : `Belum ada template gambar untuk ukuran ${grid.label}. Pilih salah satu template warna di bawah.`;
    dom.templateEmpty.classList.remove("hidden");
    if (!isCustom) TEMPLATES.forEach((theme) => dom.templateOptions.appendChild(buildColorTemplateCard(theme)));
  }

  /* Menyimpan template WARNA terpilih ke state lalu lanjut ke Langkah 4 */
  function selectTemplate(theme) {
    state.template = theme;
    state.frame = null; // template warna tidak punya gambar bingkai
    $$(".tc-template-card").forEach((card) => {
      const active = card.dataset.templateId === theme.id;
      card.classList.toggle("is-selected", active);
      card.setAttribute("aria-checked", String(active));
    });
    setTimeout(() => goToStep(4), 250);
  }

  /* Menyimpan template BERGAMBAR terpilih. Kartu diberi status "memuat" selama bingkai disiapkan. */
  async function selectImageTemplate(template, card) {
    if (card) card.classList.add("is-loading");
    try {
      $$(".tc-template-card").forEach((c) => c.classList.toggle("is-selected", c === card));
      await chooseImageTemplate(template);
    } catch (error) {
      $$(".tc-template-card").forEach((c) => c.classList.remove("is-selected"));
      reportFrameError(error);
    } finally {
      if (card) card.classList.remove("is-loading");
    }
  }

  /* =========================================================
     7b. UPLOAD BINGKAI SENDIRI (opsi Custom)
     ========================================================= */

  /* Mengosongkan hasil upload sebelumnya dan melepas blob URL-nya */
  function clearUploadedFrame() {
    if (state.uploadUrl) URL.revokeObjectURL(state.uploadUrl);
    state.uploadUrl = null;
    state.pendingUpload = null;
    dom.frameUploadPreview.classList.add("hidden");
  }

  /* Menulis pesan di bawah tombol upload (isError = true untuk warna peringatan) */
  function setUploadMessage(message, isError = false) {
    dom.frameUploadMessage.textContent = message;
    dom.frameUploadMessage.classList.toggle("is-error", isError);
  }

  /* Menangani file bingkai yang diunggah user (<input type="file">):
     validasi tipe & ukuran -> muat -> deteksi area foto -> tampilkan pratinjau.
     Bingkai baru dipakai setelah user menekan "Pakai bingkai ini". */
  async function handleFrameUpload(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = ""; // agar file yang sama bisa dipilih lagi
    if (!file) return;

    if (!FRAME_UPLOAD_TYPES.includes(file.type)) {
      setUploadMessage("Format tidak didukung. Gunakan PNG, JPG, atau WebP.", true);
      return;
    }
    if (file.size > MAX_FRAME_UPLOAD_BYTES) {
      setUploadMessage("File terlalu besar (maks. 10 MB).", true);
      return;
    }

    setUploadMessage("Membaca bingkai…");
    const url = URL.createObjectURL(file);
    try {
      const template = {
        id: `upload-${Date.now()}`,
        nama: file.name.replace(/\.[^.]+$/, "") || "Bingkai Saya",
        ukuran: "custom",
        kategori: "upload",
        url_gambar: url,
        isUpload: true,
      };
      const frame = await prepareFrame(template);
      if (frame.slots.length === 0) throw new Error("NO_WINDOW");
      if (frame.slots.length > MAX_FRAME_WINDOWS) throw new Error("TOO_MANY_WINDOWS");

      clearUploadedFrame();
      state.uploadUrl = url;
      state.pendingUpload = { template, frame };

      dom.frameUploadImg.src = frame.src;
      dom.frameUploadInfo.textContent =
        `Terdeteksi ${frame.slots.length} area foto` +
        (frame.mode === "hitam" ? " (kotak hitam dibaca sebagai tempat foto)." : ".");
      dom.frameUploadPreview.classList.remove("hidden");
      setUploadMessage(`“${template.nama}” siap dipakai.`);
    } catch (error) {
      URL.revokeObjectURL(url);
      setUploadMessage(reportFrameErrorText(error), true);
    }
  }

  /* Teks kesalahan upload (tanpa toast, karena pesan tampil langsung di bawah tombol) */
  function reportFrameErrorText(error) {
    if (error && error.name === "SecurityError") {
      return "Browser memblokir pembacaan gambar. Buka situs lewat Live Server / localhost.";
    }
    if (error && error.message === "NO_WINDOW") {
      return "Area foto tidak ditemukan. Gunakan PNG dengan bagian foto transparan (bolong), atau kotak hitam pekat.";
    }
    if (error && error.message === "TOO_MANY_WINDOWS") return `Area foto terlalu banyak (maks. ${MAX_FRAME_WINDOWS}).`;
    return "File tidak bisa dibaca sebagai gambar.";
  }

  /* Memakai bingkai unggahan yang sudah dipratinjau, lalu lanjut ke Langkah 4 */
  function useUploadedFrame() {
    const pending = state.pendingUpload;
    if (!pending) return;
    state.grid = makeFrameGrid("custom", pending.frame.slots.length);
    state.template = pending.template;
    state.frame = pending.frame;
    goToStep(4);
  }

  /* =========================================================
     8. LANGKAH 4 — SESI PENGAMBILAN FOTO
     ========================================================= */

  /* Dipanggil saat masuk Langkah 4: reset foto lama dan nyalakan kamera */
  function enterCaptureStep() {
    state.photos = [];
    state.demo = false;
    state.isCapturing = false;
    dom.captureTotalLabel.textContent = photoCount();
    dom.captureBadge.classList.add("hidden");
    dom.countdown.classList.add("hidden");
    renderThumbs();
    startCamera();
  }

  /* Dipanggil saat meninggalkan Langkah 4: batalkan sesi yang berjalan dan matikan kamera */
  function leaveCaptureStep() {
    state.captureRun += 1; // membatalkan loop capture yang sedang jalan
    state.isCapturing = false;
    stopCamera();
  }

  /* Menulis pesan status di bawah kamera (isError = true untuk warna peringatan) */
  function setCameraStatus(message, isError = false) {
    dom.cameraStatus.textContent = message;
    dom.cameraStatus.classList.toggle("is-error", isError);
  }

  /* Mengatur tombol di Langkah 4 sesuai kondisi kamera / sesi */
  function updateCaptureControls() {
    const ready = Boolean(state.stream) || state.demo;
    dom.btnStartCapture.disabled = !ready || state.isCapturing;
    dom.btnDemoMode.disabled = state.isCapturing;
    dom.btnRetryCamera.classList.toggle("hidden", Boolean(state.stream) || state.demo || state.isCapturing);
  }

  /* Menyalakan kamera lewat getUserMedia (feed mentah, tanpa filter).
     Jika gagal (izin ditolak / tidak ada kamera / bukan HTTPS), tampilkan pesan dan tawarkan foto contoh. */
  async function startCamera() {
    stopCamera();
    dom.cameraPlaceholder.classList.remove("hidden");
    dom.cameraPlaceholderText.textContent = "Menyiapkan kamera…";
    setCameraStatus("Izinkan akses kamera di browser kamu.");
    updateCaptureControls();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCameraError("Browser ini belum mendukung kamera. Gunakan HTTPS / localhost, atau coba foto contoh.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });

      // User sudah pindah langkah saat menunggu izin → langsung lepas kamera
      if (state.step !== 4) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      state.stream = stream;
      dom.cameraVideo.srcObject = stream;
      await dom.cameraVideo.play();
      dom.cameraPlaceholder.classList.add("hidden");
      setCameraStatus("Kamera siap. Tekan “Mulai Jepret” kalau sudah siap pose!");
    } catch (error) {
      const messages = {
        NotAllowedError: "Izin kamera ditolak. Aktifkan izin kamera di browser, lalu coba lagi.",
        NotFoundError: "Kamera tidak ditemukan di perangkat ini.",
        NotReadableError: "Kamera sedang dipakai aplikasi lain.",
      };
      showCameraError(messages[error.name] || "Kamera tidak bisa diaktifkan. Coba foto contoh dulu.");
    }
    updateCaptureControls();
  }

  /* Menampilkan kondisi gagal kamera di placeholder dan status */
  function showCameraError(message) {
    dom.cameraPlaceholder.classList.remove("hidden");
    dom.cameraPlaceholderText.textContent = "Kamera belum aktif";
    setCameraStatus(message, true);
    updateCaptureControls();
  }

  /* Mematikan semua track kamera dan melepas video */
  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }
    dom.cameraVideo.srcObject = null;
  }

  /* Mengaktifkan mode foto contoh (tanpa kamera) agar alur tetap bisa dicoba */
  function enableDemoMode() {
    state.demo = true;
    dom.cameraPlaceholder.classList.remove("hidden");
    dom.cameraPlaceholderText.textContent = "Mode foto contoh aktif";
    setCameraStatus("Mode foto contoh: gambar dibuat otomatis, bukan dari kamera.");
    updateCaptureControls();
  }

  /* Menggambar ulang kotak thumbnail: terisi untuk foto yang sudah diambil, kosong untuk sisanya */
  function renderThumbs() {
    dom.captureThumbs.innerHTML = "";
    for (let i = 0; i < photoCount(); i += 1) {
      const thumb = el("div", "tc-thumb");
      if (state.photos[i]) {
        thumb.classList.add("is-filled");
        const img = document.createElement("img");
        img.src = state.photos[i].src;
        img.alt = `Foto ${i + 1}`;
        thumb.appendChild(img);
      }
      dom.captureThumbs.appendChild(thumb);
    }
  }

  /* Hitung mundur 3-2-1 di atas kamera.
     Mengembalikan false bila sesi dibatalkan di tengah jalan (user pindah langkah). */
  async function runCountdown(runId) {
    dom.countdown.classList.remove("hidden");
    for (let n = COUNTDOWN_SECONDS; n >= 1; n -= 1) {
      dom.countdown.textContent = n;
      // Memicu ulang animasi "pop" pada tiap angka
      dom.countdown.classList.remove("is-pop");
      void dom.countdown.offsetWidth;
      dom.countdown.classList.add("is-pop");
      await sleep(1000);
      if (runId !== state.captureRun) return false;
    }
    dom.countdown.classList.add("hidden");
    return true;
  }

  /* Efek flash putih singkat saat foto diambil */
  function fireFlash() {
    dom.cameraFlash.classList.remove("is-firing");
    void dom.cameraFlash.offsetWidth;
    dom.cameraFlash.classList.add("is-firing");
  }

  /* Menghitung area potong "cover": mengisi kotak tujuan tanpa merusak rasio gambar */
  function coverCrop(srcW, srcH, boxW, boxH) {
    const srcRatio = srcW / srcH;
    const boxRatio = boxW / boxH;
    if (srcRatio > boxRatio) {
      const sw = srcH * boxRatio;
      return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH };
    }
    const sh = srcW / boxRatio;
    return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh };
  }

  /* Mengambil satu frame dari <video> ke canvas 4:3 (dicerminkan agar sama dengan pratinjau) */
  function grabVideoFrame() {
    const video = dom.cameraVideo;
    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_W;
    canvas.height = PHOTO_H;
    const ctx = canvas.getContext("2d");
    const crop = coverCrop(video.videoWidth, video.videoHeight, PHOTO_W, PHOTO_H);
    ctx.translate(PHOTO_W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, PHOTO_W, PHOTO_H);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

/* Foto contoh: memakai gambar bawaan di assets/images.
   Jika foto yang diminta lebih banyak dari gambar yang ada, gambar dipakai bergantian. */
  const DEMO_IMAGES = ["selfiecontoh1.jpg", "selfiecontoh2.jpg", "selfiecontoh3.jpg", "selfiecontoh4.jpg"];

  async function makeDemoPhoto(index) {
    const img = await loadImage(TC.asset(`images/${DEMO_IMAGES[index % DEMO_IMAGES.length]}`));
    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_W;
    canvas.height = PHOTO_H;
    const ctx = canvas.getContext("2d");
    const crop = coverCrop(img.naturalWidth, img.naturalHeight, PHOTO_W, PHOTO_H);
    canvas.getContext("2d").drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, PHOTO_W, PHOTO_H);

  return canvas.toDataURL("image/jpeg", 0.9);
}

  /* Menyimpan hasil jepretan ke state (dataURL + elemen Image siap pakai untuk canvas) */
  async function addPhoto(src) {
    const img = await loadImage(src);
    state.photos.push({ src, img });
    renderThumbs();
  }

  /* Menjalankan seluruh sesi foto: untuk setiap foto → hitung mundur → flash → ambil.
     Setelah semua foto terkumpul, otomatis lanjut ke Langkah 5. */
  async function runCaptureSession() {
    if (state.isCapturing) return;
    if (!state.demo && !state.stream) {
      setCameraStatus("Kamera belum aktif. Coba aktifkan lagi atau pakai foto contoh.", true);
      return;
    }

    state.isCapturing = true;
    state.photos = [];
    renderThumbs();
    updateCaptureControls();
    const runId = ++state.captureRun;
    const total = photoCount();

    dom.captureBadge.classList.remove("hidden");

    for (let i = 0; i < total; i += 1) {
      dom.captureBadge.textContent = `Foto ${i + 1} / ${total}`;
      setCameraStatus(`Bersiap untuk foto ke-${i + 1}…`);

      const completed = await runCountdown(runId);
      if (!completed) return; // dibatalkan

      fireFlash();
      const src = state.demo ? await makeDemoPhoto(i) : grabVideoFrame();
      await addPhoto(src);
      if (runId !== state.captureRun) return;

      if (i < total - 1) await sleep(PAUSE_BETWEEN_SHOTS_MS);
      if (runId !== state.captureRun) return;
    }

    state.isCapturing = false;
    setCameraStatus("Semua foto sudah diambil! Membuka ruang edit…");
    await sleep(700);
    if (runId === state.captureRun) goToStep(5);
  }

  /* =========================================================
     9. LANGKAH 5 — RUANG EDIT
     ========================================================= */

  /* Membangun panel pilihan filter (sekali saat halaman dimuat) */
  function renderFilterOptions() {
    dom.filterOptions.innerHTML = "";
    FILTERS.forEach((filter) => {
      const chip = el("button", "tc-chip", filter.name);
      chip.type = "button";
      chip.dataset.filterId = filter.id;
      chip.addEventListener("click", () => setFilter(filter));
      dom.filterOptions.appendChild(chip);
    });
  }

  /* Menandai chip filter yang aktif */
  function updateFilterChips() {
    $$(".tc-chip").forEach((chip) => {
      const active = chip.dataset.filterId === state.filter.id;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
  }

  /* Menerapkan filter ke semua foto di bingkai (lewat CSS filter, tanpa membangun ulang bingkai) */
  function setFilter(filter) {
    state.filter = filter;
    applyFilterToFrame();
    updateFilterChips();
  }

  /* Menulis nilai CSS filter ke setiap <img> di bingkai edit */
  function applyFilterToFrame() {
    if (!state.editWrap) return;
    const css = filterToCss(state.filter);
    state.editWrap.querySelectorAll(".tc-slot img, .tc-photo-slot img").forEach((img) => {
      img.style.filter = css;
    });
  }

  /* Membangun tombol stiker emoji (sekali saat halaman dimuat) */
  function renderStickerOptions() {
    dom.stickerOptions.innerHTML = "";
    EMOJI_STICKERS.forEach((emoji) => {
      const btn = el("button", "tc-sticker-btn", emoji);
      btn.type = "button";
      btn.setAttribute("aria-label", `Tambah stiker ${emoji}`);
      btn.addEventListener("click", () => addEmojiSticker(emoji));
      dom.stickerOptions.appendChild(btn);
    });
  }

  /* Membangun bingkai edit berisi foto-foto hasil jepretan + template terpilih */
  function renderEditor() {
    dom.editStage.innerHTML = "";
    state.editWrap = buildFrame({
      grid: state.grid,
      theme: state.template,
      frameInfo: state.frame,
      photos: state.photos.map((photo) => photo.src),
      filterCss: filterToCss(state.filter),
    });
    dom.editStage.appendChild(state.editWrap);
    renderStickers();
    updateFilterChips();
    updateStickerTools();
  }

  /* Posisi awal acak di sekitar tengah supaya stiker baru tidak menumpuk persis */
  function randomStickerPosition() {
    return { x: 0.3 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.4 };
  }

  /* Menambah stiker emoji ke bingkai dan langsung memilihnya */
  function addEmojiSticker(emoji) {
    const sticker = {
      id: state.nextStickerId++,
      type: "emoji",
      content: emoji,
      size: 0.14, // pecahan dari lebar bingkai
      rot: 0,
      ...randomStickerPosition(),
    };
    state.stickers.push(sticker);
    state.selectedStickerId = sticker.id;
    renderStickers();
    updateStickerTools();
  }

  /* Menangani upload stiker dari perangkat: validasi tipe & ukuran, lalu tempel ke foto */
  async function handleStickerUpload(event) {
    const files = Array.from(event.target.files || []);
    dom.uploadMessage.classList.remove("is-error");
    let rejected = 0;

    for (const file of files) {
      if (!file.type.startsWith("image/") || file.size > MAX_UPLOAD_BYTES) {
        rejected += 1;
        continue;
      }
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        state.objectUrls.push(url);
        const sticker = {
          id: state.nextStickerId++,
          type: "image",
          src: url,
          img,
          size: 0.24,
          rot: 0,
          ...randomStickerPosition(),
        };
        state.stickers.push(sticker);
        state.selectedStickerId = sticker.id;
      } catch {
        URL.revokeObjectURL(url);
        rejected += 1;
      }
    }

    event.target.value = ""; // agar file yang sama bisa dipilih lagi
    if (rejected > 0) {
      dom.uploadMessage.textContent = `${rejected} file dilewati (harus gambar, maks. 5 MB).`;
      dom.uploadMessage.classList.add("is-error");
    } else if (files.length > 0) {
      dom.uploadMessage.textContent = "Stiker ditambahkan. Geser untuk memindahkan.";
    }
    renderStickers();
    updateStickerTools();
  }

  /* Menggambar ulang semua stiker di lapisan .tc-sticker-layer pada bingkai edit.
     Posisi disimpan sebagai pecahan (0–1) dari lebar/tinggi bingkai, ukuran sebagai
     pecahan lebar bingkai, sehingga hasil di layar dan di canvas sama proporsinya. */
  function renderStickers() {
    if (!state.editWrap) return;
    const layer = state.editWrap.querySelector(".tc-sticker-layer");
    layer.innerHTML = "";

    state.stickers.forEach((sticker) => {
      const node = el("div", "tc-sticker");
      node.dataset.stickerId = sticker.id;
      node.style.left = `${sticker.x * 100}%`;
      node.style.top = `${sticker.y * 100}%`;
      node.style.transform = `translate(-50%, -50%) rotate(${sticker.rot}deg)`;
      node.classList.toggle("is-selected", sticker.id === state.selectedStickerId);

      if (sticker.type === "emoji") {
        node.textContent = sticker.content;
        node.style.fontSize = `${sticker.size * 100}cqw`;
      } else {
        const img = document.createElement("img");
        img.src = sticker.src;
        img.alt = "Stiker";
        img.draggable = false;
        img.style.width = `${sticker.size * 100}cqw`;
        node.appendChild(img);
      }

      node.addEventListener("pointerdown", (event) => startStickerDrag(event, sticker, node));
      layer.appendChild(node);
    });
  }

  /* Menggeser stiker dengan pointer (mouse / sentuh).
     Posisi dihitung relatif terhadap bingkai lalu dibatasi agar tidak keluar area. */
  function startStickerDrag(event, sticker, node) {
    event.preventDefault();
    selectSticker(sticker.id);

    const rect = state.editWrap.getBoundingClientRect();
    node.setPointerCapture(event.pointerId);

    const onMove = (moveEvent) => {
      sticker.x = clamp((moveEvent.clientX - rect.left) / rect.width, 0, 1);
      sticker.y = clamp((moveEvent.clientY - rect.top) / rect.height, 0, 1);
      node.style.left = `${sticker.x * 100}%`;
      node.style.top = `${sticker.y * 100}%`;
    };
    const onEnd = () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerup", onEnd);
      node.removeEventListener("pointercancel", onEnd);
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onEnd);
    node.addEventListener("pointercancel", onEnd);
  }

  /* Memilih stiker (atau null untuk batal pilih) tanpa membangun ulang seluruh lapisan */
  function selectSticker(id) {
    state.selectedStickerId = id;
    $$(".tc-sticker").forEach((node) => {
      node.classList.toggle("is-selected", Number(node.dataset.stickerId) === id);
    });
    updateStickerTools();
  }

  /* Mengaktifkan / menonaktifkan tombol kontrol stiker sesuai ada-tidaknya stiker terpilih */
  function updateStickerTools() {
    const hasSelection = state.stickers.some((s) => s.id === state.selectedStickerId);
    [dom.btnStickerSmaller, dom.btnStickerBigger, dom.btnStickerRotate, dom.btnStickerDelete].forEach((btn) => {
      btn.disabled = !hasSelection;
    });
  }

  /* Mengubah ukuran / rotasi stiker terpilih, atau menghapusnya */
  function modifySelectedSticker(action) {
    const sticker = state.stickers.find((s) => s.id === state.selectedStickerId);
    if (!sticker) return;

    if (action === "bigger") sticker.size = clamp(sticker.size * 1.15, 0.05, 0.7);
    if (action === "smaller") sticker.size = clamp(sticker.size / 1.15, 0.05, 0.7);
    if (action === "rotate") sticker.rot = (sticker.rot + 15) % 360;
    if (action === "delete") {
      state.stickers = state.stickers.filter((s) => s.id !== sticker.id);
      state.selectedStickerId = null;
    }
    renderStickers();
    updateStickerTools();
  }

  /* =========================================================
     10. RENDER CANVAS (untuk unduhan JPG & video Live Photo)
     ========================================================= */

  /* Apakah browser mendukung ctx.filter? (Safari belum) → jika tidak, pakai fallback per-piksel */
  const SUPPORTS_CTX_FILTER = (() => {
    try {
      return typeof document.createElement("canvas").getContext("2d").filter === "string";
    } catch {
      return false;
    }
  })();

  /* Path persegi bersudut membulat (tanpa bergantung pada ctx.roundRect) */
  function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  /* Fallback filter: menerapkan daftar operasi ke satu piksel (r, g, b).
     Rumusnya mengikuti definisi CSS filter. */
  function applyOpsToPixel(r, g, b, ops) {
    for (const [name, v] of ops) {
      if (name === "brightness") {
        r *= v; g *= v; b *= v;
      } else if (name === "contrast") {
        r = (r - 128) * v + 128; g = (g - 128) * v + 128; b = (b - 128) * v + 128;
      } else if (name === "saturate") {
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lum + (r - lum) * v; g = lum + (g - lum) * v; b = lum + (b - lum) * v;
      } else if (name === "grayscale") {
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r += (lum - r) * v; g += (lum - g) * v; b += (lum - b) * v;
      } else if (name === "sepia") {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r += (sr - r) * v; g += (sg - g) * v; b += (sb - b) * v;
      }
      r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
    }
    return [r, g, b];
  }

  /* Menggambar foto ke canvas dengan potongan "cover", sudut membulat, dan filter terpilih.
     - Browser modern: ctx.filter (sama persis dengan CSS filter di layar).
     - Fallback (mis. Safari): olah piksel di canvas sementara. */
  function drawPhotoFiltered(ctx, img, dx, dy, dw, dh, radius, filter) {
    const crop = coverCrop(img.naturalWidth, img.naturalHeight, dw, dh);
    ctx.save();
    roundRectPath(ctx, dx, dy, dw, dh, radius);
    ctx.clip();

    if (!filter.ops.length) {
      ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, dx, dy, dw, dh);
    } else if (SUPPORTS_CTX_FILTER) {
      ctx.filter = filterToCss(filter);
      ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, dx, dy, dw, dh);
    } else {
      const tmp = document.createElement("canvas");
      tmp.width = Math.round(dw);
      tmp.height = Math.round(dh);
      const tctx = tmp.getContext("2d");
      tctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, tmp.width, tmp.height);
      const data = tctx.getImageData(0, 0, tmp.width, tmp.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const [r, g, b] = applyOpsToPixel(px[i], px[i + 1], px[i + 2], filter.ops);
        px[i] = r; px[i + 1] = g; px[i + 2] = b;
      }
      tctx.putImageData(data, 0, 0);
      ctx.drawImage(tmp, dx, dy, dw, dh);
    }
    ctx.restore();
  }

  /* Mengisi latar canvas dengan warna / gradasi template */
  function paintBackground(ctx, theme, w, h) {
    if (theme.colors.length === 1) {
      ctx.fillStyle = theme.colors[0];
    } else {
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      theme.colors.forEach((color, i) => gradient.addColorStop(i / (theme.colors.length - 1), color));
      ctx.fillStyle = gradient;
    }
    ctx.fillRect(0, 0, w, h);
  }

  /* Menggambar semua stiker ke canvas (F = lebar bingkai, H = tinggi bingkai) */
  function drawStickers(ctx, F, H) {
    state.stickers.forEach((sticker) => {
      const size = sticker.size * F;
      ctx.save();
      ctx.translate(sticker.x * F, sticker.y * H);
      ctx.rotate((sticker.rot * Math.PI) / 180);
      if (sticker.type === "emoji") {
        ctx.font = `${size}px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sticker.content, 0, 0);
      } else {
        const w = size;
        const h = size * (sticker.img.naturalHeight / sticker.img.naturalWidth);
        ctx.drawImage(sticker.img, -w / 2, -h / 2, w, h);
      }
      ctx.restore();
    });
  }

  /* Menyusun hasil akhir untuk template BERGAMBAR ke satu canvas. Urutan menggambar:
       1. latar putih (supaya bagian transparan di luar lubang tidak menjadi hitam di JPG),
       2. FOTO user, tiap foto di posisi lubangnya, dipotong "cover" + filter,
       3. GAMBAR BINGKAI ditumpuk di atas foto -> foto terlihat masuk ke dalam bingkai,
       4. stiker.
     Ukuran canvas mengikuti gambar bingkai (minimal OUTPUT_MIN_WIDTH agar tidak terlalu kecil). */
  async function renderFrameCanvas() {
    const { frame } = state;
    const scale = Math.max(1, OUTPUT_MIN_WIDTH / frame.width);
    const W = Math.round(frame.width * scale);
    const H = Math.round(frame.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // 1) Latar putih
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // 2) Foto lebih dulu (sedikit melebihi lubang agar tidak ada celah di tepi)
    const bleed = Math.round(W * FRAME_BLEED);
    frame.slots.forEach((slot, i) => {
      const photo = state.photos[i];
      if (!photo) return;
      drawPhotoFiltered(
        ctx,
        photo.img,
        slot.x * W - bleed,
        slot.y * H - bleed,
        slot.w * W + bleed * 2,
        slot.h * H + bleed * 2,
        0,
        state.filter
      );
    });

    // 3) Bingkai di atas foto
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(frame.image, 0, 0, W, H);

    // 4) Stiker
    drawStickers(ctx, W, H);
    return canvas;
  }
  /* Menyusun hasil akhir (kolase + template + filter + stiker) ke satu canvas.
     Proporsi (padding, gap, caption) sama dengan CSS bingkai: semuanya pecahan dari lebar F. */
  async function renderFinalCanvas() {
    if (state.frame) return renderFrameCanvas(); // template bergambar: foto dulu, bingkai di atasnya
    const { grid, template: theme } = state;
    try {
      await document.fonts.load("700 24px Outfit");
    } catch {
      /* font gagal dimuat → pakai font cadangan */
    }

    const F = OUTPUT_WIDTH[grid.cols];
    const pad = F * 0.04;
    const gap = F * 0.025;
    const radius = F * 0.02;
    const capH = F * 0.14;
    const slotW = (F - pad * 2 - gap * (grid.cols - 1)) / grid.cols;
    const slotH = (slotW * 3) / 4;
    const H = Math.round(pad + grid.rows * slotH + (grid.rows - 1) * gap + capH);

    const canvas = document.createElement("canvas");
    canvas.width = F;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    paintBackground(ctx, theme, F, H);

    state.photos.forEach((photo, i) => {
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);
      const x = pad + col * (slotW + gap);
      const y = pad + row * (slotH + gap);
      drawPhotoFiltered(ctx, photo.img, x, y, slotW, slotH, radius, state.filter);
    });

    ctx.fillStyle = theme.text;
    ctx.font = `700 ${F * 0.046}px Outfit, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Twinkle Cam ✦", F / 2, H - capH / 2);

    drawStickers(ctx, F, H);
    return canvas;
  }

  /* =========================================================
     11. LANGKAH 6 — HASIL AKHIR
     ========================================================= */

  /* Dipanggil saat masuk Langkah 6: susun JPG, siapkan Live Photo */
  async function renderResult() {
    state.finalCanvas = null;
    dom.resultImage.classList.add("hidden");
    dom.resultLoading.classList.remove("hidden");
    setResultNotice("");
    prepareLiveStage();
    setResultMode("jpg");

    const canvas = await renderFinalCanvas();
    if (state.step !== 6) return; // user sudah pindah
    state.finalCanvas = canvas;
    dom.resultImage.src = canvas.toDataURL("image/jpeg", 0.92);
    dom.resultImage.classList.remove("hidden");
    dom.resultLoading.classList.add("hidden");
  }

  /* Menulis pesan di bawah hasil (isError = true untuk warna peringatan) */
  function setResultNotice(message, isError = false) {
    dom.resultNotice.textContent = message;
    dom.resultNotice.classList.toggle("is-error", isError);
  }

  /* Berganti antara tab "Hasil JPG" dan "Live Photo" */
  function setResultMode(mode) {
    state.resultMode = mode;
    const isJpg = mode === "jpg";

    dom.tabJpg.classList.toggle("is-active", isJpg);
    dom.tabLive.classList.toggle("is-active", !isJpg);
    dom.tabJpg.setAttribute("aria-selected", String(isJpg));
    dom.tabLive.setAttribute("aria-selected", String(!isJpg));
    dom.resultJpgPanel.classList.toggle("hidden", !isJpg);
    dom.resultLivePanel.classList.toggle("hidden", isJpg);
    dom.btnDownload.textContent = isJpg ? "Unduh Hasil (JPG)" : "Unduh Live Photo (video)";

    if (isJpg) stopLivePlayback();
    else startLivePlayback();
  }

  /* Menyiapkan tampilan Live Photo: latar template, filter, dan indikator titik */
  function prepareLiveStage() {
    dom.liveStage.style.background = templateBackground(liveTheme());
    dom.liveStage.style.color = liveTheme().text;
    dom.liveImage.style.filter = filterToCss(state.filter);
    dom.liveDots.innerHTML = "";
    state.photos.forEach(() => dom.liveDots.appendChild(el("span", "tc-live__dot-item")));
    showLiveFrame(0);
  }

  /* Menampilkan foto ke-index pada Live Photo dan menyorot titik yang sesuai */
  function showLiveFrame(index) {
    state.liveIndex = index;
    if (state.photos[index]) dom.liveImage.src = state.photos[index].src;
    Array.from(dom.liveDots.children).forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  }

  /* Memutar Live Photo: foto berganti otomatis berulang seperti slideshow / GIF */
  function startLivePlayback() {
    stopLivePlayback();
    showLiveFrame(0);
    state.liveTimer = setInterval(() => {
      showLiveFrame((state.liveIndex + 1) % state.photos.length);
    }, LIVE_INTERVAL_MS);
  }

  /* Menghentikan putaran Live Photo (saat pindah tab / langkah) */
  function stopLivePlayback() {
    if (state.liveTimer) {
      clearInterval(state.liveTimer);
      state.liveTimer = null;
    }
  }

  /* Menggambar satu frame video Live Photo: latar template + foto 4:3 + caption */
  function drawLiveVideoFrame(ctx, W, H, photo) {
    const pad = 40;
    paintBackground(ctx, liveTheme(), W, H);
    drawPhotoFiltered(ctx, photo.img, pad, pad, W - pad * 2, ((W - pad * 2) * 3) / 4, 18, state.filter);
    ctx.fillStyle = liveTheme().text;
    ctx.font = "700 36px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Twinkle Cam ✦", W / 2, H - 50);
  }

  /* Merekam Live Photo menjadi video (WebM/MP4) lewat MediaRecorder lalu mengunduhnya.
     Satu putaran penuh foto, tiap foto tampil sepanjang LIVE_INTERVAL_MS. */
  async function downloadLiveVideo() {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      setResultNotice("Browser ini belum mendukung rekam video. Gunakan tab “Hasil JPG” untuk mengunduh.", true);
      return;
    }

    const W = 960;
    const H = 800;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    await document.fonts.load("700 24px Outfit").catch(() => {});

    const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"].find((type) =>
      MediaRecorder.isTypeSupported(type)
    );
    const recorder = new MediaRecorder(canvas.captureStream(30), mimeType ? { mimeType } : undefined);
    const chunks = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    const stopped = new Promise((resolve) => (recorder.onstop = resolve));

    dom.btnDownload.disabled = true;
    setResultNotice("Merekam Live Photo… tunggu sebentar.");
    recorder.start();

    for (const photo of state.photos) {
      drawLiveVideoFrame(ctx, W, H, photo);
      await sleep(LIVE_INTERVAL_MS);
    }
    drawLiveVideoFrame(ctx, W, H, state.photos[state.photos.length - 1]);
    await sleep(150);
    recorder.stop();
    await stopped;

    const extension = (recorder.mimeType || mimeType || "video/webm").includes("mp4") ? "mp4" : "webm";
    downloadBlob(new Blob(chunks, { type: recorder.mimeType || "video/webm" }), `twinklecam-live-${Date.now()}.${extension}`);
    dom.btnDownload.disabled = false;
    setResultNotice("Live Photo berhasil diunduh.");
  }

  /* Tombol "Unduh Hasil": JPG di mode statis, video di mode Live Photo */
  async function downloadResult() {
    if (state.resultMode === "live") {
      await downloadLiveVideo();
      return;
    }
    if (!state.finalCanvas) {
      setResultNotice("Hasil belum siap, tunggu sebentar.", true);
      return;
    }
    state.finalCanvas.toBlob(
      (blob) => {
        if (!blob) return setResultNotice("Gagal membuat file JPG.", true);
        downloadBlob(blob, `twinklecam-${state.grid.id}-${Date.now()}.jpg`);
        setResultNotice("Foto berhasil diunduh.");
      },
      "image/jpeg",
      0.92
    );
  }

  /* =========================================================
     11b. TAUTAN LANGSUNG KE TEMPLATE (dari halaman Templates)
     ========================================================= */

  /* Langsung melompat ke sesi foto dengan ukuran + template tertentu.
     Dipanggil dari tautan index.html?template=<id>, yaitu tombol "Pakai template"
     di Koleksi Bingkai (menu/templates.html). */
  async function useTemplateById(templateId, button) {
    const template = FRAME_REGISTRY.find((item) => item.id === templateId);
    if (!template) return;
    if (button) button.disabled = true;
    try {
      await chooseImageTemplate(template);
    } catch (error) {
      reportFrameError(error);
    } finally {
      if (button) button.disabled = false;
    }
  }

  /* Mendukung tautan ke template tertentu: index.html?template=<id> */
  function applyTemplateFromUrl() {
    const id = new URLSearchParams(window.location.search).get("template");
    if (id) useTemplateById(id, null);
  }

  /* =========================================================
     12. EVENT LISTENER & INISIALISASI
     ========================================================= */

  /* Memasang semua event listener sekali saat halaman dimuat */
  function bindEvents() {
    // Tombol navigasi generik: data-goto="N" pindah ke langkah N
    document.addEventListener("click", (event) => {
      const gotoBtn = event.target.closest("[data-goto]");
      if (gotoBtn) goToStep(Number(gotoBtn.dataset.goto));

      // data-action="home": reset semua data lalu kembali ke Langkah 1
      if (event.target.closest("[data-action='home']")) {
        resetFlow();
        goToStep(1);
      }
    });

    // Langkah 4
    dom.btnStartCapture.addEventListener("click", runCaptureSession);
    dom.btnRetryCamera.addEventListener("click", startCamera);
    dom.btnDemoMode.addEventListener("click", enableDemoMode);

    // Langkah 5
    dom.stickerUpload.addEventListener("change", handleStickerUpload);
    dom.btnStickerBigger.addEventListener("click", () => modifySelectedSticker("bigger"));
    dom.btnStickerSmaller.addEventListener("click", () => modifySelectedSticker("smaller"));
    dom.btnStickerRotate.addEventListener("click", () => modifySelectedSticker("rotate"));
    dom.btnStickerDelete.addEventListener("click", () => modifySelectedSticker("delete"));

    // Klik area kosong di panggung edit = batal pilih stiker
    dom.editStage.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".tc-sticker")) selectSticker(null);
    });

    // Tombol Delete / Backspace menghapus stiker terpilih (hanya di Langkah 5)
    document.addEventListener("keydown", (event) => {
      if (state.step !== 5 || !state.selectedStickerId) return;
      if (event.target.closest("input, textarea")) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        modifySelectedSticker("delete");
      }
    });

    // Langkah 6
    dom.tabJpg.addEventListener("click", () => setResultMode("jpg"));
    dom.tabLive.addEventListener("click", () => setResultMode("live"));
    dom.btnDownload.addEventListener("click", downloadResult);

    // Langkah 3: sub-pilihan Custom + upload bingkai
    dom.tabCustomBuiltin.addEventListener("click", () => setCustomTab("builtin"));
    dom.tabCustomUpload.addEventListener("click", () => setCustomTab("upload"));
    dom.frameUpload.addEventListener("change", handleFrameUpload);
    dom.btnUseUploadedFrame.addEventListener("click", useUploadedFrame);

    // Pastikan kamera mati bila tab ditutup
    window.addEventListener("pagehide", stopCamera);
  }

  /* Titik masuk: siapkan komponen statis, pasang event, tampilkan Langkah 1 */
  function init() {
    renderGridOptions();
    renderFilterOptions();
    renderStickerOptions();
    bindEvents();
    goToStep(1);
    applyTemplateFromUrl();
  }

  init();
})();
