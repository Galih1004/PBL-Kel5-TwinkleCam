/* Menggambar bingkai, foto, dan hasil akhir ke canvas */
const rnd = (s) => () => {
  s |= 0;
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
function pattern(c, type, w, h, col) {
  c.fillStyle = col;
  c.globalAlpha = 0.7;
  if (type === "stripes") {
    for (let x = -h; x < w; x += 56) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + 22, 0);
      c.lineTo(x + 22 + h, h);
      c.lineTo(x + h, h);
      c.fill();
    }
  } else if (type === "checker") {
    for (let y = 0; y < h; y += 40)
      for (let x = 0; x < w; x += 40) if (((x + y) / 40) % 2 === 0) c.fillRect(x, y, 40, 40);
  } else {
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (let y = 20, r = 0; y < h; y += 44, r++)
      for (let x = r % 2 ? 22 : 0; x < w + 44; x += 44) {
        if (type === "dots") {
          c.beginPath();
          c.arc(x, y, 8, 0, 7);
          c.fill();
        } else {
          c.font = "26px sans-serif";
          c.fillText(type === "stars" ? "★" : "♥", x, y);
        }
      }
  }
  c.globalAlpha = 1;
}
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function back(c, fr, w, h) {
  const t = fr.pat,
    r = rnd(7);
  c.textAlign = "center";
  c.textBaseline = "middle";
  if (t === "sky" || t === "holo") {
    const g = c.createLinearGradient(0, 0, t === "sky" ? 0 : w, h);
    (t === "sky"
      ? ["#1b1450", "#3a1c71", "#7b2f8e"]
      : ["#ffc6f2", "#c6d8ff", "#c6fff0", "#fff3c6", "#ffc6de"]
    ).forEach((s, i, a) => g.addColorStop(i / (a.length - 1), s));
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < Math.round((w * h) / 9000); i++) {
      c.globalAlpha = 0.4 + r() * 0.6;
      c.fillStyle = t === "holo" || r() > 0.5 ? "#fff" : "#ffe14d";
      c.font = ((10 + r() * 22) | 0) + "px sans-serif";
      c.fillText(r() > 0.4 ? "✦" : "•", r() * w, r() * h);
    }
  } else if (t === "rainbow") {
    ["#ffb3c1", "#ffd6a5", "#fdf2a0", "#c1f2b0", "#a5e3ff", "#c3b1ff", "#f2b5ff"].forEach((col, i) => {
      c.fillStyle = col;
      c.fillRect(0, (i * h) / 7, w, h / 7 + 1);
    });
  } else {
    c.fillStyle = fr.bg;
    c.fillRect(0, 0, w, h);
    if (t === "news") {
      c.fillStyle = fr.fg;
      c.globalAlpha = 0.5;
      for (let y = 16; y < h; y += 16)
        for (let x = 12; x < w - 12;) {
          const l = 30 + r() * 90;
          c.fillRect(x, y, Math.min(l, w - 12 - x), 5);
          x += l + 8;
        }
      c.globalAlpha = 0.22;
      c.fillStyle = "#1e1a14";
      c.textAlign = "left";
      c.font = "900 38px Georgia,serif";
      for (let y = 50; y < h; y += 330) c.fillText("THE TWINKLE TIMES", 14, y);
    } else if (t === "notes") {
      c.strokeStyle = fr.fg;
      c.lineWidth = 2;
      c.globalAlpha = 0.6;
      for (let y = 40; y < h; y += 36) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
      }
      c.strokeStyle = "#ff8fa3";
      c.globalAlpha = 0.9;
      c.beginPath();
      c.moveTo(20, 0);
      c.lineTo(20, h);
      c.stroke();
    } else if (t === "film") {
      c.fillStyle = fr.fg;
      for (let y = 10; y < h; y += 34) {
        rr(c, 9, y, 14, 20, 4);
        c.fill();
        rr(c, w - 23, y, 14, 20, 4);
        c.fill();
      }
    } else if (t === "denim") {
      c.strokeStyle = "#ffffff";
      c.globalAlpha = 0.09;
      c.lineWidth = 2;
      for (let x = -h; x < w; x += 6) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + h, h);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.strokeStyle = "#ffd166";
      c.lineWidth = 3;
      c.setLineDash([10, 7]);
      rr(c, 10, 10, w - 20, h - 20, 16);
      c.stroke();
      c.setLineDash([]);
    } else if (t === "mail") {
      c.globalAlpha = 0.13;
      c.fillStyle = "#6b5a3a";
      c.font = "700 22px Georgia,serif";
      for (let y = 50; y < h; y += 90) c.fillText("AIR MAIL · PAR AVION", w / 2, y);
      c.globalAlpha = 1;
      c.lineWidth = 12;
      c.setLineDash([26, 26]);
      c.strokeStyle = "#e0525f";
      rr(c, 7, 7, w - 14, h - 14, 0);
      c.stroke();
      c.strokeStyle = "#4a78d0";
      c.lineDashOffset = 26;
      c.stroke();
      c.setLineDash([]);
      c.lineDashOffset = 0;
    } else if (t === "heart") {
      for (let i = 0; i < Math.round((w * h) / 5000); i++) {
        c.globalAlpha = 0.35 + r() * 0.5;
        c.fillStyle = ["#ff5fa2", "#ff8fb8", "#ffffff", "#e0345f"][(r() * 4) | 0];
        c.font = ((18 + r() * 34) | 0) + "px sans-serif";
        c.fillText("♥", r() * w, r() * h);
      }
    } else if (t === "party") {
      const cs = ["#ff5fa2", "#7fd8ff", "#ffe14d", "#8b5cf6", "#7ce0a3"];
      for (let i = 0; i < Math.round((w * h) / 2500); i++) {
        c.save();
        c.translate(r() * w, r() * h);
        c.rotate(r() * 6.3);
        c.fillStyle = cs[(r() * 5) | 0];
        c.fillRect(-4, -9, 8, 18);
        c.restore();
      }
    } else if (t === "raya") {
      c.strokeStyle = "#f2c94c";
      c.globalAlpha = 0.3;
      c.lineWidth = 2;
      for (let y = 0; y < h + 40; y += 40)
        for (let x = (y / 40) % 2 ? 20 : 0; x < w + 40; x += 40) {
          c.save();
          c.translate(x, y);
          c.rotate(Math.PI / 4);
          c.strokeRect(-11, -11, 22, 22);
          c.restore();
        }
      c.globalAlpha = 0.9;
      c.fillStyle = "#f2c94c";
      c.font = "30px sans-serif";
      for (let i = 0; i < Math.round((w * h) / 26000) + 2; i++)
        c.fillText(r() > 0.5 ? "☪" : "✦", r() * w, r() * h);
    } else if (t === "xmas") {
      c.fillStyle = "#1f7a4c";
      for (let x = 0; x < w; x += 60) c.fillRect(x, 0, 14, h);
      c.fillStyle = "#fff";
      for (let i = 0; i < Math.round((w * h) / 4000); i++) {
        c.globalAlpha = 0.5 + r() * 0.5;
        c.font = ((14 + r() * 22) | 0) + "px sans-serif";
        c.fillText("❄", r() * w, r() * h);
      }
    } else if (t !== "none") pattern(c, t, w, h, fr.fg);
  }
  c.globalAlpha = 1;
}
function dims() {
  const L = LAY[S.lay],
    rows = Math.ceil((L.dup ? L.n * 2 : L.n) / L.c);
  if (L.tpl) return { L, w: L.tpl.w, h: L.tpl.h };
  return { L, w: P * 2 + L.c * W + (L.c - 1) * G, h: P + rows * H + (rows - 1) * G + (L.F || F) };
}

