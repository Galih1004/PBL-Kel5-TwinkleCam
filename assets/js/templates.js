/* TWINKLE CAM — Halaman Templates */
document.getElementById("tplGrid").innerHTML = TC.TEMPLATES.map((t) => `
    <article class="tpl">
        <div class="tpl__strip" style="background:linear-gradient(160deg,${t.c1},${t.c2});color:${t.text}">
            ${[1, 2, 3, 4].map((n) => `<img src="assets/images/selfiecontoh${n}.jpg" alt="" loading="lazy">`).join("")}
            <span>Twinkle Cam</span>
        </div>
        <h2 class="tpl__name">${t.name}</h2>
        <a class="btn btn--outline btn--block" href="photobooth.html?template=${t.id}">Pakai template</a>
    </article>`).join("");
