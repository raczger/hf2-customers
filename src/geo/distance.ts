import { haversineKm } from './haversine.js'
import { BUDAPEST } from './reference.js'

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function distanceToBudapestKm(lat: number | null, lon: number | null): number | null {
  if (lat == null || lon == null) return null
  return round1(haversineKm(lat, lon, BUDAPEST.lat, BUDAPEST.lon))
}

export interface Ranked {
  name: string
  distanceKm: number | null
}

export function compareByDistance(a: Ranked, b: Ranked): number {
  if (a.distanceKm == null && b.distanceKm == null) return a.name.localeCompare(b.name)
  if (a.distanceKm == null) return 1
  if (b.distanceKm == null) return -1
  if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
  return a.name.localeCompare(b.name)
}
