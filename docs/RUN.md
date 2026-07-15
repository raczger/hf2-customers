# Futtatás — BMAD ág

Előfeltétel: Node ≥20, Docker.

## 1. Függőségek
```bash
npm install
```

## 2. Környezet
```bash
cp .env.example .env   # DATABASE_URL, PORT
```

## 3. Postgres indítása
```bash
docker compose up -d
```

## 4. Migráció
```bash
npm run generate         # prisma client
npm run migrate:dev      # első alkalommal létrehozza a sémát
# vagy meglévő migrációkkal: npm run migrate
```

## 5. Seed (idempotens)
```bash
npm run seed
# kétszer futtatva a sorszám 15 marad
```

## 6. Szerver
```bash
npm start   # http://localhost:3000
```

## 7. Tesztek
```bash
npm run test:unit          # Postgres nélkül fut
npm run test:integration   # futó Postgres kell (docker compose up -d + migráció)
npm test                   # mind
```

## Végpontok
```bash
curl http://localhost:3000/customers/count
# {"count":15}

curl http://localhost:3000/customers/by-distance
# [{"id":..,"name":"Anna Kovács","telepules":"Budapest","distanceKm":0}, ...]
```
