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
        <a href="index.html" class="logo" aria-label="Twinkle Cam, ke Beranda">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></svg>
        </a>
        <nav class="nav" id="nav" aria-label="Navigasi utama">${links}</nav>
        <div class="header__right">
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

    /* ---------- Footer ---------- */
    document.getElementById("site-footer").innerHTML = `
        <span class="footer__brand">Twinkle Cam</span>
        <span>© ${new Date().getFullYear()} Twinkle Cam. Dibuat untuk momen bareng bestie.</span>`;
})();
