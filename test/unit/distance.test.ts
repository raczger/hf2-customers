import { describe, it, expect } from "vitest";
import { sortByDistance, type CustomerRow } from "../../src/geo/distance.js";

const rows: CustomerRow[] = [
  { id: 1, name: "Bécsi", telepules: "Vienna", lat: 48.2082, lon: 16.3738 },
  { id: 2, name: "Pesti", telepules: "Budapest", lat: 47.4979, lon: 19.0402 },
  { id: 3, name: "Zed ismeretlen", telepules: "Atlantis", lat: null, lon: null },
  { id: 4, name: "Alfa ismeretlen", telepules: "Nowhere", lat: null, lon: null },
];

describe("sortByDistance", () => {
  const sorted = sortByDistance(rows);

  it("budapesti elöl, 0.0 km", () => {
    expect(sorted[0].telepules).toBe("Budapest");
    expect(sorted[0].distanceKm).toBe(0);
  });

  it("növekvő távolság; Bécs a második", () => {
    expect(sorted[1].telepules).toBe("Vienna");
    expect(sorted[1].distanceKm).toBeGreaterThan(200);
  });

  it("ismeretlen koordináták a végén, distanceKm null, name szerint", () => {
    expect(sorted[2].distanceKm).toBeNull();
    expect(sorted[3].distanceKm).toBeNull();
    expect(sorted[2].name).toBe("Alfa ismeretlen");
    expect(sorted[3].name).toBe("Zed ismeretlen");
  });

  it("distanceKm 1 tizedesre kerekít", () => {
    const d = sorted[1].distanceKm!;
    expect(Math.round(d * 10) / 10).toBe(d);
  });
});
