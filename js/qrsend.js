/* Kirim hasil ke HP lewat QR (WebRTC/PeerJS) dan halaman terima */
/* ---------- Kirim ke HP: QR + transfer langsung antar perangkat (WebRTC lewat PeerJS) ---------- */
const PEER_OPTS = window.PEER_OPTS || {},
  CHUNK = 64 * 1024;
let qPeer = null;
const setQ = (t, bad) => {
  const e = $("#qrStat");
  e.textContent = t;
  e.classList.toggle("bad", !!bad);
};
function closePeer() {
  if (qPeer) {
    try {
      qPeer.destroy();
    } catch (e) {}
    qPeer = null;
  }
}
function qrDraw(text) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount(),
    q = 4,
    s = Math.max(3, Math.floor(560 / (n + q * 2))),
    cv2 = $("#qrCanvas");
  cv2.width = cv2.height = s * (n + q * 2);
  const g = cv2.getContext("2d");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, cv2.width, cv2.height);
  g.fillStyle = "#1c1740";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect((c + q) * s, (r + q) * s, s, s);
}
async function collectFiles() {
  const out = [];
  try {
    out.push({ name: "twinkle-cam.png", blob: await (await fetch(outUrl())).blob() });
  } catch (e) {}
  if (vidBlob) out.push({ name: "twinkle-cam." + vidExt, blob: vidBlob });
  if (gifBlob) out.push({ name: "twinkle-cam.gif", blob: gifBlob });
  return out;
}
async function serve(conn) {
  conn.on("open", async () => {
    setQ("HP terhubung. Menyiapkan file…");
    try {
      await jobP;
    } catch (e) {}
    try {
      const files = await collectFiles();
      conn.send(JSON.stringify({ t: "start", n: files.length }));
      for (const f of files) {
        const buf = await f.blob.arrayBuffer();
        conn.send(
          JSON.stringify({
            t: "file",
            name: f.name,
            mime: f.blob.type || "application/octet-stream",
            size: buf.byteLength,
          }),
        );
        for (let o = 0; o < buf.byteLength; o += CHUNK) {
          conn.send(buf.slice(o, o + CHUNK));
          while (conn.dataChannel && conn.dataChannel.bufferedAmount > 1e6) await sleep(30);
        }
      }
      conn.send(JSON.stringify({ t: "done" }));
      setQ("Terkirim ke HP ✓ Kamu bisa menutup jendela ini, atau biarkan terbuka untuk HP lain.");
    } catch (e) {
      console.error(e);
      setQ("Pengiriman terputus. Pindai ulang QR-nya.", true);
    }
  });
  conn.on("error", () => setQ("Koneksi ke HP bermasalah. Pindai ulang QR-nya.", true));
}
function openQR() {
  $("#qrModal").classList.add("on");
  $("#qrLink").value = "";
  closePeer();
  const cv2 = $("#qrCanvas");
  cv2.getContext("2d").clearRect(0, 0, cv2.width, cv2.height);
  if (typeof Peer === "undefined" || typeof qrcode === "undefined") {
    setQ("Library QR belum termuat. Muat ulang halaman.", true);
    return;
  }
  setQ("Menghubungkan…");
  const id = "tc" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4),
    p = (qPeer = new Peer(id, PEER_OPTS));
  p.on("open", () => {
    const url = location.href.split("#")[0] + "#/terima/" + id;
    $("#qrLink").value = url;
    qrDraw(url);
    const local = location.protocol === "file:" || /^(localhost|127\.|\[::1\])/.test(location.hostname);
    setQ(
      local
        ? "QR siap, tapi alamat web ini hanya bisa dibuka di perangkat ini. Buka lewat alamat online (Vercel) agar HP bisa memindainya."
        : "Menunggu HP memindai QR… jangan tutup halaman ini.",
      local,
    );
  });
  p.on("connection", serve);
  p.on("disconnected", () => {
    try {
      p.reconnect();
    } catch (e) {}
  });
  p.on("error", (e) =>
    setQ("Gagal menyambung (" + (e.type || e.message) + "). Cek internet lalu coba lagi.", true),
  );
}
$("#btnQR").onclick = openQR;
$("#qrClose").onclick = () => {
  $("#qrModal").classList.remove("on");
  closePeer();
};
$("#qrCopy").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("#qrLink").value);
    toast("Link disalin");
  } catch (e) {
    $("#qrLink").select();
    toast("Tekan Salin manual (Ctrl+C)");
  }
};
/* sisi HP: menerima file */
function startReceive(id) {
  closePeer();
  const st = $("#recvStat"),
    items = $("#recvItems"),
    bar = $("#recvBar");
  items.innerHTML = "";
  bar.style.width = "0";
  const fail = (m) => {
    st.textContent = m;
    st.classList.add("bad");
    items.innerHTML = '<button class="pri" id="recvRetry">Coba lagi</button>';
    $("#recvRetry").onclick = () => startReceive(id);
  };
  st.classList.remove("bad");
  st.textContent = "Menghubungkan ke perangkat pengirim…";
  if (!id || typeof Peer === "undefined") {
    fail("Link tidak valid.");
    return;
  }
  const p = (qPeer = new Peer(PEER_OPTS));
  let opened = false,
    cur = null,
    total = 0,
    doneN = 0;
  const to = setTimeout(() => {
    if (!opened)
      fail("Tidak bisa terhubung. Pastikan halaman di komputer masih terbuka, lalu pindai ulang QR-nya.");
  }, 30000);
  p.on("error", (e) => {
    clearTimeout(to);
    fail("Gagal menyambung (" + (e.type || e.message) + "). Pastikan halaman pengirim masih terbuka.");
  });
  p.on("open", () => {
    const c = p.connect(id, { reliable: true });
    c.on("open", () => {
      opened = true;
      clearTimeout(to);
      st.textContent = "Terhubung. Menyiapkan file…";
    });
    c.on("error", () => fail("Koneksi terputus. Pindai ulang QR-nya."));
    c.on("data", (d) => {
      if (typeof d === "string") {
        const m = JSON.parse(d);
        if (m.t === "start") {
          total = m.n;
          st.textContent = "Menerima " + total + " file…";
        } else if (m.t === "file") {
          const el = document.createElement("figure");
          el.className = "card";
          el.innerHTML =
            '<figcaption></figcaption><div class="gifbox"><div class="spin"></div></div><div class="bar2"><i></i></div>';
          el.firstChild.textContent = m.name;
          items.appendChild(el);
          cur = { m, parts: [], got: 0, el };
        } else if (m.t === "done") {
          st.textContent = "Selesai! Simpan file di bawah ini.";
          bar.style.width = "100%";
        }
      } else if (cur) {
        cur.parts.push(d);
        cur.got += d.byteLength;
        cur.el.querySelector(".bar2 i").style.width = Math.min(100, (100 * cur.got) / cur.m.size) + "%";
        if (cur.got >= cur.m.size) {
          const blob = new Blob(cur.parts, { type: cur.m.mime }),
            url = URL.createObjectURL(blob),
            el = cur.el,
            isV = cur.m.mime.startsWith("video");
          const box = el.querySelector(".gifbox");
          box.innerHTML = "";
          const media = document.createElement(isV ? "video" : "img");
          media.src = url;
          if (isV) {
            media.controls = true;
            media.loop = true;
            media.muted = true;
            media.playsInline = true;
            media.autoplay = true;
          } else media.alt = cur.m.name;
          box.appendChild(media);
          el.querySelector(".bar2").remove();
          const a = document.createElement("a");
          a.className = "btn pri sm";
          a.href = url;
          a.download = cur.m.name;
          a.textContent = "⬇️ Simpan " + cur.m.name.split(".").pop().toUpperCase();
          const r = document.createElement("div");
          r.className = "row";
          r.appendChild(a);
          el.appendChild(r);
          doneN++;
          bar.style.width = (100 * doneN) / Math.max(total, 1) + "%";
          cur = null;
        }
      }
    });
  });
}
