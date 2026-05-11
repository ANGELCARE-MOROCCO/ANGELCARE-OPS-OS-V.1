"use client"

import * as React from "react"
import Link from "next/link"
import {
  Badge,
  Button,
  Panel,
  Shell,
  statusLabel,
  loadStore,
  type ContentItem,
  type ContentTask,
} from "@/components/market-os/content-command/content-command-system"
import {
  addTaskActivity,
  addTaskChecklistItem,
  deleteTaskChecklistItem,
  readTaskActivity,
  readTaskChecklists,
  toggleTaskChecklistItem,
  updateContentCommandTask,
  type TaskActivityEvent,
  type TaskChecklistItem,
} from "@/lib/content-command/tasks/task-activity"

export function TaskDetailWorkspace({ taskId }: { taskId: string }) {
  const [task, setTask] = React.useState<ContentTask | null>(null)
  const [linkedContent, setLinkedContent] = React.useState<ContentItem | null>(null)
  const [activity, setActivity] = React.useState<TaskActivityEvent[]>([])
  const [checklist, setChecklist] = React.useState<TaskChecklistItem[]>([])
  const [newCheck, setNewCheck] = React.useState("")
  const [note, setNote] = React.useState("")

  function reload() {
    const store = loadStore()
    const found = store.tasks.find((candidate) => candidate.id === taskId) ?? null
    setTask(found)
    setLinkedContent(found ? store.items.find((item) => item.id === found.contentId) ?? null : null)
    setActivity(readTaskActivity().filter((event) => event.taskId === taskId))
    setChecklist(readTaskChecklists().filter((item) => item.taskId === taskId))
  }

  React.useEffect(() => {
    reload()
  }, [taskId])

  function changeStatus(status: ContentTask["status"]) {
    const updated = updateContentCommandTask(taskId, (current) => ({ ...current, status }))
    if (updated) {
      addTaskActivity(taskId, "status changed", `Status changed to ${statusLabel(status)}`)
      reload()
    }
  }

  function addNote() {
    if (!note.trim()) return
    updateContentCommandTask(taskId, (current) => ({
      ...current,
      notes: `${current.notes ? current.notes + "\n\n" : ""}${new Date().toISOString()} — ${note.trim()}`,
    }))
    addTaskActivity(taskId, "note added", note.trim())
    setNote("")
    reload()
  }

  function addChecklist() {
    if (!newCheck.trim()) return
    addTaskChecklistItem(taskId, newCheck.trim())
    setNewCheck("")
    reload()
  }

  if (!task) {
    return (
      <Shell>
        <main className="mx-auto max-w-5xl p-6">
          <Panel className="p-8">
            <h1 className="text-3xl font-black">Task not found</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">No task exists with ID {taskId}.</p>
            <div className="mt-5">
              <Button href="/market-os/content-command-center/tasks/execution" kind="primary">Back to Execution Center</Button>
            </div>
          </Panel>
        </main>
      </Shell>
    )
  }

  const completedChecks = checklist.filter((item) => item.done).length

  return (
    <Shell>
      <main className="mx-auto max-w-[1500px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-900 bg-[linear-gradient(135deg,#020617,#111827_55%,#7f1d1d)] p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
                Task Detail Workspace
              </p>
              <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight">{task.title}</h1>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge kind="dark">{task.id}</Badge>
                <Badge kind="dark">{statusLabel(task.status)}</Badge>
                <Badge kind="dark">{task.priority}</Badge>
                <Badge kind="dark">{task.owner}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button href={`/market-os/content-command-center/tasks/${task.id}/edit`} kind="primary">Edit Task</Button>
              <Button href="/market-os/content-command-center/tasks/execution" kind="dark">All Tasks</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <Panel className="p-6">
            <h2 className="text-2xl font-black">Execution controls</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Change status and add operational notes directly from this task workspace.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {(["todo", "doing", "blocked", "done"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => changeStatus(status)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black ${
                    task.status === status ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {statusLabel(status)}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Info label="Owner" value={task.owner} />
              <Info label="Priority" value={task.priority} />
              <Info label="Due Date" value={task.dueDate || "--"} />
              <Info label="Linked Content" value={linkedContent?.title ?? task.contentId} />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-black">Notes</h3>
              <pre className="mt-3 whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold leading-6 text-slate-700">
                {task.notes || "No notes yet."}
              </pre>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add operational note..."
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                rows={4}
              />
              <button onClick={addNote} className="mt-3 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white">
                Add Note
              </button>
            </div>
          </Panel>

          <Panel className="p-6">
            <h2 className="text-2xl font-black">Checklist</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Completion: {completedChecks}/{checklist.length}
            </p>

            <div className="mt-5 flex gap-2">
              <input
                value={newCheck}
                onChange={(event) => setNewCheck(event.target.value)}
                placeholder="Add checklist item..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
              />
              <button onClick={addChecklist} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                Add
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <button onClick={() => { toggleTaskChecklistItem(item.id); reload() }} className={`text-left text-sm font-bold ${item.done ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {item.done ? "✅ " : "⬜ "} {item.label}
                  </button>
                  <button onClick={() => { deleteTaskChecklistItem(item.id); reload() }} className="text-xs font-black text-red-600">
                    Delete
                  </button>
                </div>
              ))}
              {!checklist.length ? (
                <p className="rounded-3xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">
                  No checklist items yet.
                </p>
              ) : null}
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <Panel className="p-6">
            <h2 className="text-2xl font-black">Linked content</h2>
            {linkedContent ? (
              <Link href={`/market-os/content-command-center/${linkedContent.id}`} className="mt-4 block rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:bg-white">
                <h3 className="text-lg font-black text-slate-950">{linkedContent.title}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">{linkedContent.channel} · {linkedContent.campaign}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">{linkedContent.status} · {linkedContent.owner}</p>
              </Link>
            ) : (
              <p className="mt-4 rounded-3xl border border-dashed border-slate-300 p-6 text-sm font-bold text-slate-500">
                No linked content found. CSV imported tasks are attached to the fallback content item until assigned.
              </p>
            )}
          </Panel>

          <Panel className="p-6">
            <h2 className="text-2xl font-black">Activity timeline</h2>
            <div className="mt-5 space-y-3">
              {activity.map((event) => (
                <article key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">{statusLabel(event.action)}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{event.timestamp}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{event.detail}</p>
                </article>
              ))}
              {!activity.length ? (
                <p className="rounded-3xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">
                  No activity yet.
                </p>
              ) : null}
            </div>
          </Panel>
        </section>
      </main>
    </Shell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
    </div>
  )
}

export default TaskDetailWorkspace