# Project Brief: `customers` REST szolgáltatás

> BMAD-METHOD — **Analyst** fázis (agent: *Mary*). Bemenet: `docs/spec.md`, `seed-customers.json`.

## Executive Summary

Kicsi, önálló REST szolgáltatás Postgres adatbázis fölött, amely egy seed
fájlból ügyfeleket tölt be, őket **offline** (külső hívás nélkül) geokódolja egy
repóba bundle-olt `település → lat/lon` referenciából, és távolság szerint —
Budapesthez viszonyítva — lekérdezhetővé teszi.

## Problem Statement

Egy ügyfél-listát (15 európai ügyfél, `seed-customers.json`) úgy kell
kiszolgálni, hogy:
- ismételt betöltés ne duplázzon (idempotencia),
- a geokódolás determinisztikus és offline legyen (nincs külső API, nincs
  futásidejű LLM-hívás — reprodukálható, hálózat nélkül is fut),
- a fogyasztó le tudja kérni az ügyfelek számát, és távolság szerint rendezve
  (Budapesttől) a listát.

## Target Users

- **Backend fejlesztő / integráló**, aki a két végpontot fogyasztja
  (`/customers/count`, `/customers/by-distance`).
- **Módszertan-kiértékelő** (a repó valódi célja): a BMAD folyamatot és a
  keletkező kód/commit-történetet hasonlítja a `superpowers` ágéhoz.

## Goals & Success Metrics

- **G1** — Idempotens seed: kétszer futtatva a sorszám változatlan (15).
- **G2** — Offline geokódolás: hálózat nélkül is fut, determinisztikus lat/lon.
- **G3** — Helyes rendezés: `by-distance` növekvő távolság, Budapest 0 km elöl,
  ismeretlen koordináta a végén (`distanceKm: null`), holtverseny `name` szerint.
- **G4** — Tesztelt távolságszámítás (haversine): ismert táv, 0 km, null eset.

## MVP Scope

**Benne:** adatmodell, idempotens seed + lokális geokódolás, a két végpont,
haversine unit teszt, futtatási README.

**Nincs benne:** authentikáció, írás/CRUD végpontok, külső geokódoló,
pagination, rate limiting, deploy.

## Constraints

- **Offline kötelező** — nincs külső geokódoló API vagy futásidejű LLM-hívás.
- **Postgres** a tároló; a séma és adat fejlesztés közben MCP-n keresztül látható.
- Kis, fókuszált commitok, hogy a folyamat követhető legyen.

## Risks

- **Ékezetes/eltérő városnév-egyeztetés** (pl. `Kraków`, `Budapest` kerületei) →
  normalizálás szükséges (ékezet+kisbetű+trim).
- **Hiányzó referencia-koordináta** → nem hiba, `null`, logolni és folytatni.
