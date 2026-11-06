Du är ett komplett produktutvecklingsteam med kompetens inom systemarkitektur, fullstackutveckling, e-handel, UI/UX, databaser, säkerhet, betalningar och kvalitetssäkring.

Ditt uppdrag är att bygga en komplett e-handelsplattform och marknadsplats med https://www.amazon.com som visuell och funktionell huvudreferens.

Genomför arbetet som ett sammanhängande uppdrag. Implementera, starta, testa och färdigställ lösningen. Stanna inte vid en plan, designskiss, startsida eller samling komponenter.

# 1. Huvudmål och omfattning

Webbplatsen ska återskapa Amazons shoppingupplevelse med mycket hög visuell precision och ett omfattande funktionellt djup.

Efterlikna:

- Sidornas struktur och proportioner.
- Navigation och informationsarkitektur.
- Informationsdensitet.
- Sökning och produktupptäckt.
- Kategori- och produktpresentation.
- Produktdetaljer och köpruta.
- Varukorg och checkout.
- Kundkonton och orderhantering.
- Säljarfunktioner.
- Administration.
- Mobilupplevelse.

Tolka ”alla funktioner” som samtliga funktioner som specificeras i denna prompt samt relevanta funktioner du kan verifiera i referensens butik och marknadsplats.

Separata streamingtjänster, molntjänster och fysisk logistik ska inte förväxlas med funktioner som går att färdigställa i en webbapplikation. Bygg integrationsgränssnitt och användbara demonstrationer för externa tjänster.

Använd ett eget, konfigurerbart butiksnamn, egen logotyp och eget eller licensierat bildmaterial. Skriv självständig kod. Designen ska ligga mycket nära referensen.

Prioritera en komplett, fungerande plattform där varje synlig funktion har ett verkligt beteende.

# 2. Arbetssätt och självständighet

Börja med att:

1. Läsa projektets instruktioner.
2. Undersöka befintlig kod och utvecklingsmiljö.
3. Identifiera befintliga integrationer.
4. Undersöka tillgängliga Amazon-sidor.
5. Skapa en intern kravlista och arkitektur.
6. Implementera hela lösningen.

Återanvänd projektets fungerande teknik och struktur när det är rimligt.

Ställ bara frågor när en saknad uppgift faktiskt blockerar arbetet. Lös vanliga design- och implementationsbeslut självständigt.

Om externa API-nycklar saknas ska du skapa ett fullt användbart demoläge och fortsätta. Dokumentera vilka inställningar som aktiverar riktiga integrationer.

Begär inte produktionshemligheter i chatten. Använd miljövariabler och skapa `.env.example`.

Arbeta i interna etapper men fortsätt genom samtliga utan att invänta godkännande mellan etapperna.

# 3. Undersök referensen

Undersök följande sidtyper när de är tillgängliga:

- Startsida.
- Kategorinavigation och sidomeny.
- Sökresultat.
- Kategorisidor.
- Erbjudandesidor.
- Produktsidor.
- Varukorg.
- Inloggning och registrering.
- Kundkonto.
- Orderhistorik.
- Hjälp och returer.
- Mobilversion.

Studera:

- Headerns höjd och innehåll.
- Sökfältets storlek.
- Kolumnbredder.
- Kortstorlekar.
- Typografi och radavstånd.
- Färger.
- Bildproportioner.
- Prisformatering.
- Informationshierarki.
- Hover-, fokus- och laddningslägen.

Om en sida kräver inloggning eller blockerar automatiserad åtkomst ska du dokumentera begränsningen och fortsätta utifrån tillgängliga referenser. Påstå inte att du verifierat något som du inte kunnat granska.

# 4. Teknisk grund

Om projektet är tomt, välj följande grund:

