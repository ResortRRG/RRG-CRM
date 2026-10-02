import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import { registerAuthRoutes } from "./auth.js";
import { registerStorageRoutes } from "./storageRoutes.js";
import { registerEmployeeFileRoutes } from "./employeeFiles.js";
import { registerExpenseFileRoutes } from "./expenseFiles.js";
import { registerPayslipRoutes } from "./payslipRoutes.js";
import { registerEpgRoutes } from "./epgIntegration.js";
import { registerBlacklistRoutes } from "./blacklistCheck.js";
import { registerScriptFileRoutes } from "./scriptFiles.js";
import { registerSalesRoutes, migrateSalesFromBlob } from "./salesRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());

registerAuthRoutes(app);
registerStorageRoutes(app);
registerEmployeeFileRoutes(app);
registerExpenseFileRoutes(app);
registerPayslipRoutes(app);
registerEpgRoutes(app);
registerBlacklistRoutes(app);
registerScriptFileRoutes(app);
registerSalesRoutes(app);

// Lets the client detect when a new version has been deployed, so it can
// prompt anyone with an old tab open to refresh rather than silently
// keep running outdated code after a fix goes live.
const SERVER_VERSION = String(Date.now());
app.get("/api/version", (req, res) => {
  res.json({ version: SERVER_VERSION });
});

// Serve the built React app (client/dist) in production. The built JS/CSS
// files have content hashes in their names (Vite's doing), so THOSE are
// safe to cache aggressively — a new build gets new filenames automatically.
// index.html is the opposite: it's what POINTS at those hashed filenames,
// so if a browser (or anything sitting in front of this, like a cache or
// a restored/background tab) ever serves a stale copy of index.html, the
// page keeps loading old JS indefinitely no matter how many times someone
// hits refresh — it never even asks the server for anything new. Explicit
// no-store headers here make sure that can't happen.
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(
  express.static(clientDist, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      }
    },
  })
);
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => migrateSalesFromBlob())
  .then(() => {
    app.listen(PORT, () => console.log(`RRG CRM server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
