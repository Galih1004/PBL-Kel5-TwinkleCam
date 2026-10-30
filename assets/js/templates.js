/* TWINKLE CAM — Halaman Templates */
const photoCount = (t) => t.shots ?? 4;

document.getElementById("tplGrid").innerHTML = TC.TEMPLATES.map((t) => {
    const n = photoCount(t);
    const photos = [1, 2, 3, 4]
        .slice(0, n)
        .map((i) => `<img src="${TC.asset(`images/selfiecontoh${i}.jpg`)}" alt="" loading="lazy">`)
        .join("");
    const background = t.bg
        ? `linear-gradient(rgba(13,10,34,.2), rgba(124,92,255,.6)), ${TC.swatch(t)}`
        : TC.swatch(t);

    return `
    <article class="tpl">
        <div class="tpl__strip${t.bg ? " tpl__strip--photo" : ""}" style="background:${background};color:${t.text}">
            ${photos}
            <span>Twinkle Cam</span>
            ${t.isNew ? '<b class="tpl__new">Baru</b>' : ""}
        </div>
        <h2 class="tpl__name">${t.name} <small>${n} foto</small></h2>
        <a class="btn btn--outline btn--block" href="photobooth.html?template=${t.id}">Pakai template</a>
    </article>`;
}).join("");
