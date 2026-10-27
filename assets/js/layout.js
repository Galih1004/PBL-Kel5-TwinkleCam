/* =========================================================
   TWINKLE CAM — Komponen bersama (header, footer, helper)
   ========================================================= */
(() => {
    const TEMPLATES = [
        { id: "twinkle",  name: "Twinkle",      c1: "#ff6fb1", c2: "#7c5cff", text: "#ffffff" },
        { id: "midnight", name: "Midnight",     c1: "#0d0a22", c2: "#2b2063", text: "#ffffff" },
        { id: "cream",    name: "Pastel Cream", c1: "#fff4e6", c2: "#ffd0e6", text: "#0d0a22" },
        { id: "sunny",    name: "Sunny Star",   c1: "#ffe58a", c2: "#ff9ec9", text: "#0d0a22" },
    ];

    const store = {
        get(key, fallback) {
            try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
        },
        set(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
        },
    };

    function toast(message) {
        const el = document.createElement("div");
        el.className = "toast";
        el.textContent = message;
        el.setAttribute("role", "status");
        document.body.append(el);
        setTimeout(() => el.remove(), 2600);
    }

    window.TC = { TEMPLATES, store, toast };

    /* ---------- Header ---------- */
    const page = location.pathname.split("/").pop() || "index.html";
    const user = store.get("twinkle_user", null);
    const links = [["index.html", "Beranda"], ["album.html", "Riwayat Album"], ["templates.html", "Templates"]]
        .map(([href, label]) => `<a href="${href}" class="nav__link${page === href ? " is-active" : ""}">${label}</a>`)
        .join("");

    const header = document.getElementById("site-header");
    header.innerHTML = `
        <a href="index.html" class="brand" aria-label="Twinkle Cam, ke Beranda">
            <img src="assets/images/logo.jpg" alt="" width="40" height="40" class="brand__logo">
            <span class="brand__name">Twinkle Cam</span>
        </a>
        <nav class="nav" id="nav" aria-label="Navigasi utama">${links}</nav>
        <div class="header__right">
            <button class="theme-toggle" id="themeToggle" type="button" aria-label="Mode terang" aria-pressed="false">
                <svg class="icon-moon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
                <svg class="icon-sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            </button>
            ${user ? '<button class="btn btn--outline" id="logout" type="button"></button>'
                   : '<a href="login.html" class="btn btn--outline">Login / Sign Up</a>'}
            <button class="menu-toggle" id="menuToggle" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
        </div>`;

    if (user) {
        const btn = document.getElementById("logout");
        btn.textContent = `Keluar · ${user.name}`;
        btn.addEventListener("click", () => { localStorage.removeItem("twinkle_user"); location.href = "index.html"; });
    }

    const nav = document.getElementById("nav");
    const toggle = document.getElementById("menuToggle");
    toggle.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", nav.classList.toggle("is-open"));
    });

    /* ---------- Ganti tema (gelap / terang) ---------- */
    const root = document.documentElement;
    const themeBtn = document.getElementById("themeToggle");
    const syncTheme = () => themeBtn.setAttribute("aria-pressed", root.dataset.theme === "light");
    themeBtn.addEventListener("click", () => {
        root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
        try { localStorage.setItem("twinkle_theme", root.dataset.theme); } catch {}
        syncTheme();
    });
    syncTheme();

    /* ---------- Footer ---------- */
    document.getElementById("site-footer").innerHTML = `
        <span class="footer__brand">Twinkle Cam</span>
        <span>© ${new Date().getFullYear()} Twinkle Cam. Dibuat untuk momen bareng bestie.</span>`;
})();
