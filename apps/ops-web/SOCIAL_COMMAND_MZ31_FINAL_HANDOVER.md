# ANGELCARE SOCIAL COMMAND — MZ3.1 FINAL HANDOVER

## Environment contract
Required server-only values:
- `SOCIAL_COMMAND_INSTAGRAM_WEBHOOK_ACCESS_TOKEN`
- `SOCIAL_COMMAND_INSTAGRAM_WEBHOOK_ACCOUNT_ID`

Keep the existing Facebook Login for Business variables and connection unchanged.

## Deployment acceptance
After Vercel deploy:
1. Control → Webhooks → Inspect subscriptions.
2. Confirm account source `Instagram Login` and host `graph.instagram.com`.
3. If fields are missing, Reconcile Instagram subscriptions once.
4. Re-inspect until required fields are healthy.
5. Test one genuine external Instagram comment.
6. Test one genuine external Instagram DM.
7. Test a reply from ENGAGE.
8. Test one scheduled publication.

Meta sample events alone are not production acceptance.
