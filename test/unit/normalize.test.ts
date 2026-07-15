import { describe, it, expect } from "vitest";
import { normalize } from "../../src/geo/normalize.js";

describe("normalize", () => {
  it("ékezetet távolít el (NFD)", () => {
    expect(normalize("Kraków")).toBe("krakow");
  });

  it("kisbetűsít és trimmel", () => {
    expect(normalize("  BUDAPEST ")).toBe("budapest");
  });

  it("NFC bemenetet is kezel", () => {
    expect(normalize("Kraków".normalize("NFC"))).toBe("krakow");
  });
});
