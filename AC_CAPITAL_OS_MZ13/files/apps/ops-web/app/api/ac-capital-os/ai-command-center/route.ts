import { createWorkspaceRouteHandlers } from "../../../../lib/ac-capital-os/server/route-handlers";

export const dynamic = "force-dynamic";

export const { GET, POST } = createWorkspaceRouteHandlers("ai-command-center");
