# CARELINK MOBILE RELIABILITY LOCKDOWN — R2 DEPLOY GATE

Status: deploy-gate enforcement phase.

## Purpose

R2 makes the mobile reliability audit mandatory before any CareLink deployment.

`npm run carelink:deploy-gate` must now execute:

1. `npm run carelink:mobile-reliability`
2. `npm run carelink:verify`
3. `npm run carelink:production-smoke`

## Field-Agent Production QA Checklist

Before a real market deployment, test with one real caregiver account.

### A. Provisioning

- Create caregiver from CARELINK-OPS / Agents.
- Save full name, phone, email, city, zone, skills, mission types, languages.
- Save mobile access email/password.
- Confirm profile persists after reopening the modal.

### B. Login

- Open `/carelink/login`.
- Login with caregiver mobile credentials.
- Confirm synced full name appears on the mobile greeting.
- Confirm assigned missions only appear for this caregiver.

### C. Mission Execution

- Open assigned mission.
- Confirm mission brief appears.
- Acknowledge mission brief.
- Confirm route/transport execution actions are available.
- Confirm dynamic service checklist appears.
- Submit report.
- Confirm report correction loop works if OPS requests correction.
- Confirm presence proof check-in/check-out gates completion.

### D. Communication

- Open `/carelink/messages`.
- Send a message.
- Confirm the message appears immediately in the local/synced feed.
- Open `/carelink/notifications`.
- Acknowledge a notification.
- Confirm unread state changes.

### E. Readiness / Profile

- Open `/carelink/profile`.
- Submit profile correction request.
- Submit profile document record.
- Open `/carelink/readiness`.
- Request readiness review.
- Confirm OPS-visible notification is created.

### F. Finance / Safety

- Open `/carelink/payments`.
- Submit honoraires/payment dispute.
- Confirm dispute remains visible.
- Open `/carelink/safety`.
- Submit SOS/incident escalation.
- Confirm escalation is created and visible.

### G. Offline

- Open `/carelink/offline`.
- Confirm queue status is readable.
- Test one action with unstable network if possible.
- Confirm queued action syncs after reconnect.

## Hard Rule

No CareLink deploy is considered production-ready if:

- `npm run carelink:mobile-reliability` fails.
- `npm run carelink:deploy-gate` fails.
- caregiver profile save does not persist all fields.
- mobile login cannot load the caregiver workspace.
- mission actions do not return to synced visible state.

## R2 Scope

No UI redesign.
No OPS redesign.
No SQL.
No new workflow.
Only deploy-gate enforcement and field-agent QA documentation.
