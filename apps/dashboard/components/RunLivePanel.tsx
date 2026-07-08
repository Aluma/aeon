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
            {events.slice(-40).reverse().map((event, i) => (
              <div key={`${event.timestamp}-${event.kind}-${i}`} className="border-l border-white/10 pl-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-eva-orange font-mono">{event.kind}</span>
                  <span className="text-[10px] text-primary-35 font-mono">{timeAgo(event.timestamp)}</span>
                </div>
                {(event.message || event.gateway || event.model) && (
                  <div className="text-[10px] text-primary-45 font-mono break-words">
                    {[event.message, event.gateway, event.model].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ))}
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
