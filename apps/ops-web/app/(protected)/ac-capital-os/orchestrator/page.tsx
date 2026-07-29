import { OrchestratorPage } from "@/components/ac-capital-os/pages/orchestrator/OrchestratorPage";
import { getCapitalActorContext } from "@/lib/ac-capital-os/server/actor-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getCapitalActorContext();
  return <OrchestratorPage actor={actor} />;
}
