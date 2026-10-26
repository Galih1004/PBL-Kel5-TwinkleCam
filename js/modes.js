/* Mode permainan. Untuk menambah mode baru, cukup daftarkan di MODES lalu tangani di capture.js */
Object.assign(S, { mode: "classic", pz: 3, preview: true, facing: "user", efx: [] });

const MODES = {
  classic: { name: "📸 Klasik", desc: "Jepret, lihat preview, lalu langsung hias." },
  puzzle: { name: "🧩 Puzzle", desc: "Setiap foto harus disusun dulu dari kepingan acak sebelum bisa dipakai." },
};
const PZ_LEVELS = [
  [3, "Mudah 3×3"],
  [4, "Sedang 4×4"],
  [5, "Sulit 5×5"],
];

function buildModes() {
  const box = $("#modeBox");
  box.innerHTML = "<h3>🎮 Pilih mode</h3>";
  const mk = (items, isOn, pick) => {
    const seg = document.createElement("div");
    seg.className = "seg wide";
    items.forEach(([k, label]) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.setAttribute("aria-pressed", String(isOn(k)));
      b.onclick = () => {
        pick(k);
        buildModes();
      };
      seg.appendChild(b);
    });
    return seg;
  };
  const desc = document.createElement("p");
  desc.className = "muted";
  desc.textContent = MODES[S.mode].desc;
  box.append(
    mk(Object.entries(MODES).map(([k, m]) => [k, m.name]), (k) => S.mode === k, (k) => (S.mode = k)),
    desc
  );
  if (S.mode === "puzzle") box.appendChild(mk(PZ_LEVELS, (k) => S.pz === k, (k) => (S.pz = k)));
}

/* tampilkan pilihan mode setiap halaman "Pilih" dibangun */
const _buildLays = buildLays;
buildLays = function () {
  _buildLays();
  buildModes();
};
