# Házifeladat (HF2)

Harness összehasonlítás, ugyanazon prompt alapján projekt tervezése és megvalósítása SUPERPOWERS és BMAD-METHOD segítéségével.

---

## Setup és tanulási görbe

(High efforton volt a Claude Code, agenteket bevont, Opus 4.8)
SUPERPOWERS: ~1 óra alatt készült el az implementációs tervvel és valósította meg azt
BMAD: ~15 perc alatt megcsinálta

## Steering

Alapvetően mind a kettő jól dolgozott.
SUPERPOWERS: stackkel és megvalósítással kapcsolatban volt pár kérdése
BMAD: teljesen magától dolgozott, az implementáció megírása után nem kérdezett semmit, hanem egyből áttért a megvalósításra

## Tervezési fázis:

SUPERPOWERS: készített implementációs terv
BMAD: szintén készített implementációs tervet, ez valamivel jobban tetszett, átláthatóbb, jobban olvasható és jobban struktúrált

## Kód minőség

Mind a kettő elsőre elkészítette, bent voltak az adatok a db-ben, működtek az endpointok, írt teszteket, le is futtatta, és kezelte az ismeretlen településeket és a null koordinátákat is

## Kontroll

SUPERPOWERS: alapvetően csinálta magától, pár kérdésben kellett nekem dönteni
BMAD: teljesen magától csinált mindent

## Összegzés

SUPERPOWERS: alapos, megértette a feladatot, megfelelően végre is hajtotta. Először a tervet kellett visszaigazolnom, néhány kérdést feltett, majd elkészítette az implementációs tervet. Erre rá kellett bólintsak, végül kicsit sok ideig dolgozott, de megoldott mindent elsőre.
BMAD: szintén minden megcsinált ahogy kellett, viszont túlságosan is átvette az irányítást. Viszont cserébe sokkal hamarabb végzett a feladattal.

Valószínűleg kellene még próbálgatni mind a két eszközt, de ha a BMAD is valamivel több visszaigazolást várna el a felasználótól (gyanítom be lehet erre állítani, megkérni rá), akkor azt választanám.
SUPERPOWERS kicsit lassú volt, egyébként jól dolgozott.

## Egyéb

Ami nem tetszett egyik esetben sem, hogy automatikusan úgy döntöttek, hogy az idempotenciát automatikusan name + telepules mezők alapján állította be. Szerintem itt megért volna egy kérdést, hogy esetleg nem az ID az, amit meg kell tartani és az alapján nézze, hogy ne duplikáljon adatokat. Egy valódi adatbázisban előfordulhat két különböző felhasználó ugyanazzal a névvel és településsel. (Természetesen itt most nem tudjuk, hogy az ID erre használható-e, így a feladat szempontjából, példaadatok tekintetében így is rendben volt.)