import { notFound } from "next/navigation";
import { ImageryR3Fixture } from "./Fixture";

// This dynamic fixture is inaccessible on public production deployments unless
// the explicit CI-only environment flag is present at runtime.
export const dynamic = "force-dynamic";
export default function ImageryR3CandidateFixturePage() {
  if (process.env.ANGELCARE_IMAGERY_R3_TEST !== "1") notFound();
  return <ImageryR3Fixture />;
}
