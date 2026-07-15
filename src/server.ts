import 'dotenv/config'
import { pathToFileURL } from 'node:url'
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

// Csak közvetlen futtatáskor indul el a szerver (teszt importnál nem).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { prisma } = await import('./db.js')
  const app = createApp(prisma)
  const port = Number(process.env.PORT ?? 3000)
  app.listen(port, () => console.log(`[server] http://localhost:${port}`))
}
