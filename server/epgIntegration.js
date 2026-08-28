import { requireAuth } from "./auth.js";

// Pushes an approved, Monster-submitted sale into EPG's ("Traveling You") CRM.
// The API key lives only here on the server — it's never sent to the browser.
export function registerEpgRoutes(app) {
  app.post("/api/epg/push-sale", requireAuth, async (req, res) => {
    const sale = req.body || {};

    const apiKey = process.env.EPG_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "EPG integration isn't configured yet — EPG_API_KEY is missing on the server.",
      });
    }

    const rawSource = (sale.source || "").trim().toLowerCase();
    let saleType;
    if (rawSource === "dialer") saleType = "DIALER";
    else if (rawSource === "paper") saleType = "PAPER";
    else {
      return res.status(400).json({
        error: `Can't push to EPG — Source must be set to "Dialer" or "Paper" on this sale (currently: ${sale.source || "not set"}).`,
      });
    }

    const saleDate = sale.timestamp ? new Date(sale.timestamp).toISOString().slice(0, 10) : null;

    const payload = {
      saleDate,
      customerName: sale.name || "",
      phone: sale.phone || "",
      packagePrice: Number(sale.packagePrice) || 0,
      verifierAmount: Number(sale.dateFlex) || 0,
      saleType,
      genieNumber: sale.genieNumber || undefined,
      notes: sale.notes || undefined,
    };

    try {
      const epgRes = await fetch("https://travelingyou-crm.com/api/downline-sales", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await epgRes.json().catch(() => ({}));

      if (!epgRes.ok) {
        console.error("EPG push rejected:", data);
        return res.status(502).json({ error: data.error || `EPG rejected the request (status ${epgRes.status}).` });
      }

      res.json({ ok: true, epgId: data.id, totalPrice: data.totalPrice });
    } catch (err) {
      console.error("EPG push failed:", err);
      res.status(500).json({ error: "Couldn't reach EPG — " + (err.message || "network error") });
    }
  });
}
