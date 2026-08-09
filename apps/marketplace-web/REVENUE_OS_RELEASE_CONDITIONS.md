# Revenue OS Release Conditions

This package implements the complete trusted-operator source contract. Final release eligibility still depends on the repository-local gate because the uploaded Revenue-only source intentionally excludes some destination modules and installed dependencies.

The gate must prove:

1. Targeted strict TypeScript passes in the actual repository.
2. Every configured internal destination route exists in the full AngelCare application.
3. The Next.js production build passes.
4. SQL preflight passes before the additive migration is applied manually.
5. SQL post-migration verification passes.
6. Live credentials and provider connectivity are valid.

The installer does not execute SQL, deploy, send email, send WhatsApp messages, or invoke external adapters.
