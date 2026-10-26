/* Halaman 3: bingkai, filter, stiker, teks */
/* ---------- halaman 3: hias ---------- */
const TABS = [
  ["fr", "🖼️ Bingkai"],
  ["fi", "✨ Filter"],
  ["zm", "🔍 Zoom"],
  ["st", "🎀 Set stiker"],
  ["fs", "📌 Tempel"],
  ["tx", "✏️ Teks"],
];
const EMO = [
  "🦋",
  "💿",
  "⭐",
  "🪩",
  "🎀",
  "🤍",
  "🩰",
  "🌷",
  "🧋",
  "🍰",
  "🍡",
  "🍓",
  "🍒",
  "🍵",
  "🌿",
  "🐸",
  "💜",
  "🎤",
  "✨",
  "👽",
  "🛸",
  "💫",
  "🌙",
  "🧸",
  "🐰",
  "🐱",
  "🐻",
  "🦄",
  "🌸",
  "🌻",
  "👑",
  "💎",
  "💖",
  "🔥",
  "😎",
  "🥹",
  "🫶",
  "💌",
  "💋",
  "🌈",
  "☁️",
  "⚡",
  "🫧",
  "🕶️",
  "🎧",
  "📸",
  "🥂",
  "🍀",
  "🪐",
  "😂",
];
function buildTabs() {
  const t = $("#tabs");
  t.innerHTML = "";
  const tabs = LAY[S.lay].tpl ? TABS.filter((x) => x[0] === "fi" || x[0] === "zm" || x[0] === "fs") : TABS;
  if (!tabs.some((x) => x[0] === S.tab)) S.tab = tabs[0][0];
  tabs.forEach(([k, l]) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = l;
    b.setAttribute("aria-pressed", String(S.tab === k));
    b.onclick = () => {
      S.tab = k;
      buildTabs();
    };
    t.appendChild(b);
  });
  buildOpts();
}
function tile(label, h, draw, on, pick) {
  const b = document.createElement("button");
  b.className = "tile";
  b.setAttribute("aria-pressed", String(on));
  const c = document.createElement("canvas");
  c.width = 192;
  c.height = h;
  draw(c.getContext("2d"));
  const s = document.createElement("span");
  s.textContent = label;
  b.append(c, s);
  b.onclick = () => {
    pick();
    document.querySelectorAll("#opts .tile").forEach((x) => x.setAttribute("aria-pressed", "false"));
    b.setAttribute("aria-pressed", "true");
    render();
  };
  return b;
}
function buildOpts() {
  const o = $("#opts");
  o.innerHTML = "";
  o.className = "opts";
  if (S.tab === "fr") {
    FR.forEach((f, i) =>
      o.appendChild(
        tile(
          f.name,
          256,
          (g) => back(g, f, 192, 256),
          !S.custom && S.fr === i,
          () => {
            S.fr = i;
            S.custom = null;
          },
        ),
      ),
    );
    const l = document.createElement("label");
    l.className = "tile";
    l.innerHTML =
      '<span style="font-size:2rem">🎨</span><input type="color" value="#ffb3d6" aria-label="Warna bingkai sendiri"><span>Warna sendiri</span>';
    l.querySelector("input").oninput = (e) => {
      S.custom = e.target.value;
      document.querySelectorAll("#opts .tile").forEach((x) => x.setAttribute("aria-pressed", "false"));
      l.setAttribute("aria-pressed", "true");
      render();
    };
    o.appendChild(l);
  } else if (S.tab === "fi") {
    FI.forEach((f, i) =>
      o.appendChild(
        tile(
          f.name,
          144,
          (g) => {
            const p = S.photos[0];
            if (p) {
              if ("filter" in g) g.filter = f.css;
              g.drawImage(p, 0, 0, 192, 144);
            } else {
              g.fillStyle = "#c9b6ff";
              g.fillRect(0, 0, 192, 144);
            }
          },
          S.fi === i,
          () => {
            S.fi = i;
          },
        ),
      ),
    );
  } else if (S.tab === "st") {
    ST.forEach((s, i) =>
      o.appendChild(
        tile(
          s.name,
          100,
          (g) => {
            g.fillStyle = "#f3e4ff";
            g.fillRect(0, 0, 192, 100);
            g.font = "40px sans-serif";
            g.textAlign = "center";
            g.textBaseline = "middle";
            if (s.e.length) s.e.slice(0, 3).forEach((e, j) => g.fillText(e, 36 + j * 60, 52));
            else g.fillText("∅", 96, 52);
          },
          S.st === i,
          () => {
            S.st = i;
          },
        ),
      ),
    );
  } else if (S.tab === "zm") {
    const Tp = !!LAY[S.lay].tpl;
    o.className = "opts txt";
    o.innerHTML =
      '<label class="rg">🔍 Zoom orang <b id="zV"></b><input type="range" id="zm" min="100" max="250" step="5"></label>' +
      (Tp
        ? '<label class="rg">⬛ Perbesar area foto <b id="gV"></b><input type="range" id="gr" min="100" max="140" step="1"></label>'
        : "") +
      '<p class="hint2">Geser zoom supaya orang di dalam foto tampil lebih besar.' +
      (Tp ? " Area foto bisa diperbesar melewati lubang bingkai kalau fotonya masih terasa kecil." : "") +
      '</p><button class="sm" id="zReset" style="margin-top:10px">Atur ulang</button>';
    const z = $("#zm"),
      g = $("#gr");
    z.value = Math.round(S.zoom * 100);
    $("#zV").textContent = z.value + "%";
    z.oninput = (e) => {
      S.zoom = e.target.value / 100;
      $("#zV").textContent = e.target.value + "%";
      render();
    };
    if (g) {
      g.value = Math.round(S.grow * 100);
      $("#gV").textContent = g.value + "%";
      g.oninput = (e) => {
        S.grow = e.target.value / 100;
        $("#gV").textContent = e.target.value + "%";
        render();
      };
    }
    $("#zReset").onclick = () => {
      S.zoom = Tp ? 1.3 : 1;
      S.grow = 1;
      buildOpts();
      render();
    };
  } else if (S.tab === "fs") {
    o.className = "opts emos";
    o.innerHTML =
      '<p class="hint2">Ketuk emoji untuk menempel di foto. Geser untuk memindah, tarik titik pink untuk memperbesar dan memutar (atau cubit dengan dua jari), ketuk ✕ untuk hapus. Stiker tempel hanya muncul di foto, tidak di video GIF.</p><div class="ctl"><button class="sm" id="fsOne">🗑️ Hapus terpilih</button><button class="sm" id="fsDel">Hapus semua</button></div>';
    EMO.forEach((e) => {
      const b = document.createElement("button");
      b.className = "emo";
      b.textContent = e;
      b.setAttribute("aria-label", "Tempel " + e);
      b.onclick = () => addFree(e);
      o.appendChild(b);
    });
    $("#fsOne").onclick = () => {
      if (S.sel == null) return toast("Ketuk stiker di foto dulu ya");
      S.free.splice(S.sel, 1);
      S.sel = null;
      render();
    };
    $("#fsDel").onclick = () => {
      S.free = [];
      S.sel = null;
      render();
    };
  } else {
    o.className = "opts txt";
    o.innerHTML =
      '<label>Tulisan di bawah foto<input type="text" id="cap" maxlength="28"></label><h3 style="margin:16px 0 8px">Gaya huruf</h3><div class="chips" id="capf"></div>';
    const i = $("#cap");
    i.value = S.cap;
    i.oninput = (e) => {
      S.cap = e.target.value;
      render();
    };
    CAPF.forEach((f, k) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.style.fontFamily = '"' + f.n + '"';
      b.style.fontWeight = f.w;
      b.textContent = f.l;
      b.setAttribute("aria-pressed", String(S.capF === k));
      b.onclick = async () => {
        S.capF = k;
        try {
          await document.fonts.load(f.w + ' 40px "' + f.n + '"');
        } catch (e) {}
        document
          .querySelectorAll("#capf .chip")
          .forEach((x, q) => x.setAttribute("aria-pressed", String(q === k)));
        render();
      };
      $("#capf").appendChild(b);
    });
  }
}

