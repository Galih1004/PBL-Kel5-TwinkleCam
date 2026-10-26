/* Halaman 4: hasil dan unduhan */
function showResult() {
  S.sel = null;
  render(false);
  $("#btnAlbum").disabled = false;
  $("#btnAlbum").textContent = "💾 Simpan ke album";
  $("#out").src = cv.toDataURL("image/png");
  jobP = (async () => {
    try {
      await makeVideo();
    } catch (e) {
      console.error(e);
      $("#vidBox").textContent = "Video gagal dibuat. Foto dan GIF tetap bisa diunduh.";
    }
    try {
      await makeGif();
    } catch (e) {
      console.error(e);
      $("#gifBox").textContent = "GIF gagal dibuat.";
    }
  })();
}

function outUrl() {
  const v = $("#size").value;
  if (v === "0") return cv.toDataURL("image/png");
  let [tw, th] = v.split("x").map(Number);
  if (cv.width > cv.height !== tw > th) [tw, th] = [th, tw];
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const g = c.getContext("2d");
  if (LAY[S.lay].tpl) {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, tw, th);
  } else back(g, curFr(), tw, th);
  const m = Math.round(Math.min(tw, th) * 0.03),
    s = Math.min((tw - 2 * m) / cv.width, (th - 2 * m) / cv.height),
    dw = cv.width * s,
    dh = cv.height * s;
  g.imageSmoothingQuality = "high";
  g.drawImage(cv, (tw - dw) / 2, (th - dh) / 2, dw, dh);
  return c.toDataURL("image/png");
}
const dl = (u, n) => {
  const a = document.createElement("a");
  a.href = u;
  a.download = n;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
$("#btnSave").onclick = () => dl(outUrl(), "twinkle-cam-" + $("#size").value + ".png");
$("#btnGif").onclick = () => gifUrl && dl(gifUrl, "twinkle-cam.gif");
$("#btnShare").onclick = async () => {
  try {
    const b = await (await fetch(outUrl())).blob(),
      f = new File([b], "twinkle-cam.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [f] }))
      await navigator.share({ files: [f], title: "Twinkle Cam" });
    else toast("Perangkat ini belum mendukung bagikan langsung. Pakai tombol Unduh ya");
  } catch (e) {}
};
$("#btnVid").onclick = () => vidUrl && dl(vidUrl, "twinkle-cam." + vidExt);
