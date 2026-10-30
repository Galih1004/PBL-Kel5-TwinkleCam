/* =========================================================
   TWINKLE CAM — Halaman Photobooth
   ========================================================= */
const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Konfigurasi ---------- */
const FILTERS = {
    none: { label: "Normal", css: "none" },
    bw: { label: "Hitam putih", css: "grayscale(1) contrast(1.1)" },
    warm: { label: "Hangat", css: "sepia(.35) saturate(1.3) brightness(1.05)" },
    soft: { label: "Lembut", css: "brightness(1.1) contrast(.92) saturate(1.15)" },
};
const FREE_DOWNLOADS = 3; // jatah unduh gratis untuk guest
const DOWNLOAD_KEY = "twinkle_downloads";

// Ukuran strip (px)
const PHOTO_W = 520,
    PHOTO_H = 390,
    PAD = 40,
    GAP = 24,
    FOOTER_H = 140;
const STRIP_W = PAD * 2 + PHOTO_W;
const shotsOf = (t) => t.shots ?? 4;
const stripHeight = (n) => PAD + n * PHOTO_H + (n - 1) * GAP + FOOTER_H;

/* ---------- State ---------- */
const video = $("#video");
const strip = $("#strip");
let shots = [];
let busy = false;
let hasStream = false;
let filter = "none";
let memoryDownloads = 0; // cadangan bila localStorage tidak tersedia
let tpl =
    TC.TEMPLATES.find((t) => t.id === new URLSearchParams(location.search).get("template")) ||
    TC.TEMPLATES[0];

/* ---------- Gambar ---------- */
const loadImage = (src, onload) => {
    const img = new Image();
    if (onload) img.onload = onload;
    img.src = src;
    return img;
};
const SAMPLES = [1, 2, 3, 4].map((n) => loadImage(TC.asset(`images/selfiecontoh${n}.jpg`)));
const FRAME_BG = {}; // gambar latar bingkai per template
TC.TEMPLATES.filter((t) => t.bg).forEach((t) => {
    FRAME_BG[t.id] = loadImage(TC.asset(t.bg), () => compose());
});

/* ---------- Kamera ---------- */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 1280, height: 960 },
            audio: false,
        });
        video.srcObject = stream;
        hasStream = true;
        $("#camMsg").hidden = true;
    } catch {
        $("#camMsg").textContent =
            "Kamera tidak bisa diakses. Izinkan kamera di browser, atau coba dengan foto contoh.";
    }
}

/* ---------- Menggambar ---------- */
function drawCover(ctx, src, w, h, mirror) {
    const sw = src.videoWidth || src.naturalWidth,
        sh = src.videoHeight || src.naturalHeight;
    const r = Math.max(w / sw, h / sh),
        cw = w / r,
        ch = h / r;
    ctx.save();
    if (mirror) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h);
    ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function paintBackground(ctx, H) {
    const g = ctx.createLinearGradient(0, 0, STRIP_W, H);
    g.addColorStop(0, tpl.c1);
    g.addColorStop(1, tpl.c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, STRIP_W, H);

    const bg = FRAME_BG[tpl.id];
    if (bg && bg.complete && bg.naturalWidth) {
        // Foto bingkai sebagai latar: sedikit blur + overlay gradasi agar foto utama tetap menonjol
        ctx.save();
        ctx.filter = "blur(5px)";
        ctx.translate(-20, -20);
        drawCover(ctx, bg, STRIP_W + 40, H + 40, false);
        ctx.restore();
        const overlay = ctx.createLinearGradient(0, 0, 0, H);
        overlay.addColorStop(0, "rgba(13,10,34,.15)");
        overlay.addColorStop(1, "rgba(124,92,255,.7)");
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, STRIP_W, H);
    }
}

