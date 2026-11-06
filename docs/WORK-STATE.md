# Nordmark implementation
User requests full Amazon-inspired marketplace, local Next.js source in this directory, GitHub and Vercel publication. Do not stop for routine approvals. No subagents used.

Database: new dedicated Neon project billowing-band-29051144, org-wild-hat-36233161, Frankfurt, Postgres17. Credentials only in ignored .env. Vercel logged in as jobapp-2883. GitHub profile VincentDimov; use Git Credential Manager for CLI API if needed, never print credentials.

Architecture: Next.js 16.4.5, React 19.3.1, Prisma 6.19.3 PostgreSQL, Better Auth, Radix dialog, Zod. Each visitor gets an isolated signed demo workspace; demo seller/admin only modify their own sandbox. No public global admin credentials. Commerce in integer öre, DB serializable transactions, server-priced lines, reservations, idempotency.

Amazon homepage blocked by JS challenge; search/cart HTTP503. Exact visual fidelity unverified. Photos: demo product catalogue DummyJSON (download locally); hero Unsplash. Attribution document required.

Implemented complete demo customer purchase/return flow, scoped seller/admin panels, 120 local images, PostgreSQL seed/migrations, Better Auth merge/logout isolation, Stripe test adapters and verified webhook, SMTP/Blob adapters, CSV, wishlists, support and account extras. Scope limitations explicitly documented in README and docs/REQUIREMENTS.md. Source formatted with Prettier. Five unit tests and 16 Playwright/API tests passed before final settings/search enhancements; rerun final suite against production build. Lint/typecheck passed, npm audit zero vulnerabilities.

GitHub empty repository created: https://github.com/VincentDimov/nordmark-marketplace . Git initialized main and files staged; commit/push still required. Vercel project nordmark-vincent created, linked, target verified prj_xvUkfknyNWjC8WZOHO6NBQU09xxf team_MR5SBZAu4rKslIcoHlmyD2o0. Six production/preview env vars configured securely via stdin script. Desired alias https://nordmark-vincent.vercel.app . No Stripe/SMTP/Blob external secrets configured. Need final tests/build, secret scan staged files, commit/push, vercel deploy --prod --skip-domain then smoke check and promote, connect GitHub, verify published flow. Local working port3016; do not stop unrelated port3000 processes.
