'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  GitBranch,
  Minus,
  Network,
  Plus,
  Printer,
  Save,
  Sparkles,
  Users,
  Workflow,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

type DepartmentNode = {
  id: string
  name: string
  count: number
  teams: number
  manager?: string
  status?: string
  children?: DepartmentNode[]
  teamNodes?: { id: string; name: string; parent: string; count: number }[]
}

type ServerAction = (formData: FormData) => void | Promise<void>

type MindMapNode = {
  id: string
  name: string
  type: 'company' | 'department' | 'sub_department' | 'team'
  x: number
  y: number
  count: number
  teams: number
  parentId?: string
  manager?: string
  status?: string
}

function cleanId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `node-${Date.now()}`
}

function Pill({ children, tone = 'violet' }: { children: React.ReactNode; tone?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'slate' | 'rose' }) {
  const tones = {
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    cyan: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
  }

  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>
}

function buildMindMap(nodes: DepartmentNode[]) {
  const result: MindMapNode[] = []
  const links: { from: string; to: string }[] = []

  const centerX = 1200
  const centerY = 620
  const deptRadiusX = 620
  const deptRadiusY = 330

  result.push({
    id: 'angelcare-root',
    name: 'AngelCare HR Organization',
    type: 'company',
    x: centerX,
    y: centerY,
    count: nodes.reduce((sum, node) => sum + node.count, 0),
    teams: nodes.reduce((sum, node) => sum + node.teams, 0),
  })

  nodes.forEach((dept, index) => {
    const angle = nodes.length <= 1 ? -Math.PI / 2 : (index / nodes.length) * Math.PI * 2 - Math.PI / 2
    const deptX = centerX + Math.cos(angle) * deptRadiusX
    const deptY = centerY + Math.sin(angle) * deptRadiusY
    const deptId = `dept-${cleanId(dept.name)}-${index}`

    result.push({
      id: deptId,
      name: dept.name,
      type: 'department',
      x: deptX,
      y: deptY,
      count: dept.count,
      teams: dept.teams,
      manager: dept.manager,
      status: dept.status,
      parentId: 'angelcare-root',
    })
    links.push({ from: 'angelcare-root', to: deptId })

    const children = dept.children || []
    children.forEach((child, childIndex) => {
      const spread = children.length > 1 ? (childIndex - (children.length - 1) / 2) * 0.42 : 0
      const childAngle = angle + spread
      const childX = deptX + Math.cos(childAngle) * 280
      const childY = deptY + Math.sin(childAngle) * 180
      const childId = `sub-${cleanId(dept.name)}-${cleanId(child.name)}-${childIndex}`

      result.push({
        id: childId,
        name: child.name,
        type: 'sub_department',
        x: childX,
        y: childY,
        count: child.count,
        teams: child.teams,
        manager: child.manager,
        status: child.status,
        parentId: deptId,
      })
      links.push({ from: deptId, to: childId })

      ;(child.teamNodes || []).forEach((team, teamIndex) => {
        const teamSpread = (teamIndex - ((child.teamNodes || []).length - 1) / 2) * 0.34
        const teamAngle = childAngle + teamSpread
        const teamX = childX + Math.cos(teamAngle) * 220
        const teamY = childY + Math.sin(teamAngle) * 130
        const teamId = `team-${childId}-${cleanId(team.name)}-${teamIndex}`

        result.push({
          id: teamId,
          name: team.name,
          type: 'team',
          x: teamX,
          y: teamY,
          count: team.count,
          teams: 0,
          parentId: childId,
        })
        links.push({ from: childId, to: teamId })
      })
    })

    ;(dept.teamNodes || []).forEach((team, teamIndex) => {
      const spread = (teamIndex - ((dept.teamNodes || []).length - 1) / 2) * 0.34
      const teamAngle = angle + spread
      const teamX = deptX + Math.cos(teamAngle) * 260
      const teamY = deptY + Math.sin(teamAngle) * 150
      const teamId = `team-${deptId}-${cleanId(team.name)}-${teamIndex}`

      result.push({
        id: teamId,
        name: team.name,
        type: 'team',
        x: teamX,
        y: teamY,
        count: team.count,
        teams: 0,
        parentId: deptId,
      })
      links.push({ from: deptId, to: teamId })
    })
  })

  return { result, links }
}

