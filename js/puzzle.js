/* Mode puzzle: foto dipotong jadi kepingan acak, pemain menukar kepingan sampai gambarnya utuh.
   solvePuzzle(photoCanvas) -> Promise<boolean>  (true = selesai, false = pemain minta foto ulang) */
function solvePuzzle(photo) {
  return new Promise((resolve) => {
    const n = S.pz,
      total = n * n,
      url = photo.toDataURL("image/jpeg", 0.88);
    const { box, close } = openModal("pz");
    box.innerHTML = `
      <h2>🧩 Susun fotonya!</h2>
      <p class="muted tiny">Ketuk dua kepingan untuk menukar, atau geser satu kepingan ke kepingan lain.</p>
      <div class="pz-wrap"><div class="pz-grid" style="--n:${n}"></div><div class="pz-peek" style="background-image:url(${url})"></div></div>
      <div class="muted" id="pzInfo"></div>
      <div class="row" style="justify-content:center">
        <button class="sm" id="pzHint">👀 Intip</button>
        <button class="sm" id="pzShuf">🔀 Acak ulang</button>
        <button class="sm ghost" id="pzSkip">↻ Foto ulang</button>
      </div>`;
    const grid = box.querySelector(".pz-grid"),
      peek = box.querySelector(".pz-peek"),
      info = box.querySelector("#pzInfo");
    let ord = [],
      sel = null,
      moves = 0,
      hints = 0,
      finished = false;
    const t0 = Date.now();
    const solved = () => ord.every((p, i) => p === i);
    const shuffle = () => {
      do {
        ord = Array.from({ length: total }, (_, i) => i);
        for (let i = total - 1; i > 0; i--) {
          const j = (Math.random() * (i + 1)) | 0;
          [ord[i], ord[j]] = [ord[j], ord[i]];
        }
      } while (solved());
      sel = null;
      moves = 0;
      draw();
    };
    const tick = () => {
      if (finished) return;
      const s = Math.floor((Date.now() - t0) / 1000);
      info.textContent = `Langkah: ${moves} · Waktu: ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}${hints ? " · Intip: " + hints : ""}`;
    };
    function draw() {
      grid.innerHTML = "";
      ord.forEach((piece, pos) => {
        const t = document.createElement("button");
        t.className = "pz-t";
        t.dataset.pos = pos;
        t.setAttribute("aria-label", "Kepingan " + (pos + 1));
        t.setAttribute("aria-pressed", String(sel === pos));
        const px = piece % n,
          py = Math.floor(piece / n);
        t.style.backgroundImage = `url(${url})`;
        t.style.backgroundSize = `${n * 100}% ${n * 100}%`;
        t.style.backgroundPosition = `${(px / (n - 1)) * 100}% ${(py / (n - 1)) * 100}%`;
        grid.appendChild(t);
      });
      tick();
    }
    function swap(a, b) {
      [ord[a], ord[b]] = [ord[b], ord[a]];
      moves++;
      sel = null;
      draw();
      if (solved()) win();
    }
    function win() {
      finished = true;
      clearInterval(timer);
      grid.classList.add("ok");
      const s = Math.floor((Date.now() - t0) / 1000);
      info.textContent = `Selesai! 🎉 ${moves} langkah, ${s} detik`;
      setTimeout(() => {
        close();
        resolve(true);
      }, 1200);
    }
    /* ketuk-ketuk atau geser: pointerdown mencatat asal, pointerup menentukan tujuan */
    let from = null;
    const posAt = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const t = el && el.closest(".pz-t");
      return t ? +t.dataset.pos : null;
    };
    grid.addEventListener("pointerdown", (e) => {
      if (!finished) from = posAt(e);
    });
    grid.addEventListener("pointerup", (e) => {
      if (finished || from == null) return;
      const to = posAt(e);
      if (to == null) {
        from = null;
        return;
      }
      if (to !== from) swap(from, to);
      else if (sel == null) {
        sel = to;
        draw();
      } else if (sel === to) {
        sel = null;
        draw();
      } else swap(sel, to);
      from = null;
    });
    box.querySelector("#pzHint").onclick = () => {
      hints++;
      peek.classList.add("on");
      setTimeout(() => peek.classList.remove("on"), 1500);
    };
    box.querySelector("#pzShuf").onclick = shuffle;
    box.querySelector("#pzSkip").onclick = () => {
      finished = true;
      clearInterval(timer);
      close();
      resolve(false);
    };
    const timer = setInterval(tick, 500);
    shuffle();
  });
}
