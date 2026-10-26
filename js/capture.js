/* Alur setelah jepret: preview per foto (Pakai/Ulangi), gerbang mode puzzle, dan tombol tambahan kamera */

/* preview satu foto. Mengembalikan "ok", "retry", atau "cancel". Otomatis "ok" setelah 3 detik. */
function previewPhoto(photo) {
  return new Promise((resolve) => {
    const { box, close } = openModal("pv");
    box.innerHTML = `
      <h2>Fotonya begini, oke? 😍</h2>
      <img alt="Preview foto">
      <div class="tc-timer"><i></i></div>
      <div class="row" style="justify-content:center">
        <button class="pri" data-a="ok">✓ Pakai</button>
        <button data-a="retry">↻ Ulangi</button>
        <button class="ghost" data-a="cancel">Batal</button>
      </div>`;
    const img = box.querySelector("img");
    img.src = photo.toDataURL("image/jpeg", 0.85);
    img.style.filter = FI[S.fi].css;
    let t;
    const end = (a) => {
      clearTimeout(t);
      close();
      resolve(a);
    };
    box.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => end(b.dataset.a)));
    box.querySelector(".tc-timer i").style.animationDuration = "3s";
    t = setTimeout(() => end("ok"), 3000);
  });
}

/* bungkus shoot() bawaan: foto baru harus lolos preview (klasik) atau puzzle (mode puzzle) */
const rawShoot = shoot;
shoot = async function (i) {
  const before = S.photos[i],
    beforeClips = S.clips[i];
  const restore = () => {
    S.photos[i] = before;
    S.clips[i] = beforeClips;
    buildSlots();
  };
  for (;;) {
    const r = await rawShoot(i);
    if (r === false) return false; /* dibatalkan lewat tombol Batal */
    const photo = S.photos[i];
    if (!photo || photo === before) return r; /* tidak ada foto baru (kamera mati / sedang sibuk) */
    if (S.mode === "puzzle") {
      const clips = S.clips[i];
      S.photos[i] = undefined; /* belum dihitung selesai sebelum puzzle beres */
      buildSlots();
      if (await solvePuzzle(photo)) {
        S.photos[i] = photo;
        S.clips[i] = clips;
        buildSlots();
        return true;
      }
      restore();
      return false;
    }
    if (!S.preview) return true;
    const a = await previewPhoto(photo);
    if (a === "ok") return true;
    restore();
    if (a === "cancel") return false;
  }
};

/* foto unggahan juga harus lewat puzzle di mode puzzle */
const rawUpload = $("#file").onchange;
$("#file").onchange = async function (e) {
  const before = S.photos.slice();
  await rawUpload.call(this, e);
  if (S.mode !== "puzzle") return;
  for (let i = 0; i < cnt(); i++) {
    const p = S.photos[i];
    if (!p || p === before[i]) continue;
    S.photos[i] = undefined;
    buildSlots();
    if (await solvePuzzle(p)) S.photos[i] = p;
    else S.photos[i] = before[i];
    buildSlots();
  }
};

/* info mode di panel foto */
const _buildSlots = buildSlots;
buildSlots = function () {
  _buildSlots();
  const t = document.querySelector(".side .tiny");
  if (t) {
    t.dataset.base = t.dataset.base || t.textContent;
    t.textContent = t.dataset.base + (S.mode === "puzzle" ? " Mode puzzle: tiap foto harus disusun dulu." : "");
  }
};

/* tombol tambahan di bawah kamera */
(function addCameraControls() {
  const row = $("#btnMirror").parentNode;
  const mk = (id, text, fn) => {
    const b = document.createElement("button");
    b.id = id;
    b.className = "chip";
    b.textContent = text;
    b.onclick = fn;
    row.appendChild(b);
    return b;
  };
  const prev = mk("btnPrev", "🔍 Preview foto: nyala", () => {
    S.preview = !S.preview;
    prev.setAttribute("aria-pressed", String(S.preview));
    prev.textContent = "🔍 Preview foto: " + (S.preview ? "nyala" : "mati");
  });
  prev.setAttribute("aria-pressed", "true");
  mk("btnFlip", "🔄 Ganti kamera", async () => {
    if (remote.stream) return toast("Kamera HP: pakai tombol Ganti kamera di layar HP");
    S.facing = S.facing === "user" ? "environment" : "user";
    setMirror(S.facing === "user");
    stopCam();
    await startCam();
  });
  mk("btnPhone", "📱 HP jadi kamera", () => openRemoteHost());
})();
