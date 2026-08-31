import { requireAuth } from "./auth.js";

// Checks a phone number against Blacklist Alliance's litigation risk
// database (professional TCPA plaintiffs, litigator attorneys, DNC lists).
// The API key lives only here on the server — it's never sent to the browser.
export function registerBlacklistRoutes(app) {
  app.post("/api/blacklist/check", requireAuth, async (req, res) => {
    const { phone } = req.body || {};

    const apiKey = process.env.BLACKLIST_ALLIANCE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Litigation risk screening isn't configured yet — BLACKLIST_ALLIANCE_API_KEY is missing on the server.",
      });
    }

    const cleanPhone = (phone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: "Enter a valid 10-digit phone number." });
    }

    try {
      const url = `https://api.blacklistalliance.net/lookup?key=${encodeURIComponent(apiKey)}&phone=${cleanPhone}&resp=json&ver=v1`;
      const blRes = await fetch(url);
      const data = await blRes.json().catch(() => ({}));

      if (!blRes.ok) {
        console.error("Blacklist Alliance error:", blRes.status, data);
        return res.status(502).json({ error: "Blacklist Alliance rejected the request (status " + blRes.status + ")." });
      }

      res.json(data);
    } catch (err) {
      console.error("Blacklist check failed:", err);
      res.status(500).json({ error: "Couldn't reach Blacklist Alliance — " + (err.message || "network error") });
    }
  });
}
