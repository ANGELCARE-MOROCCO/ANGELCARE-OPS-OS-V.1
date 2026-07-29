import { CommandFloorPage } from "@/components/ac-capital-os/pages/command-floor/CommandFloorPage";
import { getCapitalActorContext } from "@/lib/ac-capital-os/server/actor-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getCapitalActorContext();
  return <CommandFloorPage actor={actor} />;
}
