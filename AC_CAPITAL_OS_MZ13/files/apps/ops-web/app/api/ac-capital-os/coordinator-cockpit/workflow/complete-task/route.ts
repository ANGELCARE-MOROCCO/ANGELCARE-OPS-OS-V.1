import { completeCoordinatorTask } from "../../../../../lib/ac-capital-os/server/automation-gates";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return Response.json(await completeCoordinatorTask({
    taskId: typeof body.taskId === "string" ? body.taskId : undefined,
    completionNote: typeof body.completionNote === "string" ? body.completionNote : undefined,
  }));
}
