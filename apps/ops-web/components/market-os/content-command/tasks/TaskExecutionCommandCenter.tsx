"use client"

import * as React from "react"
import Link from "next/link"
import {
  Badge,
  Button,
  Metric,
  Panel,
  Shell,
  statusLabel,
  loadStore,
  type ContentTask,
} from "@/components/market-os/content-command/content-command-system"
import { readTaskActivity, readTaskChecklists } from "@/lib/content-command/tasks/task-activity"

type FilterMode = "all" | "todo" | "doing" | "blocked" | "done"

export function TaskExecutionCommandCenter() {
  const [tasks, setTasks] = React.useState<ContentTask[]>([])
  const [filter, setFilter] = React.useState<FilterMode>("all")
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    setTasks(loadStore().tasks)
  }, [])

  const activity = readTaskActivity()
  const checklists = readTaskChecklists()

  const filtered = tasks.filter((task) => {
    const matchesFilter = filter === "all" || task.status === filter
    const haystack = `${task.title} ${task.owner} ${task.priority} ${task.status}`.toLowerCase()
    return matchesFilter && haystack.includes(query.toLowerCase())
  })

  const todo = tasks.filter((task) => task.status === "todo").length
  const doing = tasks.filter((task) => task.status === "doing").length
  const blocked = tasks.filter((task) => task.status === "blocked").length
  const done = tasks.filter((task) => task.status === "done").length

  return (
    <Shell>
      <main data-market-os-root className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.25),transparent_30%),linear-gradient(135deg,#020617,#0f172a_55%,#7f1d1d)] p-8 text-slate-950 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
            Content Command / Task Execution
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">
            Task Execution Command Center
          </h1>
          <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
            Open, inspect, edit and control operational tasks. This page turns imported CSV tasks
            into clickable execution objects with detail pages, edit controls, activity history and checklist readiness.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/market-os/content-command-center" kind="primary">Back to Dashboard</Button>
            <Button href="/market-os/imports/task-injection" kind="dark">CSV Task Injection</Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Total tasks" value={String(tasks.length)} sub="Live task store" />
          <Metric label="Todo" value={String(todo)} sub="Waiting execution" />
          <Metric label="Doing" value={String(doing)} sub="In progress" />
          <Metric label="Blocked" value={String(blocked)} sub="Needs action" />
          <Metric label="Done" value={String(done)} sub="Completed" />
        </section>

        <Panel className="p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">
                Execution control
              </p>
              <h2 className="mt-2 text-2xl font-black">Task board</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Search and open task details. Every card links to a complete task execution workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "todo", "doing", "blocked", "done"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black ${
                    filter === mode ? "bg-white text-slate-950" : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {statusLabel(mode)}
                </button>
              ))}
            </div>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, owner, status or priority..."
            className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((task) => {
              const checklistCount = checklists.filter((item) => item.taskId === task.id).length
              const activityCount = activity.filter((item) => item.taskId === task.id).length

              return (
                <Link
                  key={task.id}
                  href={`/market-os/content-command-center/tasks/${task.id}`}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge>{statusLabel(task.status)}</Badge>
                    <Badge kind="priority">{task.priority}</Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-slate-950">{task.title}</h3>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {task.id} · {task.owner} · Due: {task.dueDate || "--"}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-white p-3 text-xs font-black text-slate-600">
                      Checklist: {checklistCount}
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-xs font-black text-slate-600">
                      Activity: {activityCount}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Panel>
      </main>
    </Shell>
  )
}

export default TaskExecutionCommandCenter