import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import agentsRouter from "./routes/agents";
import credentialsRouter from "./routes/credentials";
import actionsRouter from "./routes/actions";
import auditRouter from "./routes/audit";
import verifyRouter from "./routes/verify";
import vendorsRouter from "./routes/vendors";
import invoicesRouter from "./routes/invoices";
import treasuryRouter from "./routes/treasury";
import dashboardRouter from "./routes/dashboard";
import onboardingRouter from "./routes/onboarding";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));

// Rate limiting
const limiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 60_000, max: 20, message: { error: "Too many AI requests, slow down." } });
app.use(limiter);
app.use("/actions", aiLimiter);
app.use("/invoices", aiLimiter);
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "handle-fi-api" });
});

app.use("/agents", agentsRouter);
app.use("/credentials", credentialsRouter);
app.use("/actions", actionsRouter);
app.use("/audit", auditRouter);
app.use("/verify", verifyRouter);
app.use("/vendors", vendorsRouter);
app.use("/invoices", invoicesRouter);
app.use("/treasury", treasuryRouter);
app.use("/dashboard", dashboardRouter);
app.use("/onboarding", onboardingRouter);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Handle.Fi API running on http://localhost:${PORT}`);
});
