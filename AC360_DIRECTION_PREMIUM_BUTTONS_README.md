# AC360 Direction — Premium Corporate Buttons Patch

This patch upgrades the visible Cockpit de Direction button system without changing business logic or adding new modules.

## Scope

- Adds a scoped `data-ac360-direction-cockpit="true"` root attribute.
- Adds a scoped premium button CSS system in `app/globals.css`.
- Upgrades primary buttons, secondary buttons, micro actions, report cards, soft action buttons, export/download actions and mobile dock actions.
- Keeps all action wiring intact: buttons still open the governed Cockpit de Direction command modal and execute through the existing API.
- Preserves the French-native customer-facing cleanup: no visible SQL/phase/runtime developer wording.

## Files

- `components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx`
- `app/globals.css`
- `scripts/verify-ac360-direction-premium-buttons.mjs`

## Verification

```bash
node scripts/verify-ac360-direction-premium-buttons.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```
