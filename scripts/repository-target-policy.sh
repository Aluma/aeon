#!/usr/bin/env bash
# Fail closed before Aeon can dispatch work to a frozen repository.
set -euo pipefail

cd "$(dirname "$0")/.."

POLICY_FILE="${AEON_REPOSITORY_POLICY_FILE:-config/frozen-repositories.txt}"
WATCHED_FILE="${AEON_WATCHED_REPOS_FILE:-memory/watched-repos.md}"
VCH_REPO="aluma/vybose-context-hub"

contains_repo() {
  local text="$1"
  local repo="$2"
  printf '%s\n' "$text" | grep -Fqi -- "$repo"
}

is_vch_target() {
  contains_repo "${1:-}" "$VCH_REPO"
}

resolve_harness() {
  local skill="$1"
  local requested="${2:-}"
  local configured skill_configured

  configured="$(sed -n 's/^harness:[[:space:]]*//p' aeon.yml | head -1 | tr -d ' "')"
  skill_configured="$(grep "^  ${skill}:" aeon.yml | sed -n 's/.*harness:[[:space:]]*"\([^"]*\)".*/\1/p' || true)"

  if [[ -n "$requested" && "$requested" != '(config default)' ]]; then
    printf '%s\n' "$requested"
  elif [[ -n "$skill_configured" ]]; then
    printf '%s\n' "$skill_configured"
  else
    printf '%s\n' "${configured:-claude}"
  fi
}

check_policy() {
  local skill="${1:-}"
  local target="${2:-}"
  local requested_harness="${3:-}"
  local repo harness

  [[ -f "$POLICY_FILE" ]] || {
    echo "repository-target-policy: missing policy file: $POLICY_FILE" >&2
    return 2
  }

  while IFS= read -r repo; do
    repo="${repo%%#*}"
    repo="$(printf '%s' "$repo" | xargs)"
    [[ -n "$repo" ]] || continue

    if contains_repo "$target" "$repo"; then
      echo "repository-target-policy: frozen repository rejected: $repo" >&2
      return 1
    fi

    if [[ "$skill" == 'feature' && -f "$WATCHED_FILE" ]] &&
      grep -Fqi -- "$repo" "$WATCHED_FILE"; then
      echo "repository-target-policy: frozen repository appears in watched repos: $repo" >&2
      return 1
    fi
  done < "$POLICY_FILE"

  if is_vch_target "$target"; then
    harness="$(resolve_harness "$skill" "$requested_harness")"
    if [[ "$harness" != 'claude' ]]; then
      echo "repository-target-policy: VCH requires the configured Claude/OpenRouter harness" >&2
      return 1
    fi
  fi

  echo 'repository-target-policy: ok'
}

case "${1:-}" in
  check)
    shift
    check_policy "$@"
    ;;
  is-vch)
    shift
    if is_vch_target "${1:-}"; then
      echo true
    else
      echo false
    fi
    ;;
  *)
    echo "usage: $0 {check <skill> <target> [harness]|is-vch <target>}" >&2
    exit 2
    ;;
esac
