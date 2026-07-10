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

VCH becomes the local-first context layer that lets the operator move between Claude Desktop, Claude Code, Codex App, Codex CLI, Cursor, VS Code, Antigravity, Gemini CLI, Obsidian, and future tools without re-explaining project state, preferences, decisions, constraints, or corrections.

## Priorities

1. Quality gates before product breadth. Future autonomous work must be hard to fake: CI, lint, typecheck, tests, integration-style checks, skipped-test detection, placeholder detection, and PR evidence requirements come before feature expansion.
2. Correctness, durability, privacy, and inspectability over demo speed. VCH core operations must be 100% local, crash-resilient, and transparent enough that the operator can inspect what any agent would see.
3. Systemic context flow over agent cooperation. Use hooks, watchers, daemons, MCP, REST, transcript extraction, lifecycle injection, and health checks instead of relying on agents to remember instructions.
4. Enforce context authority and conflict safety. T0 user input, T1 canonical files, T2 high-confidence automated context, and T3 low-confidence automated context must drive ranking, write protection, retrieval, and escalation.
5. Verify the active repo and specs before acting. Do not infer the VCH build target from stale memory, older PRs, old repo names, or historical logs.
6. Keep architecture pragmatic and minimal. Add abstractions only when they protect correctness, reduce real duplication, or make future integrations easier without increasing operational fragility.
7. Route models by strength and use cross-model checking. Claude Opus 4.8 via OpenRouter remains the independent reviewer/verifier for high-risk PR review, security judgment, and final quality calls. GPT 5.6 Sol handles high-stakes development and repair work, GPT 5.6 Terra handles balanced audit/merge operations, GPT 5.6 Luna handles routine monitoring and triage, Qwen 3.7 Plus handles multimodal work, and DeepSeek V4 Pro remains available for lower-cost token-heavy analysis where quality is independently checkable.

## Audience

The primary audience is the operator: technical, time-constrained, quality-sensitive, and intolerant of fake progress. Secondary audiences are future coding agents and maintainers who need unambiguous constraints, executable checks, and clear residual-risk notes.

## Hard constraints

- No direct-to-main feature work. Aeon produces pull requests with verification evidence; autonomous merge is allowed only through Aeon's `auto-merge` safety policy after branch protection reports a clean merge state.
- Do not operate on frozen repos. `Aluma/universal-context-hub` is frozen unless the operator explicitly unfreezes it.
- No autonomous VCH work may start until Aeon has identified the active non-frozen repo and read its current README/specs/issues/PR state.
- No reward hacking: do not weaken tests, delete failing checks, hardcode success paths, fake integrations, hide skipped tests, or claim support without executable proof.
- No cloud dependency in the VCH critical path. Core context storage, retrieval, governance, and injection must run locally.
- No context pollution. Withhold irrelevant context rather than injecting low-quality or stale material into an agent's reasoning.
- Canonical or iron-clad files are write-protected unless the user explicitly requests a change.
- Headless/autonomous work must pause or flag low-confidence, conflicting, privacy-sensitive, or authority-boundary decisions.
- Every PR must state behavior changed, exact checks run, verification output, known gaps, and why no shortcut/mock/hardcoded path was used.
- Frontier models are the default for orchestration and implementation quality. Use cheaper token-heavy models only when their output can be independently checked by tests, static analysis, or a frontier-model review.
- Full autonomy does not mean unchecked autonomy: GPT-built work must pass CI, unresolved-conversation gates, deterministic guards, and an independent review path before `auto-merge` may ship it.

## Optimize for / avoid

- **Optimize for:** merge-proof quality gates, executable proof, small reversible PRs, local-first design, provenance, authority-aware retrieval, conflict surfacing, and graceful degradation.
- **Avoid:** broad rewrites, feature demos before guardrails, hidden complexity, placeholder implementations, non-local critical paths, noisy context capture, and any change whose success depends on trusting an agent's claim instead of a check.
