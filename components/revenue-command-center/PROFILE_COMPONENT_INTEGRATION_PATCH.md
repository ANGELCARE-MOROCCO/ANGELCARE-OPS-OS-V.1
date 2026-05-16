PROFILE COMPONENT INTEGRATION PATCH

Use this after injecting the action engine.

Import in ProspectFullProfileCommandCenter.tsx:

import {
  addPipelineHistory,
  addProspectComment,
  addProspectContact,
  addProspectDocument,
  completeProspectTask,
  createProspectTask,
  loadProspectControlData,
  scheduleProspectAppointment,
  subscribeProspectControls,
} from "@/lib/revenue-command-center/prospect-action-engine"

Wire these:
1. On profile mount: loadProspectControlData(prospect.id)
2. Subscribe: subscribeProspectControls(prospect.id, refreshControlData)
3. Create Task button: createProspectTask(...)
4. Checkbox complete: completeProspectTask(...)
5. Comment post: addProspectComment(...)
6. Appointment schedule: scheduleProspectAppointment(...)
7. Document add: addProspectDocument(...)
8. Contact add: addProspectContact(...)
9. Pipeline stage change: addPipelineHistory(prospect.id, oldStage, newStage)

Keep Email and WhatsApp CTA only:
- mailto:
- https://wa.me/