- Next.js med App Router.
- React och TypeScript med strict mode.
- Tailwind CSS.
- Tillgängliga UI-primitiver för dialoger, menyer och paneler.
- PostgreSQL.
- Prisma för databasmodell och migrationer.
- En etablerad autentiseringslösning.
- Stripe i testläge.
- Ett gränssnitt för objektlagring av bilder.
- Playwright för användarflöden.
- Ett lämpligt verktyg för enhets- och integrationstester.

Verifiera stabila, kompatibla versioner innan installation.

Använd serverrendering där det hjälper laddning och indexering. Begränsa klientkomponenter till interaktiva funktioner.

Separera:

- UI.
- Domänlogik.
- Databasåtkomst.
- Validering.
- Behörigheter.
- Externa integrationer.
- Bakgrundsjobb.

Skapa en reproducerbar lokal miljö. Om extern databas saknas, tillhandahåll PostgreSQL genom exempelvis Docker Compose.

# 5. Visuell utformning

Bygg ett återanvändbart designsystem baserat på referensen:

- Mörk huvudnavigation.
- Sekundär navigationsrad.
- Mycket framträdande sökfält.
- Ljusgrå sidbakgrund.
- Vita innehållsytor.
- Gula och orange köpknappar.
- Täta produktlistor.
- Stora produktbilder.
- Kompakta informationsblock.
- Tydliga priser, betyg och leveransuppgifter.

Undvik stora tomma ytor och ett generiskt SaaS-utseende. Återskapa en innehållsrik handelsplattform.

Skapa konsekventa designvariabler för färg, typografi, mellanrum, brytpunkter, kantlinjer och skuggor.

# 6. Header, navigation och sidfot

Implementera:

- Logotyp och länk till startsidan.
- Leveransadress och postnummer.
- Kategoriväljare.
- Sökfält med förslag.
- Språk och valuta.
- Konto och listor.
- Beställningar och returer.
- Varukorg med produktantal.
- Sidomeny med kategorihierarki.
- Snabblänkar till erbjudanden och kundservice.
- Brödsmulor.
- Utförlig sidfot.
- ”Till toppen”.

Menyer ska fungera med mus, touch och tangentbord. Dialoger och sidopaneler ska hantera fokus korrekt.

Vald leveransadress ska påverka tillämplig leveransinformation när data finns.

# 7. Startsida och produktupptäckt

Bygg en komplett startsida med:

- Kampanjkarusell.
- Kategorikort som överlappar kampanjytans nederkant.
- Kort med flera underkategorier.
- Dagens erbjudanden.
- Tidsbegränsade kampanjer.
- Bästsäljare.
- Nyheter.
- Populära kategorier.
- Produktkaruseller.
- Nyligen visade produkter.
- Rekommendationer baserade på kategori, visningar och köp.
- Fortsätt handla.
- Säsongskampanjer.
- Redaktionella samlingar.

Alla länkar ska leda till relevant innehåll.

Nedräkningar ska baseras på riktiga kampanjdatum. Använd verkliga beräkningar för rabatter och besparingar.

# 8. Sökning och kategorier

Implementera:

- Sökning på produktnamn, varumärke, kategori och relevanta attribut.
- Sökförslag.
- Sökningar med flera ord.
- Hantering av vanliga felskrivningar där vald söklösning stöder det.
- Sök- och filtertillstånd i URL.
- Kategorihierarki.
- Filtrering på pris, varumärke, betyg, lagerstatus, säljare och produktattribut.
- Sortering på relevans, pris, popularitet, betyg och nyheter.
- Resultatantal.
- Sidnumrering.
- Återställning av filter.
- Begripliga tomma resultat.
- Filterpanel på mobil.

Filtreringen ska fungera mot hela datamängden på servern.

Produktkort ska visa relevant kombination av:

- Bild.
- Titel.
- Variantinformation.
- Säljare.
- Betyg och recensionsantal.
- Pris.
- Jämförelsepris när tillämpligt.
- Tidigare pris och rabatt.
- Leveransinformation.
- Lagerstatus.
- Kampanjmarkering.
- Önskelista.
- Köpknapp.

# 9. Produktsidor

Implementera:

