# ANGELCARE Revenue Command Browser OS — Mega ZIP 6 / v0.6.0

Private Manifest V3 extension connected to the ANGELCARE SaaS through the governed Extension Gateway. It contains no privileged server secret and lazy-loads only the modules, capabilities, adapters, territories and data scopes assigned to the current user from `/users/[id]`.

The cumulative B2B vertical now covers the complete account-to-partner lifecycle plus an evidence-backed AI Sales Director, Management Command, Pipeline Truth, revenue-risk queues, staff coaching, territory intelligence, executive reporting and controlled internal automation. High-risk external or financial actions remain human-controlled.

## Local build

```bash
npm install
npm run generate:key   # once; protect .secrets/
ANGELCARE_SAAS_ORIGIN=http://localhost:3000 npm run build
npm run verify
```

Open `chrome://extensions`, enable Developer Mode, choose **Load unpacked**, and select `dist/`.

## Production identity

Back up `.secrets/angelcare-revenue-command-private.pem` outside the repository. The generated public key is injected into the manifest to preserve a stable Chrome extension ID. Never distribute the private key in a patch or source archive.

## Mega ZIP 6 deployment

Apply the SQL migration and deploy the OPS Gateway before assigning Mega ZIP 6 capabilities. Use `MEGA6_MIGRATION_ORDER.md`, `MEGA6_LIVE_ACCEPTANCE_CHECKLIST.md` and `MEGA6_ROLLBACK.md` from the repository root.
