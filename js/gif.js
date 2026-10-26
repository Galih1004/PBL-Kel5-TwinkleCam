/* Encoder GIF (palet median-cut + dithering) */
function quant(d) {
  const o = new Uint8Array(d.length >> 2);
  for (let i = 0, j = 0; i < d.length; i += 4, j++)
    o[j] = (d[i] & 224) | ((d[i + 1] & 224) >> 3) | (d[i + 2] >> 6);
  return o;
}
function lzw(px) {
  const out = [];
  let cur = 0,
    bits = 0,
    nb = 9,
    fe = 258,
    mx = 511;
  const dict = new Map();
  const put = (c) => {
    cur |= c << bits;
    bits += nb;
    while (bits >= 8) {
      out.push(cur & 255);
      cur >>= 8;
      bits -= 8;
    }
    if (fe > mx) {
      nb++;
      mx = nb === 12 ? 4096 : (1 << nb) - 1;
    }
  };
  put(256);
  let p = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i],
      key = (p << 8) | k,
      v = dict.get(key);
    if (v !== undefined) p = v;
    else {
      put(p);
      if (fe < 4096) dict.set(key, fe++);
      else {
        put(256);
        dict.clear();
        fe = 258;
        nb = 9;
        mx = 511;
      }
      p = k;
    }
  }
  put(p);
  put(257);
  if (bits > 0) out.push(cur & 255);
  return out;
}
function gifEncode(frames, w, h, delay, pal) {
  const o = [],
    u16 = (v) => o.push(v & 255, (v >> 8) & 255),
    str = (s) => [...s].forEach((ch) => o.push(ch.charCodeAt(0)));
  str("GIF89a");
  u16(w);
  u16(h);
  o.push(247, 0, 0);
  for (let i = 0; i < 768; i++) o.push(pal[i]);
  o.push(33, 255, 11);
  str("NETSCAPE2.0");
  o.push(3, 1, 0, 0, 0);
  for (const px of frames) {
    o.push(33, 249, 4, 0);
    u16(px.d || delay);
    o.push(0, 0, 44, 0, 0, 0, 0);
    u16(w);
    u16(h);
    o.push(0, 8);
    const b = lzw(px);
    for (let i = 0; i < b.length; i += 255) {
      const n = Math.min(255, b.length - i);
      o.push(n);
      for (let j = 0; j < n; j++) o.push(b[i + j]);
    }
    o.push(0);
  }
  o.push(59);
  return new Uint8Array(o);
}
/* ---------- GIF berkualitas: palet median-cut + dithering ---------- */
function makePalette(frames) {
  const hist = new Uint32Array(32768);
  for (const d of frames)
    for (let i = 0; i < d.length; i += 16)
      hist[((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3)]++;
  const cols = [];
  for (let i = 0; i < 32768; i++) if (hist[i]) cols.push(i);
  const ch = (c, a) => (a === 0 ? (c >> 10) & 31 : a === 1 ? (c >> 5) & 31 : c & 31);
  const boxes = [cols];
  while (boxes.length < 256) {
    let bi = -1,
      best = 0;
    boxes.forEach((b, i) => {
      if (b.length > 1) {
        let pop = 0;
        for (const c of b) pop += hist[c];
        if (pop > best) {
          best = pop;
          bi = i;
        }
      }
    });
    if (bi < 0) break;
    const b = boxes[bi],
      mn = [31, 31, 31],
      mx = [0, 0, 0];
    for (const c of b)
      for (let a = 0; a < 3; a++) {
        const v = ch(c, a);
        if (v < mn[a]) mn[a] = v;
        if (v > mx[a]) mx[a] = v;
      }
    const a = [0, 1, 2].sort((x, y) => mx[y] - mn[y] - (mx[x] - mn[x]))[0];
    b.sort((p, q) => ch(p, a) - ch(q, a));
    let tot = 0;
    for (const c of b) tot += hist[c];
    let acc = 0,
      cut = 1;
    for (let i = 0; i < b.length; i++) {
      acc += hist[b[i]];
      if (acc >= tot / 2) {
        cut = Math.min(Math.max(i + 1, 1), b.length - 1);
        break;
      }
    }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
  }
  const pal = new Uint8Array(768);
  boxes.forEach((b, i) => {
    let r = 0,
      g = 0,
      bl = 0,
      t = 0;
    for (const c of b) {
      const k = hist[c];
      r += ((c >> 10) & 31) * k;
      g += ((c >> 5) & 31) * k;
      bl += (c & 31) * k;
      t += k;
    }
    t = t || 1;
    pal[i * 3] = Math.min(255, (r / t) * 8 + 4);
    pal[i * 3 + 1] = Math.min(255, (g / t) * 8 + 4);
    pal[i * 3 + 2] = Math.min(255, (bl / t) * 8 + 4);
  });
  return pal;
}
function makeLut(pal) {
  const lut = new Uint8Array(32768);
  for (let c = 0; c < 32768; c++) {
    const r = ((c >> 10) & 31) * 8 + 4,
      g = ((c >> 5) & 31) * 8 + 4,
      b = (c & 31) * 8 + 4;
    let bd = 1e9,
      bi = 0;
    for (let p = 0; p < 256; p++) {
      const dr = r - pal[p * 3],
        dg = g - pal[p * 3 + 1],
        db = b - pal[p * 3 + 2],
        d = dr * dr * 2 + dg * dg * 4 + db * db * 3;
      if (d < bd) {
        bd = d;
        bi = p;
      }
    }
    lut[c] = bi;
  }
  return lut;
}
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function dither(d, w, h, lut) {
  const o = new Uint8Array(w * h);
  for (let y = 0, j = 0; y < h; y++)
    for (let x = 0; x < w; x++, j++) {
      const i = j * 4,
        t = (BAY[(y & 3) * 4 + (x & 3)] - 7.5) * 1.6;
      let r = d[i] + t,
        g = d[i + 1] + t,
        b = d[i + 2] + t;
      r = r < 0 ? 0 : r > 255 ? 255 : r;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      b = b < 0 ? 0 : b > 255 ? 255 : b;
      o[j] = lut[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
    }
  return o;
}
async function makeGif() {
  const tk = ++gifTk,
    box = $("#gifBox"),
    btn = $("#btnGif");
  btn.disabled = true;
  gifUrl = null;
  gifBlob = null;
  load(box, "Lagi bikin GIF…");
  await sleep(60);
  const T = LAY[S.lay].tpl,
    w = T ? T.w : P * 2 + W,
    h = T ? T.h : P + H + FF(),
    n = cnt(),
    total = n * (S.clips.some(Boolean) ? 7 : 1);
  const gw = Math.round(Math.min(480, Math.sqrt((14e6 * w) / (h * total))) / 2) * 2,
    gh = Math.round((h * gw) / w);
  const full = document.createElement("canvas");
  full.width = w;
  full.height = h;
  const fc = full.getContext("2d");
  const sm = document.createElement("canvas");
  sm.width = gw;
  sm.height = gh;
  const sx = sm.getContext("2d", { willReadFrequently: true });
  sx.imageSmoothingQuality = "high";
  const raw = [],
    dl8 = [];
  for (let i = 0; i < n; i++) {
    const cl = S.clips[i],
      idx = cl ? Array.from({ length: 7 }, (_, q) => Math.round((q * (cl.length - 1)) / 6)) : [null];
    idx.forEach((k, j) => {
      const s = cl ? cl[k] : S.photos[i];
      T ? paintT(fc, T, i, s) : paintOne(fc, s, i);
      sx.drawImage(full, 0, 0, gw, gh);
      raw.push(sx.getImageData(0, 0, gw, gh).data);
      dl8.push(j === idx.length - 1 ? 60 : 16);
    });
    load(box, "Lagi bikin GIF… " + (i + 1) + "/" + n);
    await sleep(0);
    if (tk !== gifTk) return;
  }
  load(box, "Lagi bikin GIF… menyusun warna");
  await sleep(30);
  const pal = makePalette(raw),
    lut = makeLut(pal);
  const frames = raw.map((d, i) => {
    const q = dither(d, gw, gh, lut);
    q.d = dl8[i];
    return q;
  });
  await sleep(0);
  if (tk !== gifTk) return;
  gifBlob = new Blob([gifEncode(frames, gw, gh, 16, pal)], { type: "image/gif" });
  gifUrl = URL.createObjectURL(gifBlob);
  box.innerHTML = "";
  const im = new Image();
  im.src = gifUrl;
  im.alt = "Hasil GIF";
  box.appendChild(im);
  btn.disabled = false;
}
