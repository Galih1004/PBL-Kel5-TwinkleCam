/* TWINKLE CAM — Halaman Riwayat Album (khusus pengguna login) */
const grid = document.getElementById("albumGrid");
const empty = document.getElementById("empty");
const locked = document.getElementById("locked");
const box = document.getElementById("lightbox");

function showLockedState() {
    locked.hidden = false; // tampilkan panel terkunci
    grid.hidden = empty.hidden = true;
    TC.requireLogin({ next: "album" });
}

function initAlbum() {
    const KEY = TC.auth.albumKey();
    let albums = TC.store.get(KEY, []);
    let openId = null;

    function render() {
        empty.hidden = albums.length > 0;
        grid.innerHTML = albums
            .map((a) => {
                const d = new Date(a.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                });
                return `<button class="album-item" type="button" data-id="${a.id}">
                    <img src="${a.img}" alt="Strip foto ${d}">
                    <span>${d} · ${a.tpl}</span>
                </button>`;
            })
            .join("");
    }

    grid.addEventListener("click", (e) => {
        const item = e.target.closest(".album-item");
        if (!item) return;
        const a = albums.find((x) => String(x.id) === item.dataset.id);
        openId = a.id;
        document.getElementById("lbImg").src = a.img;
        document.getElementById("lbDownload").href = a.img;
        box.showModal();
    });

    document.getElementById("lbClose").addEventListener("click", () => box.close());
    box.addEventListener("click", (e) => {
        if (e.target === box) box.close();
    });
    document.getElementById("lbDelete").addEventListener("click", () => {
        albums = albums.filter((a) => a.id !== openId);
        TC.store.set(KEY, albums);
        box.close();
        render();
        TC.toast("Foto dihapus");
    });

    render();
}

if (TC.auth.isLoggedIn()) initAlbum();
else showLockedState();
