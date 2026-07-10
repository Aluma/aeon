#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

resolve() {
  GATEWAY=openrouter \
  OPENROUTER_API_KEY=test-key \
  MODEL="$1" \
    bash -c 'source scripts/llm-gateway.sh >/dev/null; printf "%s" "$MODEL"'
}

expect() {
  local handle="$1" expected="$2" actual
  actual="$(resolve "$handle")"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL: $handle resolved to $actual; expected $expected" >&2
    exit 1
  fi
}

expect claude-opus-4-8 anthropic/claude-opus-4.8
expect gpt-sol openai/gpt-5.6-sol
expect gpt-terra openai/gpt-5.6-terra
expect gpt-luna openai/gpt-5.6-luna
expect glm z-ai/glm-5.2
expect qwen-max qwen/qwen3.7-max
expect deepseek deepseek/deepseek-v4-pro
expect qwen-plus qwen/qwen3.7-plus

slots="$({
  GATEWAY=openrouter \
  OPENROUTER_API_KEY=test-key \
  MODEL=glm \
    bash -c 'source scripts/llm-gateway.sh >/dev/null; printf "%s\n%s\n%s" "$ANTHROPIC_DEFAULT_OPUS_MODEL" "$ANTHROPIC_DEFAULT_SONNET_MODEL" "$ANTHROPIC_DEFAULT_HAIKU_MODEL"'
})"
expected_slots=$'anthropic/claude-opus-4.8\nopenai/gpt-5.6-sol\ndeepseek/deepseek-v4-pro'
[[ "$slots" == "$expected_slots" ]] || {
  echo "FAIL: default OpenRouter slots are inconsistent: $slots" >&2
  exit 1
}

echo 'llm-gateway model routing tests: ok'
