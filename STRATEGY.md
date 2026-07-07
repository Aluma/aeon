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
6. Route models by strength. Claude Opus 4.8 via OpenRouter is the main orchestrator for planning, risk judgment, and final verification at max effort; GPT 5.5 Pro is the primary coder/implementation model at high effort; Qwen 3.7 Plus handles multimodal work; DeepSeek V4 Pro remains available for lower-cost token-heavy analysis where quality is sufficient.

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
- Frontier models are the default for orchestration and implementation quality. Use cheaper token-heavy models only when their output can be independently checked by tests, static analysis, or a frontier-model review.

## Optimize for / avoid

- **Optimize for:** merge-proof quality gates, executable proof, small reversible PRs, local-first design, provenance, authority-aware retrieval, conflict surfacing, and graceful degradation.
- **Avoid:** broad rewrites, feature demos before guardrails, hidden complexity, placeholder implementations, non-local critical paths, noisy context capture, and any change whose success depends on trusting an agent's claim instead of a check.
