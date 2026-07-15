import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
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
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
