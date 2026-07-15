import { describe, it, expect } from 'vitest'
import { round1, distanceToBudapestKm, compareByDistance, Ranked } from '../../src/geo/distance.js'

describe('round1', () => {
  it('rounds to one decimal', () => {
    expect(round1(214.37)).toBe(214.4)
  })
})

describe('distanceToBudapestKm', () => {
  it('is 0 for Budapest coordinates', () => {
    expect(distanceToBudapestKm(47.4979, 19.0402)).toBe(0)
  })
  it('≈ 214.x for Vienna coordinates', () => {
    const d = distanceToBudapestKm(48.2082, 16.3738)!
    expect(d).toBeGreaterThan(213)
    expect(d).toBeLessThan(216)
  })
  it('returns null when coordinates are missing', () => {
    expect(distanceToBudapestKm(null, null)).toBeNull()
    expect(distanceToBudapestKm(48.2, null)).toBeNull()
  })
})

describe('compareByDistance', () => {
  it('orders ascending, nulls last, ties by name', () => {
    const rows: Ranked[] = [
      { name: 'Zoe', distanceKm: null },
      { name: 'Bob', distanceKm: 100 },
      { name: 'Amy', distanceKm: null },
      { name: 'Cara', distanceKm: 100 },
      { name: 'Dan', distanceKm: 0 },
    ]
    rows.sort(compareByDistance)
    expect(rows.map((r) => r.name)).toEqual(['Dan', 'Bob', 'Cara', 'Amy', 'Zoe'])
  })
})
