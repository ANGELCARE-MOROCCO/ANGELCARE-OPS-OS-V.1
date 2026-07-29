import { AiOperationsPage } from "@/components/ac-capital-os/pages/ai-control/AiOperationsPage";
import { getCapitalActorContext } from "@/lib/ac-capital-os/server/actor-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getCapitalActorContext();
  return <AiOperationsPage actor={actor} />;
}
