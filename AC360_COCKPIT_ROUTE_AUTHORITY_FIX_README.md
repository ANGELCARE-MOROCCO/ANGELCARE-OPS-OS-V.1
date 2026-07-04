# AC360 Cockpit Route Authority Fix

This patch corrects the production routing issue found in the uploaded production audit zip.

## Problem

`/angelcare-360/customer` was still rendering the old Phase 3B/3J shared customer cockpit shell containing copy such as:

- `Phase 3B · Cockpit live`
- `Le cockpit direction devient vivant`
- `Phase 3J · Centre de commande intelligent`

The premium Phase 3O-R2 visual-contract Cockpit de Direction existed in the codebase, but the default customer entrypoint still rendered the legacy/shared shell.

## Fix

- `/angelcare-360` redirects to `/angelcare-360/customer/cockpit-direction`
- `/angelcare-360/customer` redirects to `/angelcare-360/customer/cockpit-direction`
- `command-center` route hint points to the visual cockpit route
- back links from dedicated module screens return to `Cockpit de direction` instead of the old shared shell
- direction cockpit logo also links to the visual cockpit route

## Verify

```bash
node scripts/verify-ac360-cockpit-route-authority.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```
