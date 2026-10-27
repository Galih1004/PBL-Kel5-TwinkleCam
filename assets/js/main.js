/* TWINKLE CAM — Interaksi polaroid di Beranda */

// ---------- Polaroid: klik = jepret & ganti foto ----------
const photos = [
    { src: "selfiecontoh1.jpg", caption: "besties",    alt: "Foto besties" },
    { src: "selfiecontoh2.jpg", caption: "the squad",  alt: "Foto squad" },
    { src: "selfiecontoh3.jpg", caption: "campus day", alt: "Foto jalan bareng" },
    { src: "selfiecontoh4.jpg", caption: "love you",   alt: "Foto pose hati" },
];

const polaroid = document.getElementById("polaroid");
const img = document.getElementById("polaroidImg");
const caption = document.getElementById("polaroidCaption");
const thumbs = [...document.querySelectorAll(".thumb")];
let current = 0;
let busy = false;

function show(index) {
    if (busy || index === current) return;
    busy = true;
    current = index;

    // Restart animasi flash + develop
    polaroid.classList.remove("is-shooting");
    void polaroid.offsetWidth;
    polaroid.classList.add("is-shooting");

    // Ganti foto saat layar tepat tertutup flash
    setTimeout(() => {
        img.src = photos[index].src;
        img.alt = photos[index].alt;
        caption.textContent = photos[index].caption;
    }, 120);

    thumbs.forEach((t, i) => t.classList.toggle("is-active", i === index));
    setTimeout(() => { busy = false; }, 600);
}

polaroid.addEventListener("click", () => show((current + 1) % photos.length));
thumbs.forEach((t) => t.addEventListener("click", () => show(Number(t.dataset.index))));
