# Nordmark

Svensk Amazon-inspirerad **demonstrationsmarknadsplats** byggd med Next.js App Router, React, strict TypeScript, Tailwind CSS, Radix Dialog, Prisma och PostgreSQL. Eget butiksnamn och självständig kod. Nordmark är inte knutet till Amazon.

**Live:** https://nordmark-vincent.vercel.app  
**GitHub:** https://github.com/VincentDimov/nordmark-marketplace

## Kom igång

Node.js 22 och npm krävs. För lokal PostgreSQL krävs Docker Compose. Alternativt används en egen PostgreSQL-/Neon-databas.

Utvecklingsverktygen kräver Node.js 22.13 eller senare inom 22-serien. Vercels projektinställning och `package.json` använder båda `22.x`. ESLint är uppdaterat till 10.14. Next.js 16.4.5:s lintkonfiguration innehåller kompatibilitetsstöd för ESLint 10, men dess React-, import- och JSX-a11y-pluginer deklarerar fortfarande äldre peer-intervall. Tre avgränsade npm-overrides använder därför projektets ESLint-version. Ren `npm ci`, `npm ls eslint`, hela lintkontrollen och negativa kontroller för TypeScript, React, Hooks och bildtillgänglighet verifierar denna kombination; inga regler har tagits bort för uppgraderingen.

```powershell
cd "C:\Users\Vince\Desktop\Mina Projekt\nordmark"
npm ci
Copy-Item .env.example .env
# Ändra BETTER_AUTH_SECRET till ett kryptografiskt slumpvärde, minst 32 tecken.
docker compose up -d
npm run db:deploy
npm run db:seed
npm run dev -- --port 3016
```

Vid port 3016: sätt `BETTER_AUTH_URL` och `NEXT_PUBLIC_SITE_URL` till `http://localhost:3016`. Port 3000 används av andra projekt i ursprungsmiljön. Den skapade lokala `.env` är redan konfigurerad för den separata Neon-databasen och port 3016. `.env.local` kan ha företräde, kontrollera därför miljövariabler vid ändringar. Hemligheter är ignorerade av Git och Vercel-uppladdning.

Öppna http://localhost:3016. Produktionsläge: `npm run build` följt av `npm run start -- --port 3016`.

## Prova hela kundresan

1. Sök produkt, filtrera eller välj en kategori. Välj produktvariant och lägg i varukorg.
2. Välj rader i varukorgen och fortsätt till kassan. Testadressen är förifylld.
3. Prova `HEJ10` (10 %, högst fem användningar per miljö) och `NORD250` (250 kr i startvärde).
4. Välj lyckad, misslyckad eller avbruten demobetalning. Inga kortuppgifter eller riktiga pengar används.
5. Följ ordern under Beställningar. I `/demo` kan du byta till säljare och sedan skicka säljarens egen försändelse.
6. Byt tillbaka till kund och begär retur. Byt till admin och godkänn en full eller partiell demoåterbetalning.

Varje ny besökare får en **egen isolerad PostgreSQL-miljö**, med tre exempelorder, en retur, en demorecension, ett supportärende, adress, rabattkod och presentkort. Kund, säljare och admin på `/demo` är demonstrationsidentiteter i samma privata miljö. De är inga globala produktionsadministratörer och har inga gemensamma standardlösenord. Fem säljaridentiteter kan väljas i säljarportalen.

Registrering/inloggning använder Better Auth. Efter inloggning slås en anonym varukorg ihop med kontots varukorg. Utloggning skiljer av kontodata och startar en ny gästmiljö. E-postverifiering är frivillig i demoläge. Använd exempeluppgifter.

## Funktioner