- Bildgalleri med miniatyrer.
- Zoom och helskärmsvisning.
- Titel och varumärke.
- Betyg och recensioner.
- Produktvarianter.
- Aktuellt pris.
- Kampanjinformation.
- Lagerstatus.
- Leveransalternativ.
- Antalsväljare.
- Lägg i varukorg.
- Köp nu.
- Lägg i önskelista.
- Delningslänk.
- Produktbeskrivning.
- Specifikationer.
- Säljarinformation.
- Andra säljares erbjudanden.
- Relaterade produkter.
- Ofta köpta tillsammans.
- Produktjämförelse.
- Frågor och svar.
- Recensioner med sortering, filtrering och betygsfördelning.

På desktop ska huvuddelen använda bildgalleri till vänster, produktinformation i mitten och köpruta till höger.

Variantval ska uppdatera bild, pris, tillgänglighet och korrekt varukorgsrad.

Skilj mellan produkt, variant och säljarerbjudande i datamodellen.

# 10. Varukorg och önskelistor

Implementera:

- Gästvarukorg.
- Beständig varukorg.
- Sammanslagning vid inloggning.
- Uppdatering av antal.
- Borttagning.
- Spara till senare.
- Val av produkter som ska köpas.
- Lagerkontroll.
- Uppdatering när priser ändrats.
- Rabattkod.
- Delsumma, frakt, skatt och totalsumma.
- Flera önskelistor.
- Namngivna listor.
- Privata och delbara listor.
- Flytta produkt mellan lista och varukorg.

En inaktuell eller manipulerad klient får inte kunna bestämma pris eller köpa fler produkter än tillåtet.

# 11. Checkout och betalning

Bygg ett sammanhängande köpflöde med:

1. Gästköp eller inloggning.
2. Leveransadress.
3. Faktureringsadress.
4. Tillgängliga leveransalternativ.
5. Rabattkod och eventuellt presentkort.
6. Orderöversikt.
7. Testbetalning.
8. Orderbekräftelse.
9. Orderhistorik.

Implementera:

- Serverberäknade summor.
- Pengar lagrade utan flyttalsfel.
- Tydlig valuta.
- Konfigurerbara skatteregler.
- Lagerreservation med utgångstid.
- Säker hantering av samtidiga köp.
- Verifierade betalningswebhooks.
- Idempotent order- och betalningshantering.
- Misslyckad betalning.
- Avbruten betalning.
- Återförsök utan dubbelorder.
- Hel och partiell återbetalning där integrationen stöder det.

Betalningsstatus ska uppdateras från betrodd serverinformation. En återvändande webbläsare eller bekräftelse-URL får inte ensam markera ordern som betald.

Skapa realistiska testfall för lyckad och misslyckad betalning.

# 12. Kundkonto och efterköp

Implementera:

- Registrering.
- Inloggning och utloggning.
- Verifiering av e-post.
- Återställning av lösenord.
- Profil.
- Adressbok.
- Orderhistorik.
- Orderdetaljer.
- Leveransspårning.
- Delade leveranser.
- Avbeställning enligt orderstatus.
- Returförfrågan.
- Val av returorsak.
- Returstatus.
- Återbetalningsstatus.
- Nedladdningsbart orderunderlag.
- Köp igen.
- Recension av köpta produkter.
- Notifikationsinställningar.
- Hantering av medlemskap.

Märk endast recensioner som verifierade köp när kopplingen till ett verkligt köp har kontrollerats.

# 13. Marknadsplats och säljarportal

Bygg stöd för flera säljare.

Säljarportalen ska innehålla:

- Registrering och säljaransökan.
- Administrativt godkännande.
- Företagsprofil.
- Publik butikssida.
- Produkt- och erbjudandehantering.
- Varianter och bilder.
- Lager och SKU.
- Prissättning.
- Fraktinställningar.
- Orderhantering.
- Leveransbekräftelse.
- Returhantering.
- Försäljningsstatistik.
- Provisionsöversikt.
- Utbetalningsöversikt.
- Import och export av produkter.

