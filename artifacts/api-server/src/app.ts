import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Desktop production mode: serve the pre-built frontend from a single port.
// Activated by setting SERVE_STATIC_DIR to the frontend dist folder.
// This means no reverse-proxy is needed — static files, /api routes, and
// WebSocket all share one port so window.location.host stays consistent.
const staticDir = process.env["SERVE_STATIC_DIR"];
if (staticDir && existsSync(staticDir)) {
  logger.info({ staticDir }, "Serving static frontend files");
  app.use(express.static(staticDir));
  // SPA fallback — let React Router handle client-side routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