- 120 produkter, 12 kategorier, fem säljare och 240 varianter/erbjudanden. Lokalt lagrade produktbilder.
- Informationsrik startsida, kampanjkarusell, kategorikort, erbjudanden, populära produkter, nyligen visat och produktkaruseller.
- Serverbaserad flersordssökning i hela katalogen, förslag, URL-filter, sortering och paginering. Sökresultat inkluderar demomiljöns pris-, titel- och lagerändringar.
- Produktgalleri med zoom, varianter, köp, jämförelse, bevakningar, relaterat, gemensamt tillägg i varukorg, frågor och demorecensioner.
- Sparad gästvarukorg, kontosammanslagning, valbara rader, namngivna privata/delbara önskelistor.
- Serverprissatt checkout, heltalsbelopp i ören, moms, frakt, rabatt, atomärt presentkortssaldo och idempotenta order.
- Orderögonblicksbilder, separata betalnings-/leverans-/returstatusar, delade försändelser, avbeställning, retur och återbetalning. Nedladdningsbart textunderlag, inte juridisk faktura.
- Konto, adressbok, notifikationer, medlemskap med fri standardfrakt, återkommande demoköp med pausa/avsluta.
- Säljarportal för egna erbjudanden, lager, priser, produktbilder, CSV-import/export, egna order och försändelser. Företagsprofilinställningar och produktfrågor.
- Adminpanel för produktändringar, order, returer, återbetalningar, säljaransökningar, kampanjkoder, presentkort, support, recensioner, frakt/moms och revisionslogg. Rapporter beräknas från sparade order.
- Tangentbordsfokus, semantiska formulär och Radix-dialoger med fokusfälla/återställning. Responsivt i 390/768/1280/1440 px.

Detaljerad och ärlig status för alla krav finns i [kravmatrisen](docs/REQUIREMENTS.md). Specifikationens hela kommersiella omfattning är **inte** färdig enbart för att en närliggande demofunktion finns. Begränsningar beskrivs uttryckligen där.

## Integrationer

### Stripe test (valfritt)

Sätt `STRIPE_SECRET_KEY=sk_test_...` och `STRIPE_WEBHOOK_SECRET=whsec_...` i miljövariabler. Endast testnycklar och testhändelser accepteras. Kassan visar då Stripe testbetalning. Registera snapshot-webhooken `/api/payments/webhook` för `checkout.session.completed` och `checkout.session.expired`.

Ordern får PENDING, och lager/rabatt/presentkort reserveras atomärt före extern testcheckout. Stripes session löper ut efter 30 minuter; lagerreservationen har en dokumenterad 31-minutersgräns. Betalning godkänns bara efter en verifierad webhook med rätt sessions-ID, belopp, valuta och teststatus. Återkomst-URL godkänner aldrig betalning. Händelse-ID lagras unikt för idempotens. Expired-webhook återställer reserverade resurser. Anslut webhooks innan funktionen används; automatisk avstämning vid permanent utebliven webhook återstår. Teståterbetalningar går via Stripes API med idempotensnyckel. Faktiska Stripe-nätverksanrop är inte verifierade utan ett anslutet Stripe-testkonto.

Standardläget är den fullt användbara **demoadaptern**. Ingen Stripe-nyckel har lagts till i den publicerade butiken. För marknadsplatsutbetalningar krävs senare Stripe Connect med verklig onboarding; nuvarande utbetalningssaldo är en simulering med 12 % provision.

### E-post

`SMTP_URL` och `EMAIL_FROM` aktiverar SMTP-adaptern för Better Auths verifierings- och återställningslänkar. Utan SMTP lagras meddelanden i en intern demoutkö (`Notification.workspaceId = mail:<userId>`). Denna kö exponeras inte publikt, eftersom en återställningslänk aldrig får lämnas ut till en obehörig besökare. Utgående e-post och återställning via mottagarens inkorg kräver därför SMTP-konfiguration. Handelsnotifikationer visas i kundkontot; full extern e-postdistribution av dessa är inte ansluten.

### Bilder och frakt

`src/lib/integrations/storage.ts` validerar storlek, MIME och filsignatur för JPEG/PNG/WebP. Säljare/admin kan ladda upp produktbilder. Standardadaptern sparar dem i PostgreSQL och ger en offentlig bild-URL med slump-ID. Med `BLOB_READ_WRITE_TOKEN` används Vercel Blob. Ladda endast upp bilder avsedda för offentlig produktvisning. Filuppladdning är begränsad till 2 MB.