function nodeStyle(type: MindMapNode['type'], selected: boolean) {
  if (type === 'company') {
    return selected
      ? 'w-[300px] border-slate-950 bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.32)]'
      : 'w-[300px] border-slate-950 bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]'
  }

  if (type === 'department') {
    return selected
      ? 'w-[250px] border-violet-300 bg-violet-50 text-violet-950 shadow-[0_24px_70px_rgba(124,58,237,0.22)] ring-4 ring-violet-100'
      : 'w-[250px] border-violet-100 bg-white text-slate-950 shadow-xl shadow-violet-100/60'
  }

  if (type === 'sub_department') {
    return selected
      ? 'w-[230px] border-cyan-300 bg-cyan-50 text-cyan-950 shadow-[0_22px_60px_rgba(6,182,212,0.18)] ring-4 ring-cyan-100'
      : 'w-[230px] border-cyan-100 bg-cyan-50/80 text-cyan-950 shadow-lg shadow-cyan-100/50'
  }

  return selected
    ? 'w-[200px] border-emerald-300 bg-emerald-50 text-emerald-950 shadow-[0_18px_50px_rgba(16,185,129,0.18)] ring-4 ring-emerald-100'
    : 'w-[200px] border-emerald-100 bg-emerald-50/80 text-emerald-950 shadow-md shadow-emerald-100/50'
}

