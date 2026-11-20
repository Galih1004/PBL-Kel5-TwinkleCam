module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const fail = (code, error) => res.status(code).json({ error });

    if (req.method !== "POST") return fail(405, "Gunakan POST");

    /* Hanya terima dari halaman kita sendiri (cegah situs lain memakai endpoint ini) */
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) return fail(403, "Origin tidak diizinkan");

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return fail(500, "GOOGLE_CLIENT_ID belum diatur di server");

    const credential = req.body && req.body.credential;
    if (typeof credential !== "string" || credential.length > 4096 || credential.split(".").length !== 3)
        return fail(400, "Token tidak valid");

    try {
        const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
        if (!r.ok) return fail(401, "Token ditolak Google");
        const t = await r.json();

        const issOk = t.iss === "accounts.google.com" || t.iss === "https://accounts.google.com";
        const expOk = Number(t.exp) * 1000 > Date.now();
        const emailOk = typeof t.email === "string" && /^\S+@\S+\.\S+$/.test(t.email) && String(t.email_verified) === "true";
        if (t.aud !== clientId || !issOk || !expOk) return fail(401, "Token bukan untuk aplikasi ini atau sudah kedaluwarsa");
        if (!emailOk) return fail(401, "Akun Google harus punya email yang sudah terverifikasi");

        const email = t.email.toLowerCase();
        return res.status(200).json({
            name: String(t.name || email.split("@")[0]).slice(0, 80),
            email,
            picture: typeof t.picture === "string" && t.picture.startsWith("https://") ? t.picture : "",
        });
    } catch {
        return fail(502, "Tidak bisa menghubungi Google");
    }
};
