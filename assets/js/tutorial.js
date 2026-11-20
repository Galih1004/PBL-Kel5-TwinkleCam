/* [REVISI CEPAT] Isi langkah tutorial: array steps (title/text). Muncul sekali untuk pengunjung baru (kunci localStorage twinkle_tutorial_seen). */
/* =========================================================
   TWINKLE CAM — Tutorial interaktif untuk pengunjung baru
   Newcomer = belum ada penanda "twinkle_tutorial_seen".
   Bukan newcomer → overlay tidak muncul; panduan statis di
   index.html tetap tampil. Bisa dibuka ulang: TC.tutorial.open()
   ========================================================= */
(() => {
    const SEEN_KEY = "twinkle_tutorial_seen";

    /* Isi tutorial. Tambah/ubah langkah = ubah objek di sini. */
    const STEPS = [
        {
            emoji: "👋",
            title: "Halo, selamat datang!",
            text: "Twinkle Cam bikin strip foto estetik langsung dari browser. Ada 5 langkah singkat: Pilih, Template, Jepret, Hias, Simpan.",
        },
        {
            emoji: "🧩",
            title: "Pilih ukuran & template",
            text: "Pilih tata letak (misalnya 3x1 atau 2x2). Di langkah berikutnya hanya template yang pas dengan ukuran itu yang tampil, atau unggah background sendiri.",
        },
        {
            emoji: "📸",
            title: "Jepret sendiri atau bareng teman",
            text: "Tekan Mulai jepret, tiap foto ada hitung mundur. Pilih tata letak 2 foto atau lebih, lalu tekan Undang teman: foto diambil bergantian dari kameramu dan HP temanmu.",
        },
        {
            emoji: "✨",
            title: "Hias fotomu",
            text: "Tambah filter, set stiker, stiker tempel, dan tulisan. Template dipilih sebelum jepret, jadi hasilnya sama seperti gambar template.",
        },
        {
            emoji: "💾",
            title: "Unduh atau simpan",
            text: "Hasilnya berupa foto dan live photo. Guest bisa unduh gratis sekali; login (Google atau email) untuk tanpa batas dan simpan ke Riwayat Album.",
        },
    ];

    /* Penyimpanan harus benar-benar bisa dipakai, kalau tidak tutorial bakal muncul terus */
    function canPersist() {
        try {
            localStorage.setItem("twinkle_probe", "1");
            localStorage.removeItem("twinkle_probe");
            return true;
        } catch {
            return false;
        }
    }
    /* Pengunjung BARU = belum pernah membuka web ini di browser ini (belum ada penanda SEEN_KEY),
       belum login, dan bukan sedang membuka link terima-foto / room dari teman.
       Penanda disimpan SEGERA saat keputusan diambil (bukan menunggu pop-up ditutup), jadi
       kunjungan berikutnya, di halaman mana pun, tidak memunculkan pop-up lagi. */
    const onGuestLink = () => /^#\/(terima|join)\//.test(location.hash);
    const hasSeen = () => {
        try {
            return localStorage.getItem(SEEN_KEY) !== null;
        } catch {
            return true; // penyimpanan tidak bisa dipakai: jangan ganggu pengguna
        }
    };
    const isNewcomer = () => canPersist() && !hasSeen() && !TC.auth.isLoggedIn() && !onGuestLink();
    const markSeen = () => {
        try {
            localStorage.setItem(SEEN_KEY, new Date().toISOString());
        } catch {}
    };

    function open() {
        markSeen();
        let index = 0;

        const dlg = document.createElement("dialog");
        dlg.className = "modal tour";
        dlg.setAttribute("aria-labelledby", "tourTitle");
        dlg.innerHTML = `
            <div class="modal__box">
                <button class="tour__skip" type="button">Lewati</button>
                <div class="modal__icon tour__emoji" aria-hidden="true"></div>
                <h2 class="modal__title" id="tourTitle"></h2>
                <p class="modal__text"></p>
                <div class="tour__dots" aria-hidden="true">${STEPS.map(() => "<i></i>").join("")}</div>
                <p class="tour__count" aria-live="polite"></p>
                <div class="tour__actions">
                    <button class="btn btn--outline tour__back" type="button">Kembali</button>
                    <button class="btn btn--cta tour__next" type="button"></button>
                </div>
            </div>`;

        const $ = (s) => dlg.querySelector(s);
        const emoji = $(".tour__emoji");

        function render() {
            const step = STEPS[index];
            emoji.textContent = step.emoji;
            emoji.classList.remove("is-pop");
            void emoji.offsetWidth; // restart animasi
            emoji.classList.add("is-pop");
            $(".modal__title").textContent = step.title;
            $(".modal__text").textContent = step.text;
            $(".tour__count").textContent = `Langkah ${index + 1} dari ${STEPS.length}`;
            $(".tour__back").style.visibility = index === 0 ? "hidden" : "visible";
            $(".tour__next").textContent = index === STEPS.length - 1 ? "Mulai seru-seruan ✨" : "Lanjut";
            dlg.querySelectorAll(".tour__dots i").forEach((dot, i) =>
                dot.classList.toggle("is-on", i === index),
            );
        }

        const go = (delta) => {
            const next = index + delta;
            if (next >= STEPS.length) return dlg.close();
            index = Math.max(0, next);
            render();
        };

        $(".tour__next").addEventListener("click", () => go(1));
        $(".tour__back").addEventListener("click", () => go(-1));
        $(".tour__skip").addEventListener("click", () => dlg.close());
        dlg.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
        });
        dlg.addEventListener("close", () => {
            dlg.remove();
            document.dispatchEvent(new CustomEvent("tutorial:closed"));
        });

        document.body.append(dlg);
        render();
        dlg.showModal();
        $(".tour__next").focus();
    }

    TC.tutorial = { open, willShow: isNewcomer };

    if (isNewcomer()) {
        markSeen(); // tandai kunjungan pertama sekarang juga
        setTimeout(open, 600);
    } else if (onGuestLink() === false && !hasSeen() && TC.auth.isLoggedIn()) {
        markSeen(); // pengguna yang sudah login dianggap bukan pengunjung baru
    }
})();
