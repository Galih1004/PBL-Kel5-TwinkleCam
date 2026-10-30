/* TWINKLE CAM — Interaksi Beranda */

// Klik bingkai = cetak ulang ketiga foto (flash + efek "developing")
const frame = document.getElementById("frame");
frame.addEventListener("click", () => {
    frame.classList.remove("is-shooting");
    void frame.offsetWidth; // restart animasi
    frame.classList.add("is-shooting");
});

// Putar ulang tutorial (hanya muncul otomatis untuk pengunjung baru)
document.getElementById("replayTutorial")?.addEventListener("click", () => TC.tutorial?.open());
