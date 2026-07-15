// Determinisztikus kulcs-normalizálás a település-egyeztetéshez:
// trim + kisbetű + ékezet-eltávolítás (NFD dekompozíció + kombináló jelek törlése).
export function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}
