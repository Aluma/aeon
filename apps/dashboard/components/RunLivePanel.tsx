'use client'

import type { AeonRunEvent, Run, RunLiveResponse } from '../lib/types'
import { buildRunHealthSignals, latestEvent, secondsSince } from '../lib/observability'
import { timeAgo } from '../lib/utils'

interface RunLivePanelProps {
  run: Run
  live: RunLiveResponse | null
  events: AeonRunEvent[]
  eventsConfigured: boolean
  loading: boolean
  eventError: string
}

function fmtSeconds(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'n/a'
  if (value < 60) return `${value}s`
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function signalClass(type: 'warning' | 'info' | 'success'): string {
  if (type === 'warning') return 'text-eva-orange bg-aeon-red/10 border-aeon-red/30'
  if (type === 'success') return 'text-eva-green bg-aeon-green/10 border-aeon-green/30'
  return 'text-primary-55 bg-white/5 border-white/10'
}

function metadataString(event: AeonRunEvent, key: string): string | null {
  const value = event.metadata?.[key]
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function eventDetail(event: AeonRunEvent): string {
  const details = [event.message, event.gateway, event.model].filter(Boolean) as string[]
  if (event.kind === 'model_heartbeat') {
    const elapsed = metadataString(event, 'elapsed')
    const timeout = metadataString(event, 'timeout')
    if (elapsed) details.push(`elapsed ${elapsed}s`)
    if (timeout) details.push(`timeout ${timeout}s`)
  }
  if (event.kind === 'token_usage_recorded') {
    const input = metadataString(event, 'input_tokens')
    const output = metadataString(event, 'output_tokens')
    const cacheRead = metadataString(event, 'cache_read')
    const total = metadataString(event, 'total_tokens')
    if (input) details.push(`in ${input}`)
    if (output) details.push(`out ${output}`)
    if (cacheRead) details.push(`cache ${cacheRead}`)
    if (total) details.push(`total ${total}`)
  }
  if (event.kind === 'result_captured') {
    const bytes = metadataString(event, 'bytes')
    if (bytes) details.push(`${bytes} bytes`)
  }
  if (event.kind === 'gateway_selected') {
    const candidates = metadataString(event, 'candidates')
    if (candidates) details.push(`candidates ${candidates}`)
  }
  return details.join(' · ')
}

export function RunLivePanel({ run, live, events, eventsConfigured, loading, eventError }: RunLivePanelProps) {
  const status = live?.status || run.status
  const activeJob = live?.activeJob?.name || 'n/a'
  const activeStep = live?.activeStep?.name || (live?.stepVisibility === 'unavailable' ? 'not exposed by GitHub API' : 'n/a')
  const heartbeat = latestEvent(events, 'model_heartbeat')
  const modelStart = latestEvent(events, 'model_call_started')
  const heartbeatAge = secondsSince(heartbeat?.timestamp ?? modelStart?.timestamp)
  const signals = buildRunHealthSignals(events, status)
  const langfuseUrl = live?.id ? `https://cloud.langfuse.com/sessions/${live.id}` : ''

  return (
    <div className="space-y-3">
      {loading && <div className="flex justify-center py-4"><div className="w-2 h-2 rounded-full bg-eva-orange animate-pulse" /></div>}

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-white/10 bg-white/5 p-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-primary-35 font-mono">Status</div>
          <div className="text-xs text-primary-80 font-mono mt-1">{status}{live?.conclusion ? ` / ${live.conclusion}` : ''}</div>
        </div>
        <div className="border border-white/10 bg-white/5 p-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-primary-35 font-mono">Elapsed</div>
          <div className="text-xs text-primary-80 font-mono mt-1">{fmtSeconds(live?.elapsedSeconds)}</div>
        </div>
        <div className="border border-white/10 bg-white/5 p-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-primary-35 font-mono">Job</div>
          <div className="text-xs text-primary-80 font-mono mt-1 truncate">{activeJob}</div>
        </div>
        <div className="border border-white/10 bg-white/5 p-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-primary-35 font-mono">Heartbeat</div>
          <div className="text-xs text-primary-80 font-mono mt-1">{heartbeatAge === null ? 'n/a' : `${heartbeatAge}s ago`}</div>
        </div>
      </div>

      <div className="border border-white/10 bg-white/5 p-2">
        <div className="text-[10px] uppercase tracking-[0.16em] text-primary-35 font-mono">Active Step</div>
        <div className="text-xs text-primary-70 font-mono mt-1 break-words">{activeStep}</div>
        {live && !live.logsAvailable && (
          <div className="text-[10px] text-primary-35 font-mono mt-2">
            GitHub log downloads may stay unavailable until this run completes.
          </div>
        )}
        {live?.modelTimeoutSeconds && (
          <div className="text-[10px] text-primary-35 font-mono mt-1">
            Model timeout: {fmtSeconds(live.modelTimeoutSeconds)}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {signals.map(signal => (
          <div key={signal.code} className={`text-[11px] font-mono px-2.5 py-2 border ${signalClass(signal.type)}`}>
            {signal.message}
          </div>
        ))}
        {!eventsConfigured && (
          <div className="text-[11px] font-mono px-2.5 py-2 border text-primary-45 bg-white/5 border-white/10">
            Live event stream not configured; showing GitHub lifecycle only.
          </div>
        )}
        {eventError && (
          <div className="text-[11px] font-mono px-2.5 py-2 border text-eva-orange bg-aeon-red/10 border-aeon-red/30">
            {eventError}
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-primary-35 font-mono mb-1.5">Timeline</div>
        {events.length ? (
          <div className="space-y-1.5">
            {events.slice(-40).reverse().map((event, i) => {
              const detail = eventDetail(event)
              return (
                <div key={`${event.timestamp}-${event.kind}-${i}`} className="border-l border-white/10 pl-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-eva-orange font-mono">{event.kind}</span>
                    <span className="text-[10px] text-primary-35 font-mono">{timeAgo(event.timestamp)}</span>
                  </div>
                  {detail && (
                    <div className="text-[10px] text-primary-45 font-mono break-words">
                      {detail}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-[11px] text-primary-35 font-mono">No structured events yet.</div>
        )}
      </div>

      {langfuseUrl && (
        <a href={langfuseUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-[11px] text-primary-40 font-mono border border-white/10 px-2 py-1 hover:border-eva-orange hover:text-eva-orange transition-colors">
          Langfuse session
        </a>
      )}
    </div>
  )
}
