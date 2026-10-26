/* Stiker gambar (SVG bawaan) dan unggah stiker sendiri, ditempel lewat sistem stiker bebas yang sudah ada */
const svgUrl = (body) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100">${body}</svg>`);
const T = (txt, size, fill, y = 56) =>
  `<text x="50" y="${y}" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${size}" text-anchor="middle" fill="${fill}">${txt}</text>`;
const STK = [
  { n: "Hati", b: '<path d="M50 88C10 58 8 28 28 18c12-6 22 2 22 12 0-10 10-18 22-12 20 10 18 40-22 70z" fill="#ff5fa2" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>' },
  { n: "Bintang", b: '<path d="M50 6l13 28 30 4-22 21 6 30-27-15-27 15 6-30L7 38l30-4z" fill="#ffd84d" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>' },
  { n: "Kilau", b: '<path d="M50 4C54 34 66 46 96 50 66 54 54 66 50 96 46 66 34 54 4 50 34 46 46 34 50 4z" fill="#fff" stroke="#b9a6ff" stroke-width="4"/>' },
  { n: "Mahkota", b: '<path d="M10 78V32l22 20 18-34 18 34 22-20v46z" fill="#ffd84d" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="64" r="6" fill="#ff5fa2"/>' },
  { n: "Wow", b: '<path d="M12 18h76a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6H44L26 86V66H12a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" fill="#fff" stroke="#6c5ce7" stroke-width="4"/>' + T("WOW!", 24, "#ff5fa2", 50) },
  { n: "BFF", b: '<rect x="6" y="28" width="88" height="44" rx="22" fill="#b9a6ff" stroke="#fff" stroke-width="5"/>' + T("BFF", 26, "#fff", 59) },
  { n: "Awan", b: '<path d="M26 74a18 18 0 0 1-2-36 24 24 0 0 1 46-6 20 20 0 0 1 6 40z" fill="#fff" stroke="#8fd3ff" stroke-width="5" stroke-linejoin="round"/>' },
  { n: "Pelangi", b: '<g fill="none" stroke-width="9"><path d="M8 80a42 42 0 0 1 84 0" stroke="#ff5f7a"/><path d="M18 80a32 32 0 0 1 64 0" stroke="#ffd84d"/><path d="M28 80a22 22 0 0 1 44 0" stroke="#7ce0a3"/><path d="M38 80a12 12 0 0 1 24 0" stroke="#8fd3ff"/></g>' },
  { n: "Pita", b: '<path d="M50 50L12 30v40zM50 50l38-20v40z" fill="#ff8fc1" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="50" r="10" fill="#ff5fa2" stroke="#fff" stroke-width="4"/>' },
  { n: "Senyum", b: '<circle cx="50" cy="50" r="42" fill="#ffd84d" stroke="#fff" stroke-width="5"/><circle cx="36" cy="42" r="5" fill="#2d1b69"/><circle cx="64" cy="42" r="5" fill="#2d1b69"/><path d="M30 60q20 22 40 0" fill="none" stroke="#2d1b69" stroke-width="5" stroke-linecap="round"/>' },
].map((s) => ({ n: s.n, u: svgUrl(s.b) }));

function addFreeImg(img) {
  if (S.free.length >= 40) return toast("Maksimal 40 stiker ya");
  const { w, h } = dims();
  S.free.push({
    img,
    x: w / 2 + (Math.random() - 0.5) * 120,
    y: h / 2 + (Math.random() - 0.5) * 160,
    s: Math.round(Math.max(150, 60 * rat())),
    r: (Math.random() - 0.5) * 0.4,
  });
  S.sel = S.free.length - 1;
  render();
}
const loadImg = (src) =>
  new Promise((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = no;
    i.src = src;
  });

function addImageStickerPanel() {
  const o = $("#opts");
  const head = document.createElement("p");
  head.className = "hint2";
  head.style.cssText = "grid-column:1/-1;margin-top:10px";
  head.textContent = "Stiker gambar, atau unggah gambar sendiri (PNG transparan paling bagus):";
  o.appendChild(head);
  STK.forEach((s) => {
    const b = document.createElement("button");
    b.className = "emo";
    b.setAttribute("aria-label", "Tempel stiker " + s.n);
    b.innerHTML = `<img alt="" src="${s.u}">`;
    b.onclick = async () => addFreeImg(await loadImg(s.u));
    o.appendChild(b);
  });
  const up = document.createElement("label");
  up.className = "btn sm";
  up.style.gridColumn = "1/-1";
  up.innerHTML = '📁 Unggah stiker sendiri<input type="file" accept="image/*" hidden>';
  up.querySelector("input").onchange = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      addFreeImg(await loadImg(URL.createObjectURL(f)));
    } catch (err) {
      toast("Gambar tidak bisa dibuka");
    }
  };
  o.appendChild(up);
}

/* sambungkan ke panel hias: tab Efek, dan stiker gambar di tab Tempel */
const _buildOpts = buildOpts;
buildOpts = function () {
  if (S.tab === "ef") return buildFx();
  _buildOpts();
  if (S.tab === "fs") addImageStickerPanel();
};
