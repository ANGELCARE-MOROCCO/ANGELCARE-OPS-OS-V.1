"use client"

import { useState } from "react"
import { Button, Icons, MetricCard, Panel, PanelHeader, RunAction, StatusPill } from "./SubmoduleKit"

const initialTemplates = [
  { id: "tpl-care", name: "Family Care Response", subject: "Care schedule confirmation", category: "Operations" },
  { id: "tpl-billing", name: "Billing Correction", subject: "Updated invoice statement", category: "Finance" },
  { id: "tpl-hr", name: "HR Onboarding Reminder", subject: "Missing onboarding documents", category: "HR" }
]

export default function TemplatesExecutionWorkspace({ run }: { run: RunAction }) {
  const [templates, setTemplates] = useState(initialTemplates)

  async function createTemplate() {
    const template = {
      id: `tpl-${Date.now()}`,
      name: "New Corporate Template",
      subject: "New subject",
      category: "General"
    }
    setTemplates([template, ...templates])
    await run("template.create", {
      templateId: template.id,
      subject: template.subject,
      text: "New corporate template body",
      data: { name: template.name, category: template.category }
    })
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Templates" value={String(templates.length)} icon={<Icons.FileText className="h-4 w-4" />} />
          <MetricCard label="Categories" value="4" />
          <MetricCard label="Approval Ready" value="92%" />
          <MetricCard label="Usage" value="Active" />
        </div>

        <Panel>
          <PanelHeader
            icon={<Icons.FileText className="h-5 w-5" />}
            title="Template Library"
            subtitle="Create, edit, delete and operationalize response templates."
            action={<Button variant="primary" onClick={createTemplate}><Icons.Plus className="h-4 w-4" /> New template</Button>}
          />

          <div className="divide-y divide-slate-100">
            {templates.map((template) => (
              <div key={template.id} className="grid grid-cols-[minmax(0,1fr)_160px_260px] items-center gap-4 p-5">
                <div>
                  <div className="font-bold text-slate-950">{template.name}</div>
                  <div className="text-sm text-slate-500">{template.subject}</div>
                </div>
                <StatusPill label={template.category} tone="blue" />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => run("template.update", { templateId: template.id, data: { name: template.name + " Updated" } })}><Icons.Edit3 className="h-4 w-4" /> Edit</Button>
                  <Button variant="secondary" onClick={() => run("compose.saveDraft", { subject: template.subject, text: "Draft created from template" })}>Use</Button>
                  <Button variant="danger" onClick={() => {
                    setTemplates(templates.filter((item) => item.id !== template.id))
                    run("template.delete", { templateId: template.id })
                  }}><Icons.Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
