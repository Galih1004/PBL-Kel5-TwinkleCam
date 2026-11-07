/* =========================================================
   TWINKLE CAM — Koleksi Bingkai (halaman Templates)
   Menampilkan semua template dari assets/js/template-data.js:
     - filter per ukuran bingkai (Semua, 2x1, 3x1, 4x1, Custom, ...),
     - kartu per bingkai, dikelompokkan urut per ukuran,
     - pratinjau besar (dialog) yang bisa digeser ke bingkai lain,
     - tombol "Foto contoh" untuk melihat bingkai dengan / tanpa foto,
     - tombol "Pakai" -> index.html?template=<id> (langsung ke sesi foto).
   Menambah template cukup lewat template-data.js; file ini tidak perlu diubah.
   ========================================================= */
(() => {
  "use strict";

  const TEMPLATES = window.TWINKLE_TEMPLATES || [];
  const SIZE_ORDER = window.TWINKLE_SIZE_ORDER || [];
  const SAMPLE_PHOTOS = [1, 2, 3, 4].map((n) => `images/selfiecontoh${n}.jpg`); // dipakai bergantian
  const BLEED = 0.005; // foto dibuat sedikit lebih besar dari lubang agar tidak ada celah di tepi

  /* State tampilan: filter aktif, foto contoh nyala/mati, dan daftar yang sedang dibuka di pratinjau */
  const state = { size: "all", withPhotos: true, list: [], index: 0 };

  const $ = (selector) => document.querySelector(selector);
  const dom = {
    filters: $("#tgFilters"),
    summary: $("#tgSummary"),
    grid: $("#tgGrid"),
    dialog: $("#tgDialog"),
    stage: $("#tgStage"),
    title: $("#tgDialogTitle"),
    meta: $("#tgDialogMeta"),
    pos: $("#tgPos"),
    prev: $("#tgPrev"),
    next: $("#tgNext"),
    use: $("#tgUse"),
    close: $("#tgClose"),
  };

  /* ---------- Utilitas ---------- */

  /* Membuat elemen dengan class dan teks opsional */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* Urutan sebuah ukuran menurut TWINKLE_SIZE_ORDER (ukuran tak dikenal ditaruh paling akhir) */
  function sizeRank(size) {
    const index = SIZE_ORDER.indexOf(size);
    return index === -1 ? SIZE_ORDER.length : index;
  }

  /* Semua template, diurutkan per ukuran (1x1, 2x1, ..., custom) lalu sesuai urutan di registri */
  function sortedTemplates() {
    return TEMPLATES.map((template, order) => ({ template, order }))
      .sort((a, b) => sizeRank(a.template.ukuran) - sizeRank(b.template.ukuran) || a.order - b.order)
      .map((item) => item.template);
  }

  /* Template yang tampil sesuai filter ukuran aktif ("all" = semuanya) */
  function visibleTemplates() {
    const all = sortedTemplates();
    return state.size === "all" ? all : all.filter((template) => template.ukuran === state.size);
  }

  /* Nama ukuran untuk tampilan, mis. "4x1" atau "Custom" */
  function sizeLabel(size) {
    return size === "custom" ? "Custom" : size;
  }

  /* Keterangan satu template, mis. "4 foto · strip" */
  function describe(template) {
    const count = (template.slots || []).length;
    if (template.ukuran === "custom") return `${count} foto · bingkai custom`;
    return /x1$/.test(template.ukuran) ? `${count} foto · strip` : `${count} foto · kolase`;
  }

  /* Keterangan satu grup ukuran di judul grup */
  function describeGroup(size, items) {
    return size === "custom" ? "jumlah foto menyesuaikan desain" : describe(items[0]);
  }

  /* Alamat tombol "Pakai": membuka alur foto langsung dengan template ini (ditangani flow.js) */
  function useHref(template) {
    return `${TC.link("home")}?template=${encodeURIComponent(template.id)}`;
  }

  /* ---------- Bingkai (layering foto di bawah bingkai) ---------- */

  /* Membangun satu bingkai: lapisan foto contoh (z-index 1) di bawah gambar bingkai (z-index 2).
     Posisi foto diambil dari "slots" di registri (pecahan 0-1 dari lebar/tinggi gambar). */
  function buildFrame(template, withPhotos, lazy) {
    const frame = el("div", "tg-frame");
    if (template.tipe_area === "hitam") frame.classList.add("tg-frame--hitam");

    if (withPhotos) {
      const layer = el("div", "tg-frame__photos");
      (template.slots || []).forEach(([x, y, w, h], i) => {
        const box = el("div", "tg-slot");
        box.style.left = `${(x - BLEED) * 100}%`;
        box.style.top = `${(y - BLEED) * 100}%`;
        box.style.width = `${(w + BLEED * 2) * 100}%`;
        box.style.height = `${(h + BLEED * 2) * 100}%`;

        const photo = document.createElement("img");
        photo.src = TC.asset(SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length]);
        photo.alt = "";
        photo.draggable = false;
        photo.decoding = "async";
        if (lazy) photo.loading = "lazy";
        box.appendChild(photo);
        layer.appendChild(box);
      });
      frame.appendChild(layer);
    }

    const image = el("img", "tg-frame__img");
    image.alt = `Bingkai ${template.nama}`;
    image.draggable = false;
    image.decoding = "async";
    if (lazy) image.loading = "lazy";

    // Setelah gambar termuat, samakan rasio kotak dengan rasio asli gambar
    const syncRatio = () => {
      if (image.naturalWidth) frame.style.setProperty("--ar", (image.naturalWidth / image.naturalHeight).toFixed(4));
    };
    image.addEventListener("load", syncRatio);
    image.src = TC.asset(template.url_gambar);
    if (image.complete) syncRatio();

    frame.appendChild(image);
    return frame;
  }

  /* ---------- Filter, ringkasan, dan grid ---------- */

  /* Membuat chip filter: "Semua" + tiap ukuran yang punya template, lengkap dengan jumlahnya */
  function renderFilters() {
    const counts = {};
    TEMPLATES.forEach((template) => (counts[template.ukuran] = (counts[template.ukuran] || 0) + 1));
    const sizes = Object.keys(counts).sort((a, b) => sizeRank(a) - sizeRank(b));

    dom.filters.replaceChildren();
    [["all", "Semua", TEMPLATES.length], ...sizes.map((size) => [size, sizeLabel(size), counts[size]])].forEach(
      ([size, label, count]) => {
        const chip = el("button", "chip", label);
        chip.type = "button";
        chip.dataset.size = size;
        chip.appendChild(el("small", "", count));
        const active = state.size === size;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", String(active));
        dom.filters.appendChild(chip);
      }
    );
  }

  /* Satu kartu bingkai: pratinjau (klik = lihat besar), nama, keterangan, tombol Lihat & Pakai */
  function buildCard(template) {
    const card = el("article", "tg-card");

    const thumb = el("button", "tg-card__thumb");
    thumb.type = "button";
    thumb.dataset.id = template.id;
    thumb.setAttribute("aria-label", `Lihat besar bingkai ${template.nama}`);
    thumb.appendChild(buildFrame(template, state.withPhotos, true));

    const actions = el("div", "tg-card__actions");
    const view = el("button", "btn btn--outline btn--sm tg-card__view", "Lihat");
    view.type = "button";
    view.dataset.id = template.id;
    const use = el("a", "btn btn--cta btn--sm", "Pakai");
    use.href = useHref(template);
    use.setAttribute("aria-label", `Pakai template ${template.nama}`);
    actions.append(view, use);

    card.append(thumb, el("h3", "tg-card__name", template.nama), el("p", "tg-card__meta", describe(template)), actions);
    return card;
  }

  /* Menampilkan kartu sesuai filter, dikelompokkan per ukuran dengan judul grup */
  function renderGrid() {
    const list = visibleTemplates();
    dom.grid.replaceChildren();

    const groups = [];
    list.forEach((template) => {
      const last = groups[groups.length - 1];
      if (last && last.size === template.ukuran) last.items.push(template);
      else groups.push({ size: template.ukuran, items: [template] });
    });

    groups.forEach(({ size, items }) => {
      const group = el("div", "tg__group");
      const heading = el("h3", "tg__heading", sizeLabel(size));
      heading.appendChild(el("small", "", ` · ${describeGroup(size, items)}`));
      const cards = el("div", "tg__cards");
      items.forEach((template) => cards.appendChild(buildCard(template)));
      group.append(heading, cards);
      dom.grid.appendChild(group);
    });

    dom.summary.textContent = list.length
      ? `Menampilkan ${list.length} bingkai${state.size === "all" ? " dari semua ukuran" : ` ukuran ${sizeLabel(state.size)}`}.`
      : "Belum ada bingkai untuk ukuran ini.";
  }

  /* Mengganti filter ukuran lalu menggambar ulang chip dan grid */
  function setSize(size) {
    state.size = size;
    renderFilters();
    renderGrid();
  }

  /* ---------- Foto contoh (nyala / mati) ---------- */

  /* Menyamakan semua tombol "Foto contoh" (di halaman dan di dialog) dengan state */
  function syncSampleToggles() {
    document.querySelectorAll(".js-sample-toggle").forEach((button) => {
      button.textContent = `Foto contoh: ${state.withPhotos ? "nyala" : "mati"}`;
      button.classList.toggle("is-active", state.withPhotos);
      button.setAttribute("aria-pressed", String(state.withPhotos));
    });
  }

  /* Menyalakan / mematikan foto contoh di semua bingkai (kartu dan pratinjau) */
  function toggleSample() {
    state.withPhotos = !state.withPhotos;
    syncSampleToggles();
    renderGrid();
    if (dom.dialog.open) fillPreview();
  }

  /* ---------- Pratinjau besar ---------- */

  /* Mengisi dialog dengan template yang sedang dipilih (bingkai, nama, keterangan, tautan Pakai) */
  function fillPreview() {
    const template = state.list[state.index];
    if (!template) return;
    dom.stage.replaceChildren(buildFrame(template, state.withPhotos, false));
    dom.title.textContent = template.nama;
    dom.meta.textContent = `${sizeLabel(template.ukuran)} · ${describe(template)}`;
    dom.use.href = useHref(template);
    dom.pos.textContent = `${state.index + 1} / ${state.list.length}`;
    dom.prev.disabled = dom.next.disabled = state.list.length < 2;
  }

  /* Membuka pratinjau untuk template tertentu; navigasi dibatasi pada daftar yang sedang terfilter */
  function openPreview(id) {
    state.list = visibleTemplates();
    state.index = Math.max(0, state.list.findIndex((template) => template.id === id));
    fillPreview();
    if (!dom.dialog.open) dom.dialog.showModal();
  }

  /* Geser pratinjau ke bingkai sebelumnya (-1) / berikutnya (+1), berputar di ujung daftar */
  function stepPreview(delta) {
    if (state.list.length < 2) return;
    state.index = (state.index + delta + state.list.length) % state.list.length;
    fillPreview();
  }

  /* ---------- Event & inisialisasi ---------- */

  /* Memasang semua event listener sekali saat halaman dimuat (delegasi klik untuk elemen dinamis) */
  function bindEvents() {
    dom.filters.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-size]");
      if (chip) setSize(chip.dataset.size);
    });

    dom.grid.addEventListener("click", (event) => {
      const trigger = event.target.closest(".tg-card__thumb, .tg-card__view");
      if (trigger) openPreview(trigger.dataset.id);
    });

    document.querySelectorAll(".js-sample-toggle").forEach((button) => button.addEventListener("click", toggleSample));

    dom.close.addEventListener("click", () => dom.dialog.close());
    dom.dialog.addEventListener("click", (event) => {
      if (event.target === dom.dialog) dom.dialog.close(); // klik area gelap di luar kotak
    });
    dom.prev.addEventListener("click", () => stepPreview(-1));
    dom.next.addEventListener("click", () => stepPreview(1));
    dom.dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") stepPreview(-1);
      if (event.key === "ArrowRight") stepPreview(1);
    });
  }

  /* Titik masuk: gambar filter + grid, sinkronkan tombol foto contoh, pasang event */
  function init() {
    if (!dom.grid) return;
    if (TEMPLATES.length === 0) {
      dom.summary.textContent = "Koleksi bingkai belum tersedia.";
      return;
    }
    renderFilters();
    renderGrid();
    syncSampleToggles();
    bindEvents();
  }

  init();
})();
