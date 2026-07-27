import { loadWorkspaceData } from "../../../../../lib/ac-capital-os/server/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await loadWorkspaceData("data-room"));
}
