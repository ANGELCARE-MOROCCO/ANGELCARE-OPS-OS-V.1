# Marketplace email operations — 14 October 2026

**Production verdict: NOT GREEN. End-to-end delivery has not been established.**

**Later credential update:** The supplied Supports and IT Support values have now been installed in the live mailbox records, Windows bridge default, Auth relay persisted setting and active LMDB credential map. Bridge, Postfix and DKIM health checks pass. Authentication tests with the supplied values did not establish working provider login; successful delivery remains unverified. See `EMAIL_CREDENTIAL_UPDATE_20261014.md`. The original evidence table below is historical and predates that update.

The requested sender ownership is `supports@angelcarehub.ma` for customer interactions and `it.support@angelcarehub.ma` for Sanila / AngelCare 360 operations. Source routing and live 360 template/rule metadata were corrected. Authentication, transport, release and lifecycle-dispatch gaps remain.

## Live evidence

| Boundary | Result | Evidence |
| --- | --- | --- |
| Windows email bridge service | Running | Existing `angelcare-email-bridge` service is running on the registered server. |
| Both native credential records | Present, active | `cred_supports_angelcarehub_ma` and `cred_it_support_angelcarehub_ma` exist, with active provider records. Configuration presence does not prove working authentication. |
| Supports incoming authentication | Failed | `pop.menara.ma:110` rejected PASS: `-ERR Logon failure: unknown user name or bad password.` |
| IT Support incoming authentication | Failed | The same explicit incoming-login rejection occurred for `it.support@angelcarehub.ma`. No messages were read or deleted. |
| Bridge default credential | Matches database | Default sender is Supports; the saved password matches its database credential. Password values were kept private. |
| Legacy Auth relay credential | Matches database | Relay username and password match the native IT Support credential. This is a comparison, not successful authentication. |
| SMTP hostname connection | Failed | Both requested mailboxes timed out before an SMTP greeting/login. |
| SMTP numeric endpoints | Failed | Windows and Mac TCP tests timed out to `81.192.56.220:587` and `62.251.201.220:587`. |
| Windows general connectivity | Working during test | `1.1.1.1:443` and `pop.menara.ma:110` connected. The network fault is not established more precisely than the failed SMTP connection boundary. |
| Windows SMTP alternatives | Failed | Hostname probes to ports 25 and 465 also timed out. No provider port, DNS or firewall setting was changed. |
| Windows .NET / firewall comparison | Incomplete | The bounded inspection timed out. No firewall diagnosis or exemption is claimed. |
| Deployed native Auth worker | Responding | Authenticated GET returned HTTP 200; worker secret and bridge URL/token are configured; ledger counts and recent jobs were empty. This does not establish a running scheduler. |
| Native Auth hook | Inactive | Live Auth still uses `angelcare-auth-smtp-relay` and its global `it.support@angelcarehub.ma` sender. The native hook is installed in the DB but is not enabled in Auth. |
| Legacy Auth queue | Blocked | Eleven deferred messages were observed, with connection timeouts or prior SMTP 535 authentication errors. They were not flushed, retried manually or deleted. |
| Live 360 sender metadata | Corrected | Five templates and two rules now use `IT_SUPPORT`; zero pending messages required rerouting. Existing sent history was preserved. |
| 360 automation activation | Not active | Both observed rules remain draft; active rule count is zero. Sender repair did not activate these rules. |
| Customer lifecycle dispatch | Missing in inspected scope | The existing premium-email operations document identifies 22 lifecycle templates without a transactional dispatcher; inspected journey notifications/events were empty. Templates alone do not send email. |
| Coolify deployment access | Blocked | Docker CLI inspections timed out at 25 and 90 seconds; a direct Docker socket request timed out at 12 seconds. Host load was approximately 33. No daemon or unrelated service was restarted. |
| GitHub release access | Blocked in this session | CLI API verification failed with `x509: OSStatus -26276`; token retrieval reported no OAuth token; branch push failed with `could not read Username ... Device not configured`. An expired token has not been established. |
| Provider acceptance / inbox / replies / callback completion | Unverified | No live test email was sent. No successful external receipt, reply ingestion, confirmation link, password reset or resulting sign-in is claimed. |

