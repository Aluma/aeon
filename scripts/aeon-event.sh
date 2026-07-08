#!/usr/bin/env bash
# Emit redacted Aeon run events. Telemetry must never fail the caller.

aeon_event_redact() {
  local key="$1" value="$2"
  case "$key" in
    *KEY*|*TOKEN*|*SECRET*|*PASSWORD*|*CREDENTIAL*) printf '[redacted]'; return 0 ;;
  esac
  case "$value" in
    sk-*|sk_*|ghp_*|gho_*|github_pat_*|xai-*|bk_*|pk-lf-*|sk-lf-*) printf '[redacted]'; return 0 ;;
  esac
  printf '%s' "$value"
}

aeon_event() {
  local kind="${1:-}"
  if [ -z "$kind" ]; then return 0; fi
  shift || true

  local phase="" gateway="" model="" status="" message=""
  local metadata="{}"
  local pair key value redacted
  for pair in "$@"; do
    key="${pair%%=*}"
    value="${pair#*=}"
    [ -z "$key" ] && continue
    redacted="$(aeon_event_redact "$key" "$value")"
    case "$key" in
      phase) phase="$redacted" ;;
      gateway) gateway="$redacted" ;;
      model) model="$redacted" ;;
      status) status="$redacted" ;;
      message) message="$redacted" ;;
      *)
        metadata="$(jq -cn --argjson current "$metadata" --arg k "$key" --arg v "$redacted" '$current + {($k): $v}' 2>/dev/null || printf '{}')"
        ;;
    esac
  done

  local payload
  payload="$(jq -cn \
    --arg schema "aeon.run_event.v1" \
    --arg kind "$kind" \
    --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg run_id "${GITHUB_RUN_ID:-local}" \
    --arg run_attempt "${GITHUB_RUN_ATTEMPT:-}" \
    --arg repo "${GITHUB_REPOSITORY:-}" \
    --arg skill "${SKILL_NAME:-}" \
    --arg phase "$phase" \
    --arg gateway "$gateway" \
    --arg model "$model" \
    --arg status "$status" \
    --arg message "$message" \
    --argjson metadata "$metadata" \
    '{schema:$schema,kind:$kind,timestamp:$timestamp,run_id:$run_id}
      + (if $run_attempt != "" then {run_attempt:$run_attempt} else {} end)
      + (if $repo != "" then {repo:$repo} else {} end)
      + (if $skill != "" then {skill:$skill} else {} end)
      + (if $phase != "" then {phase:$phase} else {} end)
      + (if $gateway != "" then {gateway:$gateway} else {} end)
      + (if $model != "" then {model:$model} else {} end)
      + (if $status != "" then {status:$status} else {} end)
      + (if $message != "" then {message:$message} else {} end)
      + (if ($metadata | length) > 0 then {metadata:$metadata} else {} end)' 2>/dev/null)" || return 0

  local out_dir="${AEON_EVENT_DIR:-output/.observability/events}"
  mkdir -p "$out_dir" 2>/dev/null || true
  printf '%s\n' "$payload" >> "${out_dir}/${GITHUB_RUN_ID:-local}.jsonl" 2>/dev/null || true

  if [ -n "${AEON_OBSERVABILITY_ENDPOINT:-}" ] && [ -n "${AEON_OBSERVABILITY_TOKEN:-}" ]; then
    curl -fsS --max-time "${AEON_OBSERVABILITY_TIMEOUT_SECONDS:-3}" \
      -X POST "$AEON_OBSERVABILITY_ENDPOINT" \
      -H "Authorization: Bearer ${AEON_OBSERVABILITY_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$payload" >/dev/null 2>&1 || true
  fi

  if [ "${AEON_OBSERVABILITY_BACKEND:-}" = "github-issue" ] \
    && [ -n "${AEON_OBSERVABILITY_ISSUE_NUMBER:-}" ] \
    && [ -n "${GITHUB_REPOSITORY:-}" ] \
    && command -v gh >/dev/null 2>&1; then
    local body
    body="$(printf '<!-- aeon-run-event -->\n```json\n%s\n```\n' "$payload")"
    gh api \
      "repos/${GITHUB_REPOSITORY}/issues/${AEON_OBSERVABILITY_ISSUE_NUMBER}/comments" \
      -f "body=${body}" >/dev/null 2>&1 || true
  fi

  return 0
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  aeon_event "$@"
fi
