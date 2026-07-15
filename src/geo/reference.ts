import { normalize } from "./normalize.js";

export interface Coord {
  lat: number;
  lon: number;
}

// A seedben előforduló városok ismert koordinátái (offline referencia).
// Kulcsok a kanonikus városnevek; a keresés normalizált kulcson történik.
const CITIES: Record<string, Coord> = {
  Budapest: { lat: 47.4979, lon: 19.0402 },
  Vienna: { lat: 48.2082, lon: 16.3738 },
  Munich: { lat: 48.1351, lon: 11.582 },
  Milan: { lat: 45.4642, lon: 9.19 },
  Barcelona: { lat: 41.3874, lon: 2.1686 },
  Lyon: { lat: 45.764, lon: 4.8357 },
  Kraków: { lat: 50.0647, lon: 19.945 },
  Prague: { lat: 50.0755, lon: 14.4378 },
  Lisbon: { lat: 38.7223, lon: -9.1393 },
  Amsterdam: { lat: 52.3676, lon: 4.9041 },
  Stockholm: { lat: 59.3293, lon: 18.0686 },
  Ljubljana: { lat: 46.0569, lon: 14.5058 },
  Bucharest: { lat: 44.4268, lon: 26.1025 },
  Dublin: { lat: 53.3498, lon: -6.2603 },
  Copenhagen: { lat: 55.6761, lon: 12.5683 },
};

// Normalizált kulcs -> koordináta.
const INDEX: Map<string, Coord> = new Map(
  Object.entries(CITIES).map(([city, coord]) => [normalize(city), coord]),
);

// Budapest kerület-variánsai a fővárosra esnek (pl. "Budapest III.", "Budapest 3. kerület").
const BUDAPEST = CITIES.Budapest;

export function lookup(telepules: string): Coord | null {
  const key = normalize(telepules);
  if (key.startsWith("budapest")) return BUDAPEST;
  return INDEX.get(key) ?? null;
}

// A Budapest-referencia a by-distance számításhoz.
export const BUDAPEST_REF: Coord = BUDAPEST;
