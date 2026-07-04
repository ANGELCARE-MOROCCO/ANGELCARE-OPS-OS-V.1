# AC360 Direction — Context-Aware Modal Execution Fix

This patch fixes the execution bug where every modal confirmation was treated as a production API action.

## What changed

- Period selector and multi-site selector are now **local cockpit context actions**.
- These context modals update the cockpit view state without POSTing to `/api/ac360/customer/cockpit-direction`.
- Governed workflows still execute through the production API:
  - create direction action
  - declare risk
  - launch control
  - report/export queue
  - decisions/escalations
- Executable modals now send active cockpit context with the payload.
- Backend context errors are converted to final-client wording such as:
  - `Compte à finaliser`
  - `Vérifier le compte`
  - `Contacter AngelCare Success`

## Files updated

- `lib/ac360/customer-direction-action-map.ts`
- `components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx`
- `lib/ac360/customer-direction-cockpit-production.ts`
- `scripts/verify-ac360-direction-context-aware-execution.mjs`

## Verification

```bash
node scripts/verify-ac360-direction-context-aware-execution.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```

## Expected UX

- Applying period should not show a backend/context error.
- Applying site scope should not show a backend/context error.
- True workflow actions still create governed records or show a client-friendly account-finalization message if the account is not fully linked.
