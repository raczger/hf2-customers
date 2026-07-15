import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { prisma } from "./db.js";
import { lookup } from "./geo/reference.js";

interface SeedCustomer {
  name: string;
  budget?: number;
  location: { city: string; countryCode: string };
  note?: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = resolve(__dirname, "..", "seed-customers.json");

export async function seed(): Promise<void> {
  const raw = await readFile(SEED_PATH, "utf8");
  const customers: SeedCustomer[] = JSON.parse(raw);

  let geocoded = 0;
  let missing = 0;

  for (const c of customers) {
    const telepules = c.location.city;
    const coord = lookup(telepules);
    if (coord) {
      geocoded++;
    } else {
      missing++;
      // FR5: hiányzó koordináta nem hiba — logolunk és megyünk tovább.
      console.warn(`[seed] nincs referencia-koordináta: "${telepules}" -> lat/lon = null`);
    }

    // FR2: idempotens upsert a (name, telepules) egyediségi kulcson.
    await prisma.customer.upsert({
      where: { name_telepules: { name: c.name, telepules } },
      create: {
        name: c.name,
        telepules,
        lat: coord?.lat ?? null,
        lon: coord?.lon ?? null,
        budget: c.budget ?? null,
        note: c.note ?? null,
      },
      update: {
        lat: coord?.lat ?? null,
        lon: coord?.lon ?? null,
        budget: c.budget ?? null,
        note: c.note ?? null,
      },
    });
  }

  const total = await prisma.customer.count();
  console.log(`[seed] kész: ${customers.length} feldolgozva (geokódolt: ${geocoded}, ismeretlen: ${missing}); tábla sorszám: ${total}`);
}

// Robusztus main-guard: csak közvetlen indításkor futtat (import esetén nem).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  seed()
    .then(() => prisma.$disconnect())
    .catch(async (err) => {
      console.error("[seed] hiba:", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
