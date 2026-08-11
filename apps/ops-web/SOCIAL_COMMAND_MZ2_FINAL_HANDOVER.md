# Social Command MZ2 — Final Handover

Normal installation order:
1. Apply guarded source ZIP.
2. Run zero-build source gate.
3. Run MZ2 SQL `PRECHECK`.
4. If `CLEAN_INSTALL`, run `MIGRATION`.
5. Run `VERIFY` and require `SOCIAL_COMMAND_MZ2_DATABASE_VERIFIED`.
6. Configure webhook verification token and central AI-control URL as required.
7. After deployment, register the public webhook callback in Meta and subscribe only the fields granted to the app.

The SQL rollback file is emergency-only. No package script executes SQL, installs Windows services, calls Meta externally, or runs `next build`.
