// ============================================================
//  Efter `vite build`: förrendera sidan och lägg in CSP:n.
//
//  1. Renderar App.svelte till HTML (startvärdena: svenska, Sverige)
//     och lägger den i dist/index.html. Sidan syns direkt, och
//     Svelte tar över den när skriptet laddats (hydrering).
//  2. Räknar ut hashen för JSON-LD-blocket och skriver den i
//     CSP:n i dist/_headers och som meta-tagg i dist/index.html.
//  3. Avbryter bygget om HTML:en innehåller något som CSP:n
//     skulle blockera (inline-skript eller style-attribut).
// ============================================================
import { readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const fail = (msg) => { console.error(`prerender: ${msg}`); process.exit(1); };

const { render } = await import('../.prerender/entry-server.js');
const { body } = render();

let html = await readFile('dist/index.html', 'utf8');
if (!html.includes('<!--app-->')) fail('hittade inte <!--app--> i dist/index.html');
html = html.replace('<!--app-->', () => body);

// CSP: hash för JSON-LD-blocket (det enda inline-skriptet)
const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/g)];
const ld = inline.filter(([, attrs]) => attrs.includes('application/ld+json'));
if (inline.length !== ld.length) fail('inline-skript i HTML:en — CSP:n tillåter bara JSON-LD-blocket');
if (ld.length !== 1) fail(`väntade ett JSON-LD-block, hittade ${ld.length}`);
const hash = `'sha256-${createHash('sha256').update(ld[0][2]).digest('base64')}'`;

if (/\sstyle=/.test(html)) fail('style-attribut i HTML:en blockeras av CSP:n (style-src \'self\')');

let headers = await readFile('dist/_headers', 'utf8');
const cspLine = /^(\s*Content-Security-Policy: )(.+)$/m;
const template = headers.match(cspLine)?.[2];
if (!template?.includes("'sha256-JSONLD'")) fail("CSP-raden i _headers saknar platshållaren 'sha256-JSONLD'");
const csp = template.replace("'sha256-JSONLD'", () => hash);
headers = headers.replace(cspLine, (_, prefix) => prefix + csp);
const metaCsp = csp.split('; ').filter((d) => !d.startsWith('frame-ancestors')).join('; ');
html = html.replace(/\s*<!-- Content-Security-Policy[^>]*-->/, `\n  <meta http-equiv="Content-Security-Policy" content="${metaCsp}">`);
if (!html.includes('http-equiv="Content-Security-Policy"')) fail('kunde inte lägga in CSP-meta-taggen');
if ((html + headers.match(cspLine)[2]).includes('JSONLD')) fail('platshållaren för hashen finns kvar');

await writeFile('dist/index.html', html);
await writeFile('dist/_headers', headers);
await rm('.prerender', { recursive: true, force: true });
console.log(`prerender: dist/index.html (${(html.length / 1024).toFixed(1)} kB), CSP ${hash}`);
