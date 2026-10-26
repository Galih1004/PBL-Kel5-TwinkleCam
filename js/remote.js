/* HP jadi kamera lewat QR.
   Laptop (host) membuat kode sambungan dan menampilkan QR. HP (tamu) membuka link ?cam=KODE,
   menyalakan kameranya, lalu mengirim videonya langsung ke laptop lewat WebRTC (PeerJS).
   Video dari HP dipakai seperti kamera biasa, jadi timer, filter, puzzle, dan lainnya tetap jalan. */
const remote = { peer: null, id: null, call: null, stream: null, ui: null };

/* ---------- sisi laptop (host) ---------- */
function attachRemote(s) {
  if (stream && stream !== s) stream.getTracks().forEach((t) => t.stop());
  stream = s;
  video.srcObject = s;
  video.play().catch(() => {});
  $("#hint").style.display = "none";
  $("#btnAuto").disabled = false;
  $("#btnCam").textContent = "HP terhubung ✓";
}
const _startCam = startCam,
  _stopCam = stopCam;
startCam = async function () {
  if (remote.stream && remote.stream.active) return attachRemote(remote.stream);
  return _startCam();
};
stopCam = function () {
  if (remote.stream && stream === remote.stream) stream = null; /* lepas saja, kamera HP jangan dimatikan */
  _stopCam();
};

function onHostCall(call) {
  if (remote.call && remote.call !== call) {
    try {
      remote.call.close();
    } catch (e) {}
  }
  remote.call = call;
  call.answer();
  call.on("stream", (s) => {
    remote.stream = s;
    setMirror(!call.metadata || call.metadata.facing === "user");
    if (document.body.dataset.view === "shoot") attachRemote(s);
    if (remote.ui) remote.ui("HP terhubung ✓", true);
    toast("HP terhubung 📱");
  });
  const gone = () => {
    if (remote.call !== call) return;
    if (stream === remote.stream) stopCam();
    remote.stream = remote.call = null;
    if (remote.ui) remote.ui("HP terputus", false);
    toast("HP terputus");
  };
  call.on("close", gone);
  call.on("error", gone);
}

function ensureHost() {
  return new Promise((ok, no) => {
    if (remote.peer && !remote.peer.destroyed && remote.peer.open) return ok(remote.id);
    if (typeof Peer === "undefined") return no(new Error("Library koneksi belum termuat. Cek internet lalu muat ulang."));
    const id = "tc-" + Math.random().toString(36).slice(2, 8).padEnd(6, "x");
    const p = new Peer(id, PEER_OPTS);
    remote.peer = p;
    remote.id = id;
    p.on("open", () => ok(id));
    p.on("call", onHostCall);
    p.on("disconnected", () => {
      try {
        p.reconnect();
      } catch (e) {}
    });
    p.on("error", (e) => {
      if (e.type === "unavailable-id") return ensureHost().then(ok, no);
      no(e);
    });
  });
}

async function openRemoteHost() {
  const { box, close } = openModal("rm");
  box.innerHTML = "<h2>📱 HP jadi kamera</h2><p class='muted'>Menyiapkan koneksi…</p>";
  let id;
  try {
    id = await ensureHost();
  } catch (e) {
    box.innerHTML =
      "<h2>📱 HP jadi kamera</h2><p>Koneksi belum bisa dibuat. Pastikan perangkat terhubung ke internet, lalu coba lagi.</p><button id='rmX'>Tutup</button>";
    box.querySelector("#rmX").onclick = close;
    return;
  }
  const url = location.origin + location.pathname + "?cam=" + id;
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const local = /^(localhost|127\.|\[::1\])/.test(location.hostname) || location.protocol === "file:";
  box.innerHTML = `
    <h2>📱 HP jadi kamera</h2>
    <p class="muted">Scan QR ini dengan kamera HP, izinkan akses kamera, lalu HP akan menjadi kamera di web ini.</p>
    <div class="rm-qr">${qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })}</div>
    <div class="rm-stat" id="rmStat"></div>
    ${local ? "<p class='rm-warn'>Alamat ini (localhost/file) tidak bisa dibuka dari HP. Deploy ke Vercel (HTTPS) atau pakai tunnel seperti ngrok.</p>" : ""}
    <p class="muted tiny">Video dikirim langsung antar perangkat (peer-to-peer) dan tidak disimpan di server.</p>
    <div class="row" style="justify-content:center">
      <button class="sm" id="rmCopy">🔗 Salin link</button>
      <button class="sm" id="rmOff" hidden>Putuskan HP</button>
      <button class="sm pri" id="rmX">Tutup</button>
    </div>`;
  const stat = box.querySelector("#rmStat"),
    off = box.querySelector("#rmOff");
  remote.ui = (text, ok) => {
    stat.textContent = text;
    stat.className = "rm-stat" + (ok ? " ok" : "");
    off.hidden = !ok;
    if (ok) setTimeout(() => remote.ui === set && close(), 1400);
  };
  const set = remote.ui;
  const shut = () => {
    if (remote.ui === set) remote.ui = null;
    close();
  };
  stat.textContent = "Menunggu HP…";
  if (remote.stream && remote.stream.active) {
    stat.textContent = "HP sudah terhubung ✓";
    stat.className = "rm-stat ok";
    off.hidden = false;
  }
  box.querySelector("#rmX").onclick = shut;
  off.onclick = () => {
    if (remote.call) remote.call.close();
    stat.textContent = "HP diputuskan";
    off.hidden = true;
  };
  box.querySelector("#rmCopy").onclick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link disalin");
    } catch (e) {
      prompt("Salin link ini:", url);
    }
  };
}

