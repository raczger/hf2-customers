# customers REST szolgáltatás — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kicsi, önálló REST szolgáltatás Postgres fölött, amely idempotensen betölt 15 ügyfelet, lokálisan (offline) geokódolja őket, és Budapesthez viszonyított távolság szerint lekérdezhetővé teszi őket.

**Architecture:** Express szerver + Prisma ORM Postgres (Docker) fölött. A geo logika (normalizálás, haversine, referencia, távolság) tiszta, I/O-mentes modulokban él, hogy offline unit-tesztelhető legyen. A seed külön, idempotens szkript. A távolság-számítás és -rendezés app-oldalon fut (15 sor).

**Tech Stack:** Node.js + TypeScript (ESM), Express, Prisma, Vitest, Docker Compose, tsx.

## Global Constraints

- **Offline:** nincs külső geokódoló API, nincs LLM-hívás futásidőben. A geokódolás kizárólag a repóba bundle-olt lokális referenciából.
- **Idempotencia:** a seed kétszeri futása után is pontosan 15 sor.
- **Robusztus egyeztetés:** település-egyeztetés ékezet- és kis/nagybetű-független, trimmelt whitespace. `budapest*` (kerületek is) → főváros.
- **Nincs crash ismeretlen településnél:** `lat/lon = null`, warning log, továbbmegy.
- **Kis, fókuszált commitok** — minden task végén commit.
- **Adatmodell:** `customers(id, name, telepules, lat nullable, lon nullable, budget?, note?)`.

## File Structure

| Fájl | Felelősség |
|------|-----------|
| `package.json`, `tsconfig.json`, `vitest.config.ts` | projekt-konfiguráció |
| `docker-compose.yml`, `.env.example` | Postgres futtatás, kapcsolat |
| `prisma/schema.prisma` | `customers` modell |
| `src/geo/normalize.ts` | `normalizeCity(input)` — trim/lower/ékezet |
| `src/geo/haversine.ts` | `haversineKm(lat1,lon1,lat2,lon2)` — tiszta táv |
| `src/geo/reference.ts` | `BUDAPEST`, `lookupCoords(city)` — lokális referencia |
| `src/geo/distance.ts` | `round1`, `distanceToBudapestKm`, `compareByDistance` |
| `src/seed.ts` | idempotens seed + geokódolás |
| `src/db.ts` | Prisma client singleton |
| `src/server.ts` | Express app + a két végpont |
| `test/unit/*.test.ts` | tiszta unit tesztek (DB nélkül) |
| `test/integration/*.test.ts` | seed + végpont tesztek (DB kell) |
| `.mcp.json` | Postgres MCP bekötés |
| `README.md` | futtatási útmutató |

**Interfész-összefoglaló (a taszkok közti szerződés):**

```ts
// normalize.ts
export function normalizeCity(input: string): string
// haversine.ts
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number
// reference.ts
export interface Coords { lat: number; lon: number }
export const BUDAPEST: Coords
export function lookupCoords(city: string): Coords | null
// distance.ts
export function round1(n: number): number
export function distanceToBudapestKm(lat: number | null, lon: number | null): number | null
export interface Ranked { name: string; distanceKm: number | null }
export function compareByDistance(a: Ranked, b: Ranked): number
// seed.ts
export interface SeedCustomer { name: string; budget: number; location: { city: string; countryCode: string }; note: string }
export function seedCustomers(prisma: PrismaClient, data: SeedCustomer[]): Promise<void>
// server.ts
export function createApp(prisma: PrismaClient): Express
```

---

### Task 1: Projekt-scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `docker-compose.yml`, `.env.example`

**Interfaces:**
- Produces: futó dev-környezet (`npm install`, `docker compose up`, `npm test`).

- [ ] **Step 1: `package.json`**

```json
{
  "name": "hf2-customers",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "generate": "prisma generate",
    "migrate": "prisma migrate deploy",
    "migrate:dev": "prisma migrate dev",
    "seed": "tsx src/seed.ts",
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts",
    "test": "vitest run test/unit",
    "test:integration": "vitest run test/integration"
  },
  "dependencies": {
    "@prisma/client": "^6.2.0",
    "dotenv": "^16.4.7",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.10.5",
    "@types/supertest": "^6.0.2",
    "prisma": "^6.2.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: customers
      POSTGRES_PASSWORD: customers
      POSTGRES_DB: customers
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U customers -d customers"]
      interval: 3s
      timeout: 3s
      retries: 10
```

