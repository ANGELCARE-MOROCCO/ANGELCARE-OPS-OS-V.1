# Apply sequence

1. Back up the repository and Supabase database.
2. Inject the patch files into `apps/ops-web`.
3. Run:

```bash
cd apps/ops-web
node deployment/market-os-ambassadors-settings-control-center/verify-settings-control-center.mjs
```

4. Confirm the earlier production-hardening migration is already applied:

`database/market-os-ambassadors/20260721_market_os_ambassadors_production_hardening.sql`

5. Apply the additive Settings migration:

`database/market-os-ambassadors/20260721_market_os_ambassador_settings_control_center.sql`

6. Confirm active actor-role rows exist for the intended tenant and organization. Administrators inherit granular settings rights through `*`; market manager, compliance, finance and viewer permission seeds are additive.
7. Deploy the application through the normal release process.
8. Open `/market-os/ambassadors/settings`, create the first organization draft, validate, simulate, approve and publish it. Until the first version is published, the hardened legacy settings record is displayed as a compatibility baseline.

## Scheduled publication

Scheduled versions do not publish themselves without a runtime invocation. Call the authenticated endpoint below from an authorized hourly scheduler or run it from the control center:

`POST /api/market-os/ambassadors/settings/runtime/process`

The highest useful cadence is hourly. The runtime processor uses row locking, stale-lock recovery, transactional publication and immutable failure evidence.

No SQL is executed by the ZIP injection process.
