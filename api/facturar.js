// ============================================================
//  SANJAF — Función de servidor para facturar con Facturapi
//  Corre en Vercel (Serverless). La LLAVE SECRETA nunca sale de aquí.
//
//  Variables de entorno que debes configurar en Vercel:
//    FACTURAPI_KEY      -> tu llave de Facturapi (sk_test_... o sk_live_...)
//    SUPABASE_URL       -> https://xxxx.supabase.co   (el de SANJAF)
//    SUPABASE_ANON_KEY  -> la anon public key de SANJAF
// ============================================================

const FACTURAPI = "https://www.facturapi.io/v2";

// Verifica que quien llama tenga una sesión válida de Supabase.
async function usuarioValido(req) {
  try {
    const auth = req.headers["authorization"] || req.headers["Authorization"] || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) return false;
    const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
    if (!url || !anon) return false;
    const r = await fetch(url.replace(/\/$/, "") + "/auth/v1/user", {
      headers: { apikey: anon, Authorization: "Bearer " + token },
    });
    return r.ok;
  } catch (e) { return false; }
}

function facturapiHeaders() {
  const key = process.env.FACTURAPI_KEY || "";
  return { Authorization: "Bearer " + key, "Content-Type": "application/json" };
}

module.exports = async function handler(req, res) {
  const key = process.env.FACTURAPI_KEY;
  if (!key) {
    res.status(500).json({ error: "Falta configurar FACTURAPI_KEY en Vercel." });
    return;
  }

  // Descargas (PDF / XML) — GET ?action=pdf&id=...
  if (req.method === "GET") {
    const action = (req.query && req.query.action) || "";
    const id = (req.query && req.query.id) || "";
    if (!["pdf", "xml", "zip"].includes(action) || !id) {
      res.status(400).json({ error: "Parámetros inválidos." });
      return;
    }
    if (!(await usuarioValido(req))) { res.status(401).json({ error: "No autorizado." }); return; }
    try {
      const r = await fetch(`${FACTURAPI}/invoices/${encodeURIComponent(id)}/${action}`, {
        headers: { Authorization: "Bearer " + key },
      });
      if (!r.ok) { const t = await r.text(); res.status(r.status).json({ error: "Facturapi: " + t }); return; }
      const buf = Buffer.from(await r.arrayBuffer());
      const types = { pdf:
