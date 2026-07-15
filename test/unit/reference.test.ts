import { describe, it, expect } from "vitest";
import { lookup } from "../../src/geo/reference.js";

describe("reference lookup", () => {
  it("ismert várost megtalál (ékezet-független)", () => {
    expect(lookup("Kraków")).toEqual({ lat: 50.0647, lon: 19.945 });
    expect(lookup("  vienna ")).toEqual({ lat: 48.2082, lon: 16.3738 });
  });

  it("Budapest kerület-variánsa a fővárosra esik", () => {
    expect(lookup("Budapest III. kerület")).toEqual({ lat: 47.4979, lon: 19.0402 });
  });

  it("ismeretlen település -> null", () => {
    expect(lookup("Atlantis")).toBeNull();
  });
});
