/* [REVISI CEPAT] Validasi form: fungsi validate/submit | Google: fungsi initGoogle() + verifyCredential() | Client ID: assets/js/config.js | Verifikasi server: api/google-verify.js */
/* TWINKLE CAM — Login / Sign Up (demo front-end) + Lanjutkan dengan Google */
const $ = (id) => document.getElementById(id);
let mode = "login";

/* Tujuan setelah login: ?next=<kunci halaman>, hanya halaman yang terdaftar */
const next = new URLSearchParams(location.search).get("next");
const destination = next && TC.hasPage(next) ? TC.link(next) : TC.link("home");

/* ---------- Email: wajib, dinormalkan, divalidasi ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normalizeEmail = (v) => String(v || "").trim().toLowerCase();
const validEmail = (v) => v.length <= 254 && EMAIL_RE.test(v);

/* Menyimpan sesi. HANYA data minimum (nama, email, foto profil, penyedia). Tidak ada password dan tidak ada token Google yang disimpan. */
function saveSession({ name, email, picture = "", provider }) {
    TC.store.set("twinkle_user", { name: String(name).slice(0, 80), email, picture, provider });
    location.href = destination;
}

/* ---------- Tab Login | Sign Up ---------- */
document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
        mode = tab.dataset.mode;
        document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t === tab));
        $("nameField").hidden = mode !== "signup";
        $("submitBtn").textContent = mode === "signup" ? "Buat akun" : "Login";
        $("password").autocomplete = mode === "signup" ? "new-password" : "current-password";
        $("formError").textContent = "";
        $("googleError").textContent = "";
        renderGoogleButton(); // teks tombol Google ikut berubah (Masuk / Daftar)
    }),
);

/* ---------- Form email + password ---------- */
$("authForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("name").value.trim(),
        email = normalizeEmail($("email").value),
        pass = $("password").value;

    let error = "";
    if (mode === "signup" && !name) error = "Isi nama dulu ya.";
    else if (!email) error = "Email wajib diisi.";
    else if (!validEmail(email)) error = "Format email belum benar.";
    else if (pass.length < 6) error = "Password minimal 6 karakter.";
    $("formError").textContent = error;
    if (error) return;

    saveSession({ name: name || email.split("@")[0], email, provider: "email" });
});

/* =========================================================
   LOGIN DENGAN GOOGLE (Google Identity Services)
   Alur: tombol Google -> Google mengirim ID token (JWT) ke handleCredential()
         -> verifyCredential(): coba server (/api/google-verify), jika API tidak ada pakai pemeriksaan di browser
         -> email WAJIB ada dan terverifikasi -> saveSession().
   ========================================================= */
const GOOGLE_ID = (window.TC_CONFIG && window.TC_CONFIG.googleClientId) || "";
let gsiReady = false;

/* Membaca payload JWT (tanpa memeriksa tanda tangan: hanya untuk cadangan di browser) */
function decodeJwt(token) {
    const part = String(token).split(".")[1] || "";
    const bin = atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "="));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
}

/* Memeriksa isi token: aud, iss, exp, dan email terverifikasi. Melempar Error berisi pesan ramah jika gagal. */
function checkClaims(t) {
    const issOk = t.iss === "accounts.google.com" || t.iss === "https://accounts.google.com";
    if (t.aud !== GOOGLE_ID || !issOk || !(Number(t.exp) * 1000 > Date.now())) throw new Error("Login Google tidak valid atau kedaluwarsa. Coba lagi.");
    const email = normalizeEmail(t.email);
    if (!email || !validEmail(email)) throw new Error("Akun Google ini tidak punya email. Email wajib untuk membuat akun.");
    if (t.email_verified !== true && t.email_verified !== "true") throw new Error("Email akun Google belum terverifikasi.");
    return { name: t.name || email.split("@")[0], email, picture: typeof t.picture === "string" && t.picture.startsWith("https://") ? t.picture : "" };
}

/* Verifikasi token. Utama: server (tanda tangan Google dicek di sana). Cadangan: pemeriksaan klaim di browser. */
async function verifyCredential(credential) {
    try {
        const r = await fetch("/api/google-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ credential }),
        });
        if (r.ok) {
            const u = await r.json();
            const email = normalizeEmail(u.email);
            if (!validEmail(email)) throw new Error("Akun Google ini tidak punya email. Email wajib untuk membuat akun.");
            return { name: u.name || email.split("@")[0], email, picture: u.picture || "" };
        }
        if (r.status === 401 || r.status === 403) throw new Error("Login Google ditolak server. Coba lagi.");
        /* 404/5xx: API belum dipasang (hosting statis) -> pakai cadangan */
    } catch (e) {
        if (e instanceof Error && /^(Login|Akun)/.test(e.message)) throw e;
    }
    return checkClaims(decodeJwt(credential));
}

/* Callback dari Google */
async function handleCredential(response) {
    const box = $("googleError");
    box.textContent = "";
    try {
        const user = await verifyCredential(response.credential);
        saveSession({ ...user, provider: "google" });
    } catch (e) {
        box.textContent = e.message || "Login Google gagal. Coba lagi.";
    }
}

/* Menampilkan tombol Google. Tanpa Client ID: tombol cadangan yang menjelaskan cara mengaktifkan. */
function renderGoogleButton() {
    const holder = $("googleBtn");
    holder.innerHTML = "";
    if (gsiReady && window.google && google.accounts && google.accounts.id) {
        google.accounts.id.renderButton(holder, {
            theme: "filled_black",
            size: "large",
            shape: "pill",
            width: Math.min(holder.parentElement.clientWidth || 320, 400),
            text: mode === "signup" ? "signup_with" : "signin_with",
            logo_alignment: "left",
        });
        return;
    }
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn--outline btn--block btn--google";
    b.textContent = mode === "signup" ? "Daftar dengan Google" : "Lanjutkan dengan Google";
    b.addEventListener("click", () => {
        $("googleError").textContent = GOOGLE_ID
            ? "Layanan Google belum termuat. Cek koneksi internet lalu muat ulang halaman."
            : "Login Google belum diaktifkan: isi googleClientId di assets/js/config.js (lihat PANDUAN-REVISI.md).";
    });
    holder.appendChild(b);
}

/* Memuat skrip Google hanya jika Client ID sudah diisi */
function initGoogle() {
    renderGoogleButton();
    if (!GOOGLE_ID) return;
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => {
        google.accounts.id.initialize({ client_id: GOOGLE_ID, callback: handleCredential, auto_select: false, cancel_on_tap_outside: true });
        gsiReady = true;
        renderGoogleButton();
    };
    document.head.appendChild(s);
}
initGoogle();
