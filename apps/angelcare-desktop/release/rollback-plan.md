# ANGELCARE Desktop Rollback Plan

1. Withdraw the affected update manifest from the active channel.
2. Mark the defective version as blocked in central desktop governance.
3. Publish the last known-good signed installer under the same release channel.
4. Instruct affected operators to export sanitized diagnostics before intervention.
5. Reinstall the last known-good desktop version. Do not remove the local WhatsApp partition during a normal rollback unless security requires it.
6. Confirm SaaS authentication, device lease, workspace assignment, WhatsApp linked state and one business-context workflow.
7. Database migrations are handled separately; Mega ZIP 5 contains no database migration and never claims to roll back server-side schema changes.
