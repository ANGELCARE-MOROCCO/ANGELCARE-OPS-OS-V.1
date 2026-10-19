# Email credential update — 14 October 2026

The user-supplied Supports and IT Support passwords were applied without adding them to repository code.

| Setting | Result |
| --- | --- |
| Supports live Email OS credential record | Updated; exact-value readback passed |
| IT Support live Email OS credential record | Updated; exact-value readback passed |
| Windows bridge Supports default | Updated and service restarted; saved value matches; health HTTP 200 |
| Auth relay IT Support container setting | Updated; running container setting matches the supplied value |
| Auth relay active SMTP credential map | Updated in its original LMDB format; exact-value lookup passed |
| Postfix | Started after replacement-container startup left it inactive; subsequent status check passed |
| Postfix and DKIM health | Native health check passed with “All OK”; Docker health subsequently reported healthy |
| Mail queue / signing / Postfix volumes | Original three named volumes preserved; no queue flush or manual resend performed |
| Supports SMTP authentication test | Rejected with 535 using the supplied password and the full email address as username |
| IT Support SMTP authentication test | Connection timed out; successful SMTP authentication not established |
| Supports and IT Support incoming authentication tests | Both rejected at PASS with “unknown user name or bad password” |
| Actual bridge SMTP test | HTTP 500: connection timeout to the configured Menara endpoint |
| Inbox delivery / customer links / replies | Not verified; no fresh test message was sent |

**Credential installation is complete. End-to-end email readiness remains unverified.**

The provider login-usernames question remains pending. No alternative usernames or passwords were guessed. The supplied values were retained exactly, and mailbox activation/status decisions were preserved.

The database used is `https://angelcare-supabase.duckdns.org`, identified from the running OPS container. The accessible OPS container carries a staging label; production OPS runtime configuration has not been independently established.

The first relay replacement attempt timed out. Its rollback left the original container stopped; that was detected, acknowledged, and repaired using the Docker CLI. The final replacement is running with the new persisted IT Support value. Its reused credential map initially retained the previous value; this was corrected and compiled in the existing LMDB format. Postfix was then started and both native and Docker health checks passed.

Private database credential backup: `/private/tmp/angelcare-mailbox-credentials-before-20261014T033339Z.json`.

Private relay configuration backup: `/home/angelcare/angelcare/supabase/.auth-relay-backups/credential-20261014T040620Z` on the existing Ubuntu server. The stopped rollback container is `angelcare-auth-smtp-relay-before-password-20261014T040620Z`. Credential-map backups remain beside the existing map with timestamped `.before-` suffixes.

The Downloads current-password TXT was refreshed, and the earlier export was preserved as `ANGELCARE_MAILBOX_PASSWORDS_BEFORE_UPDATE_20261014.txt`. Both files retain permissions 0600.

No Auth hook activation, scheduler activation, provider-host change, firewall change, unrelated service restart, source deployment or customer lifecycle dispatcher activation was performed during this credential update. The broader readiness gaps in `EMAIL_OPERATIONS_READINESS_20261014.md` still require completion before a green verdict.
