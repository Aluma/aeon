import { NextResponse } from 'next/server'
import { ghAvailable, readRepoVariable, setRepoVariable } from '@/lib/gh'
import { errorResponse } from '@/lib/http'

// Langfuse region → OTLP host. The shim (scripts/langfuse-otel.sh) reads the
// LANGFUSE_HOST repo VARIABLE and defaults to EU cloud when it's unset, so EU is
// the default here too. A self-hosted / non-cloud URL surfaces as `custom` and
// is left untouched unless the operator explicitly picks EU or US.
const LANGFUSE_HOSTS = {
  eu: 'https://cloud.langfuse.com',
  us: 'https://us.cloud.langfuse.com',
} as const
type Region = keyof typeof LANGFUSE_HOSTS

function regionOf(host: string | null): Region | 'custom' {
  if (!host) return 'eu'
  const h = host.replace(/\/+$/, '')
  if (h === LANGFUSE_HOSTS.eu) return 'eu'
  if (h === LANGFUSE_HOSTS.us) return 'us'
  return 'custom'
}

export async function GET() {
  if (!ghAvailable()) {
    return NextResponse.json({ error: 'GitHub CLI not authenticated. Run: gh auth login', ghReady: false }, { status: 503 })
  }
  const host = readRepoVariable('LANGFUSE_HOST')
  const backend = readRepoVariable('AEON_OBSERVABILITY_BACKEND')
  const issueNumber = readRepoVariable('AEON_OBSERVABILITY_ISSUE_NUMBER')
  const eventWriteEndpoint = readRepoVariable('AEON_OBSERVABILITY_ENDPOINT')
  const eventReadEndpoint = readRepoVariable('AEON_OBSERVABILITY_READ_ENDPOINT')
  return NextResponse.json({
    ghReady: true,
    host,
    region: regionOf(host),
    eventWriteConfigured: !!eventWriteEndpoint || (backend === 'github-issue' && !!issueNumber),
    eventReadConfigured: !!eventReadEndpoint || (backend === 'github-issue' && !!issueNumber),
    eventBackend: backend || null,
    eventIssueNumber: issueNumber || null,
    langfuseLogContent: readRepoVariable('LANGFUSE_LOG_CONTENT'),
  })
}

export async function POST(request: Request) {
  if (!ghAvailable()) {
    return NextResponse.json({ error: 'GitHub CLI not authenticated' }, { status: 503 })
  }
  const body = await request.json().catch(() => ({})) as { region?: string }
  const region: Region | null = body.region === 'us' ? 'us' : body.region === 'eu' ? 'eu' : null
  if (!region) {
    return NextResponse.json({ error: "region must be 'eu' or 'us'" }, { status: 400 })
  }
  const host = LANGFUSE_HOSTS[region]
  try {
    setRepoVariable('LANGFUSE_HOST', host)
    return NextResponse.json({ ok: true, host, region })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to set LANGFUSE_HOST')
  }
}
