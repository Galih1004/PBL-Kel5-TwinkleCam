/* [REVISI CEPAT] Kartu katalog dibuat di fungsi cardImg() / cardPlain() di bawah. Ukuran chip: const SIZES. */
/* TWINKLE CAM — Halaman Templates (rev14)
   Filter ukuran: Semua | 1x1 | 2x1 | 3x1 | 4x1 | 2x2 | 3x2 | 4x2 
   - 2x1 / 3x1 / 4x1 : template GAMBAR (assets/js/template-images.js)
   - 1x1 / 2x2 / 3x2 / 4x2    : bingkai POLOS (frames-data.js + 5 template favorit di layout.js)
   "Semua" = seluruh template gambar. */
const IMG = window.TIMG || [];
/* Bingkai polos = 5 template favorit (layout.js) + bingkai warna/pola (frames-data.js) */
const PLAIN = [
    ...TC.TEMPLATES.map((t) => ({ id: t.id, name: t.name, bg: t.c1, fg: t.c2, ink: t.text, grad: true })),
    ...(window.TFRAMES || []).map((f) => ({ id: f.id, name: f.name, bg: f.bg, fg: f.fg || f.bg, ink: f.ink })),
];
/* Ukuran polos: kolom x baris yang digambar pada kartu + kunci tata letak untuk tombol "Pakai" */
const GRID = { "1x1": { c: 1, n: 1, lay: "p1" }, "2x2": { c: 2, n: 4, lay: "g4" }, "3x2": { c: 2, n: 6, lay: "d3" }, "4x2": { c: 2, n: 8, lay: "d4" } };

/* [DATA] Daftar chip. k = kunci, test = fungsi penyaring template gambar */
const SIZES = [
    ["all", "Semua"],
    ["1x1", "1x1"],
    ["2x1", "2x1"],
    ["3x1", "3x1"],
    ["4x1", "4x1"],
    ["2x2", "2x2"],
    ["3x2", "3x2"],
    ["4x2", "4x2"],
];
const imgFor = (k) =>
    IMG.filter((t) => (k === "all" ? true : window.tsizeOf(t) === k));
const countFor = (k) => (GRID[k] ? PLAIN.length + (k === "1x1" ? imgFor("1x1").length : 0) : imgFor(k).length);

/* Kartu template gambar (bingkai transparan). Tombol Pakai -> photobooth.html?template=ti-<id> */
const cardImg = (t) => `<article class="tpl">
        <div class="tpl__img"><img src="${TC.asset("images/template/" + t.ov)}" alt="Template ${t.name}" loading="lazy" style="aspect-ratio:${t.w}/${t.h}"></div>
        <h3 class="tpl__name">${t.name} <small>${t.n} foto</small></h3>
        <a class="btn btn--outline btn--block" href="photobooth.html?template=ti-${t.id}">Pakai template</a></article>`;

/* Kartu bingkai polos: kotak bernomor mengikuti ukuran. Tombol Pakai -> photobooth.html?template=<id>&grid=<kunci tata letak> */
function cardPlain(f, size) {
    const g = GRID[size];
    const boxes = Array.from({ length: g.n }, (_, i) => `<span class="tpl__ph" aria-hidden="true">${i + 1}</span>`).join("");
    const bg = f.grad ? `linear-gradient(135deg, ${f.bg}, ${f.fg})` : f.bg;
    return `<article class="tpl">
        <div class="tpl__strip tpl__strip--grid" style="--c:${g.c};background:${bg};color:${f.ink};border:3px solid ${f.fg}">${boxes}<span class="tpl__brand">Twinkle Cam</span></div>
        <h3 class="tpl__name">${f.name} <small>${size.replace("x", "×")} · ${g.n} foto</small></h3>
        <a class="btn btn--outline btn--block" href="photobooth.html?template=${f.id}&grid=${g.lay}">Pakai template</a></article>`;
}

const grid = document.getElementById("tiGrid");
const bar = document.getElementById("tiFilter");
const note = document.getElementById("tiNote");
let cur = "all";

/* Menggambar ulang kartu sesuai chip aktif */
function draw() {
    const items = GRID[cur]
        ? [...imgFor(cur).map(cardImg), ...PLAIN.map((f) => cardPlain(f, cur))]
        : imgFor(cur).map(cardImg);
    grid.className = "tpl-grid tpl-grid--img" + (GRID[cur] ? " tpl-grid--plain" : "");
    grid.innerHTML = items.join("");
    note.textContent = GRID[cur]
        ? `Bingkai polos untuk ukuran ${cur.replace("x", "×")}. Pilih tata letak ${cur.replace("x", "×")} di Photobooth untuk memakainya.`
        : cur === "all"
          ? "Semua template gambar. Pilih chip ukuran di atas untuk melihat template yang pas dengan tata letakmu."
          : "";
    [...bar.children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === cur)));
}

SIZES.forEach(([k, label]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.k = k;
    b.innerHTML = `${label} <small>${countFor(k)}</small>`;
    b.onclick = () => ((cur = k), draw());
    bar.appendChild(b);
});
draw();
