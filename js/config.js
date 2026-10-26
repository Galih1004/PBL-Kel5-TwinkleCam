/* Konstanta: tata letak, bingkai, filter, set stiker */
const $ = (s) => document.querySelector(s);
const W = 480,
  H = 360,
  P = 32,
  G = 20,
  F = 100,
  M = 12;
const LAY = {
  s4: { n: 4, c: 1, name: "Strip 4" },
  s3: { n: 3, c: 1, name: "Strip 3" },
  g4: { n: 4, c: 2, name: "Kotak 2×2" },
  d4: { n: 8, c: 2, name: "4×2 (8 foto)" },
  d3: { n: 6, c: 2, name: "3×2 (6 foto)" },
  l4: { n: 4, c: 2, dup: true, name: "Life4Cuts (kembar)" },
  p1: { n: 1, c: 1, F: 150, name: "Polaroid 1 foto" },
  p2: { n: 2, c: 1, F: 150, name: "Polaroid 2 foto" },
};
const FR = [
  { name: "🍬 Permen", bg: "#ffb3d6", fg: "#ffffff", pat: "dots", ink: "#2d1b69" },
  { name: "📰 Koran", bg: "#e8e0cc", fg: "#8a8272", pat: "news", ink: "#1e1a14" },
  { name: "📒 Buku tulis", bg: "#fffdf2", fg: "#7ab8ff", pat: "notes", ink: "#2d1b69" },
  { name: "🎞️ Film", bg: "#15121c", fg: "#f5f0e1", pat: "film", ink: "#f5f0e1" },
  { name: "🪩 Holo", bg: "#d9c8ff", fg: "#fff", pat: "holo", ink: "#2d1b69" },
  { name: "🌌 Langit bintang", bg: "#241a5e", fg: "#ffe14d", pat: "sky", ink: "#fff8d6" },
  { name: "🌈 Pelangi", bg: "#fff", fg: "", pat: "rainbow", ink: "#2d1b69" },
  { name: "🧈 Mentega", bg: "#ffe27a", fg: "#ffc21a", pat: "stripes", ink: "#2d1b69" },
  { name: "🍵 Mint", bg: "#9debd2", fg: "#ffffff", pat: "stars", ink: "#2d1b69" },
  { name: "🍇 Anggur", bg: "#b9a6ff", fg: "#ffffff", pat: "hearts", ink: "#2d1b69" },
  { name: "🧺 Piknik", bg: "#ffffff", fg: "#ff9cc0", pat: "checker", ink: "#2d1b69" },
  { name: "🤍 Polaroid", bg: "#fbf7ee", fg: "", pat: "none", ink: "#2d1b69" },
  { name: "👖 Denim", bg: "#4a6fa5", fg: "", pat: "denim", ink: "#fff8e0" },
  { name: "✉️ Surat jadul", bg: "#f1e6c8", fg: "", pat: "mail", ink: "#4a3b22" },
  { name: "💗 Heartline", bg: "#ffd1e3", fg: "", pat: "heart", ink: "#b0143f" },
  { name: "🎂 Ulang tahun", bg: "#fff6d6", fg: "", pat: "party", ink: "#2d1b69" },
  { name: "🌙 Lebaran", bg: "#0f5c3a", fg: "", pat: "raya", ink: "#ffe9a8" },
  { name: "🎄 Natal", bg: "#c62839", fg: "", pat: "xmas", ink: "#ffffff" },
];
const FI = [
  { name: "🌼 Asli", css: "none" },
  { name: "🪩 Y2K glow", css: "brightness(1.1) contrast(1.05) saturate(1.6) hue-rotate(-8deg)" },
  { name: "🇰🇷 Korea soft", css: "brightness(1.12) contrast(.92) saturate(1.1) sepia(.08)" },
  { name: "🤍 Clean girl", css: "brightness(1.1) contrast(1.05) saturate(.85)" },
  { name: "🎬 Sinema", css: "contrast(1.25) saturate(1.1) sepia(.15) brightness(.95)" },
  { name: "📸 Polaroid", css: "sepia(.2) contrast(.95) brightness(1.1) saturate(1.3)" },
  { name: "📼 Film 90an", css: "sepia(.35) contrast(1.1) saturate(1.1) hue-rotate(-15deg) brightness(1.05)" },
  { name: "🌆 Golden hour", css: "sepia(.3) saturate(1.6) brightness(1.05) hue-rotate(-8deg)" },
  { name: "💜 Neon", css: "hue-rotate(-30deg) saturate(2) contrast(1.15)" },
  { name: "☁️ Dreamy", css: "brightness(1.15) saturate(1.4) blur(.7px)" },
  { name: "🐼 Mono", css: "grayscale(1) contrast(1.15)" },
  { name: "🎨 Pop", css: "contrast(1.3) saturate(1.8)" },
];
const ST = [
  { name: "Polos", e: [] },
  { name: "🦋 Y2K", e: ["🦋", "💿", "⭐", "🪩"] },
  { name: "🎀 Coquette", e: ["🎀", "🤍", "🩰", "🌷"] },
  { name: "🧋 Boba", e: ["🧋", "🍰", "🍡", "🍓"] },
  { name: "🍵 Matcha", e: ["🍵", "🌿", "🍙", "🐸"] },
  { name: "💜 K-pop", e: ["💜", "🪩", "🎤", "✨"] },
  { name: "👽 Alien", e: ["👽", "🛸", "💫", "🌙"] },
  { name: "🧸 Lucu", e: ["🧸", "🐰", "🐱", "🌸"] },
  { name: "👑 Bling", e: ["👑", "💎", "💖", "✨"] },
];
if (typeof TPL !== "undefined")
  TPL.forEach((t) => {
    if (typeof TPL_IMG !== "undefined" && TPL_IMG[t.id]) t.src = TPL_IMG[t.id];
    LAY["t_" + t.id] = { n: t.slots.length, c: 1, name: t.name, tpl: t };
  });
