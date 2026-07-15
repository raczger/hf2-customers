import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { seedCustomers, SeedCustomer } from '../../src/seed.js'
import { readFileSync } from 'node:fs'

const prisma = new PrismaClient()
const data = JSON.parse(
  readFileSync(new URL('../../seed-customers.json', import.meta.url), 'utf8'),
) as SeedCustomer[]

describe('seedCustomers (idempotens)', () => {
  beforeAll(async () => {
    await prisma.customers.deleteMany()
  })
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('does not duplicate on a second run', async () => {
    await seedCustomers(prisma, data)
    await seedCustomers(prisma, data)
    expect(await prisma.customers.count()).toBe(15)
  })

  it('geocodes Budapest to the capital coords', async () => {
    const anna = await prisma.customers.findFirst({ where: { name: 'Anna Kovács' } })
    expect(anna?.lat).toBe(47.4979)
    expect(anna?.lon).toBe(19.0402)
  })
})
