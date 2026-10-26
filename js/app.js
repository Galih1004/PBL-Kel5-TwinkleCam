/* Router halaman, tema, PWA, dan inisialisasi */
/* ---------- navigasi antar halaman ---------- */
const VIEWS = ["home", "setup", "shoot", "edit", "result", "album", "terima"];
function route() {
  let note = "";
  let [v, arg] = location.hash.slice(2).split("/");
  v = v || "";
  if (!VIEWS.includes(v)) v = "home";
  if ((v === "edit" || v === "result") && !done()) {
    v = "shoot";
    note = "Selesaikan semua foto dulu ya 📸";
    history.replaceState(null, "", "#/shoot");
  }
  if (prevV === "shoot" && v !== "shoot") stopCam();
  if (prevV === "result" && v !== "result") {
    vidTk++;
    gifTk++;
    $("#qrModal").classList.remove("on");
    closePeer();
  }
  if (prevV === "terima" && v !== "terima") closePeer();
  VIEWS.forEach((x) => ($("#v-" + x).hidden = x !== v));
  document.body.dataset.view = v;
  const at = VIEWS.indexOf(v) - 1;
  document
    .querySelectorAll("#steps li")
    .forEach((li, i) => (li.className = i === at ? "on" : i < at ? "past" : ""));
  try {
    if (v === "setup") {
      buildLays();
      setupTab(!!LAY[S.lay].tpl);
    }
    if (v === "shoot") {
      buildSlots();
      if (!stream) startCam();
    }
    if (v === "edit") {
      buildTabs();
      render();
    }
    if (v === "result") showResult();
    if (v === "album") buildAlbum();
    if (v === "terima") startReceive(arg);
  } catch (e) {
    console.error(e);
    note = "Ups, ada kendala" + (e && e.name ? " (" + e.name + ")" : "") + ". Coba ulangi ya";
  }
  prevV = v;
  scrollTo(0, 0);
  $("#toast").classList.remove("on");
  if (note) toast(note);
}
addEventListener("hashchange", route);
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]");
  if (g && !g.disabled) location.hash = "#/" + g.dataset.go;
});

/* ---------- galeri template, statistik, tema ---------- */
function buildGallery() {
  if (typeof TPL === "undefined") return;
  const g = $("#gal");
  TPL.forEach((t) => {
    const b = document.createElement("button");
    b.className = "gcard";
    b.innerHTML = '<img alt="" loading="lazy"><b></b><small></small>';
    b.querySelector("img").src = t.src;
    b.querySelector("b").textContent = t.name;
    b.querySelector("small").textContent = t.slots.length + " foto";
    b.onclick = () => {
      const k = "t_" + t.id;
      if (LAY[k].n !== cnt()) {
        S.photos = [];
        S.clips = [];
      }
      S.lay = k;
      S.zoom = 1.3;
      S.grow = 1;
      tplImg(t);
      location.hash = "#/setup";
    };
    g.appendChild(b);
  });
  $("#stT").textContent = TPL.length;
}
$("#stF").textContent = FR.length;
$("#stI").textContent = FI.length;
buildGallery();
$("#btnTheme").onclick = () => {
  const r = document.documentElement,
    cur = r.dataset.theme || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light"),
    nx = cur === "dark" ? "light" : "dark";
  r.dataset.theme = nx;
  try {
    localStorage.setItem("tc-theme", nx);
  } catch (e) {}
  document.querySelector("meta[name=theme-color]").content = nx === "dark" ? "#0d0a22" : "#6c5ce7";
};
/* ---------- PWA ---------- */
let dip = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  dip = e;
  $("#btnInstall").hidden = false;
});
$("#btnInstall").onclick = async () => {
  if (!dip) return;
  dip.prompt();
  await dip.userChoice;
  dip = null;
  $("#btnInstall").hidden = true;
};
addEventListener("appinstalled", () => {
  $("#btnInstall").hidden = true;
  toast("Twinkle Cam terpasang 🎉");
});
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone) $("#iosHint").hidden = false;
if ("serviceWorker" in navigator && isSecureContext)
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
if (document.fonts)
  CAPF.forEach((f) =>
    document.fonts
      .load(f.w + ' 24px "' + f.n + '"')
      .then(() => {
        if (document.body.dataset.view === "edit") render();
      })
      .catch(() => {}),
  );
if (location.protocol === "file:") $("#fileNote").hidden = false;
setTimer(5);
route();