function drawSlot(ctx, i, y) {
    ctx.save();
    if (tpl.bg) {
        // Bingkai bergaya: border putih + sudut membulat
        ctx.fillStyle = "#fff";
        roundRectPath(ctx, PAD - 8, y - 8, PHOTO_W + 16, PHOTO_H + 16, 26);
        ctx.fill();
        roundRectPath(ctx, PAD, y, PHOTO_W, PHOTO_H, 18);
        ctx.clip();
    }
    if (shots[i]) {
        ctx.filter = FILTERS[filter].css;
        ctx.drawImage(shots[i], PAD, y);
    } else {
        ctx.fillStyle = "rgba(255,255,255,.2)";
        ctx.fillRect(PAD, y, PHOTO_W, PHOTO_H);
    }
    ctx.restore();
}

function compose() {
    const n = shotsOf(tpl);
    const H = stripHeight(n);
    strip.width = STRIP_W;
    strip.height = H;
    const ctx = strip.getContext("2d");

    paintBackground(ctx, H);
    for (let i = 0; i < n; i++) drawSlot(ctx, i, PAD + i * (PHOTO_H + GAP));

    const footY = PAD + n * PHOTO_H + (n - 1) * GAP;
    ctx.fillStyle = tpl.text;
    ctx.textAlign = "center";
    ctx.font = "36px Pacifico, cursive";
    ctx.fillText("✦ Twinkle Cam ✦", STRIP_W / 2, footY + 70);
    ctx.font = "22px Outfit, sans-serif";
    ctx.fillText(
        new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        STRIP_W / 2,
        footY + 110,
    );
}

/* ---------- Sesi jepret ---------- */
async function run(getSource, mirror, seconds) {
    if (busy) return;
    busy = true;
    $("#startBtn").disabled = $("#sampleBtn").disabled = true;
    shots = [];
    const total = shotsOf(tpl);
    compose();
    $("#actions").hidden = true;

    for (let i = 0; i < total; i++) {
        $("#progress").textContent = `Foto ${i + 1} dari ${total}`;
        for (let n = seconds; n > 0; n--) {
            $("#countdown").textContent = n;
            await wait(1000);
        }
        $("#countdown").textContent = "";

        $("#flash").classList.remove("is-on");
        void $("#flash").offsetWidth;
        $("#flash").classList.add("is-on");

        const c = document.createElement("canvas");
        c.width = PHOTO_W;
        c.height = PHOTO_H;
        drawCover(c.getContext("2d"), getSource(i), PHOTO_W, PHOTO_H, mirror);
        shots.push(c);
        compose();
        await wait(600);
    }

    $("#progress").textContent = "Selesai!";
    $("#actions").hidden = false;
    renderDownloadState();
    $("#startBtn").disabled = $("#sampleBtn").disabled = false;
    busy = false;
}

/* ---------- Chip filter & template ---------- */
function renderChips() {
    $("#filterChips").innerHTML = Object.entries(FILTERS)
        .map(
            ([k, f]) =>
                `<button type="button" class="chip${k === filter ? " is-active" : ""}" data-filter="${k}">${f.label}</button>`,
        )
        .join("");
    $("#tplChips").innerHTML = TC.TEMPLATES.map(
        (t) =>
            `<button type="button" class="chip${t.id === tpl.id ? " is-active" : ""}" data-tpl="${t.id}"><i class="dot" style="background:${TC.swatch(t)}"></i>${t.name}<small class="chip__meta">${shotsOf(t)} foto</small></button>`,
    ).join("");
}

document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    if (busy) return TC.toast("Tunggu sesi jepret selesai dulu ya");

    if (chip.dataset.filter) {
        filter = chip.dataset.filter;
        video.style.filter = FILTERS[filter].css;
    }
    if (chip.dataset.tpl) {
        tpl = TC.TEMPLATES.find((t) => t.id === chip.dataset.tpl);
        if (shots.length && shots.length < shotsOf(tpl)) {
            // Frame baru butuh lebih banyak foto dari yang sudah diambil
            shots = [];
            $("#actions").hidden = true;
            $("#progress").textContent = "";
            TC.toast(`Frame ini butuh ${shotsOf(tpl)} foto, yuk jepret ulang!`);
        }
    }
    renderChips();
    compose();
});

