#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

POLICY="scripts/repository-target-policy.sh"

expect_reject() {
  if bash "$POLICY" check "$@" >/dev/null 2>&1; then
    echo "FAIL: expected target rejection: $*" >&2
    exit 1
  fi
}

expect_reject feature 'external:Aluma/universal-context-hub' claude
expect_reject feature 'https://github.com/aluma/universal-context-hub/issues/7' claude
expect_reject feature 'external:Aluma/vybose-context-hub' grok

bash "$POLICY" check feature 'external:Aluma/vybose-context-hub' claude >/dev/null
bash "$POLICY" check feature 'external:example/repo' grok >/dev/null
[[ "$(bash "$POLICY" is-vch 'external:Aluma/vybose-context-hub --fix-issues')" == true ]]
[[ "$(bash "$POLICY" is-vch 'external:example/repo')" == false ]]

echo 'repository-target-policy tests: ok'
