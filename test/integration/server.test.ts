import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "node:http";
import { prisma } from "../../src/db.js";
import { seed } from "../../src/seed.js";
import { createApp } from "../../src/server.js";

// Integrációs teszt: éles Postgres kell (docker-compose up -d).
describe("végpontok", () => {
  let server: Server;
  let base: string;

  beforeAll(async () => {
    await prisma.customer.deleteMany();
    await seed();
    await new Promise<void>((res) => {
      server = createApp().listen(0, () => {
        const addr = server.address();
        const port = typeof addr === "object" && addr ? addr.port : 0;
        base = `http://localhost:${port}`;
        res();
      });
    });
  });

  afterAll(async () => {
    server.close();
    await prisma.$disconnect();
  });

  it("GET /customers/count -> 15", async () => {
    const r = await fetch(`${base}/customers/count`);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ count: 15 });
  });

  it("GET /customers/by-distance -> Budapest elöl, null a végén", async () => {
    const r = await fetch(`${base}/customers/by-distance`);
    expect(r.status).toBe(200);
    const body = (await r.json()) as { telepules: string; distanceKm: number | null }[];

    expect(body).toHaveLength(15);
    expect(body[0].telepules).toBe("Budapest");
    expect(body[0].distanceKm).toBe(0);

    // növekvő sorrend a nem-null szakaszon
    const known = body.filter((x) => x.distanceKm !== null).map((x) => x.distanceKm!);
    const sorted = [...known].sort((a, b) => a - b);
    expect(known).toEqual(sorted);
  });
});
