/* =========================================================
   TWINKLE CAM — Halaman Photobooth
   ========================================================= */
const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const FILTERS = {
    none: { label: "Normal",      css: "none" },
    bw:   { label: "Hitam putih", css: "grayscale(1) contrast(1.1)" },
    warm: { label: "Hangat",      css: "sepia(.35) saturate(1.3) brightness(1.05)" },
    soft: { label: "Lembut",      css: "brightness(1.1) contrast(.92) saturate(1.15)" },
};
const SAMPLES = [1, 2, 3, 4].map((n) => { const i = new Image(); i.src = `assets/images/selfiecontoh${n}.jpg`; return i; });

// Ukuran strip (px)
const PHOTO_W = 520, PHOTO_H = 390, PAD = 40, GAP = 24;
const STRIP_W = PAD * 2 + PHOTO_W;
const STRIP_H = PAD + 4 * PHOTO_H + 3 * GAP + 140;

const video = $("#video"), strip = $("#strip");
let shots = [], busy = false, hasStream = false, filter = "none";
let tpl = TC.TEMPLATES.find((t) => t.id === new URLSearchParams(location.search).get("template")) || TC.TEMPLATES[0];

/* ---------- Kamera ---------- */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 1280, height: 960 }, audio: false });
        video.srcObject = stream;
        hasStream = true;
        $("#camMsg").hidden = true;
    } catch {
        $("#camMsg").textContent = "Kamera tidak bisa diakses. Izinkan kamera di browser, atau coba dengan foto contoh.";
    }
}

/* ---------- Gambar ---------- */
function drawCover(ctx, src, w, h, mirror) {
    const sw = src.videoWidth || src.naturalWidth, sh = src.videoHeight || src.naturalHeight;
    const r = Math.max(w / sw, h / sh), cw = w / r, ch = h / r;
    ctx.save();
    if (mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h);
    ctx.restore();
}

function compose() {
    strip.width = STRIP_W; strip.height = STRIP_H;
    const ctx = strip.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, STRIP_W, STRIP_H);
    g.addColorStop(0, tpl.c1); g.addColorStop(1, tpl.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, STRIP_W, STRIP_H);

    for (let i = 0; i < 4; i++) {
        const y = PAD + i * (PHOTO_H + GAP);
        ctx.save();
        if (shots[i]) { ctx.filter = FILTERS[filter].css; ctx.drawImage(shots[i], PAD, y); }
        else { ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect(PAD, y, PHOTO_W, PHOTO_H); }
        ctx.restore();
    }

    const footY = PAD + 4 * PHOTO_H + 3 * GAP;
    ctx.fillStyle = tpl.text; ctx.textAlign = "center";
    ctx.font = "36px Pacifico, cursive";
    ctx.fillText("✦ Twinkle Cam ✦", STRIP_W / 2, footY + 70);
    ctx.font = "22px Outfit, sans-serif";
    ctx.fillText(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), STRIP_W / 2, footY + 110);
}

/* ---------- Sesi jepret ---------- */
async function run(getSource, mirror, seconds) {
    if (busy) return;
    busy = true; shots = []; compose();
    $("#actions").hidden = true;

    for (let i = 0; i < 4; i++) {
        $("#progress").textContent = `Foto ${i + 1} dari 4`;
        for (let n = seconds; n > 0; n--) { $("#countdown").textContent = n; await wait(1000); }
        $("#countdown").textContent = "";

        $("#flash").classList.remove("is-on"); void $("#flash").offsetWidth; $("#flash").classList.add("is-on");
        const c = document.createElement("canvas");
        c.width = PHOTO_W; c.height = PHOTO_H;
        drawCover(c.getContext("2d"), getSource(i), PHOTO_W, PHOTO_H, mirror);
        shots.push(c); compose();
        await wait(600);
    }
    $("#progress").textContent = "Selesai!";
    $("#actions").hidden = false;
    busy = false;
}

/* ---------- Chips filter & template ---------- */
function renderChips() {
    $("#filterChips").innerHTML = Object.entries(FILTERS)
        .map(([k, f]) => `<button type="button" class="chip${k === filter ? " is-active" : ""}" data-filter="${k}">${f.label}</button>`).join("");
    $("#tplChips").innerHTML = TC.TEMPLATES
        .map((t) => `<button type="button" class="chip${t.id === tpl.id ? " is-active" : ""}" data-tpl="${t.id}"><i class="dot" style="background:linear-gradient(135deg,${t.c1},${t.c2})"></i>${t.name}</button>`).join("");
}

document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    if (chip.dataset.filter) { filter = chip.dataset.filter; video.style.filter = FILTERS[filter].css; }
    if (chip.dataset.tpl) tpl = TC.TEMPLATES.find((t) => t.id === chip.dataset.tpl);
    renderChips(); compose();
});

/* ---------- Tombol ---------- */
$("#startBtn").addEventListener("click", () => {
    if (!hasStream) return TC.toast("Kamera belum aktif. Coba foto contoh dulu.");
    run(() => video, true, 3);
});
$("#sampleBtn").addEventListener("click", () => run((i) => SAMPLES[i], false, 1));
$("#retakeBtn").addEventListener("click", () => { shots = []; compose(); $("#actions").hidden = true; $("#progress").textContent = ""; });

$("#downloadBtn").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = strip.toDataURL("image/png");
    a.download = `twinkle-cam-${Date.now()}.png`;
    a.click();
});

$("#saveBtn").addEventListener("click", () => {
    const t = document.createElement("canvas");
    t.width = 400; t.height = Math.round(400 * STRIP_H / STRIP_W);
    t.getContext("2d").drawImage(strip, 0, 0, t.width, t.height);
    const albums = TC.store.get("twinkle_albums", []);
    albums.unshift({ id: Date.now(), date: new Date().toISOString(), tpl: tpl.name, img: t.toDataURL("image/jpeg", 0.82) });
    if (TC.store.set("twinkle_albums", albums)) TC.toast("Tersimpan di Riwayat Album ✦");
    else TC.toast("Penyimpanan penuh. Hapus beberapa foto di album dulu.");
});

/* ---------- Init ---------- */
renderChips();
document.fonts.ready.then(compose);
startCamera();
