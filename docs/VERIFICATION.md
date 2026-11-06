# Verifieringsprotokoll

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
