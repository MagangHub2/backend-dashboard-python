import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import sendRoutes from "./routes/send.routes.js";
import waStatusRoutes from "./routes/wa-status.routes.js";

const app = express();

// CORS untuk frontend
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8888",
      "http://127.0.0.1:8888",
      "http://localhost:9999",
      "http://127.0.0.1:9999",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));

// Routes
app.use(healthRoutes);
app.use(sendRoutes);
app.use(waStatusRoutes);

export default app;
