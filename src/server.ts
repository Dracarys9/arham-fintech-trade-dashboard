import "dotenv/config";

import cors from "cors";
import express from "express";

import { tradeRoutes } from "./routes/tradeRoutes";

const app = express();
const port = Number(process.env.PORT ?? 3_000);

if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
  throw new Error("PORT must be a valid TCP port");
}

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/trades", tradeRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`BSE trade API listening on port ${port}`);
});
