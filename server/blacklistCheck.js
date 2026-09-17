import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

// Checks a phone number against Blacklist Alliance's litigation risk
// database (professional TCPA plaintiffs, litigator attorneys, DNC lists).
// The API key lives only here on the server — it's never sent to the browser.

// A failed lookup (bad key, wrong API version, network error, etc.) is
// recorded here so the CRM can show a banner instead of failing silently.
// Blacklist Alliance can return a normal 200 OK with a body like
// { "status": "failed", "message": "..." } — that's still a failure, not
// just a non-2xx HTTP status, so both cases are checked below.
const FAILURE_KEY = "blacklist:lastFailure";

async function recordFailure(message) {
  const value = JSON.stringify({ message, at: new Date().toISOString() });
  try {
    await pool.query(
      `INSERT INTO app_data (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
      [FAILURE_KEY, value]
    );
  } catch (e) {
    console.error("Failed to record blacklist failure state:", e);
  }
}

export function registerBlacklistRoutes(app) {
  app.post("/api/blacklist/check", requireAuth, async (req, res) => {
    const { phone } = req.body || {};

    const apiKey = process.env.BLACKLIST_ALLIANCE_API_KEY;
    if (!apiKey) {
      const message = "Litigation risk screening isn't configured yet — BLACKLIST_ALLIANCE_API_KEY is missing on the server.";
      await recordFailure(message);
      return res.status(500).json({ error: message });
    }

    const cleanPhone = (phone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: "Enter a valid 10-digit phone number." });
    }

    try {
      const url = `https://api.blacklistalliance.net/lookup?key=${encodeURIComponent(apiKey)}&phone=${cleanPhone}&resp=json&ver=v1`;
      const blRes = await fetch(url);
      const data = await blRes.json().catch(() => ({}));

      if (!blRes.ok || data.status === "failed") {
        const message =
          (data && data.message) ||
          `Blacklist Alliance rejected the request (status ${blRes.status}).`;
        console.error("Blacklist Alliance error:", blRes.status, data);
        await recordFailure(message);
        return res.status(502).json({ error: message });
      }

      res.json(data);
    } catch (err) {
      console.error("Blacklist check failed:", err);
      const message = "Couldn't reach Blacklist Alliance — " + (err.message || "network error");
      await recordFailure(message);
      res.status(500).json({ error: message });
    }
  });

  // Lets the CRM show a dismissible banner when the last check failed.
  app.get("/api/blacklist/failure-status", requireAuth, async (req, res) => {
    const { rows } = await pool.query("SELECT value FROM app_data WHERE key = $1", [FAILURE_KEY]);
    res.json({ failure: rows[0] ? JSON.parse(rows[0].value) : null });
  });

  // Called when someone dismisses the banner in the CRM.
  app.post("/api/blacklist/acknowledge-failure", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM app_data WHERE key = $1", [FAILURE_KEY]);
    res.json({ ok: true });
  });
}
