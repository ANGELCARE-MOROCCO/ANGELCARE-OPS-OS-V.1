# SaaS Factory Options readiness metrics fix

This fixes the runtime crash:

`Cannot read properties of undefined (reading 'readinessScore')`

Cause: the Options page component expected `summary.metrics.readinessScore`, while the API/runtime can return `summary.counts.readiness`. The fix adds a defensive `optionMetrics` adapter in the page component.

## Apply

```bash
cd ~/Desktop/angelcare-opsos-app
unzip -o ~/Downloads/saas-factory-command-options-readiness-metrics-fix.zip -d .
node repair-options-readiness-metrics.cjs
node verify-options-readiness-metrics-fix.cjs
rm -rf .next
npm run dev
```

## Then run

```bash
npm run build
npx tsc --noEmit --pretty false
```
