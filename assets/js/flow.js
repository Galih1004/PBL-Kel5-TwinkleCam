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
    if (next >= 5 && state.photos.length !== state.grid.count) next = 4;

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

      const icon = el("span", "tc-grid-icon");
      icon.style.setProperty("--cols", grid.cols);
      icon.style.setProperty("--cell", `${GRID_ICON_CELL[grid.cols]}px`);
      for (let i = 0; i < grid.count; i += 1) icon.appendChild(el("span", "tc-grid-icon__cell"));

      card.append(icon, el("span", "tc-option-card__label", grid.label), el("span", "tc-option-card__meta", describeGrid(grid)));
      card.addEventListener("click", () => selectGrid(grid));
      dom.gridOptions.appendChild(card);
    });
  }

  /* Menyimpan ukuran bingkai ke state lalu lanjut ke Langkah 3.
     Jika user mengganti ukuran, template & foto lama dibuang karena tidak cocok lagi. */
  function selectGrid(grid) {
    if (state.grid && state.grid.id !== grid.id) {
      state.template = null;
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
  function buildFrame({ grid, theme, photos = [], filterCss = "none", mini = false }) {
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
     7. LANGKAH 3 — PILIH TEMPLATE
     ========================================================= */

  /* Menampilkan pilihan template. Setiap kartu berisi mini-bingkai dengan jumlah
     slot yang sesuai ukuran yang dipilih di Langkah 2. */
  function renderTemplateOptions() {
    dom.templateGridLabel.textContent = state.grid.label;
    dom.templateOptions.innerHTML = "";

    TEMPLATES.forEach((theme) => {
      const card = el("div", "tc-option-card tc-template-card");
      card.tabIndex = 0;
      card.dataset.templateId = theme.id;
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", String(state.template?.id === theme.id));
      card.setAttribute("aria-label", `Template ${theme.name}`);
      card.classList.toggle("is-selected", state.template?.id === theme.id);

      card.append(buildFrame({ grid: state.grid, theme, mini: true }), el("span", "tc-option-card__label", theme.name));
      makeActivatable(card, () => selectTemplate(theme));
      dom.templateOptions.appendChild(card);
    });
  }

  /* Menyimpan template terpilih ke state lalu lanjut ke Langkah 4 */
  function selectTemplate(theme) {
    state.template = theme;
    $$(".tc-template-card").forEach((card) => {
      const active = card.dataset.templateId === theme.id;
      card.classList.toggle("is-selected", active);
      card.setAttribute("aria-checked", String(active));
    });
    setTimeout(() => goToStep(4), 250);
  }

  /* =========================================================
     8. LANGKAH 4 — SESI PENGAMBILAN FOTO
     ========================================================= */

  /* Dipanggil saat masuk Langkah 4: reset foto lama dan nyalakan kamera */
  function enterCaptureStep() {
    state.photos = [];
    state.demo = false;
    state.isCapturing = false;
    dom.captureTotalLabel.textContent = state.grid.count;
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
    for (let i = 0; i < state.grid.count; i += 1) {
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
    const total = state.grid.count;

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
    state.editWrap.querySelectorAll(".tc-slot img").forEach((img) => {
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

  /* Menyusun hasil akhir (kolase + template + filter + stiker) ke satu canvas.
     Proporsi (padding, gap, caption) sama dengan CSS bingkai: semuanya pecahan dari lebar F. */
  async function renderFinalCanvas() {
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
    dom.liveStage.style.background = templateBackground(state.template);
    dom.liveStage.style.color = state.template.text;
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
    paintBackground(ctx, state.template, W, H);
    drawPhotoFiltered(ctx, photo.img, pad, pad, W - pad * 2, ((W - pad * 2) * 3) / 4, 18, state.filter);
    ctx.fillStyle = state.template.text;
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
  }

  init();
})();
