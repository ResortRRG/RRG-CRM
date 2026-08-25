import { requireAuth } from "./auth.js";

// Sends a payslip email via Resend (https://resend.com). Requires the
// RESEND_API_KEY env var to be set on the Railway service. If it's missing,
// this route returns a clear error instead of silently failing, so the admin
// knows setup isn't finished yet rather than assuming a bug.
export function registerPayslipRoutes(app) {
  app.post("/api/payslip/send", requireAuth, async (req, res) => {
    const { to, employeeName, subject, html } = req.body || {};

    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing to, subject, or html" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Email sending isn't configured yet — RESEND_API_KEY is missing on the server.",
      });
    }

    const fromAddress = process.env.PAYSLIP_FROM_EMAIL || "RRG CRM <onboarding@resend.dev>";

    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
        }),
      });

      const data = await resendRes.json().catch(() => ({}));

      if (!resendRes.ok) {
        console.error("Resend error:", data);
        return res.status(502).json({ error: data.message || "Email service rejected the request." });
      }

      res.json({ ok: true, id: data.id });
    } catch (err) {
      console.error("Payslip send failed:", err);
      res.status(500).json({ error: "Failed to send email." });
    }
  });
}