/* ---------- Limit unduhan guest ---------- */
const downloadsUsed = () => Math.max(TC.store.get(DOWNLOAD_KEY, 0), memoryDownloads);
const downloadsLeft = () => (TC.auth.isLoggedIn() ? Infinity : Math.max(0, FREE_DOWNLOADS - downloadsUsed()));

function renderDownloadState() {
    const left = downloadsLeft();
    const btn = $("#downloadBtn");
    const hint = $("#limitHint");

    btn.classList.toggle("is-locked", left === 0);
    btn.dataset.state = left === Infinity ? "unlimited" : left === 0 ? "locked" : left === 1 ? "low" : "ok";

    if (left === Infinity) {
        btn.textContent = "Unduh";
        hint.textContent = "Kamu sudah login, unduh sepuasnya ✨";
    } else if (left > 0) {
        btn.textContent = `Unduh (Sisa: ${left}x)`;
        hint.textContent = `Guest dapat ${FREE_DOWNLOADS}x unduh gratis. Login untuk tanpa batas.`;
    } else {
        btn.textContent = "Unduh (Login dulu)";
        hint.textContent = "Jatah unduh gratis habis. Login untuk lanjut tanpa batas.";
    }
}

$("#downloadBtn").addEventListener("click", () => {
    const left = downloadsLeft();
    if (left === 0) {
        return TC.requireLogin({
            title: "Jatah unduh gratis habis",
            text: `Guest hanya bisa mengunduh ${FREE_DOWNLOADS} kali. Login untuk unduh tanpa batas!`,
            next: "booth",
        });
    }

    const a = document.createElement("a");
    a.href = strip.toDataURL("image/png");
    a.download = `twinkle-cam-${Date.now()}.png`;
    a.click();

    if (left === Infinity) return TC.toast("Terunduh ✨");
    memoryDownloads = downloadsUsed() + 1;
    TC.store.set(DOWNLOAD_KEY, memoryDownloads);
    renderDownloadState();
    const rest = downloadsLeft();
    TC.toast(
        rest > 0
            ? `Terunduh! Sisa unduhan gratis: ${rest}x`
            : "Itu unduhan gratis terakhirmu. Login untuk lanjut ✨",
    );
});

/* ---------- Tombol lain ---------- */
$("#startBtn").addEventListener("click", () => {
    if (!hasStream) return TC.toast("Kamera belum aktif. Coba foto contoh dulu.");
    run(() => video, true, 3);
});
$("#sampleBtn").addEventListener("click", () => run((i) => SAMPLES[i], false, 1));
$("#helpBtn").addEventListener("click", () => TC.tutorial?.open());
$("#retakeBtn").addEventListener("click", () => {
    shots = [];
    compose();
    $("#actions").hidden = true;
    $("#progress").textContent = "";
});

$("#saveBtn").addEventListener("click", () => {
    if (!TC.auth.isLoggedIn()) {
        return TC.requireLogin({
            title: "Simpan ke album? Login dulu ya",
            text: "Anda harus login terlebih dahulu untuk menyimpan foto ke album.",
            next: "booth",
        });
    }
    const t = document.createElement("canvas");
    t.width = 400;
    t.height = Math.round((400 * strip.height) / strip.width);
    t.getContext("2d").drawImage(strip, 0, 0, t.width, t.height);

    const key = TC.auth.albumKey();
    const albums = TC.store.get(key, []);
    albums.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        tpl: tpl.name,
        img: t.toDataURL("image/jpeg", 0.82),
    });
    if (TC.store.set(key, albums)) TC.toast("Tersimpan di Riwayat Album ✦");
    else TC.toast("Penyimpanan penuh. Hapus beberapa foto di album dulu.");
});

/* ---------- Init ---------- */
renderChips();
renderDownloadState();
(document.fonts?.ready ?? Promise.resolve()).then(compose); // tunggu font Pacifico/Outfit siap

// Newcomer: tunggu tutorial ditutup dulu supaya izin kamera tidak bertabrakan dengan pop-up
if (TC.tutorial?.willShow()) document.addEventListener("tutorial:closed", startCamera, { once: true });
else startCamera();
