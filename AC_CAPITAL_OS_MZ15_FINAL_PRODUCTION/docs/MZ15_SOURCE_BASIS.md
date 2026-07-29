# MZ15 Source Basis

MZ15 was engineered against the actual AC CAPITAL OS artifacts available for this build:

- MZ13 Full Production Wiring package for the repository/live-fallback architecture and safety boundaries.
- MZ14 Capital Command Universe package, treated as superseded visual scaffolding rather than final architecture.
- MZ3–MZ12 SQL migrations extracted from the accepted cumulative packages for table/column compatibility review.
- The available AngelCare platform source snapshot for authentication, protected route, Supabase server client, Next.js and TypeScript conventions.

The package’s schema compatibility verifier compares 77 MZ15 API insert/update payloads against 120 AC Capital tables found in MZ3–MZ15 migrations. This does not guarantee a manually altered remote database has no drift; live SQL and API smoke remain required.
