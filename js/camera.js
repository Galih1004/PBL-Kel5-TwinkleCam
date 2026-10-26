/* Halaman 2: kamera, jepret, timer, retake, unggah foto */
/* ---------- halaman 2: jepret ---------- */
function buildSlots() {
  const t = $("#thumbs");
  t.innerHTML = "";
  for (let i = 0; i < cnt(); i++) {
    const d = document.createElement("div"),
      has = !!S.photos[i];
    d.className = "slot" + (has ? " ok" : "");
    if (has) {
      const c = document.createElement("canvas");
      c.width = 160;
      c.height = 120;
      c.getContext("2d").drawImage(S.photos[i], 0, 0, 160, 120);
      d.appendChild(c);
      const x = document.createElement("button");
      x.type = "button";
      x.className = "rt";
      x.textContent = "✕";
      x.title = "Ulangi foto " + (i + 1);
      x.setAttribute("aria-label", "Ulangi foto " + (i + 1));
      x.onclick = (e) => {
        e.stopPropagation();
        shoot(i);
      };
      d.appendChild(x);
    }
    const s = document.createElement("b");
    s.textContent = has ? i + 1 : "+" + (i + 1);
    d.appendChild(s);
    t.appendChild(d);
  }
  const dn = done();
  $("#btnNext").disabled = !dn;
  $("#btnNext").classList.toggle("pulse", dn);
  $("#btnRetakeLast").disabled = !S.photos.some((p, i) => p && i < cnt());
  {
    const f = S.photos.filter(Boolean).length;
    $("#prog").textContent = f + "/" + cnt() + " foto";
    $("#barI").style.width = (100 * f) / cnt() + "%";
  }
}
async function shoot(i) {
  if (!stream) {
    toast("Nyalakan kamera dulu, atau unggah foto ya");
    return;
  }
  if (S.busy) return;
  S.busy = true;
  S.cancel = false;
  const c = $("#count"),
    cam = $("#cam"),
    clip = [],
    vw = video.videoWidth,
    vh = video.videoHeight;
  document.body.classList.add("shooting");
  cam.classList.add("busy");
  const end = () => {
    c.classList.remove("on");
    $("#pose").classList.remove("on");
    cam.classList.remove("busy");
    document.body.classList.remove("shooting");
    S.busy = false;
    S.cancel = false;
  };
  if (S.tips) {
    let k;
    do {
      k = (Math.random() * POSE.length) | 0;
    } while (k === lastPose);
    lastPose = k;
    $("#pose").textContent = "💡 " + POSE[k];
    $("#pose").classList.add("on");
  }
  for (let t = S.timer; t > 0; t--) {
    c.textContent = t;
    c.classList.remove("on");
    void c.offsetWidth;
    c.classList.add("on");
    if (t > 1) {
      if (await waitC(1000)) {
        end();
        toast("Dibatalkan");
        return false;
      }
    } else
      for (let k = 0; k < M; k++) {
        clip.push(grab(video, vw, vh, S.mirror));
        if (await waitC(80)) {
          end();
          toast("Dibatalkan");
          return false;
        }
      }
  }
  c.classList.remove("on");
  $("#pose").classList.remove("on");
  const f = $("#flash");
  f.classList.add("on");
  const photo = grab(video, vw, vh, S.mirror);
  S.photos[i] = photo;
  clip.push(photo);
  S.clips[i] = clip;
  await sleep(80);
  f.classList.remove("on");
  end();
  buildSlots();
  return true;
}
async function auto() {
  if (!stream) return toast("Nyalakan kamera dulu ya");
  if (done()) return toast("Semua foto sudah terisi. Ketuk ✕ di foto untuk mengulang");
  for (let i = 0; i < cnt(); i++) {
    if (!S.photos[i]) {
      const ok = await shoot(i);
      if (ok === false) return;
      await sleep(600);
    }
  }
  toast("Semua foto masuk! Lanjut hias ✨");
}
async function startCam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: S.facing || "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
    video.srcObject = stream;
    $("#hint").style.display = "none";
    $("#btnAuto").disabled = false;
    $("#btnCam").textContent = "Kamera nyala ✓";
  } catch (e) {
    toast("Kamera tidak bisa dibuka");
    const h = $("#hint");
    h.style.display = "";
    h.innerHTML =
      "<b>🚫</b>Kamera belum diizinkan. Klik ikon gembok di address bar, izinkan kamera, lalu tekan Nyalakan kamera. Atau pakai Unggah foto.";
  }
}
function stopCam() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  $("#hint").style.display = "";
  $("#hint").innerHTML = "<b>📷</b>Izinkan akses kamera saat browser meminta, atau unggah foto.";
  $("#btnAuto").disabled = true;
  $("#btnCam").textContent = "Nyalakan kamera";
}

$("#btnCam").onclick = startCam;
$("#btnAuto").onclick = auto;
$("#file").onchange = async (e) => {
  const n = cnt();
  let idx = 0;
  for (const f of e.target.files) {
    while (idx < n && S.photos[idx]) idx++;
    if (idx >= n) idx = n - 1;
    const img = new Image();
    img.src = URL.createObjectURL(f);
    await img.decode();
    S.photos[idx] = grab(img, img.naturalWidth, img.naturalHeight, false);
    S.clips[idx] = null;
    idx++;
  }
  e.target.value = "";
  buildSlots();
};
$("#btnMirror").onclick = (e) => {
  S.mirror = !S.mirror;
  e.target.setAttribute("aria-pressed", String(S.mirror));
  e.target.textContent = "🪞 Cermin: " + (S.mirror ? "nyala" : "mati");
  $("#cam").classList.toggle("nomirror", !S.mirror);
};
$("#btnTips").onclick = (e) => {
  S.tips = !S.tips;
  e.target.setAttribute("aria-pressed", String(S.tips));
  e.target.textContent = "💡 Ide pose: " + (S.tips ? "nyala" : "mati");
};
$("#btnCancel").onclick = () => {
  S.cancel = true;
};
$("#btnRetakeLast").onclick = () => {
  let k = -1;
  S.photos.forEach((p, i) => {
    if (p && i < cnt()) k = i;
  });
  if (k >= 0) shoot(k);
};
$("#btnReset").onclick = () => {
  S.photos = [];
  S.clips = [];
  buildSlots();
};
$("#btnNew").onclick = () => {
  S.photos = [];
  S.clips = [];
  S.free = [];
  S.sel = null;
  location.hash = "#/setup";
};
