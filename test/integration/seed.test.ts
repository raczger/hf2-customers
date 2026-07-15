import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/db.js";
import { seed } from "../../src/seed.js";

// Integrációs teszt: éles Postgres kell (docker-compose up -d).
describe("seed idempotencia", () => {
  beforeAll(async () => {
    await prisma.customer.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("kétszer futtatva 15 sor marad", async () => {
    await seed();
    const first = await prisma.customer.count();
    await seed();
    const second = await prisma.customer.count();

    expect(first).toBe(15);
    expect(second).toBe(15);
  });
});