/* ---------- stiker tempel: geser, besar/putar, cubit ---------- */
function addFree(e) {
  if (S.free.length >= 40) return toast("Maksimal 40 stiker ya");
  const { w, h } = dims();
  S.free.push({
    e,
    x: w / 2 + (Math.random() - 0.5) * 120,
    y: h / 2 + (Math.random() - 0.5) * 160,
    s: Math.round(Math.max(120, 46 * rat())),
    r: (Math.random() - 0.5) * 0.5,
  });
  S.sel = S.free.length - 1;
  render();
}
const ptr = new Map();
let drag = null,
  rq = 0;
const rerender = () => {
  if (!rq)
    rq = requestAnimationFrame(() => {
      rq = 0;
      render();
    });
};
const pt = (e) => {
  const r = cv.getBoundingClientRect(),
    k = cv.width / r.width;
  return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, k };
};
function hit(x, y) {
  for (let i = S.free.length - 1; i >= 0; i--) {
    const s = S.free[i],
      dx = x - s.x,
      dy = y - s.y,
      co = Math.cos(-s.r),
      si = Math.sin(-s.r),
      lx = dx * co - dy * si,
      ly = dx * si + dy * co,
      h = s.s * 0.6;
    if (Math.abs(lx) <= h && Math.abs(ly) <= h) return i;
  }
  return -1;
}
cv.addEventListener("pointerdown", (e) => {
  if (document.body.dataset.view !== "edit") return;
  const p = pt(e);
  ptr.set(e.pointerId, p);
  cv.setPointerCapture(e.pointerId);
  if (ptr.size === 2 && S.sel != null) {
    const [a, b] = [...ptr.values()],
      s = S.free[S.sel];
    drag = {
      m: "pinch",
      d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      a0: Math.atan2(b.y - a.y, b.x - a.x),
      s0: s.s,
      r0: s.r,
    };
    return;
  }
  const sel = S.sel != null ? S.free[S.sel] : null;
  if (sel) {
    const h = sel.s / 2,
      co = Math.cos(sel.r),
      si = Math.sin(sel.r),
      hr = Math.min(14 * p.k, sel.s * 0.35);
    if (Math.hypot(p.x - (sel.x + h * co - h * si), p.y - (sel.y + h * si + h * co)) < hr) {
      drag = { m: "rot" };
      return;
    }
    if (Math.hypot(p.x - (sel.x - h * co + h * si), p.y - (sel.y - h * si - h * co)) < hr) {
      S.free.splice(S.sel, 1);
      S.sel = null;
      ptr.clear();
      drag = null;
      return render();
    }
  }
  const i = hit(p.x, p.y);
  if (i >= 0) {
    const s = S.free.splice(i, 1)[0];
    S.free.push(s);
    S.sel = S.free.length - 1;
    drag = { m: "move", ox: p.x - s.x, oy: p.y - s.y };
  } else {
    S.sel = null;
    drag = null;
  }
  render();
});
cv.addEventListener("pointermove", (e) => {
  if (!ptr.has(e.pointerId)) {
    if (document.body.dataset.view === "edit") {
      const p = pt(e);
      cv.style.cursor = hit(p.x, p.y) >= 0 ? "grab" : "default";
    }
    return;
  }
  const p = pt(e);
  ptr.set(e.pointerId, p);
  if (S.sel == null || !drag) return;
  const s = S.free[S.sel];
  if (drag.m === "pinch" && ptr.size >= 2) {
    const [a, b] = [...ptr.values()];
    s.s = clamp((drag.s0 * Math.hypot(a.x - b.x, a.y - b.y)) / drag.d0, 30, 500);
    s.r = drag.r0 + Math.atan2(b.y - a.y, b.x - a.x) - drag.a0;
  } else if (drag.m === "rot") {
    const dx = p.x - s.x,
      dy = p.y - s.y;
    s.s = clamp(Math.hypot(dx, dy) * Math.SQRT2, 30, 500);
    s.r = Math.atan2(dy, dx) - Math.PI / 4;
  } else if (drag.m === "move") {
    const d = dims();
    s.x = clamp(p.x - drag.ox, 0, d.w);
    s.y = clamp(p.y - drag.oy, 0, d.h);
  }
  rerender();
});
const endPtr = (e) => {
  ptr.delete(e.pointerId);
  if (!ptr.size || (drag && drag.m === "pinch")) drag = null;
};
cv.addEventListener("pointerup", endPtr);
cv.addEventListener("pointercancel", endPtr);
addEventListener("keydown", (e) => {
  if (
    (e.key === "Delete" || e.key === "Backspace") &&
    S.sel != null &&
    document.body.dataset.view === "edit" &&
    !/INPUT|SELECT/.test(document.activeElement.tagName)
  ) {
    S.free.splice(S.sel, 1);
    S.sel = null;
    render();
  }
});
