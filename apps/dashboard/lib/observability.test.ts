import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { buildRunHealthSignals, parseAeonRunEvents } from "./observability"

describe("parseAeonRunEvents", () => {
  it("keeps valid events for the requested run and drops malformed records", () => {
    const events = parseAeonRunEvents({
      events: [
        { schema: "aeon.run_event.v1", kind: "run_started", timestamp: "2026-07-08T00:00:00Z", run_id: "1" },
        { schema: "other", kind: "run_started", timestamp: "2026-07-08T00:00:01Z", run_id: "1" },
        { schema: "aeon.run_event.v1", kind: "run_started", timestamp: "2026-07-08T00:00:02Z", run_id: "2" },
      ],
    }, "1")

    assert.equal(events.length, 1)
    assert.equal(events[0].kind, "run_started")
  })
})

describe("buildRunHealthSignals", () => {
  it("warns when an active model call has a stale heartbeat", () => {
    const signals = buildRunHealthSignals([
      { schema: "aeon.run_event.v1", kind: "model_call_started", timestamp: "2026-07-08T00:00:00Z", run_id: "1" },
      { schema: "aeon.run_event.v1", kind: "model_heartbeat", timestamp: "2026-07-08T00:00:30Z", run_id: "1" },
    ], "in_progress", new Date("2026-07-08T00:03:00Z").getTime())

    assert.equal(signals.some((signal) => signal.code === "heartbeat_stale"), true)
  })

  it("reports missing live events as an informational signal", () => {
    const signals = buildRunHealthSignals([], "in_progress")
    assert.equal(signals[0].code, "events_unconfigured")
  })
})
