#!/usr/bin/env bash
# Select exactly one VCH implementation issue that has passed the program gates.
set -euo pipefail

VCH_REPO="Aluma/vybose-context-hub"

log() {
  printf 'vch-program-gate: %s\n' "$*" >&2
}

has_label() {
  local issue_json="$1"
  local expected="$2"
  jq -e --arg label "$expected" '.labels[]?.name | select(ascii_downcase == ($label | ascii_downcase))' \
    <<<"$issue_json" >/dev/null
}

has_heading() {
  local issue_json="$1"
  local heading="$2"
  jq -r '.body // ""' <<<"$issue_json" | tr -d '\r' | grep -Fqx -- "$heading"
}

validate_issue() {
  local issue_json="$1"
  local state number label heading

  state="$(jq -r '.state // "" | ascii_upcase' <<<"$issue_json")"
  number="$(jq -r '.number // "unknown"' <<<"$issue_json")"
  if [[ "$state" != "OPEN" ]]; then
    log "issue #$number is not open"
    return 1
  fi

  for label in ai-build vch:plan-approved vch:implementation; do
    if ! has_label "$issue_json" "$label"; then
      log "issue #$number is missing required label '$label'"
      return 1
    fi
  done

  for label in blocked do-not-build do-not-merge; do
    if has_label "$issue_json" "$label"; then
      log "issue #$number has blocking label '$label'"
      return 1
    fi
  done

  for heading in \
    '## Controlling requirements' \
    '## Acceptance criteria' \
    '## Test plan' \
    '## Stop conditions' \
    '## Evidence'; do
    if ! has_heading "$issue_json" "$heading"; then
      log "issue #$number is missing exact heading '$heading'"
      return 1
    fi
  done
}

main() {
  local skill="${1:-}"
  local target="${2:-}"
  local target_lower explicit_number issue_json selected_number

  target_lower="$(printf '%s' "$target" | tr '[:upper:]' '[:lower:]')"
  if [[ "$skill" != "feature" || "$target_lower" != *"aluma/vybose-context-hub"* ]]; then
    printf '%s\n' "$target"
    return 0
  fi

  explicit_number=""
  if [[ "$target_lower" =~ aluma/vybose-context-hub\#([0-9]+) ]]; then
    explicit_number="${BASH_REMATCH[1]}"
  elif [[ "$target_lower" =~ github\.com/aluma/vybose-context-hub/issues/([0-9]+) ]]; then
    explicit_number="${BASH_REMATCH[1]}"
  fi

  if [[ -n "$explicit_number" ]]; then
    if ! issue_json="$(gh issue view "$explicit_number" --repo "$VCH_REPO" --json number,state,labels,body 2>/dev/null)"; then
      log "cannot load explicit issue #$explicit_number"
      return 2
    fi
    if ! validate_issue "$issue_json"; then
      log "explicit issue #$explicit_number is not approved for implementation"
      return 2
    fi
    printf 'external:%s#%s --fix-issues\n' "$VCH_REPO" "$explicit_number"
    return 0
  fi

  if ! issue_json="$(gh issue list --repo "$VCH_REPO" --state open --limit 1000 \
    --json number,state,labels,body 2>/dev/null)"; then
    log "cannot list VCH issues"
    return 2
  fi

  selected_number=""
  while IFS= read -r candidate; do
    [[ -n "$candidate" ]] || continue
    if validate_issue "$candidate"; then
      selected_number="$(jq -r '.number' <<<"$candidate")"
      break
    fi
  done < <(jq -c 'sort_by(.number)[]' <<<"$issue_json")

  if [[ -z "$selected_number" ]]; then
    log "no approved VCH implementation issue is ready"
    return 3
  fi

  printf 'external:%s#%s --fix-issues\n' "$VCH_REPO" "$selected_number"
}

main "$@"
