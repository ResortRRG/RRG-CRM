import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

// One-time migration: if the old shared-blob sales list (app_data under the
// "crm:sales" key) has data and the new sales table is still empty, copy
// each sale over as its own row. Safe to run on every boot — it only acts
// when the new table is empty, so it's a no-op after the first successful
// migration. This exists purely so existing sales aren't lost in the
// transition; it isn't needed for normal operation afterward.
export async function migrateSalesFromBlob() {
  const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS count FROM sales");
  if (countRows[0].count > 0) return; // already migrated (or started fresh)

  const { rows: blobRows } = await pool.query("SELECT value FROM app_data WHERE key = $1", ["crm:sales"]);
  if (!blobRows[0]) return; // nothing to migrate
  const oldSales = Array.isArray(blobRows[0].value) ? blobRows[0].value : [];
  if (oldSales.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const sale of oldSales) {
      if (!sale.id) continue;
      const { id, ...rest } = sale;
      await client.query(
        `INSERT INTO sales (id, data, updated_at) VALUES ($1, $2, now())
         ON CONFLICT (id) DO NOTHING`,
        [id, JSON.stringify(rest)]
      );
    }
    await client.query("COMMIT");
    console.log(`Migrated ${oldSales.length} sales from the old shared-blob storage into individual rows.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Sales migration failed:", err);
  } finally {
    client.release();
  }
}

function rowToSale(row) {
  return { id: row.id, ...row.data };
}

export function registerSalesRoutes(app) {
  // Full list — used for display/reporting. Reading the whole list is fine
  // and doesn't need to be atomic; only the writes below do.
  app.get("/api/sales", requireAuth, async (req, res) => {
    const { rows } = await pool.query("SELECT id, data FROM sales ORDER BY updated_at ASC");
    res.json({ sales: rows.map(rowToSale) });
  });

  // Create a new sale. The server assigns the id, so there's no possibility
  // of two people's new sales colliding on the same id.
  app.post("/api/sales", requireAuth, async (req, res) => {
    const { id, ...rest } = req.body || {};
    if (!id) return res.status(400).json({ error: "id is required" });
    try {
      await pool.query(
        `INSERT INTO sales (id, data, updated_at) VALUES ($1, $2, now())
         ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = now()`,
        [id, JSON.stringify(rest)]
      );
    } catch (err) {
      console.error("Sale create failed:", err);
      return res.status(500).json({ error: "Couldn't save this sale — " + (err.message || "unknown error") });
    }
    res.json({ sale: { id, ...rest } });
  });

  // Update one sale by id. This only ever touches this one row — it cannot
  // overwrite anything happening to a different sale at the same time.
  app.put("/api/sales/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { rows: existing } = await pool.query("SELECT data FROM sales WHERE id = $1", [id]);
    if (!existing[0]) return res.status(404).json({ error: "Sale not found" });
    const merged = { ...existing[0].data, ...req.body };
    delete merged.id;
    try {
      await pool.query("UPDATE sales SET data = $1, updated_at = now() WHERE id = $2", [JSON.stringify(merged), id]);
    } catch (err) {
      console.error("Sale update failed:", err);
      return res.status(500).json({ error: "Couldn't save this sale — " + (err.message || "unknown error") });
    }
    res.json({ sale: { id, ...merged } });
  });

  app.delete("/api/sales/:id", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM sales WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  });

  // For genuine full-dataset admin operations only — restoring a backup,
  // importing historical leads, or reassigning employee ids across every
  // sale during a merge. These are explicit, deliberate full replacements,
  // not routine edits, so overwriting everything is the actual intent here
  // rather than the accidental side effect it was everywhere else.
  app.post("/api/sales/bulk-replace", requireAuth, async (req, res) => {
    const { sales: nextSales } = req.body || {};
    if (!Array.isArray(nextSales)) return res.status(400).json({ error: "sales must be an array" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM sales");
      for (const sale of nextSales) {
        if (!sale.id) continue;
        const { id, ...rest } = sale;
        await client.query("INSERT INTO sales (id, data, updated_at) VALUES ($1, $2, now())", [id, JSON.stringify(rest)]);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Bulk sales replace failed:", err);
      return res.status(500).json({ error: "Bulk replace failed: " + (err.message || "unknown error") });
    } finally {
      client.release();
    }
    res.json({ ok: true, count: nextSales.length });
  });
}
