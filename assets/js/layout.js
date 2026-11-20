/* [REVISI CEPAT] Menu/halaman: const PAGES + navLinks | Template (warna & jumlah foto): TC.TEMPLATES | Login/tema/toast/modal: fungsi bernama sama di bawah | Nama kunci localStorage: twinkle_* */
/* =========================================================
   TWINKLE CAM — Komponen bersama (header, footer, auth, modal)
   Dipakai semua halaman. Setiap <body> menandai kedalamannya
   lewat data-root: "" untuk index.html, "../" untuk akun/ & menu/.
   ========================================================= */
(() => {
    const ROOT = document.body.dataset.root || "";

    /* ---------- Peta halaman: satu tempat untuk semua tautan ---------- */
    const PAGES = {
        home: "index.html",
        booth: "menu/photobooth.html",
        album: "menu/album.html",
        templates: "menu/templates.html",
        login: "akun/login.html",
    };
    const GATED = new Set(["album"]); // halaman yang wajib login
    const hasPage = (key) => Object.prototype.hasOwnProperty.call(PAGES, key);
    const link = (key) => ROOT + PAGES[key];
    const asset = (path) => `${ROOT}assets/${path}`;

    /* ---------- Template / bingkai ----------
       shots : jumlah foto (default 4)
       bg    : gambar latar bingkai (relatif terhadap assets/)          */
    const TEMPLATES = [
        { id: "twinkle", name: "Twinkle", c1: "#7c3aed", c2: "#c084fc", text: "#ffffff" },
        { id: "midnight", name: "Midnight", c1: "#0e0a1a", c2: "#3b1d6e", text: "#ffffff" },
        { id: "cream", name: "Pastel Cream", c1: "#f5eeff", c2: "#e2d0ff", text: "#1c1433" },
        { id: "sunny", name: "Sunny Star", c1: "#fde68a", c2: "#f0abfc", text: "#1c1433" },
        {
            id: "selfie",
            name: "Selfie Besties",
            shots: 3,
            bg: "images/foto_selfiecontoh1.jpg",
            c1: "#7c3aed",
            c2: "#d946ef",
            text: "#ffffff",
            isNew: true,
        },
    ];

    /* Nilai CSS `background` untuk sebuah template */
    const swatch = (t) =>
        t.bg ? `url('${asset(t.bg)}') center/cover` : `linear-gradient(135deg, ${t.c1}, ${t.c2})`;

    /* ---------- Penyimpanan (localStorage aman-error) ---------- */
    const store = {
        get(key, fallback) {
            try {
                return JSON.parse(localStorage.getItem(key)) ?? fallback;
            } catch {
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        },
    };

    /* ---------- Auth (front-end/demo) ----------
       Semua pengecekan login lewat objek ini. Saat backend siap,
       cukup ganti isi user()/logout() dengan sesi dari server.      */
    const auth = {
        user: () => store.get("twinkle_user", null),
        isLoggedIn: () => auth.user() !== null,
        albumKey: () => `twinkle_albums_${auth.user()?.email ?? "guest"}`,
        logout() {
            try {
                localStorage.removeItem("twinkle_user");
            } catch {}
        },
    };

    /* ---------- Toast ---------- */
    function toast(message) {
        document.querySelectorAll(".toast").forEach((t) => t.remove()); // satu notifikasi sekali tampil
        const el = document.createElement("div");
        el.className = "toast";
        el.textContent = message;
        el.setAttribute("role", "status");
        document.body.append(el);
        setTimeout(() => el.remove(), 2800);
    }

    /* ---------- Modal / pop-up ---------- */
    function openModal({ icon = "✨", title, text, actions = [] }) {
        const dlg = document.createElement("dialog");
        dlg.className = "modal";
        dlg.setAttribute("aria-labelledby", "modalTitle");
        dlg.innerHTML = `
            <div class="modal__box">
                <div class="modal__icon" aria-hidden="true"></div>
                <h2 class="modal__title" id="modalTitle"></h2>
                <p class="modal__text"></p>
                <div class="modal__actions"></div>
            </div>`;
        dlg.querySelector(".modal__icon").textContent = icon;
        dlg.querySelector(".modal__title").textContent = title;
        dlg.querySelector(".modal__text").textContent = text;

        const actionBox = dlg.querySelector(".modal__actions");
        actions.forEach(({ label, href, variant = "ghost", onClick }) => {
            const el = document.createElement(href ? "a" : "button");
            el.className = `btn ${variant === "cta" ? "btn--cta" : "btn--outline"}`;
            el.textContent = label;
            if (href) el.href = href;
            else {
                el.type = "button";
                el.addEventListener("click", () => (onClick ? onClick(dlg) : dlg.close()));
            }
            actionBox.append(el);
        });

        dlg.addEventListener("click", (e) => {
            if (e.target === dlg) dlg.close(); // klik area gelap
        });
        dlg.addEventListener("close", () => dlg.remove());
        document.body.append(dlg);
        dlg.showModal();
        return dlg;
    }

    /* Pop-up "harus login". `next` = kunci halaman tujuan setelah login */
    function requireLogin({
        title = "Eits, login dulu ya!",
        text = "Anda harus login terlebih dahulu untuk melihat fitur ini",
        next,
    } = {}) {
        const href = link("login") + (next && hasPage(next) ? `?next=${next}` : "");
        return openModal({
            icon: "🔒",
            title,
            text,
            actions: [{ label: "Login / Sign Up", href, variant: "cta" }, { label: "Nanti dulu" }],
        });
    }

    window.TC = {
        ROOT,
        TEMPLATES,
        store,
        auth,
        toast,
        link,
        asset,
        hasPage,
        swatch,
        openModal,
        requireLogin,
    };

    /* ---------- Header ---------- */
    const currentFile = location.pathname.split("/").pop() || "index.html";
    const user = auth.user();
    const gate = (key) => (GATED.has(key) ? ` data-requires-login="${key}"` : "");

    const navLinks = [
        /* rev14: menu "Photobooth" dihapus dari header; masuk lewat tombol "Mulai foto" */
        ["home", "Beranda"],
        ["album", "Riwayat Album"],
        ["templates", "Templates"],
    ]
        .map(([key, label]) => {
            const active = PAGES[key].split("/").pop() === currentFile;
            return `<a href="${link(key)}" class="nav__link${active ? " is-active" : ""}"${gate(key)}>${label}</a>`;
        })
        .join("");

    document.getElementById("site-header").innerHTML = `
        <a href="${link("home")}" class="brand" aria-label="Twinkle Cam, ke Beranda">
            <img src="${asset("images/logo.jpg")}" alt="" width="40" height="40" class="brand__logo">
            <span class="brand__name">Twinkle Cam</span>
        </a>
        <nav class="nav" id="nav" aria-label="Navigasi utama">${navLinks}</nav>
        <div class="header__right">
            <button class="theme-toggle" id="themeToggle" type="button" aria-label="Mode terang" aria-pressed="false">
                <svg class="icon-moon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
                <svg class="icon-sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            </button>
            ${currentFile === "photobooth.html" ? "" : `<a href="${link("booth")}" class="btn btn--cta btn--sm header__cta">Mulai foto</a>`}
            ${
                user
                    ? '<button class="btn btn--outline" id="logout" type="button"></button>'
                    : `<a href="${link("login")}" class="btn btn--outline">Login / Sign Up</a>`
            }
            <button class="menu-toggle" id="menuToggle" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
        </div>`;

    if (user) {
        const logoutBtn = document.getElementById("logout");
        logoutBtn.textContent = `Keluar · ${user.name}`;
        logoutBtn.addEventListener("click", () => {
            auth.logout();
            location.href = link("home");
        });
    }

    /* Menu mobile */
    const nav = document.getElementById("nav");
    const menuToggle = document.getElementById("menuToggle");
    menuToggle.addEventListener("click", () => {
        menuToggle.setAttribute("aria-expanded", nav.classList.toggle("is-open"));
    });

    /* Ganti tema (gelap / terang) */
    const root = document.documentElement;
    const themeBtn = document.getElementById("themeToggle");
    const syncTheme = () => themeBtn.setAttribute("aria-pressed", root.dataset.theme === "light");
    themeBtn.addEventListener("click", () => {
        root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
        try {
            localStorage.setItem("twinkle_theme", root.dataset.theme);
        } catch {}
        syncTheme();
    });
    syncTheme();

    /* ---------- Footer: tautan ke semua halaman ---------- */
    const footerLinks = [
        ["home", "Beranda"],
        ["booth", "Photobooth"],
        ["album", "Riwayat Album"],
        ["templates", "Templates"],
        ["login", "Login / Sign Up"],
    ]
        .map(([key, label]) => `<a href="${link(key)}"${gate(key)}>${label}</a>`)
        .join("");

    document.getElementById("site-footer").innerHTML = `
        <div class="footer__info">
            <span class="footer__brand">Twinkle Cam</span>
            <span>© ${new Date().getFullYear()} Twinkle Cam. Dibuat untuk momen bareng bestie.</span>
        </div>
        <nav class="footer__nav" aria-label="Tautan footer">${footerLinks}</nav>`;

    /* PWA: bisa dipasang dan dibuka offline (butuh HTTPS atau localhost) */
    if ("serviceWorker" in navigator && isSecureContext)
        addEventListener("load", () => navigator.serviceWorker.register(ROOT + "sw.js").catch(() => {}));

    /* ---------- Fitur khusus login: kunci tautan untuk guest ----------
       Tambahkan data-requires-login="<kunci halaman>" ke elemen apa pun. */
    const LOCK_ICON =
        '<svg class="lock-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

    if (!auth.isLoggedIn()) {
        document.querySelectorAll("[data-requires-login]").forEach((el) => {
            el.classList.add("is-locked");
            el.setAttribute("aria-disabled", "true");
            el.title = "Login dulu untuk membuka fitur ini";
            el.insertAdjacentHTML("afterbegin", LOCK_ICON);
        });
    }

    document.addEventListener("click", (e) => {
        const el = e.target.closest("[data-requires-login]");
        if (!el || auth.isLoggedIn()) return;
        e.preventDefault();
        requireLogin({ next: el.dataset.requiresLogin });
    });
})();
