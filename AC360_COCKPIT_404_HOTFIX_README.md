# AC360 Cockpit 404 Hotfix

This hotfix repairs the route authority issue introduced by redirecting `/angelcare-360` and `/angelcare-360/customer`.

Instead of redirecting, both entry routes now directly render the visual-contract `Ac360DirectionCockpitPage`.

## Routes repaired

- `/angelcare-360`
- `/angelcare-360/customer`
- `/angelcare-360/customer/cockpit-direction` remains the canonical page

## Apply

```bash
unzip -o ~/Downloads/AngelCare_360_Cockpit_404_Hotfix_Patch_20260702.zip -d .
node scripts/verify-ac360-cockpit-404-hotfix.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```
