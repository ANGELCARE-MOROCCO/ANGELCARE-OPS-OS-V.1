"use client"

import * as React from "react"
import { Badge, Button, PageHeader, Panel, Shell, TaskForm, statusLabel, useContentStore, type ContentTask } from "./content-command-system"

const taskStatuses: ContentTask["status"][] = ["todo", "doing", "blocked", "done"]

export default function ContentTasksPage() {
  const { store, commit } = useContentStore()
  const [status, setStatus] = React.useState<ContentTask["status"] | "all">("all")
  const tasks = store.tasks.filter((task) => status === "all" || task.status === status)

  const updateTask = (task: ContentTask, nextStatus: ContentTask["status"]) => commit((draft) => { draft.tasks = draft.tasks.map((candidate) => candidate.id === task.id ? { ...candidate, status: nextStatus } : candidate) }, "task status", `${task.title} moved to ${nextStatus}`)

  return <Shell>
    <main data-market-os-root className="mx-auto max-w-[1500px] space-y-6 p-4 lg:p-8">
      <PageHeader eyebrow="Content Command / Tasks" title="Production tasks and blockers" description="Assign the real execution work behind every content item, move tasks through status, and expose blocked production immediately." actions={<Button href="/market-os/content-command-center">Back</Button>} />
      <Panel className="p-6"><h2 className="text-2xl font-black">Create task</h2><div className="mt-5"><TaskForm items={store.items} onSave={(task) => commit((draft) => { draft.tasks = [task, ...draft.tasks] }, "task create", `Created task ${task.title}`)} /></div></Panel>
      <div className="flex flex-wrap gap-2"><Button onClick={() => setStatus("all")} kind={status === "all" ? "dark" : "soft"}>All</Button>{taskStatuses.map((taskStatus) => <Button key={taskStatus} onClick={() => setStatus(taskStatus)} kind={status === taskStatus ? "dark" : "soft"}>{statusLabel(taskStatus)}</Button>)}</div>
      <div className="grid gap-4 lg:grid-cols-2">{tasks.map((task) => { const item = store.items.find((candidate) => candidate.id === task.contentId); return <Panel key={task.id} className="p-5"><div className="flex flex-wrap gap-2"><Badge>{statusLabel(task.status)}</Badge><Badge kind="priority">{task.priority}</Badge></div><h3 className="mt-3 text-xl font-black">{task.title}</h3><p className="mt-1 text-sm font-bold text-slate-500">Linked: {item?.title ?? "No content"}</p><p className="mt-1 text-sm font-bold text-slate-500">Owner: {task.owner} • Due {task.dueDate}</p><p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{task.notes || "No notes."}</p><div className="mt-4 flex flex-wrap gap-2">{taskStatuses.map((taskStatus) => <Button key={taskStatus} onClick={() => updateTask(task, taskStatus)} kind={task.status === taskStatus ? "dark" : "soft"}>{statusLabel(taskStatus)}</Button>)}<Button onClick={() => commit((draft) => { draft.tasks = draft.tasks.filter((candidate) => candidate.id !== task.id) }, "task delete", `Deleted ${task.title}`)} kind="danger">Delete</Button></div></Panel> })}</div>
      {!tasks.length ? <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">No tasks found.</p> : null}
    </main>
  </Shell>
}