Fraktadaptern ger användbara simulerade leveransfönster och spårningshändelser. Ingen transportör är ansluten. Återkommande köp lagrar schema och status men skapar inte automatiska betalningar eller externa beställningar.

## Arkitektur och säkerhet

- `src/app`: serverrenderade routes, metadata, sitemap och API.
- `src/components`: butik, konto och portaler. UI-state och återkoppling i ShopProvider.
- `src/lib/catalog.json`: reproducerbar baskatalog, samma ursprung för seed och butik. Prisma-modeller skiljer Product, Variant och Offer åt. Miljöspecifika Inventory-rader lagrar ändringar utan att ändra andra besökares data.
- `src/lib/commerce.ts`: serialiserbara PostgreSQL-transaktioner, serverpriser, lager, koder, saldon och orderögonblicksbilder.
- `src/lib/session.ts`: signerad HttpOnly-cookie, SameSite=Lax, Secure i produktion, kontobindning och isolering.
- `src/lib/auth.ts`: Better Auth, Prisma, databasbaserad anropsbegränsning och säkra authcookies.
- `src/lib/integrations`: utbytbara betalnings-, e-post-, lagrings- och fraktadaptrar.
- `prisma/migrations`: versionshanterade migrationer. `prisma/seed.ts`: idempotent katalogseed.

Mutationer valideras med Zod och kontrollerar origin, roll och resursägarskap. Säljare kan inte uppdatera andra säljares erbjudanden eller försändelser; privata order och kvitton kräver rätt miljö. Kund kan inte anropa adminåtgärder. Demo-admin är uttryckligen begränsad till sin egen miljö. SQL utförs via Prisma. Priser kommer aldrig från klientens summering. Kortdata tas inte emot av applikationen. Ingen publik produktionsadmin skapas.

Den här leveransen är en demo och ska inte användas för riktig handel utan vidare arbete med bland annat global rollhantering, full katalogadministration, externa transporter, skatter/juridik, utbetalningar, driftövervakning, datarensning och återställningsrutiner. En cookie som går ut efter sju dagar raderar inte automatiskt databasraderna.

## Verifiering

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
# Starta servern på port 3016 (eller låt Playwright starta produktionsservern)
npm run test:e2e
```

Fem domäntester och 16 Playwright/API-tester täcker bland annat: sökning/filter/sortering, variantval, komplett browserköp, lyckad/misslyckad/avbruten betalning, serverpriser, dubbla orderanrop, två samtidiga köp av sista lagervaran, kod/saldo, orderisolering, säljarrättigheter, retur/partiell återbetalning, varukorgssammanslagning och utloggningsisolering, signerad/dubbel webhook och fel belopp, önskelistedelning, medlemskap, support och osäker bildfil. Skärmbilder finns i `docs/screenshots`.

GitHub Actions kör PostgreSQL 17, migrationer, seed, lint, enhetstester, typkontroll, produktionsbygge och Playwright. Webhooktest använder disponibla lokala/CI-hemligheter, inga riktiga betalkonton.

## Referens och bildkällor

Amazons startsida var skyddad av en JavaScript/robotkontroll; sökning och varukorg gav HTTP 503 under granskningen. Inloggade konto-/checkout-/säljarflöden hos Amazon granskades inte. Ingen exakt visuell likhet eller full funktionsparitet påstås. Designen använder mörk dubbelnavigation, stor sökning, täta vita produktkort, ljusgrå grund, överlappande kategorikort och gula/orange köpknappar.

Bildkällor och licensnotiser finns i [ATTRIBUTION.md](docs/ATTRIBUTION.md). Produktuppgifter, priser, omdömen och garantiuppgifter är exempeldata.

## Publicering

Vercel-projektet heter `nordmark-vincent` i team `jobapplication`. PostgreSQL finns i en separat Neon-databas i Frankfurt. `vercel.json` anger Next.js och Frankfurtregion. Se till att `.vercel/project.json` pekar på avsett projekt innan någon miljö- eller publiceringsåtgärd. Miljövariabler läses från `.env` och överförs via stdin av `scripts/configure-vercel.cjs`, utan att värden skrivs i terminalen.
