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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());

registerAuthRoutes(app);
registerStorageRoutes(app);
registerEmployeeFileRoutes(app);
registerExpenseFileRoutes(app);
registerPayslipRoutes(app);

// Serve the built React app (client/dist) in production.
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`RRG CRM server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
