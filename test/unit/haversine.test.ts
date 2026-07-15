import { describe, it, expect } from "vitest";
import { haversine } from "../../src/geo/haversine.js";

const BUDAPEST = { lat: 47.4979, lon: 19.0402 };
const VIENNA = { lat: 48.2082, lon: 16.3738 };

describe("haversine", () => {
  it("Budapest–Bécs ≈ 214 km", () => {
    const d = haversine(BUDAPEST.lat, BUDAPEST.lon, VIENNA.lat, VIENNA.lon);
    expect(d).toBeGreaterThan(209);
    expect(d).toBeLessThan(219);
  });

  it("azonos pont = 0 km", () => {
    expect(haversine(BUDAPEST.lat, BUDAPEST.lon, BUDAPEST.lat, BUDAPEST.lon)).toBe(0);
  });
});