function grab(src, sw, sh, mirror, tw = W, th = H) {
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const g = c.getContext("2d");
  const r = tw / th;
  let cw = sw,
    ch = sh;
  if (sw / sh > r) cw = sh * r;
  else ch = sw / r;
  if (mirror) {
    g.translate(tw, 0);
    g.scale(-1, 1);
  }
  g.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, tw, th);
  return c;
}
/* ---------- gambar ---------- */
function card(c, x, y, src, i) {
  const em = ST[S.st].e;
  c.save();
  c.shadowColor = "rgba(45,27,105,.35)";
  c.shadowOffsetY = 6;
  c.shadowBlur = 12;
  c.fillStyle = "#fff";
  rr(c, x - 8, y - 8, W + 16, H + 16, 20);
  c.fill();
  c.restore();
  c.save();
  rr(c, x, y, W, H, 14);
  c.clip();
  if (src) {
    if ("filter" in c) c.filter = FI[S.fi].css;
    const z = S.zoom || 1;
    if (z > 1) {
      const sw = src.width / z,
        sh = src.height / z;
      c.drawImage(src, (src.width - sw) / 2, (src.height - sh) * 0.4, sw, sh, x, y, W, H);
    } else c.drawImage(src, x, y, W, H);
    c.filter = "none";
  } else {
    c.fillStyle = "#f3e4ff";
    c.fillRect(x, y, W, H);
    c.fillStyle = "#ff5fa2";
    c.font = '800 90px "Bricolage Grotesque",sans-serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(String(i + 1), x + W / 2, y + H / 2);
  }
  c.restore();
  if (em.length) {
    c.font = "60px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.save();
    c.translate(x + W - 22, y + 8);
    c.rotate(0.3);
    c.fillText(em[i % em.length], 0, 0);
    c.restore();
    c.save();
    c.translate(x + 24, y + H - 6);
    c.rotate(-0.3);
    c.fillText(em[(i + 2) % em.length], 0, 0);
    c.restore();
  }
}
const CAPF = [
  { n: "Bricolage Grotesque", w: 800, sz: 46, l: "Modern" },
  { n: "Pacifico", w: 400, sz: 42, l: "Script" },
  { n: "Caveat", w: 700, sz: 58, l: "Tulisan tangan" },
  { n: "Fredoka", w: 700, sz: 46, l: "Bulat" },
];
function caption(c, fr, w, h) {
  const f = CAPF[S.capF] || CAPF[0];
  c.fillStyle = fr.ink;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = f.w + " " + f.sz + 'px "' + f.n + '",sans-serif';
  c.fillText(S.cap || " ", w / 2, h - FF() / 2 + 4);
}
const tImgs = {};
function tplImg(t) {
  let e = tImgs[t.id];
  if (!e) {
    e = tImgs[t.id] = new Image();
    e.onload = () => {
      const v = document.body.dataset.view;
      if (v === "edit") render();
    };
    e.src = t.src;
  }
  return e.complete && e.naturalWidth ? e : null;
}
function paintT(c, t, upTo, cur) {
  const im = tplImg(t);
  if (im) c.drawImage(im, 0, 0, t.w, t.h);
  else {
    c.fillStyle = "#d9c8ff";
    c.fillRect(0, 0, t.w, t.h);
  }
  t.slots.forEach((s, i) => {
    const src = i < upTo ? S.photos[i] : i === upTo ? cur : null;
    if (!src) return;
    const g = S.grow || 1,
      z = S.zoom || 1;
    c.save();
    c.beginPath();
    s.poly.forEach(([x, y], k) => {
      const px = s.cx + (x - s.cx) * g,
        py = s.cy + (y - s.cy) * g;
      k ? c.lineTo(px, py) : c.moveTo(px, py);
    });
    c.closePath();
    c.clip();
    c.translate(s.cx, s.cy);
    c.rotate(s.a);
    const k = Math.max((s.w * 1.06 * g + 10) / src.width, (s.h * 1.06 * g + 10) / src.height) * z,
      dw = src.width * k,
      dh = src.height * k,
      by = (dh - s.h * g) * 0.08;
    if ("filter" in c) c.filter = FI[S.fi].css;
    c.drawImage(src, -dw / 2, -dh / 2 + by, dw, dh);
    c.filter = "none";
    c.restore();
  });
}
function paint(c, ui) {
  const { L, w, h } = dims();
  if (L.tpl) {
    paintT(c, L.tpl, L.n, null);
    drawFree(c, ui);
    return;
  }
  const fr = curFr();
  back(c, fr, w, h);
  for (let i = 0; i < (L.dup ? L.n * 2 : L.n); i++) {
    const pi = L.dup ? Math.floor(i / L.c) : i;
    card(c, P + (i % L.c) * (W + G), P + Math.floor(i / L.c) * (H + G), S.photos[pi], pi);
  }
  caption(c, fr, w, h);
  drawFree(c, ui);
}
function paintOne(c, src, i) {
  const w = P * 2 + W,
    h = P + H + FF(),
    fr = curFr();
  back(c, fr, w, h);
  card(c, P, P, src, i);
  caption(c, fr, w, h);
}
const rat = () => cv.width / (cv.getBoundingClientRect().width || cv.width);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function drawFree(c, ui) {
  S.free.forEach((s, i) => {
    c.save();
    c.translate(s.x, s.y);
    c.rotate(s.r);
    c.font = s.s + "px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (s.img) {
      /* stiker gambar: muat dalam kotak s x s tanpa merusak rasio */
      const k = Math.min(s.s / s.img.naturalWidth, s.s / s.img.naturalHeight);
      const w = s.img.naturalWidth * k,
        h = s.img.naturalHeight * k;
      c.drawImage(s.img, -w / 2, -h / 2, w, h);
    } else c.fillText(s.e, 0, 0);
    if (ui && i === S.sel) {
      const h = s.s / 2,
        k = rat(),
        hr = 11 * k;
      c.strokeStyle = "#ff5fa2";
      c.lineWidth = 3 * k;
      c.setLineDash([8 * k, 6 * k]);
      c.strokeRect(-h, -h, s.s, s.s);
      c.setLineDash([]);
      c.lineWidth = 2 * k;
      c.strokeStyle = "#fff";
      c.fillStyle = "#ff5fa2";
      c.beginPath();
      c.arc(h, h, hr, 0, 7);
      c.fill();
      c.stroke();
      c.fillStyle = "#2d1b69";
      c.beginPath();
      c.arc(-h, -h, hr, 0, 7);
      c.fill();
      c.stroke();
      c.fillStyle = "#fff";
      c.font = "700 " + hr * 1.3 + "px sans-serif";
      c.fillText("✕", -h, -h + 1);
    }
    c.restore();
  });
}
function render(ui = true) {
  const { w, h } = dims();
  if (cv.width !== w) cv.width = w;
  if (cv.height !== h) cv.height = h;
  paint(ctx, ui);
}
