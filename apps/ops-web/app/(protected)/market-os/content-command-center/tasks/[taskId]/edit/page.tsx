"use client"

import { TaskEditWorkspace } from "@/components/market-os/content-command/tasks/TaskEditWorkspace"

export default function Page({ params }: { params: { taskId: string } }) {
  return <TaskEditWorkspace taskId={params.taskId} />
}