#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cat >"$TMP_DIR/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

case "${1:-} ${2:-}" in
  "issue list")
    printf '%s\n' "${MOCK_ISSUE_LIST:-[]}"
    ;;
  "issue view")
    number="${3:-}"
    jq -c --argjson number "$number" '.[] | select(.number == $number)' <<<"${MOCK_ISSUE_LIST:-[]}"
    ;;
  *)
    echo "unexpected gh invocation: $*" >&2
    exit 1
    ;;
esac
EOF
chmod +x "$TMP_DIR/gh"
export PATH="$TMP_DIR:$PATH"

GATE="scripts/vch-program-gate.sh"
BODY=$'## Controlling requirements\nsource\n## Acceptance criteria\ncriteria\n## Test plan\ntests\n## Stop conditions\nstop\n## Evidence\nevidence'

issue() {
  local number="$1"
  local labels_json="$2"
  local body="${3:-$BODY}"
  jq -n --argjson number "$number" --arg body "$body" --argjson labels "$labels_json" \
    '{number:$number,state:"OPEN",body:$body,labels:($labels | map({name:.}))}'
}

READY_LABELS='["ai-build","vch:plan-approved","vch:implementation"]'
BLOCKED_LABELS='["ai-build","vch:plan-approved","vch:implementation","blocked"]'

READY_7="$(issue 7 "$READY_LABELS")"
READY_11="$(issue 11 "$READY_LABELS")"
BLOCKED_3="$(issue 3 "$BLOCKED_LABELS")"
MISSING_HEADING="$(issue 5 "$READY_LABELS" $'## Controlling requirements\nsource')"
export MOCK_ISSUE_LIST="$(jq -s '.' <<<"$BLOCKED_3
$MISSING_HEADING
$READY_11
$READY_7")"

actual="$(bash "$GATE" feature 'external:Aluma/vybose-context-hub --fix-issues')"
[[ "$actual" == 'external:Aluma/vybose-context-hub#7 --fix-issues' ]]

actual="$(bash "$GATE" feature 'external:Aluma/vybose-context-hub#11 --fix-issues')"
[[ "$actual" == 'external:Aluma/vybose-context-hub#11 --fix-issues' ]]

if bash "$GATE" feature 'external:Aluma/vybose-context-hub#3 --fix-issues' >/dev/null 2>&1; then
  echo 'FAIL: blocked explicit issue passed the gate' >&2
  exit 1
else
  [[ "$?" -eq 2 ]]
fi

export MOCK_ISSUE_LIST="$(jq -s '.' <<<"$BLOCKED_3
$MISSING_HEADING")"
if bash "$GATE" feature 'external:Aluma/vybose-context-hub --fix-issues' >/dev/null 2>&1; then
  echo 'FAIL: expected no ready issue' >&2
  exit 1
else
  [[ "$?" -eq 3 ]]
fi

actual="$(bash "$GATE" feature 'external:example/repo --fix-issues')"
[[ "$actual" == 'external:example/repo --fix-issues' ]]

echo 'vch-program-gate tests: ok'
