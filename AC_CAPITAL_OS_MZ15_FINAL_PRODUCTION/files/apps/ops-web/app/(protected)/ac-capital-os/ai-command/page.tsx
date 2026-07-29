import { AiCommandPage } from "@/components/ac-capital-os/pages/ai-command/AiCommandPage";
import { getCapitalActorContext } from "@/lib/ac-capital-os/server/actor-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getCapitalActorContext();
  return <AiCommandPage actor={actor} />;
}
