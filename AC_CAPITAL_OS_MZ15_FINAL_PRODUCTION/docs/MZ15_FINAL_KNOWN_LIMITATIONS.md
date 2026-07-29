# MZ15 Final Known Limitations and External Gates

1. **Repository TypeScript must be run after installation.** Package syntax/type rehearsals do not replace the current repository gate.
2. **MZ15 SQL is additive and must be run manually.** The installer never executes database changes.
3. **Browser acceptance requires an authenticated session.** Use `--storage-state` when the protected app redirects to sign-in.
4. **Supabase schema drift can still surface.** APIs were built against the accepted MZ1–MZ13 schemas inspected for this package; a database that was manually altered can require surgical column reconciliation.
5. **Data Room requires a private `ac-capital-data-room` bucket.** Missing storage returns a real failure; the UI may not fake success.
6. **Live AI is disabled by default.** MZ15 implements real dry-run logging and governance; external model activation remains an explicit provider-control decision.
7. **Automatic sensitive email and automatic funding submission are intentionally absent.** The human coordinator executes and logs proof.
8. **PDF report export is not claimed.** The report engine exposes Markdown, HTML and JSON draft output.
9. **Global capital notifications are visibly disabled until a notification delivery endpoint is configured.**
10. **Production readiness cannot be certified by static tokens.** It requires SQL, app TypeScript, API health, authenticated browser evidence, storage/provider readiness and deployment checks.
