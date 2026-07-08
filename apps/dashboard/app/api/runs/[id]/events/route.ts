import { NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import { REPO_ROOT, currentGhRepo, readRepoVariable } from '@/lib/gh'
import { errorResponse } from '@/lib/http'
import { parseAeonRunEvents } from '@/lib/observability'
import type { RunEventsResponse } from '@/lib/types'

function buildUrl(base: string, runId: string): string {
  const url = new URL(base)
  url.searchParams.set('run_id', runId)
  return url.toString()
}

function parseIssueCommentBody(body: string): unknown | null {
  if (!body.includes('<!-- aeon-run-event -->')) return null
  const match = body.match(/```json\s*([\s\S]*?)\s*```/)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

function readGitHubIssueEvents(issueNumber: string, runId: string) {
  const repo = currentGhRepo()
  if (!repo) throw new Error('GitHub repo could not be resolved')
  const raw = execFileSync(
    'gh',
    ['api', `repos/${repo}/issues/${issueNumber}/comments?per_page=100`],
    { stdio: 'pipe', cwd: REPO_ROOT, timeout: 15000, maxBuffer: 10 * 1024 * 1024 },
  ).toString()
  const comments = JSON.parse(raw) as Array<{ body?: string }>
  return parseAeonRunEvents(
    comments.map((comment) => parseIssueCommentBody(comment.body || '')).filter(Boolean),
    runId,
  )
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

    const backend = readRepoVariable('AEON_OBSERVABILITY_BACKEND')
    const issueNumber = readRepoVariable('AEON_OBSERVABILITY_ISSUE_NUMBER')
    if (backend === 'github-issue' && issueNumber) {
      const response: RunEventsResponse = {
        configured: true,
        events: readGitHubIssueEvents(issueNumber, id),
      }
      return NextResponse.json(response)
    }

    const endpoint = readRepoVariable('AEON_OBSERVABILITY_READ_ENDPOINT')
    if (!endpoint) {
      const response: RunEventsResponse = { configured: false, events: [] }
      return NextResponse.json(response)
    }

    const token = process.env.AEON_OBSERVABILITY_READ_TOKEN
      || process.env.AEON_OBSERVABILITY_TOKEN
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
    const upstream = await fetch(buildUrl(endpoint, id), { headers, cache: 'no-store' })
    if (!upstream.ok) {
      const response: RunEventsResponse = {
        configured: true,
        events: [],
        error: `Event endpoint returned HTTP ${upstream.status}`,
      }
      return NextResponse.json(response, { status: 502 })
    }

    const body = await upstream.json().catch(() => ({}))
    const response: RunEventsResponse = {
      configured: true,
      events: parseAeonRunEvents(body, id),
    }
    return NextResponse.json(response)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch run events')
  }
}
