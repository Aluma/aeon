#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

export GITHUB_RUN_ID=12345
export GITHUB_RUN_ATTEMPT=1
export GITHUB_REPOSITORY=Aluma/aeon
export SKILL_NAME=feature
export AEON_EVENT_DIR="$TMP/events"

# shellcheck source=../aeon-event.sh
source "$ROOT/scripts/aeon-event.sh"

aeon_event model_call_started phase=model gateway=openrouter model=anthropic/claude-opus-4.8 OPENROUTER_API_KEY=sk-test-secret
EVENT_FILE="$TMP/events/12345.jsonl"
test -s "$EVENT_FILE"

jq -e '
  .schema == "aeon.run_event.v1" and
  .kind == "model_call_started" and
  .run_id == "12345" and
  .repo == "Aluma/aeon" and
  .skill == "feature" and
  .gateway == "openrouter" and
  .metadata.OPENROUTER_API_KEY == "[redacted]"
' "$EVENT_FILE" >/dev/null

export AEON_OBSERVABILITY_ENDPOINT="http://127.0.0.1:9/does-not-exist"
export AEON_OBSERVABILITY_TOKEN="token"
aeon_event model_heartbeat elapsed=60

LINES="$(wc -l < "$EVENT_FILE" | tr -d ' ')"
test "$LINES" = "2"

FAKE_BIN="$TMP/bin"
mkdir -p "$FAKE_BIN"
cat > "$FAKE_BIN/gh" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$GH_CAPTURE"
exit 0
SH
chmod +x "$FAKE_BIN/gh"
export PATH="$FAKE_BIN:$PATH"
export GH_CAPTURE="$TMP/gh-calls.txt"
export AEON_OBSERVABILITY_BACKEND=github-issue
export AEON_OBSERVABILITY_ISSUE_NUMBER=99
aeon_event run_completed status=success
grep -q 'issues/99/comments' "$GH_CAPTURE"

echo "test_aeon_event.sh: ok"