En order ska kunna innehålla produkter från flera säljare och delas i säljarorder och försändelser.

Säljare får bara se den information som behövs för deras egna erbjudanden och orderrader.

Om riktiga marknadsplatsutbetalningar aktiveras, använd en integration avsedd för detta och dess onboarding. I demoläget ska finansiella flöden tydligt vara simuleringar.

# 14. Kompletterande handelsfunktioner

Implementera sammanhängande versioner av:

- Rabattkoder med giltighetstid och användningsgräns.
- Kampanjer.
- Paketpriser.
- Presentkort med saldo och transaktionshistorik.
- Presentmeddelande.
- Medlemskap med definierade förmåner.
- Återkommande köp för utvalda produkter.
- Bevakning av pris och lager.
- Produktjämförelse.
- Kundserviceärenden.
- Meddelanden kopplade till order.
- Hjälpcenter och vanliga frågor.
- Notifikationer i webbplatsen och via e-post.

Presentkortssaldo och rabattgränser ska uppdateras atomärt så att parallella anrop inte kan dubbelanvända dem.

För abonnemang ska användaren kunna se nästa tillfälle, pausa och avsluta.

# 15. Adminpanel

Bygg en separat, skyddad administrationsyta med:

- Översikt.
- Produkter och varianter.
- Kategorier och varumärken.
- Attribut.
- Bilder.
- Säljare och säljaransökningar.
- Användare och roller.
- Lager.
- Order och försändelser.
- Betalningar och återbetalningar.
- Returer.
- Kampanjer.
- Rabattkoder.
- Presentkort.
- Medlemskap.
- Recensioner och moderering.
- Kundserviceärenden.
- Startsidessektioner och banners.
- Frakt- och skatteinställningar.
- Försäljningsrapporter.
- Revisionslogg.

Statistik ska beräknas från lagrade data.

Använd tydliga statusövergångar och bekräftelser för känsliga administrativa åtgärder.

# 16. Data, säkerhet och tillförlitlighet

Modellera minst:

- Användare, roller och sessioner.
- Adresser.
- Säljare.
- Produkter, varianter och säljarerbjudanden.
- Kategorier och attribut.
- Bilder.
- Lager, reservationer och lagerhändelser.
- Varukorgar.
- Önskelistor.
- Order och orderrader.
- Försändelser.
- Betalningar.
- Returer och återbetalningar.
- Recensioner.
- Frågor och svar.
- Rabattkoder.
- Presentkortstransaktioner.
- Medlemskap.
- Återkommande köp.
- Notifikationer.
- Supportärenden.
- Revisionsloggar.

Spara ögonblicksbilder av produktnamn, pris, skatt, säljare och relevanta adressuppgifter på ordern så att historiken inte ändras när produktkatalogen uppdateras.

Implementera:

- Serversidevalidering.
- Behörighetskontroll per operation och resurs.
- Säkra sessioner.
- Skydd mot relevanta injektions- och webbsårbarheter.
- Begränsning av känsliga anropsfrekvenser.
- Validering av filuppladdningar.
- Verifierade webhooks.
- Transaktioner och unika begränsningar.
- Loggning utan lösenord, betalningsuppgifter eller hemligheter.
- Kontrollerad felhantering.

Använd tydliga tillstånd för betalning, order, leverans och retur i stället för ett enda statusfält som blandar ihop dem.

# 17. Fullständigt demoläge

Webbplatsen ska gå att demonstrera utan betalda externa tjänster.

Skapa:

- Minst 120 produkter.
- Minst 12 kategorier.
- Flera varumärken.
- Minst fem demosäljare.
- Produkter med flera varianter.
- Varierande lagerstatus.
- Kampanjer.
- Demokunder.
- Demoorder med olika status.
- Returer och supportärenden.
- Tydligt identifierade demorecensioner.

