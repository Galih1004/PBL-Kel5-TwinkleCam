/* Helper UI: modal sederhana yang dipakai preview, puzzle, dan dialog QR */
function openModal(cls) {
  const bg = document.createElement("div");
  bg.className = "tc-modal";
  const box = document.createElement("div");
  box.className = "tc-box card " + (cls || "");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  bg.appendChild(box);
  document.body.appendChild(bg);
  return { box, close: () => bg.remove() };
}

function setMirror(v) {
  S.mirror = v;
  const b = $("#btnMirror");
  b.setAttribute("aria-pressed", String(v));
  b.textContent = "🪞 Cermin: " + (v ? "nyala" : "mati");
  $("#cam").classList.toggle("nomirror", !v);
}
