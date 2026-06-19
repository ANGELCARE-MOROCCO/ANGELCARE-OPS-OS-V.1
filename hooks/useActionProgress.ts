'use client'

import { useCallback, useMemo, useState } from 'react'

export type ActionProgressStatus = 'idle' | 'running' | 'success' | 'error'
export type ActionProgressStepStatus = 'pending' | 'running' | 'done' | 'failed'

export type ActionProgressStep = {
  id: string
  label: string
  detail?: string
  percent: number
  status: ActionProgressStepStatus
  timestamp?: string
}

export type ActionProgressReport = {
  title: string
  subtitle?: string
  status: ActionProgressStatus
  percent: number
  currentStep?: string
  detail?: string
  steps: ActionProgressStep[]
  startedAt?: string
  completedAt?: string
  durationMs?: number
  summary?: string
  result?: Record<string, unknown>
  error?: string
  canClose: boolean
}

export type StartActionConfig = {
  title: string
  subtitle?: string
  detail?: string
  steps?: Array<{
    id?: string
    label: string
    detail?: string
    percent: number
  }>
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeSteps(steps: StartActionConfig['steps'] = []): ActionProgressStep[] {
  return steps.map((step, index) => ({
    id: step.id || `step-${index + 1}`,
    label: step.label,
    detail: step.detail,
    percent: Math.max(0, Math.min(100, Number(step.percent || 0))),
    status: index === 0 ? 'running' : 'pending',
    timestamp: index === 0 ? nowIso() : undefined,
  }))
}

function duration(startedAt?: string, completedAt?: string) {
  if (!startedAt || !completedAt) return undefined
  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined
  return Math.max(0, end - start)
}

export function useActionProgress() {
  const [progress, setProgress] = useState<ActionProgressReport>({
    title: '',
    status: 'idle',
    percent: 0,
    steps: [],
    canClose: false,
  })

  const isRunning = progress.status === 'running'

  const startAction = useCallback((config: StartActionConfig) => {
    const startedAt = nowIso()
    const steps = normalizeSteps(config.steps)
    setProgress({
      title: config.title,
      subtitle: config.subtitle,
      status: 'running',
      percent: steps[0]?.percent ?? 0,
      currentStep: steps[0]?.label || config.title,
      detail: steps[0]?.detail || config.detail || 'Preparing action…',
      steps,
      startedAt,
      canClose: false,
    })
  }, [])

  const updateProgress = useCallback((percent: number, detail?: string, currentStep?: string) => {
    setProgress((current) => ({
      ...current,
      status: current.status === 'idle' ? 'running' : current.status,
      percent: Math.max(0, Math.min(100, Number(percent || 0))),
      detail: detail ?? current.detail,
      currentStep: currentStep ?? current.currentStep,
      canClose: false,
    }))
  }, [])

  const setStep = useCallback((stepId: string, status: ActionProgressStepStatus, detail?: string, percent?: number) => {
    setProgress((current) => {
      const nextPercent = typeof percent === 'number'
        ? Math.max(0, Math.min(100, percent))
        : current.steps.find((step) => step.id === stepId)?.percent ?? current.percent

      return {
        ...current,
        percent: nextPercent,
        currentStep: current.steps.find((step) => step.id === stepId)?.label || current.currentStep,
        detail: detail ?? current.detail,
        steps: current.steps.map((step) => {
          if (step.id === stepId) {
            return { ...step, status, detail: detail ?? step.detail, timestamp: nowIso() }
          }
          if (step.percent < nextPercent && step.status !== 'failed') {
            return { ...step, status: 'done' }
          }
          if (status === 'running' && step.percent === nextPercent) {
            return { ...step, status: 'running', timestamp: nowIso() }
          }
          return step
        }),
      }
    })
  }, [])

  const completeAction = useCallback((summary: string, result?: Record<string, unknown>) => {
    const completedAt = nowIso()
    setProgress((current) => ({
      ...current,
      status: 'success',
      percent: 100,
      currentStep: 'Completed',
      detail: summary,
      summary,
      result,
      completedAt,
      durationMs: duration(current.startedAt, completedAt),
      canClose: true,
      steps: current.steps.map((step) => ({ ...step, status: step.status === 'failed' ? step.status : 'done' })),
    }))
  }, [])

  const failAction = useCallback((error: string, result?: Record<string, unknown>) => {
    const completedAt = nowIso()
    setProgress((current) => ({
      ...current,
      status: 'error',
      currentStep: 'Action failed',
      detail: error,
      error,
      result,
      completedAt,
      durationMs: duration(current.startedAt, completedAt),
      canClose: true,
      steps: current.steps.map((step) => {
        if (step.status === 'running') return { ...step, status: 'failed', detail: error, timestamp: nowIso() }
        return step
      }),
    }))
  }, [])

  const closeProgress = useCallback(() => {
    setProgress({
      title: '',
      status: 'idle',
      percent: 0,
      steps: [],
      canClose: false,
    })
  }, [])

  const api = useMemo(() => ({
    progress,
    isRunning,
    startAction,
    updateProgress,
    setStep,
    completeAction,
    failAction,
    closeProgress,
  }), [closeProgress, completeAction, failAction, isRunning, progress, setStep, startAction, updateProgress])

  return api
}
