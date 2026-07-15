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
