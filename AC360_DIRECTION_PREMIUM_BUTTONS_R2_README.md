# AC360 Direction Premium Corporate Buttons R2

This patch upgrades the visible Cockpit de Direction button system beyond the earlier soft pills.

## Scope

- `components/ac360/customer/direction/Ac360DirectionCockpitPage.tsx`
- `scripts/verify-ac360-direction-premium-buttons-r2.mjs`

## What changed

- Adds a centralized premium button style system inside the direction cockpit component.
- Replaces soft/pastel action buttons with stronger corporate buttons.
- Upgrades:
  - top intelligence bar controls,
  - primary page actions,
  - secondary action buttons,
  - execution-secured strip buttons,
  - card `Voir tout` / `Voir détail` micro-actions,
  - report template cards,
  - report generator controls,
  - export/download actions,
  - modal close/confirm buttons,
  - mobile dock buttons.

## Visual contract

Buttons now use:

- sharper executive gradients,
- deeper controlled shadows,
- premium ring/border treatment,
- hover lift,
- corporate micro-pill actions,
- stronger command hierarchy,
- no baby-soft pastel-only styling.

## Apply

```bash
cd ~/Desktop/angelcare-opsos-app
unzip -o ~/Downloads/AngelCare_360_Direction_Premium_Buttons_R2_Patch_20260703.zip -d .
node scripts/verify-ac360-direction-premium-buttons-r2.mjs
NODE_OPTIONS="--max-old-space-size=16384" npx tsc --noEmit --pretty false
npm run build
```