- [ ] **Step 5: `.env.example`**

```
DATABASE_URL="postgresql://customers:customers@localhost:5432/customers?schema=public"
PORT=3000
```

- [ ] **Step 6: Install + smoke**

Run: `npm install` then `cp .env.example .env` then `docker compose up -d` then `npm test`
Expected: install ok; Postgres konténer `healthy`; vitest „No test files found" (0 teszt) — hiba nélkül lefut.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts docker-compose.yml .env.example
git commit -m "chore: projekt-scaffold (ts, vitest, docker compose, env)"
```

---

### Task 2: Prisma séma + migráció

**Files:**
- Create: `prisma/schema.prisma`, `prisma/migrations/**` (generált)

**Interfaces:**
- Produces: `customers` tábla + generált Prisma client (`@@unique([name, telepules])` → `name_telepules` composite key).

- [ ] **Step 1: `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model customers {
  id        Int     @id @default(autoincrement())
  name      String
  telepules String
  lat       Float?
  lon       Float?
  budget    Int?
  note      String?

  @@unique([name, telepules])
}
```

- [ ] **Step 2: Migráció létrehozása + alkalmazása**

Run: `npm run migrate:dev -- --name init`
Expected: létrejön `prisma/migrations/<ts>_init/migration.sql`, a `customers` tábla létrejön, a client generálódik.

- [ ] **Step 3: Séma-ellenőrzés (MCP vagy prisma)**

Run: `npx prisma db execute --stdin <<< "SELECT to_regclass('public.customers');"` vagy a Postgres MCP-vel nézd meg a táblát.
Expected: a `customers` tábla létezik, oszlopai: id, name, telepules, lat, lon, budget, note.

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: prisma customers séma + init migráció"
```

---

### Task 3: `normalizeCity` (TDD)

**Files:**
- Test: `test/unit/normalize.test.ts`
- Create: `src/geo/normalize.ts`

**Interfaces:**
- Produces: `normalizeCity(input: string): string`

- [ ] **Step 1: Failing test**

```ts
// test/unit/normalize.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeCity } from '../../src/geo/normalize.js'

describe('normalizeCity', () => {
  it('lowercases and trims', () => {
    expect(normalizeCity('  Vienna ')).toBe('vienna')
  })
  it('strips diacritics', () => {
    expect(normalizeCity('Kraków')).toBe('krakow')
  })
  it('handles Budapest with surrounding whitespace', () => {
    expect(normalizeCity(' Budapest ')).toBe('budapest')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run test/unit/normalize.test.ts`
Expected: FAIL — `normalizeCity` nincs definiálva.

- [ ] **Step 3: Implementation**

```ts
// src/geo/normalize.ts
export function normalizeCity(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run test/unit/normalize.test.ts`
Expected: PASS (3 teszt).

- [ ] **Step 5: Commit**

```bash
git add test/unit/normalize.test.ts src/geo/normalize.ts
git commit -m "feat: normalizeCity (ékezet/kisbetű/trim)"
```

---

### Task 4: `haversineKm` (TDD)

**Files:**
- Test: `test/unit/haversine.test.ts`
- Create: `src/geo/haversine.ts`

**Interfaces:**
- Produces: `haversineKm(lat1, lon1, lat2, lon2): number`

- [ ] **Step 1: Failing test**

```ts
// test/unit/haversine.test.ts
import { describe, it, expect } from 'vitest'
import { haversineKm } from '../../src/geo/haversine.js'

const BUDAPEST = { lat: 47.4979, lon: 19.0402 }
const VIENNA = { lat: 48.2082, lon: 16.3738 }

describe('haversineKm', () => {
  it('Budapest–Vienna ≈ 214 km', () => {
    const d = haversineKm(BUDAPEST.lat, BUDAPEST.lon, VIENNA.lat, VIENNA.lon)
    expect(d).toBeGreaterThan(210)
    expect(d).toBeLessThan(220)
  })
  it('same point is 0 km', () => {
    const d = haversineKm(BUDAPEST.lat, BUDAPEST.lon, BUDAPEST.lat, BUDAPEST.lon)
    expect(d).toBeCloseTo(0, 6)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run test/unit/haversine.test.ts`
Expected: FAIL — `haversineKm` nincs definiálva.

- [ ] **Step 3: Implementation**

```ts
// src/geo/haversine.ts
const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run test/unit/haversine.test.ts`
Expected: PASS (2 teszt).

- [ ] **Step 5: Commit**

```bash
git add test/unit/haversine.test.ts src/geo/haversine.ts
git commit -m "feat: haversineKm távolságszámítás + tesztek"
```

---

### Task 5: `lookupCoords` + referencia (TDD)

**Files:**
- Test: `test/unit/reference.test.ts`
- Create: `src/geo/reference.ts`

**Interfaces:**
- Consumes: `normalizeCity` (Task 3)
- Produces: `Coords`, `BUDAPEST: Coords`, `lookupCoords(city): Coords | null`

- [ ] **Step 1: Failing test**

```ts
// test/unit/reference.test.ts
import { describe, it, expect } from 'vitest'
import { lookupCoords, BUDAPEST } from '../../src/geo/reference.js'

describe('lookupCoords', () => {
  it('finds a known city (Vienna)', () => {
    expect(lookupCoords('Vienna')).toEqual({ lat: 48.2082, lon: 16.3738 })
  })
  it('matches accented city (Kraków)', () => {
    expect(lookupCoords('Kraków')).toEqual({ lat: 50.0647, lon: 19.945 })
  })
  it('maps Budapest districts to the capital', () => {
    expect(lookupCoords('Budapest XI.')).toEqual(BUDAPEST)
  })
  it('returns null for unknown city', () => {
    expect(lookupCoords('Atlantis')).toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run test/unit/reference.test.ts`
Expected: FAIL — modul/`lookupCoords` nincs.

- [ ] **Step 3: Implementation**

```ts
// src/geo/reference.ts
import { normalizeCity } from './normalize.js'

export interface Coords {
  lat: number
  lon: number
}

export const BUDAPEST: Coords = { lat: 47.4979, lon: 19.0402 }

// A seedben előforduló városok ismert koordinátái, normalizált kulccsal.
const REFERENCE: Record<string, Coords> = {
  budapest: BUDAPEST,
  vienna: { lat: 48.2082, lon: 16.3738 },
  munich: { lat: 48.1351, lon: 11.582 },
  milan: { lat: 45.4642, lon: 9.19 },
  barcelona: { lat: 41.3874, lon: 2.1686 },
  lyon: { lat: 45.764, lon: 4.8357 },
  krakow: { lat: 50.0647, lon: 19.945 },
  prague: { lat: 50.0755, lon: 14.4378 },
  lisbon: { lat: 38.7223, lon: -9.1393 },
  amsterdam: { lat: 52.3676, lon: 4.9041 },
  stockholm: { lat: 59.3293, lon: 18.0686 },
  ljubljana: { lat: 46.0569, lon: 14.5058 },
  bucharest: { lat: 44.4268, lon: 26.1025 },
  dublin: { lat: 53.3498, lon: -6.2603 },
  copenhagen: { lat: 55.6761, lon: 12.5683 },
}

export function lookupCoords(city: string): Coords | null {
  const key = normalizeCity(city)
  if (key.startsWith('budapest')) return BUDAPEST
  return REFERENCE[key] ?? null
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run test/unit/reference.test.ts`
Expected: PASS (4 teszt).

- [ ] **Step 5: Commit**

```bash
git add test/unit/reference.test.ts src/geo/reference.ts
git commit -m "feat: lokális geokódoló referencia + lookupCoords"
```

---

### Task 6: távolság + rendezés helperek (TDD)

**Files:**
- Test: `test/unit/distance.test.ts`
- Create: `src/geo/distance.ts`

**Interfaces:**
- Consumes: `haversineKm` (Task 4), `BUDAPEST` (Task 5)
- Produces: `round1`, `distanceToBudapestKm`, `Ranked`, `compareByDistance`

- [ ] **Step 1: Failing test**

```ts
// test/unit/distance.test.ts
import { describe, it, expect } from 'vitest'
import { round1, distanceToBudapestKm, compareByDistance, Ranked } from '../../src/geo/distance.js'

describe('round1', () => {
  it('rounds to one decimal', () => {
    expect(round1(214.37)).toBe(214.4)
  })
})

describe('distanceToBudapestKm', () => {
  it('is 0 for Budapest coordinates', () => {
    expect(distanceToBudapestKm(47.4979, 19.0402)).toBe(0)
  })
  it('≈ 214.x for Vienna coordinates', () => {
    const d = distanceToBudapestKm(48.2082, 16.3738)!
    expect(d).toBeGreaterThan(213)
    expect(d).toBeLessThan(216)
  })
  it('returns null when coordinates are missing', () => {
    expect(distanceToBudapestKm(null, null)).toBeNull()
    expect(distanceToBudapestKm(48.2, null)).toBeNull()
  })
})

describe('compareByDistance', () => {
  it('orders ascending, nulls last, ties by name', () => {
    const rows: Ranked[] = [
      { name: 'Zoe', distanceKm: null },
      { name: 'Bob', distanceKm: 100 },
      { name: 'Amy', distanceKm: null },
      { name: 'Cara', distanceKm: 100 },
      { name: 'Dan', distanceKm: 0 },
    ]
    rows.sort(compareByDistance)
    expect(rows.map((r) => r.name)).toEqual(['Dan', 'Bob', 'Cara', 'Amy', 'Zoe'])
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run test/unit/distance.test.ts`
Expected: FAIL — modul/exportok nincsenek.

- [ ] **Step 3: Implementation**

```ts
// src/geo/distance.ts
import { haversineKm } from './haversine.js'
import { BUDAPEST } from './reference.js'

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function distanceToBudapestKm(lat: number | null, lon: number | null): number | null {
  if (lat == null || lon == null) return null
  return round1(haversineKm(lat, lon, BUDAPEST.lat, BUDAPEST.lon))
}

export interface Ranked {
  name: string
  distanceKm: number | null
}

export function compareByDistance(a: Ranked, b: Ranked): number {
  if (a.distanceKm == null && b.distanceKm == null) return a.name.localeCompare(b.name)
  if (a.distanceKm == null) return 1
  if (b.distanceKm == null) return -1
  if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
  return a.name.localeCompare(b.name)
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run test/unit/distance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add test/unit/distance.test.ts src/geo/distance.ts
git commit -m "feat: távolság-számítás (null-kezelés) + rendezés komparátor"
```

---

### Task 7: idempotens seed + geokódolás

**Files:**
- Create: `src/seed.ts`, `test/integration/seed.test.ts`

**Interfaces:**
- Consumes: `lookupCoords` (Task 5), Prisma client (Task 2)
- Produces: `SeedCustomer`, `seedCustomers(prisma, data)`

- [ ] **Step 1: Implementation**

```ts
// src/seed.ts
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { lookupCoords } from './geo/reference.js'

export interface SeedCustomer {
  name: string
  budget: number
  location: { city: string; countryCode: string }
  note: string
}

export async function seedCustomers(prisma: PrismaClient, data: SeedCustomer[]): Promise<void> {
  for (const c of data) {
    const telepules = c.location.city
    const coords = lookupCoords(telepules)
    if (!coords) {
      console.warn(`[seed] Ismeretlen település, lat/lon=null: "${telepules}" (${c.name})`)
    }
    await prisma.customers.upsert({
      where: { name_telepules: { name: c.name, telepules } },
      update: { lat: coords?.lat ?? null, lon: coords?.lon ?? null, budget: c.budget, note: c.note },
      create: {
        name: c.name,
        telepules,
        lat: coords?.lat ?? null,
        lon: coords?.lon ?? null,
        budget: c.budget,
        note: c.note,
      },
    })
  }
}

async function main() {
  const prisma = new PrismaClient()
  const url = new URL('../seed-customers.json', import.meta.url)
  const data = JSON.parse(readFileSync(url, 'utf8')) as SeedCustomer[]
  await seedCustomers(prisma, data)
  const count = await prisma.customers.count()
  console.log(`[seed] Kész. Ügyfelek száma: ${count}`)
  await prisma.$disconnect()
}

// Csak közvetlen futtatáskor fut le a main (teszt importnál nem).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
```

- [ ] **Step 2: Idempotencia-teszt (integration, DB kell)**

```ts
// test/integration/seed.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { seedCustomers, SeedCustomer } from '../../src/seed.js'
import { readFileSync } from 'node:fs'

const prisma = new PrismaClient()
const data = JSON.parse(
  readFileSync(new URL('../../seed-customers.json', import.meta.url), 'utf8'),
) as SeedCustomer[]

describe('seedCustomers (idempotens)', () => {
  beforeAll(async () => {
    await prisma.customers.deleteMany()
  })
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('does not duplicate on a second run', async () => {
    await seedCustomers(prisma, data)
    await seedCustomers(prisma, data)
    expect(await prisma.customers.count()).toBe(15)
  })

  it('geocodes Budapest to the capital coords', async () => {
    const anna = await prisma.customers.findFirst({ where: { name: 'Anna Kovács' } })
    expect(anna?.lat).toBe(47.4979)
    expect(anna?.lon).toBe(19.0402)
  })
})
```

- [ ] **Step 3: DB fel + migráció + teszt futtatás**

Run: `docker compose up -d && npm run migrate && npm run test:integration -- test/integration/seed.test.ts`
Expected: PASS — 2 futás után is 15 sor; Anna Kovács Budapest-koordinátákkal.

- [ ] **Step 4: Kézi seed-ellenőrzés (idempotencia + log)**

Run: `npm run seed && npm run seed`
Expected: mindkét futás végén `Ügyfelek száma: 15`. (A jelen seedben nincs ismeretlen város, ezért warning nem várható — de a kód nem crashel, ha lenne.)

- [ ] **Step 5: Commit**

```bash
git add src/seed.ts test/integration/seed.test.ts
git commit -m "feat: idempotens seed + lokális geokódolás"
```

---

### Task 8: Express végpontok

**Files:**
- Create: `src/db.ts`, `src/server.ts`, `test/integration/server.test.ts`

**Interfaces:**
- Consumes: `distanceToBudapestKm`, `compareByDistance` (Task 6), Prisma client
- Produces: `createApp(prisma): Express`, `GET /customers/count`, `GET /customers/by-distance`

- [ ] **Step 1: `src/db.ts`**

```ts
// src/db.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()
```

- [ ] **Step 2: Failing integration test**

```ts
// test/integration/server.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../../src/server.js'
import { seedCustomers, SeedCustomer } from '../../src/seed.js'
import { readFileSync } from 'node:fs'

const prisma = new PrismaClient()
const data = JSON.parse(
  readFileSync(new URL('../../seed-customers.json', import.meta.url), 'utf8'),
) as SeedCustomer[]
const app = createApp(prisma)

describe('endpoints', () => {
  beforeAll(async () => {
    await prisma.customers.deleteMany()
    await seedCustomers(prisma, data)
  })
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('GET /customers/count returns the real count', async () => {
    const res = await request(app).get('/customers/count')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ count: 15 })
  })

  it('GET /customers/by-distance is sorted, Budapest first at 0', async () => {
    const res = await request(app).get('/customers/by-distance')
    expect(res.status).toBe(200)
    const list = res.body as Array<{ name: string; distanceKm: number | null }>
    expect(list).toHaveLength(15)
    expect(list[0].name).toBe('Anna Kovács')
    expect(list[0].distanceKm).toBe(0)
    const known = list.filter((x) => x.distanceKm != null).map((x) => x.distanceKm!)
    const sorted = [...known].sort((a, b) => a - b)
    expect(known).toEqual(sorted)
  })
})
```

- [ ] **Step 3: Run — expect FAIL**

Run: `npm run test:integration -- test/integration/server.test.ts`
Expected: FAIL — `createApp` nincs.

- [ ] **Step 4: `src/server.ts`**

```ts
// src/server.ts
import 'dotenv/config'
import express, { Express } from 'express'
import { PrismaClient } from '@prisma/client'
import { distanceToBudapestKm, compareByDistance } from './geo/distance.js'

export function createApp(prisma: PrismaClient): Express {
  const app = express()

  app.get('/customers/count', async (_req, res) => {
    const count = await prisma.customers.count()
    res.json({ count })
  })

  app.get('/customers/by-distance', async (_req, res) => {
    const rows = await prisma.customers.findMany()
    const ranked = rows.map((c) => ({
      ...c,
      distanceKm: distanceToBudapestKm(c.lat, c.lon),
    }))
    ranked.sort(compareByDistance)
    res.json(ranked)
  })

  return app
}

// Közvetlen futtatás: szerver indítása.
if (process.argv[1]?.endsWith('server.ts')) {
  const { prisma } = await import('./db.js')
  const app = createApp(prisma)
  const port = Number(process.env.PORT ?? 3000)
  app.listen(port, () => console.log(`[server] http://localhost:${port}`))
}
```

- [ ] **Step 5: Run — expect PASS**

Run: `npm run test:integration -- test/integration/server.test.ts`
Expected: PASS (2 teszt).

- [ ] **Step 6: Kézi végpont-ellenőrzés**

Run: `npm start` egy terminálban, majd `curl localhost:3000/customers/count` és `curl localhost:3000/customers/by-distance`
Expected: `{"count":15}`; a lista Anna Kovács-csal kezdődik (`distanceKm: 0`), növekvő távolsággal.

- [ ] **Step 7: Commit**

```bash
git add src/db.ts src/server.ts test/integration/server.test.ts
git commit -m "feat: /customers/count és /customers/by-distance végpontok"
```

---

### Task 9: README + Postgres MCP bekötés

**Files:**
- Create: `.mcp.json`
- Modify: `README.md` (ág-specifikus futtatási szekció hozzáadása)

**Interfaces:**
- Produces: futtatási dokumentáció + Postgres MCP a futó DB-re.

- [ ] **Step 1: `.mcp.json`**

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://customers:customers@localhost:5432/customers"
      ]
    }
  }
}
```

- [ ] **Step 2: README futtatási szekció** (a meglévő `README.md` végére)

```markdown
## Futtatás (superpowers ág)

Előfeltétel: Node 20+, Docker.

    npm install
    cp .env.example .env

    # 1) Postgres indítás
    npm run db:up

    # 2) Migráció
    npm run migrate

    # 3) Seed (idempotens — kétszer is futtatható)
    npm run seed

    # 4) Szerver
    npm start        # http://localhost:3000

    # 5) Tesztek
    npm test                 # unit (DB nélkül)
    npm run test:integration # seed + végpontok (DB kell)

Végpontok:
- `GET /customers/count`
- `GET /customers/by-distance`

### Postgres MCP
A `.mcp.json` beköti a `@modelcontextprotocol/server-postgres` szervert a futó
Postgresre — így fejlesztés közben látható a séma és az adat. Aktiváláshoz indítsd
újra a Claude Code sessiont a projektben (a futó DB-nek elérhetőnek kell lennie).
```

- [ ] **Step 3: Teljes végigfutás ellenőrzése**

Run: `docker compose up -d && npm run migrate && npm run seed && npm test && npm run test:integration`
Expected: minden zöld; seed után 15 sor.

- [ ] **Step 4: Commit**

```bash
git add .mcp.json README.md
git commit -m "docs: futtatási README + Postgres MCP bekötés"
```

---

## Self-Review

**Spec coverage:**
- Offline, lokális geokódolás → Task 5 (`reference.ts`), Global Constraints. ✓
- Adatmodell (id, name, telepules, lat?, lon?, budget?, note?) → Task 2. ✓
- Idempotens seed → Task 7 (`upsert` + teszt). ✓
- Robusztus egyeztetés (ékezet/kisbetű/trim, budapest→főváros) → Task 3 + Task 5. ✓
- Ismeretlen település → null + log, nincs crash → Task 7 (`seed.ts`). ✓
- `GET /customers/count` → Task 8. ✓
- `GET /customers/by-distance` (növekvő, distanceKm 1 tizedes, budapesti 0 elöl, null-ok a végén, holtverseny name) → Task 6 (komparátor) + Task 8. ✓
- Haversine unit teszt (ismert táv, 0, null) → Task 4 + Task 6. ✓
- Kis commitok → minden task commit-tal zárul. ✓
- README (Postgres, migráció, seed, szerver, tesztek) → Task 9. ✓
- Postgres MCP → Task 9. ✓

**Placeholder scan:** nincs TBD/TODO; minden lépés konkrét kódot/parancsot tartalmaz.

**Type consistency:** `Coords`, `BUDAPEST`, `lookupCoords`, `distanceToBudapestKm`, `compareByDistance`, `Ranked`, `seedCustomers`, `SeedCustomer`, `createApp` végig konzisztensen használva a taszkok között.
