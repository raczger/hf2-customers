# `customers` REST szolgáltatás — Architecture Document

> BMAD-METHOD — **Architect** fázis (agent: *Winston*). Forrás: `docs/prd.md`.

## Introduction
Backend-only szolgáltatás egy seed fájl idempotens betöltésére, offline
geokódolásra és két olvasó végpont kiszolgálására. A hangsúly a
determinizmuson, az offline működésen és a tesztelhetőségen van.

## High Level Architecture
- **Stílus:** egyszerű réteges monolit (nincs mikroszolgáltatás).
- **Adatáramlás:** `seed-customers.json` → seed script (geokódolás a lokális
  referenciából) → Postgres `customers` → HTTP olvasó végpontok.
- **Offline garancia:** a geokódolás kizárólag a `src/geo/reference.ts`-ből
  történik; nincs hálózati hívás sehol a futásidőben.

## Tech Stack
| Kategória | Technológia | Verzió | Indok |
|-----------|-------------|--------|-------|
| Nyelv | TypeScript | ^5 | típusbiztonság |
| Futtató | Node.js | ≥20 | natív ESM, fetch nem szükséges |
| DB | PostgreSQL | 16 | spec követelmény |
| ORM | Prisma | ^5 | migráció + típusos kliens, MCP-vel látható séma |
| HTTP | Express | ^4 | minimalista, 2 GET végpont |
| Teszt | Vitest | ^1 | gyors, TS-native |
| Konténer | docker-compose | — | lokális Postgres |

## Data Models

### `Customer`
| Mező | Típus | Megjegyzés |
|------|-------|-----------|
| `id` | int, PK, autoincrement | |
| `name` | string | |
| `telepules` | string | a `location.city`-ből |
| `lat` | float? | nullable, geokódolásból |
| `lon` | float? | nullable, geokódolásból |
| `budget` | int? | opcionális |
| `note` | string? | opcionális |

**Megszorítás:** `@@unique([name, telepules])` — az idempotens upsert kulcsa.

## API Specification
- `GET /customers/count` → `200 { "count": number }`
- `GET /customers/by-distance` → `200 [{ id, name, telepules, distanceKm }]`
  - `distanceKm`: `number` (1 tizedes) vagy `null`
  - rendezés: `distanceKm` ASC (null utolsó), majd `name` ASC
- Hiba: `500 { "error": string }`

## Source Tree
```
src/
  db.ts                 # Prisma kliens singleton
  server.ts             # Express app + a két végpont
  seed.ts               # idempotens seed + geokódolás (main-guard)
  geo/
    normalize.ts        # trim + lowercase + ékezet-eltávolítás
    reference.ts        # település -> {lat,lon} (15 város + Budapest-variánsok)
    haversine.ts        # két koordináta közti km
    distance.ts         # customer-lista -> distanceKm + rendezés
prisma/
  schema.prisma
  migrations/
test/
  unit/                 # normalize, haversine, distance, reference
  integration/          # seed idempotencia, server végpontok
docs/                   # brief, prd, architecture, stories, qa
```

## Components
- **geo/normalize** — determinisztikus kulcs-normalizálás a város-egyeztetéshez.
- **geo/reference** — statikus lookup tábla; normalizált kulcs → koordináta.
- **geo/haversine** — tiszta függvény, mellékhatás nélkül (könnyen tesztelhető).
- **geo/distance** — Budapest-referencia alkalmazása, `distanceKm` kerekítés és
  a spec szerinti rendezés (null a végére, holtverseny `name` szerint).
- **seed** — JSON olvasás, geokódolás, Prisma upsert `(name, telepules)`-re.
- **server** — Express, két végpont, try/catch → `500` JSON.

## Testing Strategy
- **Unit:** `haversine` (BP–Bécs ≈214 km, 0 km), `normalize` (ékezet/kisbetű),
  `reference` (találat + ismeretlen→null), `distance` (rendezés + null a végén).
- **Integration:** seed idempotencia (2× futtatás → 15), végpontok válasz-alakja.
- **DB izoláció:** integrációs teszt a compose-os Postgreshez köt.

## Coding Standards
- Tiszta függvények a `geo/` alatt (nincs I/O a számításban).
- Nincs hálózati hívás a `geo/`-ban és a `seed`-ben (offline invariáns).
- Kis, story-nkénti commitok (BMAD Dev ciklus).
