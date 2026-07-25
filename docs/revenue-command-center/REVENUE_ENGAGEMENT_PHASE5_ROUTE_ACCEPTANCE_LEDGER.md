# Revenue Engagement Phase 5 — Route Acceptance Ledger

| Route | Experience contract | Primary corporate purpose | Dominant UX | Acceptance state |
|---|---|---|---|---|
| `/appointments` | `engagement-command` | Organization-wide engagement posture | Executive command cockpit | Implemented |
| `/appointments/dashboard` | `appointment-dashboard` | Daily movement, confirmation and preparation | Operational dashboard | Implemented |
| `/appointments/command` | `appointment-command` | Prioritized commercial intervention | Mission command | Implemented |
| `/appointments/control-tower` | `control-tower` | Confirmation and preparation risk | Risk control tower | Implemented |
| `/appointments/[id]` | `appointment-dossier` | Full appointment operational record | Enterprise dossier | Implemented |
| `/appointments/briefing/[id]` | `briefing-room` | Pre-meeting alignment and readiness | Briefing room | Implemented |
| `/appointments/calendar` | `calendar` | Weekly commercial cadence | Calendar command | Implemented |
| `/appointments/conversion` | `conversion` | Convert outcomes into progress and work | Conversion desk | Implemented |
| `/appointments/escalations` | `escalations` | Executive intervention | Escalation command | Implemented |
| `/appointments/executive` | `executive` | Direction-level meeting intelligence | Executive cockpit | Implemented |
| `/appointments/follow-up/[id]` | `follow-up` | Convert commitments into dated actions | Follow-up plan | Implemented |
| `/appointments/high-value` | `high-value` | Protect strategic meetings | High-value command | Implemented |
| `/appointments/live` | `live-command` | Ready and active meetings | Live command | Implemented |
| `/appointments/live/[id]` | `live-room` | Capture live commercial facts and commitments | Full meeting room | Implemented |
| `/appointments/schedule` | `schedule-studio` | Governed appointment composition | Scheduling studio | Implemented |
| `/appointments/new` | `new-appointment` | Create and prepare a commercial meeting | Creation studio | Implemented |
| `/appointments/no-shows` | `no-shows` | Classify and recover non-attendance | No-show center | Implemented |
| `/appointments/outcome/[id]` | `outcome-studio` | Record and propagate commercial result | Outcome studio | Implemented |
| `/appointments/performance` | `performance` | Team discipline and conversion quality | Performance cockpit | Implemented |
| `/appointments/queue` | `queue` | Search and control the entire portfolio | Enterprise registry | Implemented |
| `/appointments/recovery` | `recovery` | Reconnect and recover fragile meetings | Recovery command | Implemented |
| `/appointments/reschedules` | `reschedules` | Control new dates and reconfirmation | Rescheduling control | Implemented |
| `/appointments/risk` | `risk` | Prioritize fragile meeting signals | Risk workspace | Implemented |
| `/appointments/analytics` | `analytics` | Cadence and conversion analysis | Analytics cockpit | Implemented |

## Shared acceptance requirements

Every route:

- Retains the full-width Revenue Command shell
- Uses the uniform collapsible sidebar
- Preserves deep-link route parameters
- Uses a unique route contract
- Avoids the retired appointment mega-workspace
- Has loading, empty, error, and schema-readiness handling
- Uses French corporate language and `fr-FR` formatting
- Shows commercial values in `Dh`
- Uses controlled APIs rather than local simulated mutation
- Preserves TEXT prospect identity and UUID appointment identity
- Remains responsive and keyboard operable
