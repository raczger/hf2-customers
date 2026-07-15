import { haversine } from "./haversine.js";
import { BUDAPEST_REF } from "./reference.js";

export interface CustomerRow {
  id: number;
  name: string;
  telepules: string;
  lat: number | null;
  lon: number | null;
}

export interface CustomerWithDistance {
  id: number;
  name: string;
  telepules: string;
  distanceKm: number | null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Budapesttől mért távolság 1 tizedesre; ismeretlen koordináta -> null.
export function withDistance(row: CustomerRow): CustomerWithDistance {
  const distanceKm =
    row.lat === null || row.lon === null
      ? null
      : round1(haversine(BUDAPEST_REF.lat, BUDAPEST_REF.lon, row.lat, row.lon));
  return {
    id: row.id,
    name: row.name,
    telepules: row.telepules,
    distanceKm,
  };
}

// Növekvő távolság; null a lista végére; holtverseny esetén name szerint.
export function sortByDistance(
  rows: CustomerRow[],
): CustomerWithDistance[] {
  return rows.map(withDistance).sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) {
      return a.name.localeCompare(b.name);
    }
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    return a.name.localeCompare(b.name);
  });
}
