# AGENTS.md — riktlinjer för ändringar

- **Stack:** Svelte 5 (runes) och TypeScript, byggt med Vite till statiska filer i `dist/`. Inga runtime-beroenden utöver Svelte; lägg inte till npm-paket som laddas i webbläsaren. Inga externa anrop.
- **Lager:** `src/rules` (data + typer) → `src/engine` (rena beräkningar) → `src/view/model.ts` (ren vymodell) → `src/view/*.svelte` + `src/App.svelte`. Beroenden går bara åt höger; motorn känner inte till DOM eller texter.
- **En simulering.** All beräkning går via `simulate()` i `src/engine/simulate.ts`. Skapa inte parallella beräkningar för diagram eller tabell; läs huvudboken.
- **Skatteregler** är data i `src/rules/countries.ts` med källor. Parametrarna typas per regim i `src/rules/types.ts`. En ny regel skrivs som en regim i `src/engine/regimes/` med tester.
- **Texter** finns bara i `src/i18n/sv.ts` och `en.ts`. `en.ts` typas mot nycklarna i `sv.ts`; platshållarna testas. Inga texter i logiken.
- **Förrendering:** `npm run build` renderar `App.svelte` till HTML (svenska, Sverige) och Svelte hydrerar den i webbläsaren. Startläget måste därför vara detsamma på servern och i webbläsaren; sparade val (språk, land, tema) läses först i `onMount`. Använd inte `window`, `document` eller `localStorage` utanför `onMount`/`$effect`.
- **CSP:** `script-src 'self'` och `style-src 'self'`. Inga inline-skript, inga `style`-attribut, inga `style:`-direktiv och inga Svelte-transitioner (de lägger in `<style>`). Dynamiska mått sätts via `element.style` i en attachment (`{@attach}`), se `Compound.svelte`. `scripts/prerender.js` och `tests/render.test.ts` stoppar bygget om något sådant kommer med.
- **Tester:** `npm test` (Vitest) och `npm run check` (svelte-check, inga varningar). `tests/parity.test.ts` jämför motorn mot facit från den tidigare versionen. Om en ändring medvetet ger andra siffror, förklara varför i testet.
- **Tillgänglighet:** synligt tangentbordsfokus, etiketter på alla fält, diagrammet styrs med piltangenter och har en textuppläsning.
