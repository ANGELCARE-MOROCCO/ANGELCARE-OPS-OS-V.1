import { notFound } from "next/navigation";
import { MediaVaultCIFixture } from "./Fixture";
export const dynamic = "force-dynamic";
export default function MediaVaultCIPage() {
  if (process.env.ANGELCARE_IMAGERY_R3_TEST !== "1") notFound();
  return <MediaVaultCIFixture />;
}
