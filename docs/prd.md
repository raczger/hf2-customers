# `customers` REST szolgáltatás — Product Requirements Document (PRD)

> BMAD-METHOD — **PM** fázis (agent: *John*). Forrás: `docs/brief.md`, `docs/spec.md`.

## Goals and Background Context

### Goals
- Idempotens seed betöltés Postgresbe a `seed-customers.json`-ból.
- Offline, determinisztikus geokódolás lokális `település → lat/lon` referenciából.
- `GET /customers/count` és `GET /customers/by-distance` végpontok a specifikáció
  szerinti szemantikával.
- Tesztelt haversine távolságszámítás.

### Background Context
A repó célja két fejlesztési módszertan összehasonlítása azonos specifikáción.
Ez az ág a **BMAD-METHOD**-ot követi. A szolgáltatásnak hálózat nélkül,
reprodukálhatóan kell futnia; ezért a geokódolás nem külső API-ból, hanem a
repóba bundle-olt referenciából történik.

## Requirements

### Functional (FR)
- **FR1** — A rendszer betölti a `seed-customers.json` 15 ügyfelét Postgresbe.
- **FR2** — A seed idempotens: ismételt futtatás nem hoz létre duplikátumot
  (természetes kulcs: `name` + `telepules`).
- **FR3** — Minden ügyfél `telepules` mezőjéhez `lat/lon`-t rendel egy lokális
  referenciából; a referencia a seedben előforduló városokra ismert
  koordinátákkal.
- **FR4** — A település-egyeztetés normalizált: ékezet-független, kis/nagybetű-
  független, trimmelt whitespace. „Budapest" (és kerületei) a fővárosra esik.
- **FR5** — Ismeretlen település esetén `lat=null, lon=null`; ez nem hiba,
  logolódik, a betöltés folytatódik.
- **FR6** — `GET /customers/count` → `{ "count": <egész> }`, a tényleges
  sorszámmal megegyezik.
- **FR7** — `GET /customers/by-distance` → ügyféllista **növekvő** `distanceKm`
  szerint Budapesthez képest; `distanceKm` 1 tizedesre kerekítve.
- **FR8** — Budapesti ügyfelek elöl (`0.0` km); ismeretlen koordinátájúak a lista
  végén `distanceKm: null`; holtverseny esetén `name` szerinti rendezés.

### Non-Functional (NFR)
- **NFR1** — Offline: nincs külső geokódoló API vagy futásidejű LLM-hívás.
- **NFR2** — Determinisztikus: azonos bemenet → azonos lat/lon és rendezés.
- **NFR3** — Robusztus hibakezelés: hiányzó koordináta nem crashel; a
  végpontokon hibánál `500` JSON hibaválasz (nem néma összeomlás).
- **NFR4** — Reprodukálható telepítés (lockfile) és dokumentált futtatás.

## Technical Assumptions
- **Nyelv/futtató:** TypeScript + Node.js.
- **DB / ORM:** Postgres, Prisma (migráció + kliens).
- **HTTP:** minimalista réteg (pl. Express vagy natív) — 2 GET végpont.
- **Teszt:** Vitest (unit + integráció).
- **Repo:** monorepo nem szükséges, egyszerű `src/` szerkezet.

## Epic List
- **Epic 1 — Alap + adatmodell + idempotens seed & geokódolás:** projekt-váz,
  Prisma séma, lokális geokódoló referencia, idempotens seed script.
- **Epic 2 — Lekérdező végpontok + tesztek:** haversine, `count` és
  `by-distance` végpontok, unit/integrációs tesztek, README.

---

## Epic 1 — Alap, adatmodell, idempotens seed & geokódolás

**Cél:** futtatható projekt-váz Postgresszel; a 15 ügyfél idempotensen betöltve
és offline geokódolva.

### Story 1.1 — Projekt-váz és eszközlánc
Mint fejlesztő, szeretnék egy futtatható TS+Node projektet Postgresszel és
teszt-runnerrel, hogy legyen mire építeni.
**Acceptance Criteria**
1. `package.json` scriptekkel (build, seed, start, test); lockfile commitolva.
2. `tsconfig.json`, Vitest konfiguráció.
3. `docker-compose.yml` Postgreshez; `.env.example` a `DATABASE_URL`-lel.
4. Prisma bekötve; `prisma migrate` lefut és üres `customers` táblát hoz létre.

### Story 1.2 — Adatmodell (Prisma séma + migráció)
Mint fejlesztő, szeretnék `customers` táblát, hogy tárolhassam az ügyfeleket.
**Acceptance Criteria**
1. `customers`: `id`, `name`, `telepules`, `lat` (nullable), `lon` (nullable).
2. `budget` és `note` opcionálisan eltárolható.
3. Egyediségi megszorítás a `(name, telepules)` páron (idempotencia alapja).
4. Migráció verziózva a repóban.

### Story 1.3 — Lokális geokódoló referencia + normalizálás
Mint fejlesztő, szeretnék offline `település → lat/lon` feloldást, hogy ne
kelljen külső hívás.
**Acceptance Criteria**
1. A seedben előforduló 15 városra ismert koordinátákkal töltött referencia.
2. Normalizáló függvény: trim + kisbetű + ékezet-eltávolítás (NFD).
3. „Budapest" és megadott kerület-variánsok a fővárosi koordinátára esnek.
4. Ismeretlen település → `null` (nem dob hibát).

### Story 1.4 — Idempotens seed script
Mint fejlesztő, szeretném a seed adatot betölteni duplikáció nélkül.
**Acceptance Criteria**
1. Beolvassa a `seed-customers.json`-t és upsert-el `(name, telepules)` alapján.
2. Kétszer futtatva a sorszám 15 marad (idempotens).
3. Minden sorhoz feloldja a `lat/lon`-t a referenciából; ismeretlennél `null` +
   log, a futás nem áll le.
4. A script robusztus main-guarddal fut (közvetlen indításkor).

---

## Epic 2 — Lekérdező végpontok és tesztek

**Cél:** a két végpont a spec szerinti szemantikával, tesztekkel és README-vel.

### Story 2.1 — Haversine távolságszámítás (unit-tesztelt)
Mint fejlesztő, szeretnék megbízható km-távolságot két koordináta között.
**Acceptance Criteria**
1. `haversine(lat1,lon1,lat2,lon2)` km-t ad vissza.
2. Unit teszt: Budapest–Bécs ≈ 214 km (tűréssel), Budapest–Budapest = 0.
3. Null/ismeretlen koordináta kezelése a hívó rétegben (distance = null).

### Story 2.2 — `GET /customers/count`
Mint fogyasztó, szeretném tudni az ügyfelek számát.
**Acceptance Criteria**
1. `{ "count": <egész> }` a tábla tényleges sorszámával.
2. Hibánál `500` JSON hibaválasz.

### Story 2.3 — `GET /customers/by-distance`
Mint fogyasztó, szeretném az ügyfeleket Budapesttől növekvő távolság szerint.
**Acceptance Criteria**
1. Minden elem tartalmaz `distanceKm`-t (1 tizedesre kerekítve).
2. Növekvő rendezés; budapestiek elöl (`0.0`).
3. Ismeretlen koordinátájúak a végén `distanceKm: null`.
4. Holtverseny esetén `name` szerint.
5. Hibánál `500` JSON hibaválasz.

### Story 2.4 — Futtatási README
Mint új fejlesztő, szeretném egy helyen a futtatási lépéseket.
**Acceptance Criteria**
1. Postgres indítás, migráció, seed, szerver, tesztek lépései.
2. `.env` beállítás és a végpontok példahívásai.
