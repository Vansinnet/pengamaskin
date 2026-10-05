# AGENTS.md — riktlinjer för ändringar

- **Inga beroenden, inget byggsteg.** Vanilla ES-moduler som laddas direkt av webbläsaren. Lägg inte till npm-paket i runtime.
- **Lager:** `src/rules` (data) → `src/engine` (rena beräkningar) → `src/view/model.js` (ren vymodell) → `src/view/*` + `src/main.js` (DOM). Beroenden går bara åt höger; motorn känner inte till DOM eller texter.
- **En simulering.** All beräkning går via `simulate()` i `src/engine/simulate.js`. Skapa inte parallella beräkningar för diagram eller tabell; läs huvudboken.
- **Skatteregler** är data i `src/rules/countries.js` med källor. En ny regel skrivs som en regim i `src/engine/regimes/` med tester.
- **Texter** finns bara i `src/i18n/sv.js` och `en.js` med samma nycklar (testas). Inga texter i logiken.
- **DOM** byggs med `h()`/`s()` i `src/view/dom.js`. Ingen `innerHTML`, inga inline-stilar (CSP: `style-src 'self'`). Dynamiska mått sätts via `element.style`.
- **Tester:** `npm test`. `tests/parity.test.js` jämför motorn mot facit från den tidigare versionen. Om en ändring medvetet ger andra siffror, förklara varför i testet.
- **Tillgänglighet:** synligt tangentbordsfokus, etiketter på alla fält, diagrammet styrs med piltangenter och har en textuppläsning.
