# AC360 Phase 3O-R4 — Direction Cockpit Hardening Reality Pass

This patch hardens the visual-contract Cockpit de Direction so it stops behaving like a static showcase page.

## Purpose
- Preserve the premium white French-native visual contract.
- Keep `/angelcare-360`, `/angelcare-360/customer`, and `/angelcare-360/customer/cockpit-direction` rendering the dedicated Direction Cockpit directly.
- Add a zero-static-action policy layer.
- Make header buttons, card actions, report generator controls, export/download affordances, and mobile dock actions open the governed AC360 preflight modal.
- Route the modal confirmation through `/api/ac360/customer/cockpit-direction`, using the existing SQL-backed production tables and proof reference chain.

## Key Files
- `components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx`
- `app/(protected)/angelcare-360/page.tsx`
- `app/(protected)/angelcare-360/customer/page.tsx`
- `app/(protected)/angelcare-360/customer/cockpit-direction/page.tsx`
- `app/(protected)/angelcare-360/customer/cockpit-direction/[view]/page.tsx`
- `scripts/verify-ac360-phase3o-r4-hardening-reality.mjs`

## Verification
```bash
node scripts/verify-ac360-phase3o-r4-hardening-reality.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```

## Runtime Check
Open:
- `/angelcare-360`
- `/angelcare-360/customer`
- `/angelcare-360/customer/cockpit-direction`

Click topbar buttons, page action buttons, `Voir tout`, report generator controls, downloads, and mobile dock actions. Every interaction should open the AC360 preflight modal and execute through the production cockpit API after confirmation.
