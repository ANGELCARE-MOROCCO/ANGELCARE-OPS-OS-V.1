import OnboardingCommandCenter, {
  type OnboardingSeedData,
} from "../_components/OnboardingCommandCenter";
import { getOnboardingWorkspace } from "@/lib/hr-onboarding/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const phaseLabels: Record<string, string> = {
  offer_accepted: "Offer & Acceptance",
  preboarding: "Pre-Boarding",
  documents: "Document Collection",
  orientation: "Orientation",
  training_setup: "Training & Setup",
  integration: "Integration",
  probation: "Probation & Review",
  completed: "Completed",
};

const taskLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
  waived: "Completed",
  archived: "Archived",
};

export default async function OnboardingDetailPage({
  params,
}: Props) {
  const { id } = await params;
  const workspace = await getOnboardingWorkspace(id);

  const seed: OnboardingSeedData = {
    journeys: workspace.journeys.map((journey) => ({
      id: journey.journeyKey,
      title: journey.title,
      position: journey.position ?? "",
      status:
        journey.status === "completed"
          ? "Completed"
          : phaseLabels[journey.phase] ?? journey.phase,
      startDate: journey.startDate ?? journey.createdAt,
      department: journey.department ?? "",
      manager: journey.manager ?? "",
      location: journey.location ?? "",
      employmentType: journey.employmentType ?? "",
      email: journey.email ?? "",
      phone: journey.phone ?? "",
      progress: journey.progress,
      owner: journey.owner ?? "",
      version: journey.version,
    })),

    tasks: workspace.tasks.map((task) => ({
      id: task.taskKey,
      journey_id: task.journeyKey,
      group: task.groupName,
      title: task.title,
      due_at: task.dueAt,
      owner: task.owner,
      status: taskLabels[task.status] ?? task.status,
      priority: task.priority,
      version: task.version,
      required: task.required,
      blocker_reason: task.blockerReason,
      notes: task.notes,
    })),

    documents: workspace.documents.map((document) => ({
      id: document.documentKey,
      journey_id: document.journeyKey,
      title: document.title,
      owner: document.owner,
      status: document.status,
      category: document.category,
      due_at: document.dueDate,
      expiry_date: document.expiresAt,
      file_url: document.fileUrl,
      version: document.version,
      required: document.required,
      notes: document.notes,
    })),

    activity: workspace.activity.map((activity) => ({
      id: activity.activityKey,
      journey_id: activity.journeyKey,
      title: activity.title,
      body: activity.body,
      type: activity.type,
      status: activity.status,
      actor_name: activity.actorName,
      created_at: activity.createdAt,
    })),
  };

  return <OnboardingCommandCenter initialData={seed} />;
}
