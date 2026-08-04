import InterviewOperationsCommandClient from "./InterviewOperationsCommandClient";
import { getInterviewCommandSnapshot } from "@/lib/hr-recruitment/interviews/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RecruitmentInterviewsPage() {
  const snapshot = await getInterviewCommandSnapshot();
  return <InterviewOperationsCommandClient initialSnapshot={snapshot} />;
}