/* ---------- sisi HP (tamu): dibuka dari QR dengan ?cam=KODE ---------- */
async function startGuest(hostId) {
  document.body.classList.add("guest");
  const ov = document.createElement("div");
  ov.id = "guest";
  ov.innerHTML = `
    <video muted playsinline autoplay></video>
    <div class="g-top"><b>📱 Kamera HP · Twinkle Cam</b><span id="gStat">Menyalakan kamera…</span></div>
    <p class="g-tip">Putar HP ke posisi mendatar (landscape) agar foto lebih lebar. Biarkan layar tetap menyala.</p>
    <div class="g-bar"><button id="gFlip">🔄 Ganti kamera</button><button id="gStop">✖ Putuskan</button></div>`;
  document.body.appendChild(ov);
  const v = ov.querySelector("video"),
    st = (t) => (ov.querySelector("#gStat").textContent = t);
  let facing = "user",
    local = null,
    peer = null,
    call = null;
  try {
    navigator.wakeLock && navigator.wakeLock.request("screen").catch(() => {});
  } catch (e) {}

  const send = async () => {
    if (local) local.getTracks().forEach((t) => t.stop());
    local = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
    v.srcObject = local;
    v.classList.toggle("mirror", facing === "user");
    if (call) {
      try {
        call.close();
      } catch (e) {}
    }
    st("Menghubungkan ke laptop…");
    call = peer.call(hostId, local, { metadata: { facing } });
    call.on("close", () => st("Terputus dari laptop"));
    setTimeout(() => {
      const pc = call && call.peerConnection;
      if (!pc) return;
      pc.addEventListener("iceconnectionstatechange", () => {
        const s = pc.iceConnectionState;
        if (s === "connected" || s === "completed") st("Terhubung ✓ Foto diambil dari laptop");
        else if (s === "failed" || s === "disconnected") st("Koneksi terputus. Muat ulang halaman ini.");
      });
    }, 0);
  };

  peer = new Peer(PEER_OPTS);
  peer.on("open", () =>
    send().catch(() => st("Kamera tidak bisa dibuka. Izinkan akses kamera lalu muat ulang."))
  );
  peer.on("error", (e) =>
    st(e.type === "peer-unavailable" ? "Kode tidak ditemukan. Scan ulang QR di laptop." : "Koneksi gagal: " + e.type)
  );
  ov.querySelector("#gFlip").onclick = () => {
    facing = facing === "user" ? "environment" : "user";
    send().catch(() => st("Tidak bisa ganti kamera"));
  };
  ov.querySelector("#gStop").onclick = () => {
    try {
      call && call.close();
      peer.destroy();
    } catch (e) {}
    if (local) local.getTracks().forEach((t) => t.stop());
    v.srcObject = null;
    st("Terputus. Tutup tab ini atau muat ulang untuk menyambung lagi.");
    ov.querySelector(".g-bar").hidden = true;
  };
}
const camParam = new URLSearchParams(location.search).get("cam");
if (camParam && /^tc-[a-z0-9]{4,12}$/.test(camParam)) startGuest(camParam);
