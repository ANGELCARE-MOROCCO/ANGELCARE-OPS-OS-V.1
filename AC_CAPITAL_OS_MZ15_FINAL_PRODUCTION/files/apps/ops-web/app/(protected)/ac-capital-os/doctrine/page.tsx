import { DoctrinePage } from "@/components/ac-capital-os/pages/doctrine/DoctrinePage";
import { getCapitalActorContext } from "@/lib/ac-capital-os/server/actor-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getCapitalActorContext();
  return <DoctrinePage actor={actor} />;
}
