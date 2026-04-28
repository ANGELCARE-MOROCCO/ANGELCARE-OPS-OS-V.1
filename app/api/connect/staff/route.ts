import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    staff: [
      { id: "1", name: "CEO Command", role: "CEO", department: "Direction", status: "online" },
      { id: "2", name: "Ops Manager", role: "Manager", department: "Operations", status: "busy" },
      { id: "3", name: "SDR Desk 1", role: "Sales", department: "Revenue", status: "online" },
    ],
  });
}
