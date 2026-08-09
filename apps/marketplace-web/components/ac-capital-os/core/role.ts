import type { CapitalActor, CapitalRole } from "./types";

const founderRoles = new Set(["ceo", "owner", "super_admin", "root", "root_admin", "direction", "managing_director", "founder"]);
const adminRoles = new Set(["admin", "manager", "capital_strategy_admin", "capital_admin", "operations_manager"]);
const aiRoles = new Set(["ai_system_admin", "ai_admin"]);
const coordinatorRoles = new Set(["capital_coordinator", "coordinator", "agent", "backoffice"]);
const financeRoles = new Set(["finance", "finance_admin", "finance_reviewer", "admin_finance"]);
const dataRoomRoles = new Set(["data_room_owner", "document_controller"]);

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function mapCapitalRole(rawRole: string): CapitalRole {
  const role = normalize(rawRole);
  if (founderRoles.has(role)) return "Founder / Managing Director";
  if (adminRoles.has(role)) return "Capital Strategy Admin";
  if (aiRoles.has(role)) return "AI System Admin";
  if (coordinatorRoles.has(role)) return "Capital Coordinator";
  if (financeRoles.has(role)) return "Finance / Admin Reviewer";
  if (dataRoomRoles.has(role)) return "Data Room Owner";
  return "Read-only Viewer";
}

const writeRoles: CapitalRole[] = [
  "Founder / Managing Director",
  "Capital Strategy Admin",
  "AI System Admin",
  "Capital Coordinator",
  "Finance / Admin Reviewer",
  "Data Room Owner",
];

export function canWrite(actor: CapitalActor) {
  return writeRoles.includes(actor.role) || actor.permissions.includes("*") || actor.permissions.includes("ac_capital.write");
}

export function canApprove(actor: CapitalActor) {
  return actor.role === "Founder / Managing Director" || actor.permissions.includes("*") || actor.permissions.includes("ac_capital.approve");
}

export function canManageAi(actor: CapitalActor) {
  return ["Founder / Managing Director", "Capital Strategy Admin", "AI System Admin"].includes(actor.role) || actor.permissions.includes("ac_capital.ai.manage");
}

export function canManageDataRoom(actor: CapitalActor) {
  return ["Founder / Managing Director", "Capital Strategy Admin", "Data Room Owner", "Finance / Admin Reviewer"].includes(actor.role) || actor.permissions.includes("ac_capital.data_room.manage");
}
