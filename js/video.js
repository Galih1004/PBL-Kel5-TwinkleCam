/* Perekaman video hasil (MediaRecorder) */
/* ---------- halaman 4: simpan ---------- */
/* ---------- video (MediaRecorder) ---------- */
function pickMimes() {
  if (!window.MediaRecorder) return [];
  const ok = (l) => l.find((t) => MediaRecorder.isTypeSupported(t));
  return [
    ok([
      "video/mp4;codecs=avc1.42E01F",
      "video/mp4;codecs=avc1.4D401F",
      "video/mp4;codecs=avc1.640028",
      "video/mp4",
    ]),
    ok(["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]),
  ].filter(Boolean);
}
async function recordOnce(mime, T, w, h, vw, vh, tk, box) {
  const n = cnt(),
    mk = (a, b) => {
      const c = document.createElement("canvas");
      c.width = a;
      c.height = b;
      return c;
    };
  const full = mk(w, h),
    fc = full.getContext("2d"),
    rec = mk(vw, vh),
    rc = rec.getContext("2d");
  const draw = (s, i) => {
    T ? paintT(fc, T, i, s) : paintOne(fc, s, i);
    rc.drawImage(full, 0, 0, vw, vh);
  };
  const stream = rec.captureStream(30),
    chunks = [];
  let failed = false;
  const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4e6 });
  mr.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  mr.onerror = () => {
    failed = true;
  };
  const stopped = new Promise((r) => (mr.onstop = r)),
    end = () => {
      try {
        mr.stop();
      } catch (e) {}
      stream.getTracks().forEach((t) => t.stop());
    };
  draw(S.clips[0] ? S.clips[0][0] : S.photos[0], 0);
  mr.start(250);
  for (let i = 0; i < n; i++) {
    const cl = S.clips[i];
    if (cl)
      for (let k = 0; k < cl.length; k++) {
        draw(cl[k], i);
        await sleep(k === cl.length - 1 ? 1000 : 80);
      }
    else {
      draw(S.photos[i], i);
      await sleep(1300);
    }
    load(box, "Merekam video… " + (i + 1) + "/" + n);
    if (tk !== vidTk) {
      end();
      return null;
    }
  }
  await sleep(250);
  end();
  await Promise.race([stopped, sleep(4000)]);
  const blob = new Blob(chunks, { type: (chunks[0] && chunks[0].type) || mime.split(";")[0] });
  return failed || blob.size < 2000 ? undefined : blob;
}
async function makeVideo() {
  const tk = ++vidTk,
    box = $("#vidBox"),
    btn = $("#btnVid"),
    list = pickMimes();
  btn.disabled = true;
  vidBlob = null;
  vidUrl = null;
  if (!list.length) {
    box.textContent = "Browser ini belum mendukung perekaman video. Pakai GIF ya.";
    return;
  }
  load(box, "Merekam video… tetap di halaman ini ya");
  await sleep(60);
  const T = LAY[S.lay].tpl,
    w = T ? T.w : P * 2 + W,
    h = T ? T.h : P + H + FF(),
    sc = Math.min(1, 720 / w, 1000 / h),
    vw = Math.round((w * sc) / 2) * 2,
    vh = Math.round((h * sc) / 2) * 2;
  let blob;
  for (const mime of list) {
    try {
      blob = await recordOnce(mime, T, w, h, vw, vh, tk, $("#vidBox"));
    } catch (e) {
      console.warn("rekam gagal", mime, e);
      blob = undefined;
    }
    if (blob === null) return;
    if (blob) break;
  }
  if (tk !== vidTk) return;
  if (!blob) {
    box.textContent = "Video belum bisa dibuat di perangkat ini. Foto dan GIF tetap bisa diunduh.";
    return;
  }
  vidExt = blob.type.includes("mp4") ? "mp4" : "webm";
  vidBlob = blob;
  vidUrl = URL.createObjectURL(blob);
  box.innerHTML = "";
  const v = document.createElement("video");
  v.src = vidUrl;
  v.controls = true;
  v.loop = true;
  v.muted = true;
  v.autoplay = true;
  v.playsInline = true;
  box.appendChild(v);
  v.play().catch(() => {});
  $("#vidExt").textContent = vidExt.toUpperCase();
  btn.disabled = false;
}
