/* Halaman 1: pilih tata letak dan timer */
/* ---------- halaman 1: pilih ---------- */
function buildLays() {
  const b = $("#lays"),
    tb = $("#tpls");
  b.innerHTML = "";
  tb.innerHTML = "";
  Object.entries(LAY).forEach(([k, L]) => {
    const x = document.createElement("button");
    x.className = "lay";
    x.setAttribute("aria-pressed", String(S.lay === k));
    x.innerHTML = L.tpl
      ? `<img class="tt" src="${L.tpl.src}" alt=""><b>${L.name}</b><small>${L.n} foto</small>`
      : `<i class="mini" style="--c:${L.c}">${"<u></u>".repeat(L.dup ? L.n * 2 : L.n)}</i><b>${L.name}</b><small>${L.n} foto</small>`;
    x.onclick = () => {
      if (LAY[k].n !== cnt()) {
        S.photos = [];
        S.clips = [];
      }
      S.lay = k;
      S.zoom = LAY[k].tpl ? 1.3 : 1;
      S.grow = 1;
      if (LAY[k].tpl) tplImg(LAY[k].tpl);
      buildLays();
    };
    (L.tpl ? tb : b).appendChild(x);
  });
}
function setTimer(v) {
  S.timer = v;
  document
    .querySelectorAll("[data-timer]")
    .forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.timer === v)));
}
document.querySelectorAll("[data-timer]").forEach((b) => (b.onclick = () => setTimer(+b.dataset.timer)));

function setupTab(t) {
  $("#lays").hidden = t;
  $("#tpls").hidden = !t;
  $("#tabLay").setAttribute("aria-pressed", String(!t));
  $("#tabTpl").setAttribute("aria-pressed", String(t));
}
$("#tabLay").onclick = () => setupTab(false);
$("#tabTpl").onclick = () => setupTab(true);
