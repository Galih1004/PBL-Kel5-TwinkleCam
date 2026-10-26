/* State global dan helper kecil */
const S = {
  lay: "s4",
  fr: 5,
  fi: 1,
  st: 1,
  cap: "Twinkle Cam ✨",
  photos: [],
  clips: [],
  custom: null,
  mirror: true,
  busy: false,
  timer: 5,
  tab: "fr",
  tips: true,
  free: [],
  sel: null,
  zoom: 1,
  grow: 1,
  capF: 0,
};
const cv = $("#strip"),
  ctx = cv.getContext("2d"),
  video = $("#video");
let jobP = Promise.resolve(),
  vidBlob = null,
  vidUrl = null,
  vidExt = "webm",
  vidTk = 0,
  gifBlob = null,
  stream = null,
  gifUrl = null,
  gifTk = 0,
  prevV = "home";
const POSE = [
  "Senyum lebar 😁",
  "Pose peace ✌️",
  "Bikin bentuk hati 🫶",
  "Pura-pura kaget 😲",
  "Gaya model 💅",
  "Tertawa lepas 🤣",
  "Pipi imut 🥺",
  "Angkat tangan 🙌",
  "Bibir manyun 😗",
  "Gaya detektif 🕵️",
  "Peluk diri sendiri 🤗",
  "Tatap teman sebelahmu 👀",
  "Pose kucing 🐱",
  "Gaya cool 😎",
];
let lastPose = -1;
const load = (box, t) => {
  box.innerHTML = '<div class="spin"></div><p></p>';
  box.lastChild.textContent = t;
};
const waitC = async (ms) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (S.cancel) return true;
    await sleep(Math.min(50, ms));
  }
  return !!S.cancel;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FF = () => LAY[S.lay].F || F,
  cnt = () => LAY[S.lay].n,
  done = () => Array.from({ length: cnt() }).every((_, i) => S.photos[i]);
const curFr = () => (S.custom ? { bg: S.custom, fg: "#ffffff", pat: "dots", ink: "#2d1b69" } : FR[S.fr]);
function toast(t) {
  const e = $("#toast");
  e.textContent = t;
  e.classList.add("on");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => e.classList.remove("on"), 3200);
}
