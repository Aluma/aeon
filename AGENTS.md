<!-- AUTO-GENERATED from STRATEGY.md by scripts/gen-agents-md.js. Do not edit by hand.
     Grok (the grok harness) loads BOTH this file and CLAUDE.md as standing
     instructions and reads CLAUDE.md natively, so the full operating manual lives
     in CLAUDE.md — NOT duplicated here. This file carries only STRATEGY.md, which
     CLAUDE.md delivers to Claude Code via the `@STRATEGY.md` import that grok does
     not expand. Edit STRATEGY.md and re-run the generator to update it. -->

# Strategy (Grok harness)

Grok already loads Aeon's full operating manual from `CLAUDE.md` (how Aeon works,
memory, tools, capability mode, security, output). This file adds only the
operator's strategy below — the north-star `CLAUDE.md` references as `@STRATEGY.md`,
which grok does not expand. Read it at the start of every task and let it break
ties; absorb it, don't quote it.

# Strategy

## North-star metric

Vybose Context Hub becomes a production-quality, local-first context infrastructure layer that gives every important LLM, coding, IDE, and note-taking interaction accurate prior context without manual copy/paste transfer.

The winning state is cross-tool continuity: a user can move between Claude Desktop, Claude Code, Codex App, Codex CLI, Cursor, VS Code, Antigravity, Gemini CLI, Obsidian, and future tools without re-explaining project state, preferences, decisions, constraints, or corrections.

## Priorities

1. Build the quality gate before product features. Future autonomous work must be hard to fake: CI, lint, typecheck, tests, integration-style checks, skipped-test detection, placeholder detection, and PR evidence requirements come first.
2. Optimize for correctness, durability, privacy, and inspectability over demo speed. VCH core operations must be 100% local, resilient to crashes, and transparent enough that the user can see what any agent would see.
3. Prefer systemic context flow over agent cooperation. Use hooks, watchers, daemons, MCP, REST, transcript extraction, lifecycle injection, and health checks instead of relying on agents to remember instructions.
4. Enforce context authority and conflict safety. T0 user input, T1 canonical files, T2 high-confidence automated context, and T3 low-confidence automated context must drive ranking, write protection, retrieval, and escalation.
5. Keep architecture pragmatic and minimal. Add abstractions only when they protect correctness, reduce real duplication, or make future integrations easier without increasing operational fragility.
6. Route models by strength and cost. GLM 5.2 via OpenRouter is the main autonomous builder; Qwen 3.7 Max, Qwen 3.7 Plus, and DeepSeek V4 Pro handle token-heavy or multimodal work where they are efficient; GPT 5.5 Pro and Claude Opus 4.8 Max are reserved for hard planning, adversarial review, architecture, and final verification.

## Audience

The primary audience is the operator: technical, time-constrained, quality-sensitive, and intolerant of fake progress. Secondary audiences are future coding agents and maintainers who need unambiguous constraints, executable checks, and clear residual-risk notes.

## Hard constraints

- No direct-to-main feature work. Aeon should produce pull requests with verification evidence; `auto-merge` stays disabled.
- No reward hacking: do not weaken tests, delete failing checks, hardcode success paths, fake integrations, hide skipped tests, or claim support without executable proof.
- No cloud dependency in the VCH critical path. Core context storage, retrieval, governance, and injection must run locally.
- No context pollution. Withhold irrelevant context rather than injecting low-quality or stale material into an agent's reasoning.
- Canonical or iron-clad files are write-protected unless the user explicitly requests a change.
- Headless/autonomous work must pause or flag low-confidence, conflicting, privacy-sensitive, or authority-boundary decisions.
- Every PR must state behavior changed, exact checks run, verification output, known gaps, and why no shortcut/mock/hardcoded path was used.
- Expensive frontier models are escalation tools, not default throughput models. Use them only when their judgment materially reduces risk or catches subtle failure modes.

## Optimize for / avoid

- **Optimize for:** merge-proof quality gates, executable proof, small reversible PRs, local-first design, provenance, authority-aware retrieval, conflict surfacing, and graceful degradation.
- **Avoid:** broad rewrites, feature demos before guardrails, hidden complexity, placeholder implementations, non-local critical paths, noisy context capture, and any change whose success depends on trusting an agent's claim instead of a check.
