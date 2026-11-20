/* [REVISI CEPAT] Animasi strip hero (auto-cetak tiap 7 dtk): bagian "if (!RM)" | Angka statistik: .stats b[data-count] | Muncul saat scroll: selector di IntersectionObserver */
/* TWINKLE CAM — Interaksi & animasi Beranda */
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");

/* Angka statistik naik saat terlihat */
const counter = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    counter.unobserve(e.target);
    const b = e.target.querySelector("b"), to = +b.dataset.count;
    if (RM) return (b.textContent = to);
    const t0 = performance.now();
    (function tick(t) { const k = Math.min(1, (t - t0) / 900); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(t0);
}), { threshold: 0.4 });
document.querySelectorAll(".stats > div").forEach((el) => counter.observe(el));

const frame = document.getElementById("frame");
const shoot = () => {
    frame.classList.remove("is-shooting");
    void frame.offsetWidth; // restart animasi
    frame.classList.add("is-shooting");
};
frame.addEventListener("click", shoot); // klik = cetak ulang

// Putar ulang tutorial (hanya muncul otomatis untuk pengunjung baru)
document.getElementById("replayTutorial")?.addEventListener("click", () => TC.tutorial?.open());

// Muncul bertahap saat di-scroll
const io = new IntersectionObserver(
    (entries) =>
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add("is-in");
                io.unobserve(e.target);
            }
        }),
    { threshold: 0.15 },
);
document.querySelectorAll(".section__title, .step, .section .center, .reveal, .stats > div, .tplc").forEach((el) => {
    el.classList.add("reveal");
    el.style.setProperty("--i", el.classList.contains("step") ? [...el.parentNode.children].indexOf(el) : 0);
    io.observe(el);
});

if (!RM) {
    // Strip foto "dicetak" otomatis, diulang tiap beberapa detik
    setTimeout(shoot, 900);
    setInterval(() => !document.hidden && shoot(), 7000);

    // Bingkai miring mengikuti pointer (desktop saja)
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const v = document.querySelector(".hero__visual");
        v.addEventListener("pointermove", (e) => {
            const r = v.getBoundingClientRect();
            v.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 10}deg`);
            v.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
        });
        v.addEventListener("pointerleave", () => {
            v.style.setProperty("--rx", "0deg");
            v.style.setProperty("--ry", "0deg");
        });
    }
}
