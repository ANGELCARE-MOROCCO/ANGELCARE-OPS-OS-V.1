# Rollback

## Preferred rollback

1. Stop Ambassador write traffic.
2. Run the package application rollback script or restore the pre-injection application backup.
3. Retain the additive `app_user_id` schema and actor mapping. The previous runtime ignores them.
4. Redeploy and validate the previous runtime.

## Disable an OpsOS mapping without schema removal

Set the relevant `market_os_ambassador_actor_roles.status` to `revoked`. Do not delete audit evidence.

## Destructive schema cleanup

The included rollback SQL is intentionally guarded. It requires:

```sql
set app.ambassador_session_bridge_allow_destructive_rollback = 'true';
```

It also refuses to run while any row has `app_user_id`. Export and explicitly remove mappings first. Destructive cleanup is not required for normal application rollback.