## Repairs completed

- Centralized the two automated sender lanes. Marketplace customer Auth uses Supports; Sanila/360 paths and existing OPS Auth destinations use IT Support.
- Corrected IT email help text and reply contact links in Auth templates.
- Changed direct 360 email, tenant-access metadata, composed messages and rule-generated messages to IT Support. Removed arbitrary/B2B fallback sender selection.
- Restricted the 360 mailbox selector and new rule/template metadata to the native IT mailbox.
- Changed 360 configuration checks to resolve its active native database credential/provider and require the configured bridge, with awaited settings/audit consumers.
- Added recipient-acceptance checks to direct 360 sends and both Email Command send paths. A missing or partial acknowledgement cannot produce `smtp_accepted`; command messages with unconfirmed receipts use `waiting_internal` / `delivery_unknown` and receive no automatic retry.
- Preserved the existing demo simulation guard. A simulated demo result is not evidence of inbox delivery.
- Restored the missing Email Command schema migration in the marketplace app and its operator navigation entry.
- Applied only `20261014030000_angelcare360_it_support_email_routing.sql` live: UPDATE 5 templates, UPDATE 2 rules, UPDATE 0 pending messages; committed and verified. The restored historical schema migration was not executed.

Live metadata backup: `C:\AngelCare\backups\email-routing\routing-2026-10-14T02-38-07-713Z.json`.

## Validation and release

| Check | Result |
| --- | --- |
| Auth composition / destinations / locales / error classification | 50/50 passed offline |
| Customer email rendering and contracts | 70/70 passed offline |
| Mailbox policy | 5/5 passed offline |
| Real Email Command send function with mocked dependencies | Four scenarios passed: IT routing, missing IT mailbox, demo guard, unconfirmed acceptance |
| Real 360 bridge functions with mocked dependencies | Four scenarios passed: native configuration/routing, inactive credential, unconfirmed acceptance, demo guard |
| Existing Email Command static suite | 184 checks passed after restoring its missing migration and navigation |
| Expanded Email Command TypeScript check | Passed with no errors |
| Whitespace check | Passed |
| Production image build / deployment | Not completed; release access blocked |

These suites overlap and are not independent delivery proofs.

The release is isolated at `/private/tmp/angelcare-email-release-20261014`, on branch `fix/marketplace-email-routing-20261014`, based on `58a9a9d9`. Its final commit is `2fe9076e32c59774599946d0ad1f11524532b95a`. Unrelated workspace edits were not included. Local commits contain the repair; no branch push, image publication or application deployment succeeded.

## Work required before a green verdict

1. Verify the two mailbox accounts with Menara and update their native Email OS credentials. Repeat incoming and SMTP authentication successfully.
2. Restore and verify SMTP reachability from the production Windows bridge. Current tests do not establish the provider/network root cause; configuration guesses are not repairs.
3. Restore release access, build the isolated commit through the existing Marketplace workflow, and deploy/verify the new application image.
4. Verify a persistent worker scheduler, then enable the installed Auth hook only after both native mailboxes can send. It changes delivery for the shared Auth instance and must preserve existing OPS flows.
5. Wire the missing customer lifecycle dispatcher to persisted, authorized events with recipient ownership, idempotence and recorded outcomes; verify intended 360 rules before activation.
6. Exercise controlled real confirmation, recovery, customer journey and 360 access flows. Observe correct From/Reply-To headers, provider acceptance, inbox receipt, usable links, resulting account transitions and incoming replies in Email OS.

The credential-update question remains pending. SMTP/provider credentials, new account confirmation, mailbox password resets, broad queue operations and unrelated infrastructure changes were not fabricated or performed.
