# AngelCare Social Command · MZ3 Production Hardening Core 1.0.0

## Mission

MZ3 converts the current manual Meta/Windows operating chain into a more observable, self-diagnosing and safer production control plane while preserving MZ1 creative/publishing behavior and MZ2 engagement/automation/intelligence.

## Implemented

### Meta webhook trust
- Strict HMAC-SHA256 verification remains mandatory.
- Multiple signing-secret candidates are supported without exposing values.
- Dedicated webhook signing secret takes precedence over existing Meta/Facebook app secret fallbacks.
- Rejection telemetry records reason, safe source labels, signature fingerprint and body SHA-256 only.
- Control includes signature self-test.
- Invalid JSON remains rejected after signature acceptance.

### Webhook operations
- Desired Meta subscriptions are explicit and inspectable.
- `subscribed_apps` inspect/reconcile operations are built in.
- Subscription snapshot is persisted into the active connection metadata.
- Failed signature-verified events can be replayed.
- Duplicate webhook replays no longer increment conversation unread counts.
- `messaging_seen` supports direct message IDs and watermark-style read events.

### Credential lifecycle
- Superseded Meta connections have encrypted user/page tokens erased.
- Expired OAuth sessions are cleaned and their encrypted tokens erased.
- Credential-health automation detects expiry horizon and can optionally reconcile webhook subscriptions.
- Token encryption gains a versioned AES-256-GCM keyring with previous-key support and explicit rotation.

### Execution hardening
- Publishing jobs are claimed with a conditional state transition before provider execution.
- Stale `preparing/publishing` locks are recovered into retry state.

### Access control
- Social Command route permissions are implemented for view/operate/publish/engage/automate/control/meta-admin/destructive operations.
- Enforcement is rollout-safe and OFF by default until production roles are verified.

### Windows media / scheduler
- Uploads honor a configurable free-space reserve.
- Stale partial uploads are automatically cleaned.
- Health reports capacity and temporary-file warnings.
- Admin maintenance endpoint can trigger cleanup.
- Scheduled publisher secret is no longer written into `tick.ps1`.

### Control UI
- Signature health and last rejection reason.
- Desired/actual subscription state.
- Self-test, inspect, reconcile and replay commands.

## Deliberate non-changes
- No database migration is required by MZ3 Core.
- No full Next.js production build is invoked by the installer.
- No SQL is executed automatically.
- No Meta permission or OAuth scope is silently changed.
- `pages_manage_engagement` is not introduced.
- Facebook Page Story publishing remains truthfully unsupported.
- Existing Windows media/Supabase storage boundary remains unchanged.