function NodeCard({
  node,
  selected,
  onSelect,
}: {
  node: MindMapNode
  selected: boolean
  onSelect: (node: MindMapNode) => void
}) {
  const Icon = node.type === 'company' ? Sparkles : node.type === 'department' ? Building2 : node.type === 'sub_department' ? GitBranch : Network
  const label =
    node.type === 'company'
      ? 'Company root'
      : node.type === 'department'
        ? 'Département'
        : node.type === 'sub_department'
          ? 'Sous-département'
          : 'Équipe'

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className={`org-print-node absolute rounded-[28px] border p-4 text-left transition hover:-translate-y-1 hover:shadow-2xl ${nodeStyle(node.type, selected)}`}
      style={{
        left: node.x,
        top: node.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className={node.type === 'company' ? 'grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white' : 'grid h-12 w-12 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm'}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className={node.type === 'company' ? 'text-[10px] font-black uppercase tracking-[0.2em] text-white/50' : 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-400'}>
            {label}
          </p>
          <p className="mt-1 truncate text-base font-black">{node.name}</p>
          <p className={node.type === 'company' ? 'mt-1 text-xs font-bold text-white/60' : 'mt-1 text-xs font-bold text-slate-500'}>
            {node.count} employé(s) · {node.teams} équipe(s)
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={node.type === 'company' ? 'rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-white/70' : 'rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-600'}>
          Live
        </span>
        {node.manager ? (
          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-600">
            {node.manager}
          </span>
        ) : null}
      </div>
    </button>
  )
}

export default function DepartmentsOrgBuilderClient({
  departments,
  createAction,
  departmentsTable,
  positionsTable,
}: {
  departments: DepartmentNode[]
  createAction: ServerAction
  departmentsTable: string
  positionsTable: string
}) {
  const [nodes, setNodes] = useState<DepartmentNode[]>(departments)
  const [selectedMain, setSelectedMain] = useState(departments[0]?.name || '')
  const [selectedParent, setSelectedParent] = useState(departments[0]?.name || '')
  const [selectedMapNode, setSelectedMapNode] = useState<MindMapNode | null>(null)
  const [subDeptName, setSubDeptName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [zoom, setZoom] = useState(0.72)
  const [pan, setPan] = useState({ x: -360, y: -230 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const allSelectable = useMemo(() => {
    const rows: { name: string; type: string }[] = []
    nodes.forEach((node) => {
      rows.push({ name: node.name, type: 'Département' })
      node.children?.forEach((child) => rows.push({ name: child.name, type: `Sous-département de ${node.name}` }))
    })
    return rows
  }, [nodes])

  const { result: mapNodes, links } = useMemo(() => buildMindMap(nodes), [nodes])

  const selectedNode = selectedMapNode || mapNodes.find((node) => node.name === selectedParent) || mapNodes[0]

  function findNode(name: string) {
    for (const node of nodes) {
      if (node.name === name) return node
      const child = node.children?.find((c) => c.name === name)
      if (child) return child
    }
    return null
  }

  function addLocalSubDepartment() {
    const name = subDeptName.trim()
    if (!name || !selectedMain) return

    const child: DepartmentNode = {
      id: `sub-${cleanId(selectedMain)}-${cleanId(name)}-${Date.now()}`,
      name,
      count: 0,
      teams: 0,
      manager: 'À assigner',
      status: 'draft',
      children: [],
      teamNodes: [],
    }

    setNodes((current) =>
      current.map((node) =>
        node.name === selectedMain
          ? { ...node, children: [...(node.children || []), child] }
          : node,
      ),
    )

    setSelectedParent(name)
    setSelectedMapNode(null)
    setSubDeptName('')
  }

  function addLocalTeam() {
    const name = teamName.trim()
    if (!name || !selectedParent) return

    const team = {
      id: `team-${cleanId(selectedParent)}-${cleanId(name)}-${Date.now()}`,
      name,
      parent: selectedParent,
      count: 0,
    }

    setNodes((current) =>
      current.map((node) => {
        if (node.name === selectedParent) {
          return { ...node, teams: node.teams + 1, teamNodes: [...(node.teamNodes || []), team] }
        }

        return {
          ...node,
          children: node.children?.map((child) =>
            child.name === selectedParent
              ? { ...child, teams: child.teams + 1, teamNodes: [...(child.teamNodes || []), team] }
              : child,
          ),
        }
      }),
    )

    setTeamName('')
  }

  function selectFromMap(node: MindMapNode) {
    setSelectedMapNode(node)
    if (node.type === 'department') {
      setSelectedMain(node.name)
      setSelectedParent(node.name)
      return
    }

    if (node.type === 'sub_department') {
      setSelectedParent(node.name)
      const parent = mapNodes.find((item) => item.id === node.parentId)
      if (parent?.type === 'department') setSelectedMain(parent.name)
      return
    }

    if (node.parentId) {
      const parent = mapNodes.find((item) => item.id === node.parentId)
      if (parent) setSelectedParent(parent.name)
    }
  }

  const totalSubDepartments = nodes.reduce((sum, node) => sum + (node.children?.length || 0), 0)
  const totalTeams = nodes.reduce(
    (sum, node) =>
      sum +
      (node.teamNodes?.length || 0) +
      (node.children || []).reduce((childSum, child) => childSum + (child.teamNodes?.length || 0), 0),
    0,
  )

  const selectedSourceNode = selectedNode ? findNode(selectedNode.name) : null

  function printMindMapA4() {
    window.print()
  }

  return (
    <section className="rounded-[38px] border border-white/80 bg-white p-6 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-100">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }

          html,
          body {
            width: 297mm !important;
            height: 210mm !important;
            overflow: hidden !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .org-print-page,
          .org-print-page * {
            visibility: visible !important;
          }

          .org-print-page {
            position: fixed !important;
            inset: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            padding: 8mm !important;
            background: white !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            z-index: 999999 !important;
          }

          .org-print-shell {
            width: 281mm !important;
            height: 194mm !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 10mm !important;
            overflow: hidden !important;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 45%, #f5f3ff 100%) !important;
            box-shadow: none !important;
            position: relative !important;
          }

          .org-print-header {
            height: 22mm !important;
            padding: 6mm 8mm 4mm !important;
            border-bottom: 1px solid #e2e8f0 !important;
            background: white !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 8mm !important;
            box-sizing: border-box !important;
          }

          .org-print-title {
            font-size: 15pt !important;
            line-height: 1.05 !important;
            font-weight: 900 !important;
            letter-spacing: -0.7pt !important;
            color: #020617 !important;
            margin: 0 !important;
          }

          .org-print-subtitle {
            margin-top: 2mm !important;
            font-size: 7.5pt !important;
            line-height: 1.2 !important;
            color: #475569 !important;
            font-weight: 700 !important;
          }

          .org-print-ref {
            background: #020617 !important;
            color: white !important;
            border-radius: 5mm !important;
            padding: 4mm 5mm !important;
            min-width: 48mm !important;
            text-align: right !important;
            font-size: 7pt !important;
            font-weight: 900 !important;
          }

          .org-print-canvas {
            position: relative !important;
            width: 281mm !important;
            height: 172mm !important;
            overflow: hidden !important;
          }

          .org-print-stage {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            width: 2400px !important;
            height: 1400px !important;
            transform-origin: center center !important;
            transform: translate(-50%, -50%) scale(0.43) !important;
          }

          .org-no-print {
            display: none !important;
          }

          .org-print-only {
            display: block !important;
          }

          .org-print-node {
            box-shadow: none !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          svg path {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }

        @media screen {
          .org-print-only {
            display: none;
          }
        }
      `}</style>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-700">Live mind-map organigram builder</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">Carte dynamique départements, sous-départements & équipes</h2>
          <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-slate-500">
            Une vraie carte mentale d’organisation : racine AngelCare, branches départements, sous-branches, équipes, connexions visuelles,
            preview instantané et sauvegarde dans les tables RH de production.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
          <div className="rounded-[24px] bg-slate-950 p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Départements</p>
            <p className="mt-1 text-3xl font-black">{nodes.length}</p>
          </div>
          <div className="rounded-[24px] border border-cyan-100 bg-cyan-50 p-4 text-cyan-800">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sous-départements</p>
            <p className="mt-1 text-3xl font-black">{totalSubDepartments}</p>
          </div>
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Équipes</p>
            <p className="mt-1 text-3xl font-black">{totalTeams}</p>
          </div>
        </div>
      </div>

      <div className="org-print-only org-print-page">
        <div className="org-print-shell">
          <div className="org-print-header">
            <div>
              <p style={{ margin: 0, fontSize: '6.5pt', letterSpacing: '2.8pt', fontWeight: 900, color: '#6d28d9', textTransform: 'uppercase' }}>
                AngelCare HR Command OS · Organigramme dynamique
              </p>
              <h1 className="org-print-title">Carte dynamique départements, sous-départements & équipes</h1>
              <p className="org-print-subtitle">
                Vue synchronisée A4 paysage · {nodes.length} département(s) · {totalSubDepartments} sous-département(s) · {totalTeams} équipe(s)
              </p>
            </div>
            <div className="org-print-ref">
              <div style={{ opacity: 0.55, fontSize: '5.8pt', letterSpacing: '1.6pt', textTransform: 'uppercase' }}>Référence print</div>
              <div style={{ marginTop: '2mm', fontSize: '8.5pt' }}>AC-HR-ORG-{new Date().getFullYear()}</div>
              <div style={{ marginTop: '1.5mm', opacity: 0.65, fontSize: '6pt' }}>A4 paysage · live map</div>
            </div>
          </div>

          <div className="org-print-canvas">
            <div className="org-print-stage">
              <svg className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="angelcareLinePrint" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.78" />
                    <stop offset="55%" stopColor="#06b6d4" stopOpacity="0.72" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.72" />
                  </linearGradient>
                </defs>

                {links.map((link) => {
                  const from = mapNodes.find((node) => node.id === link.from)
                  const to = mapNodes.find((node) => node.id === link.to)
                  if (!from || !to) return null

                  const fx = Math.round(from.x)
                  const fy = Math.round(from.y)
                  const tx = Math.round(to.x)
                  const ty = Math.round(to.y)
                  const midX = Math.round((fx + tx) / 2)

                  return (
                    <path
                      key={`print-${link.from}-${link.to}`}
                      d={`M ${fx} ${fy} C ${midX} ${fy}, ${midX} ${ty}, ${tx} ${ty}`}
                      fill="none"
                      stroke="url(#angelcareLinePrint)"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  )
                })}
              </svg>

              {mapNodes.map((node) => (
                <NodeCard
                  key={`print-${node.id}`}
                  node={node}
                  selected={selectedNode?.id === node.id}
                  onSelect={() => undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="org-no-print mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-[38px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-violet-50/50 shadow-inner">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-white/90 p-4 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Corporate mind map canvas</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">AngelCare dynamic organization map</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="emerald">Live preview</Pill>
              <Pill tone="violet">{selectedNode?.name || 'No selection'}</Pill>
              <button type="button" onClick={() => setZoom((z) => Math.max(0.42, Number((z - 0.08).toFixed(2))))} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700">
                <ZoomOut className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setZoom((z) => Math.min(1.18, Number((z + 0.08).toFixed(2))))} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700">
                <ZoomIn className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setPan({ x: -360, y: -230 })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">
                Center
              </button>
              <button type="button" onClick={printMindMapA4} className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg">
                <Printer className="mr-2 inline h-4 w-4" />
                Print A4 landscape
              </button>
            </div>
          </div>

          <div className="relative h-[760px] overflow-auto">
            {!mounted ? (
              <div className="grid h-full place-items-center">
                <div className="rounded-[30px] border border-violet-100 bg-white px-8 py-6 text-center shadow-xl shadow-slate-200/60">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-700">Loading live mind map</p>
                  <p className="mt-2 text-lg font-black text-slate-950">Preparing organization canvas...</p>
                </div>
              </div>
            ) : (
            <div
              className="relative h-[1400px] w-[2400px] origin-top-left transition-transform duration-300"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              <svg className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="angelcareLine" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.65" />
                    <stop offset="55%" stopColor="#06b6d4" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.55" />
                  </linearGradient>
                </defs>
                {links.map((link) => {
                  const from = mapNodes.find((node) => node.id === link.from)
                  const to = mapNodes.find((node) => node.id === link.to)
                  if (!from || !to) return null

                  const fx = Math.round(from.x)
                  const fy = Math.round(from.y)
                  const tx = Math.round(to.x)
                  const ty = Math.round(to.y)
                  const midX = Math.round((fx + tx) / 2)

                  return (
                    <path
                      key={`${link.from}-${link.to}`}
                      d={`M ${fx} ${fy} C ${midX} ${fy}, ${midX} ${ty}, ${tx} ${ty}`}
                      fill="none"
                      stroke="url(#angelcareLine)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  )
                })}
              </svg>

              {mapNodes.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  selected={selectedNode?.id === node.id}
                  onSelect={selectFromMap}
                />
              ))}
            </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 border-t border-slate-200 bg-white p-3">
            <button type="button" onClick={() => setPan((p) => ({ ...p, y: p.y + 120 }))} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">↑ Move</button>
            <button type="button" onClick={() => setPan((p) => ({ ...p, x: p.x + 140 }))} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">← Move</button>
            <button type="button" onClick={() => setPan((p) => ({ ...p, x: p.x - 140 }))} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">Move →</button>
            <button type="button" onClick={() => setPan((p) => ({ ...p, y: p.y - 120 }))} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">Move ↓</button>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                <Workflow className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-950">Ajouter sous-département</h3>
                <p className="text-xs font-bold text-slate-500">Parent sélectionné depuis la carte live</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Département principal</span>
                <select
                  value={selectedMain}
                  onChange={(event) => {
                    setSelectedMain(event.target.value)
                    setSelectedParent(event.target.value)
                    setSelectedMapNode(null)
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none ring-violet-100 focus:ring-4"
                >
                  {nodes.map((dept) => <option key={dept.name} value={dept.name}>{dept.name}</option>)}
                </select>
              </label>

              <input
                value={subDeptName}
                onChange={(event) => setSubDeptName(event.target.value)}
                placeholder="Nom du sous-département"
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none ring-violet-100 focus:ring-4"
              />

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={addLocalSubDepartment} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg">
                  <Plus className="mr-2 inline h-4 w-4" />
                  Preview map
                </button>

                <form action={createAction}>
                  <input type="hidden" name="_table" value={departmentsTable} />
                  <input type="hidden" name="_redirect" value="/hr/departments" />
                  <input type="hidden" name="name" value={subDeptName || `Sous-département ${selectedMain}`} />
                  <input type="hidden" name="department" value={selectedMain} />
                  <input type="hidden" name="parent_department" value={selectedMain} />
                  <input type="hidden" name="type" value="sub_department" />
                  <input type="hidden" name="status" value="active" />
                  <button className="w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-200">
                    <Save className="mr-2 inline h-4 w-4" />
                    Save
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-950">Ajouter équipe</h3>
                <p className="text-xs font-bold text-slate-500">Département ou sous-département sélectionné</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Parent live</span>
                <select
                  value={selectedParent}
                  onChange={(event) => {
                    setSelectedParent(event.target.value)
                    setSelectedMapNode(null)
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none ring-emerald-100 focus:ring-4"
                >
                  {allSelectable.map((item) => (
                    <option key={`${item.type}-${item.name}`} value={item.name}>
                      {item.name} · {item.type}
                    </option>
                  ))}
                </select>
              </label>

              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Nom de l’équipe"
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none ring-emerald-100 focus:ring-4"
              />

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={addLocalTeam} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg">
                  <Plus className="mr-2 inline h-4 w-4" />
                  Preview map
                </button>

                <form action={createAction}>
                  <input type="hidden" name="_table" value={positionsTable} />
                  <input type="hidden" name="_redirect" value="/hr/departments" />
                  <input type="hidden" name="title" value={teamName || `Équipe ${selectedParent}`} />
                  <input type="hidden" name="department" value={selectedParent} />
                  <input type="hidden" name="parent_department" value={selectedMain} />
                  <input type="hidden" name="sub_department" value={selectedParent} />
                  <input type="hidden" name="type" value="team" />
                  <input type="hidden" name="status" value="active" />
                  <button className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200">
                    <Save className="mr-2 inline h-4 w-4" />
                    Save
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-cyan-100 bg-cyan-50 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-cyan-700" />
              <div>
                <p className="text-sm font-black text-cyan-950">Selected node</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{selectedNode?.name || 'No selection'}</p>
                <p className="mt-2 text-xs font-bold leading-5 text-cyan-800">
                  Type: {selectedNode?.type || '—'} · Staff: {selectedNode?.count || 0} · Teams: {selectedSourceNode?.teams || selectedNode?.teams || 0}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
