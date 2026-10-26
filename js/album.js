/* Album lokal (IndexedDB) */
/* ---------- album lokal (IndexedDB) ---------- */
const idb = () =>
  new Promise((ok, no) => {
    const r = indexedDB.open("twinkle-cam", 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      d.createObjectStore("meta", { keyPath: "id" });
      d.createObjectStore("files", { keyPath: "id" });
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
const req = (r) =>
  new Promise((ok, no) => {
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
const done2 = (t) =>
  new Promise((ok, no) => {
    t.oncomplete = ok;
    t.onerror = t.onabort = () => no(t.error);
  });
async function albumAdd(photo, gif, thumb, lay, vid, vext) {
  const d = await idb(),
    t = d.transaction(["meta", "files"], "readwrite"),
    id = Date.now();
  t.objectStore("meta").put({ id, t: id, lay, thumb, gif: !!gif, vid: !!vid });
  t.objectStore("files").put({ id, photo, gif, vid, vext });
  await done2(t);
  return id;
}
async function albumList() {
  const d = await idb();
  return (await req(d.transaction("meta").objectStore("meta").getAll())).reverse();
}
async function albumGet(id) {
  const d = await idb();
  return req(d.transaction("files").objectStore("files").get(id));
}
async function albumDel(id) {
  const d = await idb(),
    t = d.transaction(["meta", "files"], "readwrite");
  t.objectStore("meta").delete(id);
  t.objectStore("files").delete(id);
  await done2(t);
}
async function saveAlbum() {
  const b = $("#btnAlbum");
  b.disabled = true;
  try {
    if (!gifBlob || !vidBlob) toast("Menunggu video selesai…");
    await jobP;
    const pb = await new Promise((r) => cv.toBlob(r, "image/png")),
      t = document.createElement("canvas");
    t.width = 200;
    t.height = Math.round((200 * cv.height) / cv.width);
    t.getContext("2d").drawImage(cv, 0, 0, t.width, t.height);
    await albumAdd(pb, gifBlob, t.toDataURL("image/jpeg", 0.7), LAY[S.lay].name, vidBlob, vidExt);
    b.textContent = "Tersimpan ✓";
    toast("Tersimpan di album 🎉");
  } catch (e) {
    b.disabled = false;
    toast("Gagal menyimpan. Penyimpanan browser mungkin penuh atau diblokir.");
  }
}
async function buildAlbum() {
  const g = $("#albumGrid");
  let list = [];
  try {
    list = await albumList();
  } catch (e) {
    toast("Album tidak bisa dibuka di browser ini");
  }
  g.innerHTML = "";
  $("#albumEmpty").hidden = list.length > 0;
  $("#albumCount").textContent = list.length ? "(" + list.length + ")" : "";
  list.forEach((m) => {
    const b = document.createElement("button"),
      d = new Date(m.t).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    b.className = "ph";
    b.innerHTML = '<img alt="Foto ' + d + '"><span>' + d + (m.vid || m.gif ? " 🎬" : "") + "</span>";
    b.firstChild.src = m.thumb;
    b.onclick = () => openViewer(m.id);
    g.appendChild(b);
  });
}
let vid = null,
  vi = 0,
  vUrls = [],
  vItems = [];
function setV(i) {
  vi = i;
  const x = vItems[i],
    im = $("#vImg"),
    vv = $("#vVid");
  if (x.t === "vid") {
    im.hidden = true;
    vv.hidden = false;
    vv.src = x.u;
    vv.play().catch(() => {});
  } else {
    vv.pause();
    vv.hidden = true;
    vv.removeAttribute("src");
    im.hidden = false;
    im.src = x.u;
  }
  document
    .querySelectorAll("#vTabs button")
    .forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  $("#vDel").textContent = "🗑️ Hapus";
}
async function openViewer(id) {
  const f = await albumGet(id);
  if (!f) return;
  vUrls.forEach((u) => URL.revokeObjectURL(u));
  vItems = [{ l: "📷 Foto", b: f.photo, n: "twinkle-cam.png", t: "img" }];
  if (f.vid) vItems.push({ l: "🎬 Video", b: f.vid, n: "twinkle-cam." + (f.vext || "webm"), t: "vid" });
  if (f.gif) vItems.push({ l: "🎞️ GIF", b: f.gif, n: "twinkle-cam.gif", t: "img" });
  vItems.forEach((x) => (x.u = URL.createObjectURL(x.b)));
  vUrls = vItems.map((x) => x.u);
  vid = id;
  const tabs = $("#vTabs");
  tabs.innerHTML = "";
  tabs.hidden = vItems.length < 2;
  vItems.forEach((x, i) => {
    const b = document.createElement("button");
    b.textContent = x.l;
    b.onclick = () => setV(i);
    tabs.appendChild(b);
  });
  setV(0);
  $("#viewer").classList.add("on");
}
$("#vSave").onclick = () => dl(vItems[vi].u, vItems[vi].n);
$("#vClose").onclick = () => {
  $("#vVid").pause();
  $("#viewer").classList.remove("on");
};
$("#vDel").onclick = async (e) => {
  if (e.target.textContent.includes("Yakin")) {
    await albumDel(vid);
    $("#viewer").classList.remove("on");
    buildAlbum();
    toast("Foto dihapus");
  } else e.target.textContent = "Yakin hapus?";
};
$("#btnAlbum").onclick = saveAlbum;
