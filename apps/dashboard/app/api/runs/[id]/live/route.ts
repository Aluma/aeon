import { NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import { REPO_ROOT, ghArgsRepo, readRepoVariable } from '@/lib/gh'
import { errorResponse } from '@/lib/http'
import type { RunJob, RunLiveResponse, RunStep } from '@/lib/types'

interface GhRunView {
  status?: string
  conclusion?: string | null
  displayTitle?: string
  url?: string
  createdAt?: string
  updatedAt?: string
  jobs?: Array<{
    name?: string
    status?: string
    conclusion?: string | null
    url?: string
    startedAt?: string | null
    completedAt?: string | null
    steps?: Array<{
      name?: string
      status?: string
      conclusion?: string | null
      number?: number
      startedAt?: string | null
      completedAt?: string | null
    }>
  }>
}

function secondsBetween(start?: string | null, end = Date.now()): number | null {
  if (!start) return null
  const t = new Date(start).getTime()
  if (Number.isNaN(t)) return null
  return Math.max(0, Math.floor((end - t) / 1000))
}

function normalizeStep(step: NonNullable<NonNullable<GhRunView['jobs']>[number]['steps']>[number]): RunStep {
  return {
    name: step.name || 'step',
    status: step.status || 'unknown',
    conclusion: step.conclusion ?? null,
    number: step.number,
    startedAt: step.startedAt ?? null,
    completedAt: step.completedAt ?? null,
  }
}

function normalizeJob(job: NonNullable<GhRunView['jobs']>[number]): RunJob {
  return {
    name: job.name || 'job',
    status: job.status || 'unknown',
    conclusion: job.conclusion ?? null,
    url: job.url,
    startedAt: job.startedAt ?? null,
    completedAt: job.completedAt ?? null,
    steps: Array.isArray(job.steps) ? job.steps.map(normalizeStep) : undefined,
  }
}

function parsePositiveInt(value: string | null): number | null {
  if (!value || !/^[1-9][0-9]*$/.test(value)) return null
  return Number(value)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid run ID' }, { status: 400 })
    }

    const raw = execFileSync(
      'gh',
      ['run', 'view', id, ...ghArgsRepo(), '--json', 'status,conclusion,displayTitle,url,createdAt,updatedAt,jobs'],
      { stdio: 'pipe', cwd: REPO_ROOT, timeout: 15000 },
    ).toString()
    const info = JSON.parse(raw) as GhRunView
    const jobs = (info.jobs || []).map(normalizeJob)
    const activeJob = jobs.find((job) => job.status === 'in_progress')
      ?? jobs.find((job) => job.status === 'queued')
      ?? null
    const activeStep = activeJob?.steps?.find((step) => step.status === 'in_progress')
      ?? activeJob?.steps?.find((step) => step.status === 'queued')
      ?? null
    const stepVisibility = jobs.some((job) => Array.isArray(job.steps) && job.steps.length > 0)
      ? 'available'
      : 'unavailable'
    const status = info.status || 'unknown'
    const response: RunLiveResponse = {
      id,
      title: info.displayTitle || `run ${id}`,
      url: info.url,
      status,
      conclusion: info.conclusion ?? null,
      createdAt: info.createdAt ?? null,
      updatedAt: info.updatedAt ?? null,
      jobs,
      activeJob,
      activeStep,
      elapsedSeconds: secondsBetween(info.createdAt),
      logsAvailable: status === 'completed',
      stepVisibility,
      modelTimeoutSeconds: parsePositiveInt(readRepoVariable('AEON_MODEL_TIMEOUT_SECONDS')),
    }
    return NextResponse.json(response)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch live run state')
  }
}