Använd relevanta produktbilder och varierande, realistiska produkttexter. Undvik trasiga bildlänkar och identiska platshållare.

Tillhandahåll utvecklingskonton för kund, säljare och administratör. Dessa får inte aktiveras osäkert i produktion.

Skapa adapters för betalning, e-post, lagring och frakt. Demoadapters ska ge användbara resultat och vara tydligt identifierbara i gränssnittet där det behövs.

Simulerad betalning eller leverans får aldrig framställas som en verklig transaktion.

# 18. Mobil, tillgänglighet och prestanda

Verifiera minst följande bredder:

- 390 px.
- 768 px.
- 1280 px.
- 1440 px.

Implementera:

- Mobilanpassad navigation.
- Lättåtkomlig sökning.
- Filterpanel.
- Touchvänligt galleri.
- Tydliga köpknappar.
- Läsbara tabeller och orderdetaljer.
- Ingen oavsiktlig horisontell sidscroll.

Använd semantisk HTML, formuläretiketter, synligt fokus, tangentbordsstöd och tillgängliga dialoger.

Optimera bilder, databasfrågor, laddning och klientkod. Använd paginering för stora datamängder.

Skapa metadata, sitemap, canonical-adresser och korrekt produktrelaterad strukturerad data. Privata kontosidor och interna administrationssidor ska inte indexeras.

# 19. Verifiering och acceptanskriterier

Skapa en kravmatris som kopplar varje huvudfunktion till implementation och verifiering.

Testa minst:

- Sökning, filter och sortering.
- Variantval.
- Gästvarukorg.
- Sammanslagning av varukorg.
- Lyckat köp.
- Misslyckad och avbruten betalning.
- Upprepad webhook.
- Samtidiga köp av sista lagervaran.
- Rabattkod och presentkort.
- Orderhistorik.
- Avbeställning och retur.
- Säljarens orderhantering.
- Administrativ produktändring.
- Kund som försöker läsa annan kunds order.
- Säljare som försöker ändra annan säljares erbjudande.
- Vanlig användare som försöker anropa adminfunktioner.

Kör relevanta tester, lint, typkontroll och produktionsbygge.

Starta applikationen och använd den i webbläsaren. Granska desktop och mobil med skärmbilder. Kontrollera även tomma tillstånd, laddning, fel och långa produktnamn.

Jämför referensen visuellt och korrigera avvikelser i layout, proportioner och informationstäthet.

Rapportera inte en funktion som färdig enbart för att dess knapp eller sida finns.

# 20. Leverans och definition av klart

Leverera:

- Komplett körbar källkod.
- Databasmodell och migrationer.
- Reproducerbart seed-skript.
- `.env.example`.
- Lokal startkonfiguration.
- Dokumenterade demoidentiteter.
- Dokumenterade externa integrationer.
- Testsvit för centrala flöden.
- Kort arkitekturbeskrivning.
- README.
- Kravmatris med verifieringsstatus.

Lösningen är klar när:

1. Startsida, sökresultat och produktsidor visuellt ligger nära Amazon.
2. Kunden kan genomföra ett fullständigt köp i demoläge.
3. Ordern syns och kan hanteras i relevanta konton.
4. Säljaren kan hantera sina produkter och order.
5. Administratören kan hantera plattformen.
6. Behörigheter och kritiska affärsregler har verifierats.
7. Mobilversionen fungerar.
8. Produktionsbygget passerar.
9. Inga centrala flöden slutar i tomma knappar eller oimplementerade platshållare.

Fortsätt självständigt tills hela omfattningen är genomförd eller en konkret teknisk begränsning hindrar fortsatt arbete. Om arbetet sträcker sig över flera kontextfönster, spara ett kort arbetsläge och fortsätt från detta.

Avsluta med en kort, ärlig leveransrapport med startinstruktioner, verifierade funktioner, testresultat och eventuella återstående externa konfigurationer.

Börja nu med att undersöka projektet och referensen. Genomför därefter hela implementationen i samma sammanhängande uppdrag.