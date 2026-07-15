import express from "express";
import { fileURLToPath, pathToFileURL } from "node:url";
import { prisma } from "./db.js";
import { sortByDistance } from "./geo/distance.js";

export function createApp() {
  const app = express();

  // GET /customers/count -> { count }
  app.get("/customers/count", async (_req, res) => {
    try {
      const count = await prisma.customer.count();
      res.json({ count });
    } catch (err) {
      console.error("[GET /customers/count]", err);
      res.status(500).json({ error: "internal error" });
    }
  });

  // GET /customers/by-distance -> növekvő távolság Budapesttől
  app.get("/customers/by-distance", async (_req, res) => {
    try {
      const rows = await prisma.customer.findMany({
        select: { id: true, name: true, telepules: true, lat: true, lon: true },
      });
      res.json(sortByDistance(rows));
    } catch (err) {
      console.error("[GET /customers/by-distance]", err);
      res.status(500).json({ error: "internal error" });
    }
  });

  return app;
}

// Main-guard: csak közvetlen indításkor indítjuk a szervert.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, () => {
    console.log(`[server] fut: http://localhost:${port}`);
  });
}
