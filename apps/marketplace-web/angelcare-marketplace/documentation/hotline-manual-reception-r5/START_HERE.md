# AngelCare Hotline · Manual Reception R5

This repair uses the existing Marketplace deployment and the existing Supabase SQL Editor. It does not require a worker, cron, another Coolify resource, new environment variables or a Windows gateway change.

## Apply in your existing SOP

1. Run `install.mjs` against `/Users/user/Desktop/angelcare-platform`. The installer preflights every change, retains unrelated edits, writes verified backups and prints the guarded source rollback command. It does not build, install dependencies or execute SQL.
2. Apply `database/01_APPLY_HOTLINE_MANUAL_RECEPTION_R5.sql` in the Marketplace SQL Editor. This is a NEW targeted migration for manual pickup, even if earlier Hotline SQLs passed. Then run `database/02_VERIFY_HOTLINE_MANUAL_RECEPTION_R5.sql`; its seven checks must be true. Source copies are installed under `apps/marketplace-web/supabase/migrations/20261015072357_hotline_manual_reception_r5.sql` and `apps/marketplace-web/scripts/hotline-manual-reception-r5/02_VERIFY.sql`.
3. Stage/commit/push through your usual release SOP. Build the exact source commit using **Build Marketplace GHCR One-Off**; deploy that immutable image into the **existing Marketplace resource** in Coolify. This package does not change release workflows or perform Git/deployment operations.
4. In Hotline, retain your published hours, routes and MP3 mappings. Ensure an enabled agent has the relevant language AND queue assigned. This repair does not grant extra languages, queues or staff permissions automatically.
5. Test one customer from another browser: local recorded menus → need and consent → hold/music → admin opens dossier → explicit pickup → microphone permission → two-way audio → hang up/callback. Check the customer and agent receive no audio/microphone connection before pickup. Live acceptance is required; it has not been performed on your deployment here.

## Exact flow

- The MP3 menus and choices run in the browser. Before hold there is no new reception case, LiveKit token, room connection or microphone request.
- Entering hold creates/reuses one native session and case. Published opening hours, maximum queue size, consent, rate limits and guest ownership still apply. Entry no longer requires a worker heartbeat, a ready agent, LiveKit availability or a microphone.
- Music is an ordinary HTML audio element using your published MP3 and existing gateway. It is not a live media stream. Browser autoplay restrictions may require the existing “Activer le son” control. No voice prompt is replayed while waiting.
- While a case is active, small authenticated session polls keep its status current. The admin workspace polls while it is open. There is no always-on IVR/call process. Idle visitors do not maintain a voice signal.
- The admin can open a waiting dossier without assignment or audio, provided their permissions, enabled agent profile, language and queue allow it. Supervisors retain existing visibility. Read access does not grant case editing or call interception.
- Prepared details include name, contact, need, reference, source page, language, queue, selected rhythm and the published IVR labels followed. Public agent identity remains **ANGELCARE HOTLINE**.
- “Décrocher et ouvrir l’audio” atomically reserves the caller for that agent. Only then can the two participants obtain microphone-only tokens and connect. The customer is counted as connected only after the existing server checks observe BOTH microphone publications.
- Manual pickup is deliberate availability: an enabled eligible agent may choose a caller even if their prior presence was away. No second voice call or active assigned text chat is silently displaced.
- If another agent wins the pickup race, the losing request cannot join the room. Retrying a successful pickup is idempotent. A call that cannot connect within 120 seconds returns to hold; its case remains available.
- Existing transfers, messages, callbacks, case qualification and closure remain available. The published maximum wait limit still applies. Closed hours offer the existing message/callback alternatives.

## Hold counter

Counter = actual elapsed time since reception, not a randomized duration or promise:

| Time | Colour |
|---|---|
| 0:00 to 4:59 | Green |
| 5:00 to 8:00 | Orange |
| Above 8:00 | Red |

It appears on reception cards and inside the pre-pickup drawer. Queue position, agent counts and estimates continue to use recorded reception data; this package does not introduce fabricated queue statistics. Estimates remain unavailable until sufficient completed-call evidence exists.

## Speech and low-data behaviour

The existing LiveKit client now uses mono capture, a 20 kbit/s audio codec target, DTX/silence suppression, RED/loss resilience, echo cancellation, noise suppression and gain control. No camera or video track is requested. Both browser clients use the same settings. Microphone tracks and media elements are released when the call ends or the component unmounts; a delayed connection cannot reopen capture after cancellation.

The codec target is not total network traffic: transport overhead and resilience add data. MP3 file size still affects its initial download. Use appropriately compressed MP3s in the existing vault; this patch does not re-encode or replace your uploaded files. Poor or absent network, blocked microphones, missing TURN/LiveKit connectivity and mobile OS background suspension cannot be guaranteed away. Existing reconnect and callback/message controls remain available.

## Runtime authority and preservation

The existing `ac_hotline_dispatch()` entry point becomes **lazy maintenance only**, with no automatic assignment. It performs bounded expiry/recovery work at most once every five seconds when active Marketplace requests call it. Its old heartbeat column is used only to throttle maintenance; it is not an admission requirement or an agent-availability signal.

No schedule, active published version, audio file, gateway setting, email configuration, customer identity, catalogue, pricing, payment or unrelated workspace is reset. Original SQL function definitions are backed up in a private, RLS-protected Hotline backup table before replacement. Ordinary client database roles cannot call pickup or presence RPCs directly.

## Recovery

The installer prints the source rollback command and preserves later overlapping edits. SQL rollback is separate: `database/03_ROLLBACK_HOTLINE_MANUAL_RECEPTION_R5.sql` restores the saved definitions, refuses unfamiliar later function edits, and refuses rollback while receptions are live. It does not delete customer cases, media or history. Coordinate source and SQL rollback before deploying an old image.

## Verification performed here

See `VERIFICATION.md`. Native R1/R3 and R5 were exercised in an isolated PostgreSQL-compatible test engine; actual route handlers and actual React components were tested with external boundaries mocked. No production SQL, live customer/agent audio call, Windows operation, dependency installation in your repository, full app build, commit, push or deployment was executed here.
