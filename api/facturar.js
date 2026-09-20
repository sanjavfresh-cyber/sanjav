const FACTURAPI = "https://www.facturapi.io/v2";

function sendJSON(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

async function leerBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch (e) { return {}; } }
    return req.body;
  }
  return await new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}

async function usuarioValido(req) {
  try {
    const auth = req.headers["authorization"] || req.headers["Authorization"] || "";
    const token = String(auth).replace(/^Bearer\s+/i, "").trim();
    if (!token) return false;
    const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
    if (!url || !anon) return false;
    const r = await fetch(url.replace(/\/$/, "") + "/auth/v1/user", {
      headers: { apikey: anon, Authorization: "Bearer " + token },
    });
    return r.ok;
  } catch (e) { return false; }
}

module.exports = async function handler(req, res) {
  try {
    const key = process.env.FACTURAPI_KEY;
    if (!key) return sendJSON(res, 500, { error: "Falta configurar FACTURAPI_KEY en Vercel." });

    const method = req.method || "GET";
    const query = req.query || {};

    if (method === "GET") {
      const action = query.action || "", id = query.id || "";
      if (!action && !id) return sendJSON(res, 200, { ok: true, mensaje: "Función de facturación activa." });
      if (!["pdf", "xml", "zip"].includes(action) || !id) return sendJSON(res, 400, { error: "Parámetros inválidos." });
      if (!(await usuarioValido(req))) return sendJSON(res, 401, { error: "No autorizado." });
      const r = await fetch(`${FACTURAPI}/invoices/${encodeURIComponent(id)}/${action}`, { headers: { Authorization: "Bearer " + key } });
      if (!r.ok) { const t = await r.text(); return sendJSON(res, r.status, { error: "Facturapi: " + t.slice(0, 300) }); }
      const buf = Buffer.from(await r.arrayBuffer());
      const types = { pdf: "application/pdf", xml: "application/xml", zip: "application/zip" };
      res.statusCode = 200;
      res.setHeader("Content-Type", types[action]);
      res.setHeader("Content-Disposition", `inline; filename="factura-${id}.${action}"`);
      res.end(buf);
      return;
    }

    if (method !== "POST") return sendJSON(res, 405, { error: "Método no permitido." });
    if (!(await usuarioValido(req))) return sendJSON(res, 401, { error: "No autorizado (tu sesión pudo expirar, vuelve a entrar)." });

    const body = await leerBody(req);
    const c = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (!c.legal_name || !c.tax_id || !c.tax_system || !(c.address && c.address.zip))
      return sendJSON(res, 400, { error: "Faltan datos fiscales del cliente (RFC, razón social, régimen o código postal)." });
    if (!items.length) return sendJSON(res, 400, { error: "La nota no tiene productos para facturar." });

    const rate = typeof body.iva_rate === "number" ? body.iva_rate : 0;
    const invoice = {
      customer: {
        legal_name: String(c.legal_name).trim(),
        tax_id: String(c.tax_id).trim().toUpperCase(),
        tax_system: String(c.tax_system),
        email: c.email || undefined,
        address: { zip: String(c.address.zip).trim() },
      },
      items: items.map((it) => ({
        quantity: Number(it.quantity) || 1,
        product: {
          description: String(it.description || "Producto").slice(0, 1000),
          product_key: String(it.product_key || "50100000"),
          unit_key: String(it.unit_key || "H87"),
          price: Number(it.price) || 0,
          tax_included: it.tax_included === true,
          taxes: [{ type: "IVA", rate: rate }],
        },
      })),
      use: body.use || "G03",
      payment_form: body.payment_form || "01",
      payment_method: body.payment_method || "PUE",
    };
    if (body.folio_number) invoice.folio_number = body.folio_number;

    const r = await fetch(`${FACTURAPI}/invoices`, {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    });
    const txt = await r.text();
    let data = {}; try { data = JSON.parse(txt); } catch (e) {}
    if (!r.ok) return sendJSON(res, r.status, { error: (data && data.message) || ("Facturapi: " + txt.slice(0, 300)) });
    return sendJSON(res, 200, {
      id: data.id, uuid: data.uuid, folio_number: data.folio_number,
      series: data.series, total: data.total, status: data.status, verification_url: data.verification_url,
    });
  } catch (e) {
    return sendJSON(res, 500, { error: "Error interno: " + String((e && e.message) || e) });
  }
};
