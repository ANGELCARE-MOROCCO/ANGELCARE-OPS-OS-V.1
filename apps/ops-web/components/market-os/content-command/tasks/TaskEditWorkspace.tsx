"use client"

import * as React from "react"
import {
  Button,
  Field,
  Input,
  Panel,
  Select,
  Shell,
  Textarea,
  loadStore,
  priorities,
  statusLabel,
  type ContentTask,
  type Priority,
} from "@/components/market-os/content-command/content-command-system"
import { updateContentCommandTask, deleteContentCommandTask } from "@/lib/content-command/tasks/task-activity"

export function TaskEditWorkspace({ taskId }: { taskId: string }) {
  const [task, setTask] = React.useState<ContentTask | null>(null)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    const found = loadStore().tasks.find((candidate) => candidate.id === taskId) ?? null
    setTask(found)
  }, [taskId])

  if (!task) {
    return (
      <Shell>
        <main data-market-os-root className="mx-auto max-w-5xl p-6">
          <Panel className="p-8">
            <h1 className="text-3xl font-black">Task not found</h1>
            <div className="mt-5">
              <Button href="/market-os/content-command-center/tasks/execution" kind="primary">Back</Button>
            </div>
          </Panel>
        </main>
      </Shell>
    )
  }

  function set<K extends keyof ContentTask>(key: K, value: ContentTask[K]) {
    setTask((current) => current ? { ...current, [key]: value } : current)
    setSaved(false)
  }

  function save() {
    if (!task) return
    updateContentCommandTask(task.id, () => task)
    setSaved(true)
  }

  function remove() {
    if (!task) return
    deleteContentCommandTask(task.id)
    window.location.href = "/market-os/content-command-center/tasks/execution"
  }

  return (
    <Shell>
      <main className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-900 bg-[linear-gradient(135deg,#020617,#111827_55%,#7f1d1d)] p-8 text-slate-950 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
            Task Edit Workspace
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">{task.title}</h1>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Edit operational task details and persist changes into the real Content Command task store.
          </p>
        </section>

        <Panel className="p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Task title">
              <Input value={task.title} onChange={(event) => set("title", event.target.value)} />
            </Field>

            <Field label="Owner">
              <Input value={task.owner} onChange={(event) => set("owner", event.target.value)} />
            </Field>

            <Field label="Status">
              <Select value={task.status} onChange={(event) => set("status", event.target.value as ContentTask["status"])}>
                {(["todo", "doing", "blocked", "done"] as const).map((status) => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </Select>
            </Field>

            <Field label="Priority">
              <Select value={task.priority} onChange={(event) => set("priority", event.target.value as Priority)}>
                {priorities.map((priority) => <option key={priority}>{priority}</option>)}
              </Select>
            </Field>

            <Field label="Due date">
              <Input type="date" value={task.dueDate} onChange={(event) => set("dueDate", event.target.value)} />
            </Field>

            <Field label="Linked content ID">
              <Input value={task.contentId} onChange={(event) => set("contentId", event.target.value)} />
            </Field>

            <div className="lg:col-span-2">
              <Field label="Notes">
                <Textarea value={task.notes} onChange={(event) => set("notes", event.target.value)} rows={8} />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={save} kind="primary">Save Task</Button>
            <Button href={`/market-os/content-command-center/tasks/${task.id}`} kind="dark">Back to Detail</Button>
            <Button href="/market-os/content-command-center/tasks/execution">All Tasks</Button>
            <Button onClick={remove} kind="danger">Delete Task</Button>
          </div>

          {saved ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
              Task saved successfully.
            </p>
          ) : null}
        </Panel>
      </main>
    </Shell>
  )
}

export default TaskEditWorkspace