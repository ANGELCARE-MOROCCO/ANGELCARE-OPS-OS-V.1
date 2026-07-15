"use client"

import { TaskDetailWorkspace } from "@/components/market-os/content-command/tasks/TaskDetailWorkspace"

export default function Page({ params }: { params: { taskId: string } }) {
  return <TaskDetailWorkspace taskId={params.taskId} />
}