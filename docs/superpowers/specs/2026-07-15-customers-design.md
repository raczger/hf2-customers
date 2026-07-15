# Design — `customers` REST szolgáltatás (superpowers ág)

Státusz: jóváhagyva (2026-07-15)
Kapcsolódó: [`docs/spec.md`](../../spec.md) (a feladat), `seed-customers.json` (adat)

## Cél

Kicsi, önálló REST szolgáltatás Postgres fölött, amely idempotensen betölt 15
ügyfelet, lokálisan (offline) geokódolja őket, és távolság szerint (Budapesthez
képest) lekérdezhetővé teszi őket. Nincs külső hívás futásidőben.

## Tech stack

- **Node.js + TypeScript**, **Express** szerver
- **Prisma** ORM (migráció, seed, típusos séma) Postgres fölött
- **Vitest** a tesztekhez
- **Docker Compose** a Postgreshez
- **Postgres MCP** (`@modelcontextprotocol/server-postgres`) projekt-scope-ban a fejlesztéshez

## Architektúra

Tiszta, I/O-mentes geo modulok, hogy unit-tesztelhetők legyenek offline:

```
src/
  server.ts        Express app + route-ok
  db.ts            Prisma client singleton
  geo/
    normalize.ts   ekezet/kis-nagybetu-fuggetlen, trimmelt normalizalas
    haversine.ts   tiszta tavolsag-fuggveny (km)
    reference.ts   telepules -> {lat, lon} lokalis referencia
    distance.ts    ugyfel -> distanceKm (null-kezelessel) + rendezes
  seed.ts          idempotens seed + geokodolas (kulon szkript)
prisma/
  schema.prisma
  migrations/
test/
  haversine.test.ts
  normalize.test.ts
docker-compose.yml
.mcp.json
.env(.example)
```

## Adatmodell — Prisma `customers`

```prisma
model customers {
  id        Int     @id @default(autoincrement())
  name      String
  telepules String
  lat       Float?
  lon       Float?
  budget    Int?
  note      String?

  @@unique([name, telepules])   // idempotencia kulcsa
}
```

## Betöltés (idempotens seed + geokódolás)

1. Beolvassa a `seed-customers.json`-t.
2. Minden ügyfélre: `telepules = location.city`, normalizálás → referencia-lookup
   → `{lat, lon}` vagy `null`.
3. `upsert` a `(name, telepules)` egyedi kulcson → kétszeri futásra is 15 sor.
4. Ismeretlen település → `lat/lon = null`, **warning log**, nincs crash.

**Normalizálás** (`normalize.ts`): `trim` → `toLowerCase` → ékezet-eltávolítás
(Unicode NFD + kombináló jelek törlése). Pl. `"Kraków" → "krakow"`,
`" Budapest " → "budapest"`.

**Referencia** (`reference.ts`): a seed 15 városa, ismert koordinátákkal, normalizált
kulccsal. A `budapest` előtaggal kezdődő kulcs (kerületek is) a főváros
koordinátájára esik. Külső hívás nincs.

## Végpontok

- `GET /customers/count` → `{ "count": <int> }` — Prisma `count()`.
- `GET /customers/by-distance` → ügyféllista **növekvő** távolság szerint:
  - koordináta ismert → `distanceKm = round1(haversine(ügyfél, Budapest))`,
    budapesti → `0.0`
  - koordináta null → `distanceKm: null`, a **lista végén**
  - rendezés: ismert táv növekvő; holtverseny `name` szerint; a null-osok a végén,
    egymás közt `name` szerint
  - minden elem: teljes ügyfél (`id, name, telepules, lat, lon, budget, note`) + `distanceKm`

A rendezés és a haversine app-oldalon fut (15 sor), így a logika tiszta és tesztelhető.

## Tesztek (Vitest)

- `haversine`: Budapest–Bécs ≈ 214 km (tűréssel, pl. ±2%), Budapest–Budapest = 0.
- `distance` wrapper: null-koordináta → `null`.
- `normalize`: ékezet/kisbetű/whitespace esetek (pl. `"Kraków"`, `" Budapest "`).

## Postgres + MCP

- `docker-compose.yml`: `postgres:16`, db=`customers`, healthcheck → README „Postgres indítás".
- `DATABASE_URL` a `.env`-ben (`.env.example` verziózva).
- `.mcp.json`: `@modelcontextprotocol/server-postgres` a futó DB-re — séma/adat láthatóság fejlesztés közben.

## Commit-bontás (kis, fókuszált commitok)

1. `chore:` scaffold (package.json, tsconfig, docker-compose, .env.example)
2. `feat:` prisma séma + migráció
3. `test/feat:` geo utils (normalize, haversine, reference, distance) + tesztek (TDD)
4. `feat:` idempotens seed + geokódolás
5. `feat:` a két végpont (Express)
6. `docs:` README (futtatás) + `.mcp.json` bekötés

## Nem cél (YAGNI)

- Nincs auth, nincs pagináció, nincs írás-végpont (CRUD create/update/delete).
- Nincs külső geokódoló, nincs LLM futásidőben.
