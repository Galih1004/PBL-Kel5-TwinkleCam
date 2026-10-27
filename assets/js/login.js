/* TWINKLE CAM — Login / Sign Up (demo, tanpa server) */
let mode = "login";
const $ = (id) => document.getElementById(id);

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
    mode = tab.dataset.mode;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t === tab));
    $("nameField").hidden = mode !== "signup";
    $("submitBtn").textContent = mode === "signup" ? "Buat akun" : "Login";
    $("password").autocomplete = mode === "signup" ? "new-password" : "current-password";
    $("formError").textContent = "";
}));

$("authForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("name").value.trim(), email = $("email").value.trim(), pass = $("password").value;
    let error = "";
    if (mode === "signup" && !name) error = "Isi nama dulu ya.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) error = "Format email belum benar.";
    else if (pass.length < 6) error = "Password minimal 6 karakter.";
    $("formError").textContent = error;
    if (error) return;

    TC.store.set("twinkle_user", { name: name || email.split("@")[0], email });
    location.href = "index.html";
});
