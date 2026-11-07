# Verifieringsprotokoll

## Verktygsuppdatering 7 november 2026

Vercels Node-inställning har ändrats från 26.x till 22.x för att matcha projektets testade runtime och `engines` i package.json. ESLint har uppgraderats från den utgångna versionen 9.39.5 till 10.14.0. Avgränsade peer-overrides för de tre äldre lintpluginerna finns dokumenterade i README. Ren installation utan npm-varningar, beroendeträd, lint, strict TypeScript, fem domäntester och produktionsbygge kontrolleras före publicering. Nästa CI-körning verifierar dessutom hela browser-/API-sviten på Linux.

Verifierat 6 november 2026 med Node.js 22.20.0 på Windows och Chromium via Playwright. Databas: PostgreSQL17 i en separat Neon-miljö i Frankfurt.

| Kontroll | Resultat |
|---|---|
| Reproducerbart katalogseed | 120 produkter, 12 kategorier, 5 säljare, 240 varianter/erbjudanden |
| Prisma migrationer | 3 migrationer applicerade |
| ESLint | Passerar utan varningar/fel |
| Strict TypeScript | Passerar |
| Domäntester | 5 av 5 passerar |
| Playwright/API mot produktionsbygge | 15 av 15 passerar |
| Extra portaltest mot produktionsbygge | 1 av 1 passerar: adminändring blir sökbar och säljarens lager renderas |
| Next.js produktionsbygge | Passerar |
| npm audit (alla paket) | 0 sårbarheter efter dependency overrides |
| npm audit --omit=dev | 0 sårbarheter |
| Visuell QA | Startsida och produkt i 390, 768, 1280, 1440 px; admin och säljare vid 1280 px |
| Responsivt sidbreddstest | Ingen oavsiktlig horisontell sidscroll i de testade startsidorna/produktsidorna |
| Browserfel | Inga pageerror i responsivtester eller portaltest |
| Hemligheter i staging | Lokala databas-, auth-, webhook- och OIDC-värden kontrolleras av scripts/check-secrets.cjs |

De 16 Playwright/API-testerna finns under `tests/e2e`. Webhooktestet använder Stripes egen signeringshjälpare och en disponibel testfixture i databasen; det är inte en faktisk extern Stripe-betalning. SMTP, extern Blob-lagring och riktiga betal-/fraktkonton har inte verifierats. Amazonrobotkontrollen hindrade exakt visuell referensjämförelse.

Krav som inte är färdigställda redovisas i [REQUIREMENTS.md](REQUIREMENTS.md).

## Driftsatt verifiering

Vercel deployment `dpl_CqLBpCgRmABhfCsPbY6vEYnWGvb6` (kodcommit `ce665ac`) byggdes framgångsrikt och promoverades efter ett separat smoke-test till https://nordmark-vincent.vercel.app. Funktionerna kör i Frankfurt (`fra1`) nära databasen. GitHub är anslutet för kommande publiceringar.

Smoke-test mot driftsatt API verifierade databasinitiering, sparad varukorg, lyckat demoköp med rabatt och presentkort, återläsning av order, avbeställning och demoåterbetalning. Efter publicering kördes också de sju webbläsartesterna för sökning/tomläge, komplett variant-/varukorgs-/köpflöde, kontoregistrering och responsiv layout i fyra bredder mot den publika adressen.

En otillförlitlig testväntan på ett nätverkssvar ersattes med kontroll av faktiskt renderat sessionsinnehåll. Det undviker att ett redan avslutat snabbt API-svar missas i CI eller på den publicerade webbplatsen. Applikationskoden ändrades inte av den rättningen.

CI:s mobiltest avgränsades också till synligt innehåll i `#main`, eftersom Next.js under streaming kan ha både en dold förberedande kopia och det synliga innehållet i DOM samtidigt. Första Linux-körningen efter publicering passerade 15/16 tester och identifierade denna selektorfråga; övriga kontroller, inklusive köp och behörigheter, var godkända.

Vercels första loggsökning efter driftsatt smoke-test returnerade inga felloggar. Separat extern felövervakning/drains är inte konfigurerad. GitHub Actions körs också på den pushade källkoden; dess slutstatus kan läsas via repots Actions-flik.
