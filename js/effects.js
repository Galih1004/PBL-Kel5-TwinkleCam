/* Efek tambahan di atas filter. Efek digambar per foto dan bisa ditumpuk. */
const star4 = (c, x, y, r) => {
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y);
  c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
};
const FX = [
  {
    id: "vig",
    name: "🌑 Vinyet",
    draw(c, x, y, w, h) {
      const g = c.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(20,0,40,.55)");
      c.fillStyle = g;
      c.fillRect(x, y, w, h);
    },
  },
  {
    id: "grain",
    name: "🎞️ Grain film",
    draw(c, x, y, w, h, seed) {
      const r = rnd(seed * 97 + 3);
      for (let i = 0, n = Math.round((w * h) / 30); i < n; i++) {
        c.fillStyle = r() > 0.5 ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)";
        c.fillRect(x + r() * w, y + r() * h, 1.6, 1.6);
      }
    },
  },
  {
    id: "spark",
    name: "✨ Kilau",
    draw(c, x, y, w, h, seed) {
      const r = rnd(seed * 31 + 11);
      c.save();
      c.shadowColor = "#fff";
      c.shadowBlur = 10;
      c.fillStyle = "rgba(255,255,255,.95)";
      for (let i = 0, n = Math.round((w * h) / 9000) + 4; i < n; i++) star4(c, x + r() * w, y + r() * h, (4 + r() * 11) * (w / 480));
      c.restore();
    },
  },
  {
    id: "leak",
    name: "🌅 Light leak",
    draw(c, x, y, w, h) {
      c.save();
      c.globalCompositeOperation = "screen";
      const g = c.createLinearGradient(x, y, x + w * 0.6, y + h * 0.6);
      g.addColorStop(0, "rgba(255,120,60,.6)");
      g.addColorStop(0.5, "rgba(255,60,160,.25)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(x, y, w, h);
      const g2 = c.createLinearGradient(x + w, y, x + w * 0.7, y + h * 0.4);
      g2.addColorStop(0, "rgba(120,80,255,.45)");
      g2.addColorStop(1, "rgba(120,80,255,0)");
      c.fillStyle = g2;
      c.fillRect(x, y, w, h);
      c.restore();
    },
  },
  {
    id: "vhs",
    name: "📼 VHS",
    draw(c, x, y, w, h, seed) {
      c.save();
      c.fillStyle = "rgba(255,0,80,.06)";
      c.fillRect(x, y, w, h);
      c.fillStyle = "rgba(0,0,0,.14)";
      for (let yy = y; yy < y + h; yy += 3) c.fillRect(x, yy, w, 1);
      const r = rnd(seed * 13 + 5);
      c.fillStyle = "rgba(255,255,255,.1)";
      for (let i = 0; i < 2; i++) c.fillRect(x, y + r() * h, w, 5 + r() * 6);
      c.restore();
    },
  },
];

/* gambar efek ke setiap kartu foto (bingkai bergambar/template tidak memakai efek) */
const _card = card;
card = function (c, x, y, src, i) {
  _card(c, x, y, src, i);
  if (!src || !S.efx.length) return;
  c.save();
  rr(c, x, y, W, H, 14);
  c.clip();
  S.efx.forEach((id) => {
    const f = FX.find((f) => f.id === id);
    if (f) f.draw(c, x, y, W, H, i + 1);
  });
  c.restore();
};

TABS.splice(2, 0, ["ef", "💫 Efek"]);

function buildFx() {
  const o = $("#opts");
  o.className = "opts";
  const mk = (label, draw, on, click) => {
    const b = document.createElement("button");
    b.className = "tile";
    b.setAttribute("aria-pressed", String(on));
    const cv2 = document.createElement("canvas");
    cv2.width = 192;
    cv2.height = 144;
    draw(cv2.getContext("2d"));
    const s = document.createElement("span");
    s.textContent = label;
    b.append(cv2, s);
    b.onclick = () => {
      click(b);
      render();
    };
    o.appendChild(b);
  };
  const base = (g) => {
    const p = S.photos[0];
    if (p) {
      if ("filter" in g) g.filter = FI[S.fi].css;
      g.drawImage(p, 0, 0, 192, 144);
      g.filter = "none";
    } else {
      g.fillStyle = "#c9b6ff";
      g.fillRect(0, 0, 192, 144);
    }
  };
  mk("🚫 Tanpa efek", base, !S.efx.length, () => {
    S.efx = [];
    buildFx();
  });
  FX.forEach((f) =>
    mk(
      f.name,
      (g) => {
        base(g);
        f.draw(g, 0, 0, 192, 144, 1);
      },
      S.efx.includes(f.id),
      (b) => {
        S.efx = S.efx.includes(f.id) ? S.efx.filter((x) => x !== f.id) : [...S.efx, f.id];
        buildFx();
      }
    )
  );
  const hint = document.createElement("p");
  hint.className = "hint2";
  hint.style.gridColumn = "1/-1";
  hint.textContent = "Efek bisa ditumpuk. Ketuk lagi untuk mematikan.";
  o.appendChild(hint);
}
