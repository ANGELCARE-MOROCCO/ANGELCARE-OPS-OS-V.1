export const roleMatrix = {
  CEO: ["view", "approve", "export", "assign", "block", "escalate"],
  HR_DIRECTOR: ["view", "create", "edit", "approve", "export", "block"],
  ACADEMY_MANAGER: ["view", "create", "edit", "approve", "export"],
  TRAINER: ["view", "edit"],
  OPS_MANAGER: ["view", "assign", "escalate", "export"],
  SUPERVISOR: ["view", "edit", "assign", "escalate"],
  FINANCE: ["view", "export"],
  COUNTRY_MANAGER: ["view", "approve", "export", "assign", "escalate"],
} as const;
export const modules = ["command", "talent", "recruitment", "academy", "readiness", "allocation", "performance", "incidents", "compliance", "reports"];
