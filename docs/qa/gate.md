# QA Gate — `customers` (BMAD ág)

> BMAD-METHOD — **QA** fázis (agent: *Quinn*). Review az acceptance criteria és a
> tényleges teszt-futás alapján.

## Gate döntés: **PASS** ✅

Futtatott bizonyíték: `npm test` → **6 test file, 15 teszt zöld**
(12 unit + 3 integrációs, valódi Postgres ellen). Seed 2× → sorszám 15 (idempotens),
15/15 geokódolva.

## Követelmény-lefedettség

| Köv. | Leírás | Bizonyíték | Státusz |
|------|--------|------------|---------|
| FR1 | 15 ügyfél betöltése | seed log `15 feldolgozva`; server-teszt count=15 | ✅ |
| FR2 | Idempotens seed | `seed.test.ts` 2× → 15/15; upsert `(name,telepules)` | ✅ |
| FR3 | lat/lon lokális referenciából | seed `geokódolt: 15`; `reference.test.ts` | ✅ |
| FR4 | Normalizált egyeztetés (ékezet/kisbetű/trim, Budapest) | `normalize.test.ts`, `reference.test.ts` | ✅ |
| FR5 | Ismeretlen → null, nem crashel | `reference.test.ts` (Atlantis→null); seed warn-ág | ✅ |
| FR6 | `GET /count` = tényleges | `server.test.ts` count=15 | ✅ |
| FR7 | `by-distance` distanceKm 1 tizedes, növekvő | `distance.test.ts`, `server.test.ts` | ✅ |
| FR8 | Budapest 0.0 elöl, null a végén, holtverseny name | `distance.test.ts` (mind a 4 eset) | ✅ |
| NFR1 | Offline (nincs külső hívás) | `geo/` csak lokális referencia; hálózat-mentes futás | ✅ |
| NFR2 | Determinisztikus | tiszta függvények + statikus referencia | ✅ |
| NFR3 | 500 JSON hibánál | `server.ts` try/catch mindkét végponton | ✅ |
| NFR4 | Reprodukálható telepítés + README | `package-lock.json` + `docs/RUN.md` | ✅ |

## Megjegyzések / nyitott pontok
- Az integrációs tesztek futó Postgrest igényelnek (`docker compose up -d` +
  migráció); a `docs/RUN.md` ezt dokumentálja.
- `by-distance` a rendezést alkalmazás-rétegben végzi (kis adathalmaz, 15 sor);
  nagyobb adatnál SQL-oldali rendezés/pagináció megfontolandó — jelen scope-on kívül.

## Verifikációs parancsok
```bash
docker compose up -d && npm run migrate:dev
npm run seed && npm run seed        # idempotencia
npm test                            # 15/15
```
