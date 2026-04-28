import { NextResponse } from "next/server";

const rooms = [
  { id: "ops", name: "Ops Command", type: "OPS" },
  { id: "sales", name: "Revenue Floor", type: "DEPARTMENT" },
  { id: "missions", name: "Missions Live", type: "DEPARTMENT" },
  { id: "emergency", name: "Emergency Escalation", type: "EMERGENCY" },
];

export async function GET() {
  return NextResponse.json({ rooms });
}
