# hf2-customers

Egy kicsi, önálló **REST szolgáltatás Postgres fölött**, amely ügyfeleket tölt be
egy seed fájlból, lokálisan (offline) geokódolja őket, és távolság szerint
lekérdezhetővé teszi őket Budapesthez képest.

## A repó célja: módszertan-összehasonlítás

Ugyanaz a feladat (lásd [`docs/spec.md`](docs/spec.md)) **kétféle fejlesztési
módszertannal**, két külön ágon megvalósítva — így a folyamat is összehasonlítható:

| Ág | Módszertan |
|----|------------|
| [`superpowers`](../../tree/superpowers) | [Superpowers](https://github.com/obra/superpowers) workflow (brainstorming → spec → plan → TDD) |
| [`bmad`](../../tree/bmad) | [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) |

Mindkét ág ugyanarról a **közös vázról** indul (ez a commit: spec, seed adat,
`.gitignore`), és ugyanazt a specifikációt valósítja meg — csak a módszertan és
így a kód/commit-történet tér el.

A futtatáshoz szükséges lépéseket (Postgres indítás, migráció, seed, szerver,
tesztek) az adott ág README-je / dokumentációja írja le, mivel az
implementáció ágfüggő.

## Adat

A seed adat a [`seed-customers.json`](seed-customers.json) fájlban van (15 ügyfél).
A geokódolás egy lokális, a repóba bundle-olt `település → lat/lon` referenciából
történik — **nincs külső hívás** futásidőben.

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
