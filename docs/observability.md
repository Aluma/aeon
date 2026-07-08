---
type: Reference
layout: default
title: Visual Observability
---

# Visual Observability

Aeon's primary observability surface is the dashboard's right panel. The **Live**
tab combines GitHub Actions lifecycle state with optional structured Aeon run
events so an operator can distinguish "still working" from "stuck" without
waiting for completed logs.

## What works without extra services

The dashboard always polls GitHub Actions for:

- run status and conclusion
- active job, when GitHub exposes it
- active step, when GitHub exposes it
- elapsed time
- whether downloadable logs should be available

GitHub log downloads may remain unavailable while a job is running. The Live tab
labels that state explicitly instead of treating it as a failure.

## Structured live events

For semantic progress during long model calls, configure an append-only event
sink:

| Name | Kind | Purpose |
|---|---|---|
| `AEON_OBSERVABILITY_ENDPOINT` | repo variable | HTTPS endpoint that receives JSON events by POST. |
| `AEON_OBSERVABILITY_TOKEN` | repo secret | Bearer token used for writes to the event endpoint. |
| `AEON_OBSERVABILITY_READ_ENDPOINT` | repo variable | HTTPS endpoint the dashboard reads with `?run_id=<id>`. |
| `AEON_OBSERVABILITY_READ_TOKEN` | local dashboard env var | Optional bearer token for dashboard reads. GitHub secrets are write-only, so this must be available to the local dashboard process. |
| `AEON_OBSERVABILITY_TIMEOUT_SECONDS` | repo variable | Optional write timeout. Defaults to 3 seconds. |

### GitHub issue backend

If you do not want to run a separate event service yet, Aeon can use one internal
GitHub issue as an append-only event stream:

| Name | Kind | Purpose |
|---|---|---|
| `AEON_OBSERVABILITY_BACKEND=github-issue` | repo variable | Enables issue-comment event writes and dashboard reads. |
| `AEON_OBSERVABILITY_ISSUE_NUMBER` | repo variable | The issue number that stores `aeon.run_event.v1` comments. |

This uses the workflow's existing `issues: write` permission and the local
dashboard's `gh` authentication. It is not the lowest-noise backend, but it is
useful when you want live observability without deploying Cloudflare, Supabase,
or another service.

Event delivery is non-fatal. If the endpoint is unset, slow, down, or rejects the
request, the Aeon run continues.

Event schema:

```json
{
  "schema": "aeon.run_event.v1",
  "kind": "model_heartbeat",
  "timestamp": "2026-07-08T00:00:00Z",
  "run_id": "123456789",
  "run_attempt": "1",
  "repo": "owner/repo",
  "skill": "feature",
  "phase": "model",
  "gateway": "openrouter",
  "model": "anthropic/claude-opus-4.8",
  "metadata": {
    "elapsed": "60",
    "timeout": "1500"
  }
}
```

Events are metadata-only. The emitter redacts secret-looking keys and values and
does not send prompts, responses, command output bodies, or credential material.

## Langfuse drill-down

Langfuse remains optional and complementary. Use it for model/tool/span traces;
use the Aeon dashboard for run-level operating state.

For privacy-first tracing, set:

```bash
gh variable set LANGFUSE_LOG_CONTENT --body '0'
```

Then set `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and `LANGFUSE_HOST` as
described in `docs/langfuse.md`.

## Operator checklist

To confirm a run is progressing:

1. Open the dashboard right panel.
2. Select **Live**.
3. Pick the active run.
4. Confirm the GitHub job is active.
5. Confirm heartbeat age is below the warning threshold when structured events
   are configured.
6. Confirm event timeline advances during long model calls.
7. After completion, switch to **Logs** and confirm the final summary still
   renders.

Warnings in the Live tab are advisory. They are designed to surface likely
stalls, missing token records, and provider churn without adding destructive
controls to the dashboard.
