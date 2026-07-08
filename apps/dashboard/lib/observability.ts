import type { AeonRunEvent, RunHealthSignal } from './types'
import { isRecord } from './utils'

const EVENT_SCHEMA = 'aeon.run_event.v1'
const MAX_EVENTS = 500

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function objectMetadata(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

export function parseAeonRunEvent(value: unknown): AeonRunEvent | null {
  if (!isRecord(value)) return null
  if (value.schema !== EVENT_SCHEMA) return null
  const kind = stringField(value.kind)
  const timestamp = stringField(value.timestamp)
  const runId = stringField(value.run_id)
  if (!kind || !timestamp || !runId) return null

  return {
    schema: EVENT_SCHEMA,
    kind,
    timestamp,
    run_id: runId,
    run_attempt: stringField(value.run_attempt),
    repo: stringField(value.repo),
    skill: stringField(value.skill),
    phase: stringField(value.phase),
    gateway: stringField(value.gateway),
    model: stringField(value.model),
    status: stringField(value.status),
    message: stringField(value.message),
    metadata: objectMetadata(value.metadata),
  }
}

export function parseAeonRunEvents(value: unknown, runId?: string): AeonRunEvent[] {
  const raw = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.events)
      ? value.events
      : []
  return raw
    .map(parseAeonRunEvent)
    .filter((event): event is AeonRunEvent => !!event && (!runId || event.run_id === runId))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-MAX_EVENTS)
}

export function latestEvent(events: AeonRunEvent[], kind: string): AeonRunEvent | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i].kind === kind) return events[i]
  }
  return null
}

export function secondsSince(timestamp?: string | null, now = Date.now()): number | null {
  if (!timestamp) return null
  const t = new Date(timestamp).getTime()
  if (Number.isNaN(t)) return null
  return Math.max(0, Math.floor((now - t) / 1000))
}

export function buildRunHealthSignals(
  events: AeonRunEvent[],
  runStatus: string,
  now = Date.now(),
): RunHealthSignal[] {
  const signals: RunHealthSignal[] = []
  const heartbeat = latestEvent(events, 'model_heartbeat')
  const modelStart = latestEvent(events, 'model_call_started')
  const modelComplete = latestEvent(events, 'model_call_completed')
  const tokenUsage = latestEvent(events, 'token_usage_recorded')
  const providerFailures = events.filter((event) => event.kind === 'provider_failed')

  if (runStatus === 'in_progress' && modelStart && !modelComplete) {
    const age = secondsSince(heartbeat?.timestamp ?? modelStart.timestamp, now)
    if (age !== null && age > 130) {
      signals.push({
        type: 'warning',
        code: 'heartbeat_stale',
        message: `No model heartbeat for ${age}s.`,
      })
    } else if (age !== null) {
      signals.push({
        type: 'success',
        code: 'heartbeat_fresh',
        message: `Latest model heartbeat ${age}s ago.`,
      })
    }
  }

  if (providerFailures.length >= 3) {
    signals.push({
      type: 'warning',
      code: 'provider_churn',
      message: `${providerFailures.length} provider failures observed in this run.`,
    })
  }

  if (modelComplete && !tokenUsage) {
    signals.push({
      type: 'warning',
      code: 'missing_token_usage',
      message: 'Model completed but no token usage event has been recorded.',
    })
  }

  if (!events.length) {
    signals.push({
      type: 'info',
      code: 'events_unconfigured',
      message: 'Structured live events are not configured for this run.',
    })
  }

  return signals
}
